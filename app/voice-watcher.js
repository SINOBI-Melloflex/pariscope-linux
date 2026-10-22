// voice-watcher.js - Pariscope Instant-Alert, Anti-Spam Voice Engine
// Rule: first DOWN = instant voice alert. Then LOCKED (no repeat alerts) until
// the link has been continuously UP for STABLE_MS. Only then does a future
// DOWN count as a brand-new incident and get its own instant alert.

const fs = require('fs');

const API_URL      = 'http://localhost:4000/api/status';
const POLL_MS       = 10 * 1000;       // check every 10 seconds
const STABLE_MS     = 2 * 60 * 1000;   // must be UP this long, continuously, to fully clear
const REMINDER_MS   = 30 * 60 * 1000;  // reminder cycle for still-down links (log only, no voice)
const MAX_INDIVIDUAL = 3;

const PRONOUNCE = { 'S11R19': 'S 11 R 19', 'S12 pop': 'S 12 pop', 'G MAX': 'G Max' };

const state = new Map(); // key -> { name, active, alerted, downSince, upSince }
let lastGlobalReminder = 0;
let speakQueue = Promise.resolve();
const SERVER_VOICE = process.argv.includes("--test") || process.env.PARISCOPE_SERVER_VOICE === "1"; // VOICE-OFF
const VDATA = require('./datadir').DATA_DIR;
const VOICE_LOG = require('path').join(VDATA, 'voice.log');
const STATE_FILE = require('path').join(VDATA, 'voice-state.json');
function saveVoiceState() {
  try {
    const nodes = {};
    for (const [k, v] of state) nodes[k] = v;
    const tmp = STATE_FILE + '.tmp';
    fs.writeFileSync(tmp, JSON.stringify({ savedAt: Date.now(), lastGlobalReminder, nodes }));
    fs.renameSync(tmp, STATE_FILE);
  } catch (e) { console.error('voice state save failed', e.message); }
}
try {
  const saved = JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
  lastGlobalReminder = saved.lastGlobalReminder || 0;
  for (const [k, v] of Object.entries(saved.nodes || {})) { v.upSince = null; state.set(k, v); }
  console.log('Restored ' + state.size + ' link states from disk.');
} catch (e) {}

function speakable(name) {
  let n = name.replace(/[_\-.]+/g, ' ').replace(/\s+/g, ' ').trim();
  for (const [k, v] of Object.entries(PRONOUNCE)) n = n.split(k).join(v);
  return n;
}
function joinNames(list) {
  if (list.length <= 1) return list[0] || '';
  return list.slice(0, -1).join(', ') + ' and ' + list[list.length - 1];
}
function duration(ms) {
  const m = Math.max(1, Math.round(ms / 60000));
  if (m < 60) return m + ' minute' + (m > 1 ? 's' : '');
  const h = Math.floor(m / 60), r = m % 60;
  return h + ' hour' + (h > 1 ? 's' : '') + (r ? ' ' + r + ' minutes' : '');
}
function timestamp() { return new Date().toLocaleTimeString(); }

function logGroup(text) {
  const line = `${timestamp()} [GROUP] ${text}\n`;
  console.log(line.trim());
  try { fs.appendFileSync(VOICE_LOG, line); } catch (e) {}
}

function speak(text) {
  console.log(`${timestamp()} [voice] ${text}`);
  try { fs.appendFileSync(VOICE_LOG, `${timestamp()} [voice] ${text}\n`); } catch (e) {}

}

// 4.0: send DOWN / RECOVERED events to the WhatsApp + Telegram engine inside the main app.
// Never blocks or breaks the voice alerts: any problem is only written to voice.log.
async function notifyGroups(type, items, retry) {
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 8000);
    const res = await fetch('http://127.0.0.1:4000/api/internal/notify', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, items }), signal: ctrl.signal
    });
    clearTimeout(t);
    if (!res.ok && !retry) setTimeout(() => notifyGroups(type, items, true), 5000);
  } catch (e) {
    try { fs.appendFileSync(VOICE_LOG, `${timestamp()} [notify ERROR] ${e.message}\n`); } catch (e2) {}
    if (!retry) setTimeout(() => notifyGroups(type, items, true), 5000);
  }
}

function getState(key, name) {
  let s = state.get(key);
  if (!s) {
    s = { name, active: false, alerted: false, downSince: null, upSince: null };
    state.set(key, s);
  }
  return s;
}

async function poll() {
  const now = Date.now();
  let data;
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 8000);
    const res = await fetch(API_URL, { signal: ctrl.signal });
    clearTimeout(t);
    data = await res.json();
    if (!res.ok || !data || !Array.isArray(data.categories)) return; // LICENCE-GATE
  } catch (e) {
    console.error(`${timestamp()} [poll ERROR] ${e.message}`);
    return;
  }

  const newlyDown = [];      // instant alerts to fire this cycle
  const newlyRecovered = []; // stable recoveries to fire this cycle

  for (const cat of data.categories || []) {
    for (const n of cat.nodes || []) {
      const key = n.name + '|' + n.ip;
      const s = getState(key, n.name);
      const isUp = (n.status === 'ONLINE');

      if (!isUp) {
        s.upSince = null; // any down tick cancels a stability count in progress
        if (!s.active) {
          // brand new incident - instant alert
          s.active = true;
          s.downSince = n.downSince || now;
          if (!s.alerted) {
            s.alerted = true;
            newlyDown.push({ name: n.name, ip: n.ip });
          }
        }
        // else: already down/locked - do nothing, this is the anti-spam lock
      } else {
        if (s.active) {
          if (s.upSince === null) {
            s.upSince = now; // start counting continuous UP time
          } else if (now - s.upSince >= STABLE_MS) {
            // fully stable - close incident, unlock, allow future alerts
            const downtimeMs = now - s.downSince;
            newlyRecovered.push({ name: n.name, ip: n.ip, ms: downtimeMs });
            s.active = false;
            s.alerted = false;
            s.downSince = null;
            s.upSince = null;
          }
          // else: up, but not yet 2 minutes stable - stay locked, no alert yet
        }
      }
    }
  }

  // --- 4.0: also tell the WhatsApp / Telegram engine (silent, same PC only) ---
  if (newlyDown.length) notifyGroups('down', newlyDown);
  if (newlyRecovered.length) notifyGroups('up', newlyRecovered);

  // --- Instant DOWN alerts (batched if several happen in the same 10s tick) ---
  if (newlyDown.length === 1) {
    speak(`Hello. ${speakable(newlyDown[0].name)} is down. Can you check?`);
    logGroup(`DOWN - ${newlyDown[0].name}`);
  } else if (newlyDown.length > 1) {
    const names = newlyDown.slice(0, MAX_INDIVIDUAL).map(d => speakable(d.name));
    speak(`Hello. ${newlyDown.length} links just went down, including ${joinNames(names)}. Can you check?`);
    logGroup(`MULTIPLE LINKS DOWN - ${newlyDown.map(d => d.name).join(', ')}`);
  }

  // --- Stable recovery alerts (batched) ---
  if (newlyRecovered.length === 1) {
    const r = newlyRecovered[0];
    speak(`Good news. ${speakable(r.name)} is back up and stable after ${duration(r.ms)}.`);
    logGroup(`RECOVERED (STABLE) - ${r.name} - Downtime: ${duration(r.ms)}.`);
  } else if (newlyRecovered.length > 1) {
    speak(`Good news. ${newlyRecovered.length} links are back up and stable.`);
    logGroup(`MULTIPLE RECOVERIES (STABLE) - ${newlyRecovered.map(r => r.name + ' (' + duration(r.ms) + ')').join(', ')}`);
  }

  // --- Global 30-minute reminder for anything still down/locked (log only, NO voice) ---
  const stillDown = [...state.values()].filter(s => s.active);
  if (stillDown.length > 0 && now - lastGlobalReminder >= REMINDER_MS) {
    lastGlobalReminder = now;
    const lines = stillDown.map(s => `${s.name} - ${duration(now - s.downSince)}`);
    logGroup(`DOWN REMINDER - ${stillDown.length} link(s) still down: ${lines.join(' | ')}`);
  } else if (stillDown.length === 0) {
    lastGlobalReminder = now;
  }
}

async function loop() {
  try { await poll(); } catch (e) { console.error(`${timestamp()} [loop ERROR] ${e.message}`); }
  saveVoiceState();
  setTimeout(loop, POLL_MS);
}

if (process.argv.includes('--test')) {
  speak('Hello. Dattapara Primary is down. Can you check?');
  logGroup('TEST - DOWN - Dattapara Primary');
} else {
  console.log(`${timestamp()} Pariscope instant-alert voice engine started. Watching ${API_URL}`);
  loop();
}


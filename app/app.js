const express = require("express");
const path = require("path");
const ping = require("ping");

const app = express();
const licence = require("./licence"); // LICENCE
licence.attach(app); // LICENCE
app.use(licence.gate); // LICENCE
const PORT = process.env.PORT || 4000;

const manage = require("./manage"); // MANAGE
const hist = require("./history"); // HISTORY
app.use((req, res, next) => { if (/history[^\/]*\.(json|txt)/i.test(req.path)) return res.status(404).end(); next(); }); // HISTORY
app.use(manage.blockPrivate); // MANAGE
app.use(manage.viewGate); // LOCK
try { require("./customize").attach(app); } catch (e) { console.error("[customize] disabled: " + e.message); } // CUSTOMIZE
app.use(express.static(__dirname));

const rawCategories = [];

manage.loadSaved(rawCategories); // MANAGE
let liveState = {
  totalNodes: 0,
  onlineCount: 0,
  offlineCount: 0,
  flappingCount: 0,
  categories: JSON.parse(JSON.stringify(rawCategories))
};

let historyMap = {};
const fs = require("fs");
const STATE_FILE = path.join(require("./datadir").DATA_DIR, "state-cache.json");
let downSince = {};
let lastSavedAt = 0;
const bootTime = Date.now();
try { const saved = JSON.parse(fs.readFileSync(STATE_FILE, "utf8")); downSince = saved.downSince || {}; lastSavedAt = saved.savedAt || 0; } catch (e) { downSince = {}; }
function markDown(ip, now) {
  if (!downSince[ip]) downSince[ip] = (lastSavedAt && now - bootTime < 90000) ? lastSavedAt : now;
  return downSince[ip];
}
function saveState() {
  try {
    const known = new Set();
    liveState.categories.forEach(c => c.nodes.forEach(n => known.add(n.ip))); // MANAGE
    const out = {};
    for (const ip in downSince) { if (known.has(ip)) out[ip] = downSince[ip]; }
    const tmp = STATE_FILE + ".tmp";
    fs.writeFileSync(tmp, JSON.stringify({ savedAt: Date.now(), downSince: out }));
    fs.renameSync(tmp, STATE_FILE);
  } catch (e) { console.error("state save failed", e.message); }
}
process.on("SIGINT", () => { saveState(); process.exit(0); });
process.on("SIGTERM", () => { saveState(); process.exit(0); });
const solidRedStyle = 'offline-glow" style="background-color: rgba(255, 0, 0, 0.2); border: 2px solid #ff0000; box-shadow: 0 0 15px rgba(255, 0, 0, 0.8);';
const flappingPinkStyle = 'flapping-glow" style="background-color: rgba(255, 0, 127, 0.2); border: 2px solid #ff007f; box-shadow: 0 0 15px rgba(255, 0, 127, 0.8);';

async function pollCategory(cat) {
  const now = Date.now();
  for (let node of cat.nodes) {
    const ip = node.ip;
    if (!historyMap[ip]) historyMap[ip] = { lastAlive: true, flips: [], flapUntil: 0 };

    try {
      const res = await ping.promise.probe(ip, { timeout: 1.5 });
      const isAlive = res.alive && res.time !== 'unknown' && res.time !== 'undefined';

      if (historyMap[ip].lastAlive !== isAlive) {
        historyMap[ip].lastAlive = isAlive;
        historyMap[ip].flips.push(now);
      }

      historyMap[ip].flips = historyMap[ip].flips.filter(t => now - t < 60000);

      if (historyMap[ip].flips.length >= 2) {
        historyMap[ip].flapUntil = now + 50000;
      }

      const isCurrentlyFlapping = now < historyMap[ip].flapUntil;

      node.priority = cat.priority;
      node.categoryName = cat.name;

      if (isCurrentlyFlapping) {
        node.status = "FLAPPING";
        node.time = "UNSTABLE";
        node.cardClass = flappingPinkStyle;
        node.badgeClass = "badge-flapping";
        node.barColor = "#ff007f";
        markDown(ip, now);
        node.downSince = downSince[ip];
      } else if (isAlive) {
        node.status = "ONLINE";
        node.time = res.time + " ms";
        node.cardClass = 'online-glow" style="border: 1px solid #2ed573; background-color: transparent; box-shadow: none;';
        node.badgeClass = "badge-online";
        node.barColor = "#2ed573";
        delete downSince[ip];
        node.downSince = null;
      } else {
        node.status = "DOWN";
        node.time = "TIMEOUT";
        node.cardClass = solidRedStyle;
        node.badgeClass = "badge-offline";
        node.barColor = "#FF0000";
        markDown(ip, now);
        node.downSince = downSince[ip];
      }
    } catch (e) {
      node.priority = cat.priority;
      node.categoryName = cat.name;
      node.status = "DOWN";
      node.time = "TIMEOUT";
      node.cardClass = solidRedStyle;
      node.badgeClass = "badge-offline";
      node.barColor = "#FF0000";
      markDown(ip, now);
      node.downSince = downSince[ip];
    }
  }
}

liveState.categories.forEach(cat => {
  function schedulePoll() {
    pollCategory(cat).then(() => {
      try { cat.nodes.forEach(n => hist.record(n.ip, n.name, cat.name, n.status, Date.now())); } catch (e) {} // HISTORY
      let online = 0, offline = 0, flapping = 0, total = 0;
      liveState.categories.forEach(c => {
        c.nodes.forEach(n => {
          total++;
          if (n.status === "ONLINE") online++;
          if (n.status === "DOWN") offline++;
          if (n.status === "FLAPPING") flapping++;
        });
        c.nodes.sort((a, b) => {
          const p = s => s === "DOWN" ? 1 : s === "FLAPPING" ? 2 : 3;
          return p(a.status) - p(b.status);
        });
      });
      liveState.totalNodes = total;
      saveState();
      liveState.onlineCount = online;
      liveState.offlineCount = offline;
      liveState.flappingCount = flapping;

      if (!cat.removed) setTimeout(schedulePoll, cat.interval); // MANAGE
    });
  }
  schedulePoll();
});

manage.attach({ app, liveState, pollCategory }); // MANAGE
hist.attach(app); // HISTORY
try { require("./geomap").attach(app); } catch (e) { console.error("[geomap] disabled: " + e.message); } // GEOMAP
try { require("./netmap").attach(app); } catch (e) { console.error("[netmap] disabled: " + e.message); } // NETMAP
try { require("./updater").attach(app); } catch (e) { console.error("[updater] disabled: " + e.message); } // UPDATER
try { require("./services").attach(app); } catch (e) { console.error("[services] disabled: " + e.message); } // SERVICES
app.get("/api/status", (req, res) => {
  res.json(liveState);
});

const server = app.listen(PORT, "0.0.0.0", (err) => {
  if (err) { console.error("Pariscope could not start: " + err.message); process.exit(1); }
  console.log("Pariscope SOC Engine live on " + PORT);
});
server.on("error", (e) => { console.error("Pariscope could not start: " + e.message); process.exit(1); });




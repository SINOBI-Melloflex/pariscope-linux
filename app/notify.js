"use strict";
// Pariscope 4.0 - WhatsApp + Telegram alerts (runs silently inside the main Pariscope process).
//  - Telegram : needs a bot token + group chat id. Uses only built-in Node (no extra files).
//  - WhatsApp : the admin scans a QR once (Linked devices) and gives a group invite link.
//               Uses the optional "@whiskeysockets/baileys" + "qrcode" packages (installed by the 4.0 installer).
// Settings are stored in notify.json, the WhatsApp login in the wa-auth folder (both are hidden from the web).

const fs = require("fs");
const path = require("path");

const DATA_DIR = require("./datadir").DATA_DIR;
const CFG_FILE = path.join(DATA_DIR, "notify.json");
const WA_DIR = path.join(DATA_DIR, "wa-auth");
const LOG_FILE = path.join(DATA_DIR, "notify.log");
const TG_API = process.env.PARISCOPE_TG_API || "https://api.telegram.org";

/* ---------------- settings ---------------- */
const DEFAULT = {
  version: 1,
  siteName: "",
  telegram: { enabled: false, token: "", chatId: "" },
  whatsapp: { enabled: false, inviteLink: "", groupJid: "", groupName: "" }
};
let cfg = JSON.parse(JSON.stringify(DEFAULT));
function loadCfg() {
  try {
    const j = JSON.parse(fs.readFileSync(CFG_FILE, "utf8").replace(/^\uFEFF/, ""));
    cfg = {
      version: 1,
      siteName: String(j.siteName || "").slice(0, 60),
      telegram: Object.assign({}, DEFAULT.telegram, j.telegram || {}),
      whatsapp: Object.assign({}, DEFAULT.whatsapp, j.whatsapp || {})
    };
  } catch (e) { /* first run: defaults */ }
  normTg();
  normGroups();
}
function saveCfg() {
  try {
    const tmp = CFG_FILE + ".tmp";
    fs.writeFileSync(tmp, JSON.stringify(cfg, null, 2));
    fs.renameSync(tmp, CFG_FILE);
  } catch (e) { log("could not save notify.json: " + e.message); }
}
function log(text) {
  const line = new Date().toLocaleString() + " " + text + "\n";
  try { console.log("[notify] " + text); fs.appendFileSync(LOG_FILE, line); } catch (e) {}
}
function trimLog() {
  try { if (fs.statSync(LOG_FILE).size > 1024 * 1024) fs.writeFileSync(LOG_FILE, ""); } catch (e) {}
}

/* ---------------- helpers ---------------- */
const TOKEN_RE = /^\d{5,}:[A-Za-z0-9_-]{30,}$/;
const CHAT_RE = /^(-?\d{5,20}|@[A-Za-z0-9_]{5,})$/;
const INVITE_RE = /chat\.whatsapp\.com\/(?:invite\/)?([A-Za-z0-9]{10,40})/i;
const inviteCode = (s) => { const m = INVITE_RE.exec(String(s || "")); return m ? m[1] : null; };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
function maskToken(t) { return t ? t.split(":")[0] + ":\u2022\u2022\u2022\u2022\u2022\u2022" + t.slice(-4) : ""; }
function duration(ms) {
  const m = Math.max(1, Math.round(ms / 60000));
  if (m < 60) return m + " min";
  const h = Math.floor(m / 60), r = m % 60;
  return h + " h" + (r ? " " + r + " min" : "");
}
function cleanSite(s) { return String(s == null ? "" : s).replace(/[\u0000-\u001f<>"`]/g, "").trim().slice(0, 60); }

function compose(type, items) {
  const site = cfg.siteName ? " - " + cfg.siteName : "";
  const when = new Date().toLocaleString();
  const line = (i) => "\u2022 " + i.name + " (" + i.ip + ")" + (i.cat ? " [" + i.cat + "]" : "") + (type === "up" && i.ms ? " - was down " + duration(i.ms) : "");
  const head = type === "down"
    ? "\uD83D\uDD34 PARISCOPE ALERT" + site + "\n" + (items.length === 1 ? "Link DOWN" : items.length + " links DOWN")
    : "\uD83D\uDFE2 PARISCOPE RECOVERED" + site + "\n" + (items.length === 1 ? "Link is back UP and stable" : items.length + " links are back UP and stable");
  const lines = items.slice(0, 25).map(line);
  if (items.length > 25) lines.push("...and " + (items.length - 25) + " more");
  return head + "\n" + lines.join("\n") + "\nTime: " + when;
}

/* ---------------- Telegram ---------------- */
const tg = { lastError: "", lastOk: 0, chain: Promise.resolve() };

function tgFriendly(j, status) {
  const d = String((j && j.description) || "").toLowerCase();
  if (status === 401 || d.includes("unauthorized")) return "Bot token is wrong.";
  if (d.includes("chat not found")) return "Chat ID is wrong, or the bot was not added to that group.";
  if (d.includes("kicked") || d.includes("not a member") || d.includes("forbidden") || status === 403) return "The bot was removed from the group or is not allowed to write there.";
  if (status === 429) return "Telegram says: too many messages, slow down.";
  return (j && j.description) ? "Telegram: " + j.description : "Telegram error " + status;
}
async function tgCall(token, method, body) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 15000);
  try {
    const r = await fetch(TG_API + "/bot" + token + "/" + method, {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body || {}), signal: ctrl.signal
    });
    const j = await r.json().catch(() => ({}));
    if (!j.ok) {
      const e = new Error(tgFriendly(j, r.status));
      e.migrateTo = j.parameters && j.parameters.migrate_to_chat_id;
      e.retryAfter = j.parameters && j.parameters.retry_after;
      throw e;
    }
    return j.result;
  } catch (e) {
    if (e.name === "AbortError") throw new Error("Telegram did not answer. Check the internet connection.");
    if (e.message === "fetch failed") throw new Error("Cannot reach Telegram. Check the internet connection.");
    throw e;
  } finally { clearTimeout(t); }
}
function normTg() {
  const t = cfg.telegram;
  const defs = [["t1", "Telegram box 1"], ["t2", "Telegram box 2"], ["t3", "Telegram box 3"]];
  const clean = (s) => String(s == null ? "" : s).replace(/[\u0000-\u001f<>"]/g, "").trim().slice(0, 40);
  const have = new Map();
  const src = Array.isArray(t.boxes) ? t.boxes : (t.chatId ? [{ id: "t1", name: "", chatId: t.chatId }] : []);
  src.forEach((x) => {
    const id = String((x && x.id) || "").replace(/[^a-z0-9]/gi, "").slice(0, 12);
    if (id && !have.has(id)) have.set(id, { name: clean(x.name), chatId: String(x.chatId || "").trim() });
  });
  const out = [];
  defs.forEach((d) => { const h = have.get(d[0]) || {}; out.push({ id: d[0], name: h.name || d[1], chatId: h.chatId || "" }); have.delete(d[0]); });
  have.forEach((v, id) => { if (out.length < 10) out.push({ id, name: v.name || ("Telegram box " + (out.length + 1)), chatId: v.chatId }); });
  t.boxes = out; t.chatId = out[0].chatId;
}
function tgReady() { normTg(); return !!(cfg.telegram.token && cfg.telegram.boxes.some((b) => b.chatId)); }
async function tgSendRaw(text, boxId) {
  normTg();
  const box = cfg.telegram.boxes.find((x) => x.id === boxId) || cfg.telegram.boxes[0];
  try {
    await tgCall(cfg.telegram.token, "sendMessage", { chat_id: box.chatId, text, disable_web_page_preview: true });
  } catch (e) {
    if (e.migrateTo) { box.chatId = String(e.migrateTo); cfg.telegram.chatId = cfg.telegram.boxes[0].chatId; saveCfg(); return tgSendRaw(text, box.id); }
    if (e.retryAfter && e.retryAfter <= 30) { await sleep((e.retryAfter + 1) * 1000); return tgSendRaw(text, box.id); }
    throw e;
  }
}
function tgSend(text, boxId) {
  tg.chain = tg.chain.then(async () => {
    try { await tgSendRaw(text, boxId); tg.lastError = ""; tg.lastOk = Date.now(); }
    catch (e) { tg.lastError = e.message; log("Telegram send failed: " + e.message); }
  });
  return tg.chain;
}
async function tgTest(token, chatId) {
  token = token || cfg.telegram.token; chatId = chatId || cfg.telegram.chatId;
  if (!TOKEN_RE.test(token || "")) throw new Error("Bot token looks wrong. It should look like 123456789:ABCdef...");
  if (!CHAT_RE.test(chatId || "")) throw new Error("Chat ID looks wrong. For a group it is a number like -1001234567890.");
  const me = await tgCall(token, "getMe");
  await tgCall(token, "sendMessage", { chat_id: chatId, text: "\u2705 Pariscope test message" + (cfg.siteName ? " - " + cfg.siteName : "") + "\nTelegram alerts are working." });
  return me.username || "";
}
async function tgDiscover(token) {
  token = token || cfg.telegram.token;
  if (!TOKEN_RE.test(token || "")) throw new Error("Enter the bot token first.");
  await tgCall(token, "getMe");
  const ups = await tgCall(token, "getUpdates", { limit: 100, timeout: 0 });
  const seen = new Map();
  (ups || []).forEach((u) => {
    const m = u.message || u.channel_post || u.my_chat_member || u.edited_message;
    const c = m && m.chat;
    if (c && c.id && c.type !== "private") seen.set(String(c.id), { id: String(c.id), title: c.title || String(c.id), type: c.type });
  });
  return Array.from(seen.values());
}

/* ---------------- WhatsApp (optional library) ---------------- */
const wa = { status: "off", qr: null, number: "", lastError: "", lastOk: 0, group: "", sock: null, gen: 0, timer: null, lib: null, qrlib: null, pending: [], sending: false };
const silent = { level: "silent", child() { return silent; }, trace() {}, debug() {}, info() {}, warn() {}, error() {}, fatal() {} };

async function waLoadLib() {
  if (wa.lib) return wa.lib;
  let m;
  try { m = await import("@whiskeysockets/baileys"); }
  catch (e) { return null; }
  const L = m.useMultiFileAuthState ? m : (m.default && m.default.useMultiFileAuthState ? m.default : null);
  if (!L) return null;
  const make = typeof L.makeWASocket === "function" ? L.makeWASocket : (typeof L.default === "function" ? L.default : (typeof m.default === "function" ? m.default : null));
  if (!make) return null;
  wa.lib = { make, useMultiFileAuthState: L.useMultiFileAuthState, fetchLatestBaileysVersion: L.fetchLatestBaileysVersion, DisconnectReason: L.DisconnectReason || {} };
  try { const q = await import("qrcode"); wa.qrlib = q.default || q; } catch (e) { wa.qrlib = null; }
  return wa.lib;
}
function waStopSock() {
  wa.gen++;
  if (wa.timer) { clearTimeout(wa.timer); wa.timer = null; }
  const s = wa.sock; wa.sock = null;
  if (s) { try { s.ev.removeAllListeners(); } catch (e) {} try { s.end(undefined); } catch (e) {} }
  wa.qr = null;
}
async function waStart() {
  if (!cfg.whatsapp.enabled) { wa.status = "off"; return; }
  waStopSock();
  const gen = wa.gen;
  wa.status = "loading"; wa.lastError = "";
  const lib = await waLoadLib();
  if (gen !== wa.gen) return;
  if (!lib) { wa.status = "missing"; wa.lastError = "The WhatsApp component is not installed on this PC. Reinstall using the Pariscope 4.0 setup while connected to the internet."; return; }
  try {
    fs.mkdirSync(WA_DIR, { recursive: true });
    const auth = await lib.useMultiFileAuthState(WA_DIR);
    let version;
    try { version = (await lib.fetchLatestBaileysVersion()).version; } catch (e) {}
    if (gen !== wa.gen) return;
    const sock = lib.make({
      auth: auth.state, version, logger: silent, printQRInTerminal: false,
      browser: ["Pariscope", "Chrome", "4.0"], markOnlineOnConnect: false, syncFullHistory: false, generateHighQualityLinkPreview: false
    });
    wa.sock = sock;
    sock.ev.on("creds.update", auth.saveCreds);
    sock.ev.on("connection.update", async (u) => {
      if (gen !== wa.gen) return;
      if (u.qr) {
        wa.status = "qr";
        try { wa.qr = wa.qrlib ? await wa.qrlib.toDataURL(u.qr, { margin: 1, width: 300 }) : null; } catch (e) { wa.qr = null; }
        if (!wa.qr) wa.lastError = "QR picture component missing.";
      }
      if (u.connection === "connecting" && wa.status !== "qr") wa.status = "connecting";
      if (u.connection === "open") {
        wa.qr = null; wa.status = "connected"; wa.lastError = "";
        wa.number = String((sock.user && sock.user.id) || "").split(":")[0].split("@")[0];
        log("WhatsApp connected" + (wa.number ? " (+" + wa.number + ")" : ""));
        waJoinGroup(sock, gen).then(waFlush);
      }
      if (u.connection === "close") {
        const code = u.lastDisconnect && u.lastDisconnect.error && u.lastDisconnect.error.output && u.lastDisconnect.error.output.statusCode;
        wa.qr = null;
        if (code === (lib.DisconnectReason.loggedOut || 401)) {
          log("WhatsApp was logged out from the phone");
          try { fs.rmSync(WA_DIR, { recursive: true, force: true }); } catch (e) {}
          wa.number = ""; wa.status = "logged_out";
          wa.timer = setTimeout(() => { if (gen === wa.gen && cfg.whatsapp.enabled) waStart(); }, 3000);
        } else {
          wa.status = "connecting";
          wa.timer = setTimeout(() => { if (gen === wa.gen && cfg.whatsapp.enabled) waStart(); }, code === 515 ? 500 : 6000);
        }
      }
    });
  } catch (e) {
    wa.status = "error"; wa.lastError = e.message; log("WhatsApp start failed: " + e.message);
    wa.timer = setTimeout(() => { if (gen === wa.gen && cfg.whatsapp.enabled) waStart(); }, 30000);
  }
}
function normBoxes(w) {
  const defs = [["b1", "Group box 1"], ["b2", "Group box 2"], ["b3", "Group box 3"]];
  const clean = (s) => String(s == null ? "" : s).replace(/[\u0000-\u001f<>"]/g, "").trim().slice(0, 40);
  const have = new Map();
  (Array.isArray(w.boxes) ? w.boxes : []).forEach((x) => {
    const id = String((x && x.id) || "").replace(/[^a-z0-9]/gi, "").slice(0, 12);
    if (id && !have.has(id)) have.set(id, clean(x && x.name));
  });
  const out = [];
  defs.forEach((d) => { out.push({ id: d[0], name: have.get(d[0]) || d[1] }); have.delete(d[0]); });
  have.forEach((name, id) => { if (out.length < 10) out.push({ id, name: name || ("Group box " + (out.length + 1)) }); });
  w.boxes = out;
  const ids = new Set(out.map((b) => b.id));
  (Array.isArray(w.groups) ? w.groups : []).forEach((g) => { if (!ids.has(g.box)) g.box = "b1"; });
}
function normGroups() {
  const w = cfg.whatsapp;
  let g = Array.isArray(w.groups) ? w.groups : [];
  g = g.map((x) => ({ inviteLink: String((x && x.inviteLink) || "").trim(), groupJid: String((x && x.groupJid) || ""), groupName: String((x && x.groupName) || ""), box: String((x && x.box) || "b1") })).filter((x) => inviteCode(x.inviteLink));
  if (!g.length && inviteCode(w.inviteLink)) g = [{ inviteLink: String(w.inviteLink).trim(), groupJid: String(w.groupJid || ""), groupName: String(w.groupName || ""), box: "b1" }];
  const seen = new Set();
  g = g.filter((x) => { const c = inviteCode(x.inviteLink); if (seen.has(c)) return false; seen.add(c); return true; }).slice(0, 20);
  w.groups = g; normBoxes(w);
  w.inviteLink = g.length ? g[0].inviteLink : "";
  w.groupJid = g.length ? g[0].groupJid : "";
  w.groupName = g.length ? g[0].groupName : "";
}
function waGroupsPublic() {
  normGroups();
  return cfg.whatsapp.groups.map((g) => {
    const c = inviteCode(g.inviteLink);
    return { inviteLink: g.inviteLink, box: g.box, name: g.groupName || "", state: (wa.gstate && wa.gstate[c]) || "", error: (wa.gerr && wa.gerr[c]) || "" };
  });
}
function waAggregate() {
  const gs = cfg.whatsapp.groups;
  const st = gs.map((g) => (wa.gstate || {})[inviteCode(g.inviteLink)] || "");
  if (!gs.length) { wa.group = "no_link"; return; }
  if (st.includes("joined")) { wa.group = "joined"; wa.lastError = ""; }
  else if (st.includes("pending")) { wa.group = "pending"; wa.lastError = "Waiting for a group admin to approve this WhatsApp number."; }
  else if (st.includes("error")) { wa.group = "error"; wa.lastError = (wa.gerr || {})[inviteCode(gs[st.indexOf("error")].inviteLink)] || "Could not join the group."; }
  else wa.group = "";
}
async function waJoinGroup(sock, gen) {
  normGroups();
  wa.gstate = wa.gstate || {}; wa.gerr = wa.gerr || {};
  const groups = cfg.whatsapp.groups;
  if (!groups.length) { wa.group = "no_link"; return; }
  for (const g of groups) {
    const code = inviteCode(g.inviteLink);
    if (gen !== wa.gen) return;
    if (g.groupJid && wa.gstate[code] === "joined") continue;
    wa.gstate[code] = "checking"; wa.gerr[code] = "";
    try {
      const info = await sock.groupGetInviteInfo(code);
      if (gen !== wa.gen) return;
      g.groupJid = info.id; g.groupName = info.subject || ""; normGroups(); saveCfg();
      try { await sock.groupMetadata(info.id); wa.gstate[code] = "joined"; continue; } catch (e) { /* not a member yet */ }
      try { await sock.groupAcceptInvite(code); wa.gstate[code] = "joined"; log("Joined WhatsApp group " + info.subject); }
      catch (e) {
        const msg = String((e && e.message) || e);
        if (/conflict|already/i.test(msg) || (e && e.data === 409)) wa.gstate[code] = "joined";
        else if (/approval|request|forbidden|403/i.test(msg)) { wa.gstate[code] = "pending"; wa.gerr[code] = "Waiting for a group admin to approve this WhatsApp number."; }
        else { wa.gstate[code] = "error"; wa.gerr[code] = "Could not join the group: " + msg; log(wa.gerr[code]); }
      }
    } catch (e) {
      wa.gstate[code] = "error"; wa.gerr[code] = "The group invite link is not valid or was reset."; log("WhatsApp invite check failed: " + e.message);
    }
    await sleep(1500);
  }
  waAggregate();
}
function waTargets(boxIds) {
  normGroups();
  return cfg.whatsapp.groups.filter((g) => g.groupJid && (!boxIds || boxIds.indexOf(g.box) >= 0) && (wa.gstate || {})[inviteCode(g.inviteLink)] === "joined");
}
function waSend(text, boxes) {
  wa.pending.push({ text, ts: Date.now(), boxes: boxes || null });
  if (wa.pending.length > 30) wa.pending.shift();
  return waFlush();
}
async function waFlush() {
  if (wa.sending) return;
  wa.sending = true;
  try {
    let skips = 0;
    while (wa.pending.length && wa.status === "connected" && wa.sock) {
      const item = wa.pending[0];
      if (Date.now() - item.ts > 10 * 60 * 1000) { wa.pending.shift(); continue; }
      const targets = waTargets(item.boxes);
      if (!targets.length) { wa.pending.push(wa.pending.shift()); if (++skips >= wa.pending.length) break; continue; }
      skips = 0;
      let any = false;
      for (const g of targets) {
        try { await wa.sock.sendMessage(g.groupJid, { text: item.text }); any = true; }
        catch (e) { wa.lastError = "Could not send to " + (g.groupName || "a group") + ": " + e.message; log(wa.lastError); }
        await sleep(1500);
      }
      if (any) wa.lastOk = Date.now();
      wa.pending.shift();
    }
  } finally { wa.sending = false; }
}
async function waFlushOld() {
  if (wa.sending) return;
  wa.sending = true;
  try {
    while (wa.pending.length && wa.status === "connected" && wa.sock) {
      const targets = waTargets();
      if (!targets.length) break;
      const item = wa.pending[0];
      if (Date.now() - item.ts > 10 * 60 * 1000) { wa.pending.shift(); continue; } // too old to be useful
      let any = false;
      for (const g of targets) {
        try { await wa.sock.sendMessage(g.groupJid, { text: item.text }); any = true; }
        catch (e) { wa.lastError = "Could not send to " + (g.groupName || "a group") + ": " + e.message; log(wa.lastError); }
        await sleep(1500);
      }
      if (any) wa.lastOk = Date.now();
      wa.pending.shift();
    }
  } finally { wa.sending = false; }
}
function waReady() { normGroups(); return cfg.whatsapp.enabled && cfg.whatsapp.groups.length > 0; }
/* ---------------- events from the voice engine ---------------- */
let ctx = null;
async function dispatch(type, items) {
  if (!ctx) return { sent: 0 };
  const map = new Map();
  ctx.liveState.categories.forEach((c) => c.nodes.forEach((n) => map.set(n.name + "|" + n.ip, { n, c })));
  const rich = [];
  (items || []).slice(0, 200).forEach((i) => {
    const f = map.get(String(i.name) + "|" + String(i.ip)) || (i.svc === true ? { n: { name: String(i.name), ip: String(i.ip), alerts: {} }, c: { name: String(i.cat || "Services") } } : null);
    if (!f) return;
    const a = f.n.alerts || {};
    rich.push({ name: f.n.name, ip: f.n.ip, cat: f.c.name, ms: Number(i.ms) || 0, wa: a.wa !== false, tg: a.tg !== false, boxes: Array.isArray(a.boxes) && a.boxes.length ? a.boxes : null, tgBoxes: Array.isArray(a.tgBoxes) && a.tgBoxes.length ? a.tgBoxes : null });
  });
  let sent = 0;
  const tgItems = rich.filter((i) => i.tg), waItems = rich.filter((i) => i.wa);
  if (cfg.telegram.enabled && tgReady() && tgItems.length) {
    const tIds = cfg.telegram.boxes.map((b) => b.id);
    const byChat = new Map();
    tgItems.forEach((i) => {
      (i.tgBoxes || tIds).forEach((id) => {
        const b = cfg.telegram.boxes.find((x) => x.id === id);
        if (!b || !b.chatId) return;
        if (!byChat.has(b.chatId)) byChat.set(b.chatId, { id: b.id, m: new Map() });
        byChat.get(b.chatId).m.set(i.name + "|" + i.ip, i);
      });
    });
    byChat.forEach((v) => { tgSend(compose(type, Array.from(v.m.values())), v.id); sent++; });
  }
  if (waReady() && waItems.length) {
    const allIds = cfg.whatsapp.boxes.map((b) => b.id);
    const byBox = new Map();
    waItems.forEach((i) => { (i.boxes || allIds).forEach((id) => { if (allIds.indexOf(id) < 0) return; if (!byBox.has(id)) byBox.set(id, []); byBox.get(id).push(i); }); });
    const sig = new Map();
    byBox.forEach((list, id) => { const k = list.map((x) => x.name + "|" + x.ip).join(","); if (!sig.has(k)) sig.set(k, { list, ids: [] }); sig.get(k).ids.push(id); });
    sig.forEach((v) => { waSend(compose(type, v.list), v.ids); sent++; });
  }
  return { sent };
}

/* ---------------- admin routes (login required) ---------------- */
function publicStatus() {
  return {
    siteName: cfg.siteName,
    telegram: {
      enabled: !!cfg.telegram.enabled, chatId: cfg.telegram.chatId, tokenSet: !!cfg.telegram.token,
      tokenMask: maskToken(cfg.telegram.token), lastError: tg.lastError, lastOk: tg.lastOk, boxes: (normTg(), cfg.telegram.boxes)
    },
    whatsapp: {
      enabled: !!cfg.whatsapp.enabled, status: wa.status, qr: wa.status === "qr" ? wa.qr : null, number: wa.number,
      inviteLink: cfg.whatsapp.inviteLink, groupName: cfg.whatsapp.groupName, group: wa.group || "", groups: waGroupsPublic(), boxes: (normGroups(), cfg.whatsapp.boxes),
      lastError: wa.lastError, lastOk: wa.lastOk
    }
  };
}
function attach(c) {
  ctx = c;
  const router = c.router, authed = c.authed;
  const ok = (res, extra) => res.json(Object.assign({ ok: true }, extra || {}));
  const bad = (res, msg, code) => res.status(code || 400).json({ error: msg });

  router.get("/notify", authed, (req, res) => res.json(publicStatus()));

  router.post("/notify/site", authed, (req, res) => {
    cfg.siteName = cleanSite((req.body || {}).siteName); saveCfg(); ok(res);
  });

  router.post("/notify/telegram", authed, (req, res) => {
    const b = req.body || {};
    if (!Array.isArray(b.boxes)) return bad(res, "Nothing to save.");
    if (b.boxes.length > 10) return bad(res, "Maximum 10 Telegram boxes.");
    const enabled = !!b.enabled;
    const token = String(b.token || "").trim() || cfg.telegram.token;
    const boxes = [];
    for (const x of b.boxes) {
      const id = String((x && x.id) || "").replace(/[^a-z0-9]/gi, "").slice(0, 12);
      if (!id) continue;
      const chatId = String((x && x.chatId) || "").trim();
      const name = cleanSite(x.name).slice(0, 40);
      if (chatId && !CHAT_RE.test(chatId)) return bad(res, "Chat ID looks wrong in box " + (name || id) + ". For a group it is a number like -1001234567890.");
      boxes.push({ id, name, chatId });
    }
    if (token && !TOKEN_RE.test(token)) return bad(res, "Bot token looks wrong. It should look like 123456789:ABCdef...");
    if (enabled) {
      if (!token) return bad(res, "Enter the bot token first.");
      if (!boxes.some((bx) => bx.chatId)) return bad(res, "Enter at least one group chat ID first.");
    }
    cfg.telegram = { enabled, token, chatId: "", boxes };
    normTg(); saveCfg(); ok(res);
  });
  router.post("/notify/telegram-old", authed, (req, res) => {
    const b = req.body || {};
    const chatId = String(b.chatId || "").trim();
    const token = String(b.token || "").trim() || cfg.telegram.token;
    const enabled = !!b.enabled;
    if (enabled) {
      if (!TOKEN_RE.test(token)) return bad(res, "Bot token looks wrong. It should look like 123456789:ABCdef...");
      if (!CHAT_RE.test(chatId)) return bad(res, "Chat ID looks wrong. For a group it is a number like -1001234567890.");
    } else {
      if (token && !TOKEN_RE.test(token)) return bad(res, "Bot token looks wrong.");
      if (chatId && !CHAT_RE.test(chatId)) return bad(res, "Chat ID looks wrong.");
    }
    cfg.telegram = { enabled, token, chatId }; saveCfg(); ok(res);
  });
  router.post("/notify/telegram/test", authed, async (req, res) => {
    try {
      const b = req.body || {};
      const bot = await tgTest(String(b.token || "").trim(), String(b.chatId || "").trim());
      ok(res, { bot });
    } catch (e) { bad(res, e.message); }
  });
  router.post("/notify/telegram/find", authed, async (req, res) => {
    try { ok(res, { chats: await tgDiscover(String((req.body || {}).token || "").trim()) }); }
    catch (e) { bad(res, e.message); }
  });

  const parseLinks = (b) => {
    const raw = Array.isArray(b.inviteLinks) ? b.inviteLinks : String(b.inviteLinks != null ? b.inviteLinks : (b.inviteLink || "")).split(/[\s,;]+/);
    return raw.map((x) => String(x || "").trim()).filter(Boolean);
  };
  router.post("/notify/whatsapp", authed, (req, res) => {
    const b = req.body || {};
    if (!Array.isArray(b.boxes)) return bad(res, "Nothing to save.");
    if (b.boxes.length > 10) return bad(res, "Maximum 10 group boxes.");
    const enabled = !!b.enabled;
    const boxes = [], groups = [], seenCodes = new Set();
    for (const x of b.boxes) {
      const id = String((x && x.id) || "").replace(/[^a-z0-9]/gi, "").slice(0, 12);
      if (!id) continue;
      boxes.push({ id, name: cleanSite(x.name).slice(0, 40) });
      const links = String((x && x.links) || "").split(/[\s,;]+/).map((s) => s.trim()).filter(Boolean);
      for (const l of links) {
        const code = inviteCode(l);
        if (!code) return bad(res, "That is not a WhatsApp group invite link: " + l.slice(0, 60) + "  (it looks like https://chat.whatsapp.com/XXXXXXXX)");
        if (seenCodes.has(code)) continue;
        seenCodes.add(code);
        groups.push({ inviteLink: l, groupJid: "", groupName: "", box: id });
      }
    }
    if (groups.length > 20) return bad(res, "Maximum 20 WhatsApp groups in total.");
    if (enabled && !groups.length) return bad(res, "Paste at least one WhatsApp group invite link first.");
    normGroups();
    const wasEnabled = !!cfg.whatsapp.enabled;
    const old = new Map(cfg.whatsapp.groups.map((g) => [inviteCode(g.inviteLink), g]));
    groups.forEach((g) => { const o = old.get(inviteCode(g.inviteLink)); if (o) { g.groupJid = o.groupJid; g.groupName = o.groupName; } });
    cfg.whatsapp = { enabled, inviteLink: "", groupJid: "", groupName: "", groups, boxes };
    normGroups(); saveCfg();
    const keep = new Set(cfg.whatsapp.groups.map((g) => inviteCode(g.inviteLink)));
    Object.keys(wa.gstate || {}).forEach((k) => { if (!keep.has(k)) { delete wa.gstate[k]; if (wa.gerr) delete wa.gerr[k]; } });
    if (!enabled) { waStopSock(); wa.status = "off"; wa.group = ""; wa.pending = []; }
    else if (!wa.sock || !wasEnabled) { waStart(); }
    else if (wa.status === "connected") { waJoinGroup(wa.sock, wa.gen).then(waFlush); }
    ok(res);
  });
  router.post("/notify/whatsapp-old", authed, (req, res) => {
    const b = req.body || {};
    const enabled = !!b.enabled;
    const links = parseLinks(b);
    for (const l of links) if (!inviteCode(l)) return bad(res, "That is not a WhatsApp group invite link: " + l.slice(0, 60) + "  (it looks like https://chat.whatsapp.com/XXXXXXXX)");
    if (links.length > 20) return bad(res, "Maximum 20 WhatsApp groups.");
    if (enabled && !links.length) return bad(res, "Paste at least one WhatsApp group invite link first.");
    normGroups();
    const wasEnabled = !!cfg.whatsapp.enabled;
    const old = new Map(cfg.whatsapp.groups.map((g) => [inviteCode(g.inviteLink), g]));
    const groups = links.map((l) => { const o = old.get(inviteCode(l)); return { inviteLink: l, groupJid: o ? o.groupJid : "", groupName: o ? o.groupName : "" }; });
    cfg.whatsapp = { enabled, inviteLink: "", groupJid: "", groupName: "", groups };
    normGroups(); saveCfg();
    const keep = new Set(cfg.whatsapp.groups.map((g) => inviteCode(g.inviteLink)));
    Object.keys(wa.gstate || {}).forEach((k) => { if (!keep.has(k)) { delete wa.gstate[k]; if (wa.gerr) delete wa.gerr[k]; } });
    if (!enabled) { waStopSock(); wa.status = "off"; wa.group = ""; wa.pending = []; }
    else if (!wa.sock || !wasEnabled) { waStart(); }
    else if (wa.status === "connected") { waJoinGroup(wa.sock, wa.gen).then(waFlush); }
    ok(res);
  });
  router.post("/notify/whatsapp/test", authed, async (req, res) => {
    if (wa.status !== "connected") return bad(res, "WhatsApp is not connected yet. Scan the QR code first.");
    const boxId = String((req.body || {}).box || "");
    normGroups();
    const inBox = cfg.whatsapp.groups.filter((g) => g.box === boxId);
    if (!inBox.length) return bad(res, "This box has no saved link yet. Paste a link and press Save and connect first.");
    const targets = waTargets([boxId]);
    if (!targets.length) return bad(res, "No group in this box is ready yet (still joining, or waiting for admin approval). See the status lines.");
    const bx = cfg.whatsapp.boxes.find((x) => x.id === boxId);
    let n = 0, lastErr = "";
    for (const g of targets) {
      try { await wa.sock.sendMessage(g.groupJid, { text: "\u2705 Pariscope test message" + (cfg.siteName ? " - " + cfg.siteName : "") + "\nBox: " + (bx ? bx.name : boxId) + "\nWhatsApp alerts are working." }); n++; }
      catch (e) { lastErr = e.message; }
      await sleep(800);
    }
    if (!n) return bad(res, "Could not send: " + lastErr);
    ok(res, { sent: n });
  });
  router.post("/notify/whatsapp/test-all", authed, async (req, res) => {
    if (wa.status !== "connected") return bad(res, "WhatsApp is not connected yet. Scan the QR code first.");
    const targets = waTargets();
    if (!targets.length) return bad(res, wa.group === "pending" ? "Waiting for a group admin to approve this number." : "No group is ready yet. Check the invite links.");
    let n = 0, lastErr = "";
    for (const g of targets) {
      try { await wa.sock.sendMessage(g.groupJid, { text: "\u2705 Pariscope test message" + (cfg.siteName ? " - " + cfg.siteName : "") + "\nWhatsApp alerts are working." }); n++; }
      catch (e) { lastErr = e.message; }
      await sleep(800);
    }
    if (!n) return bad(res, "Could not send: " + lastErr);
    ok(res, { sent: n });
  });
  router.post("/notify/whatsapp/unlink", authed, async (req, res) => {
    try { if (wa.sock) await wa.sock.logout(); } catch (e) {}
    waStopSock();
    try { fs.rmSync(WA_DIR, { recursive: true, force: true }); } catch (e) {}
    normGroups();
    cfg.whatsapp.enabled = false;
    cfg.whatsapp.groups.forEach((g) => { g.groupJid = ""; g.groupName = ""; });
    normGroups(); saveCfg();
    wa.status = "off"; wa.number = ""; wa.group = ""; wa.pending = []; wa.lastError = ""; wa.gstate = {}; wa.gerr = {};
    ok(res);
  });
  // per-link switches: { catId, uid, wa, tg }   and   whole category: { catId, wa, tg }
  const setFlags = (n, b) => {
    const prevBoxes = n.alerts && Array.isArray(n.alerts.boxes) ? n.alerts.boxes : null;
    const prevTg = n.alerts && Array.isArray(n.alerts.tgBoxes) ? n.alerts.tgBoxes : null;
    n.alerts = { wa: b.wa === undefined ? (n.alerts ? n.alerts.wa !== false : true) : !!b.wa, tg: b.tg === undefined ? (n.alerts ? n.alerts.tg !== false : true) : !!b.tg };
    if (Array.isArray(b.boxes)) n.alerts.boxes = b.boxes.map(String).filter((x) => /^[a-z0-9]{1,12}$/i.test(x)).slice(0, 30);
    else if (prevBoxes) n.alerts.boxes = prevBoxes;
    if (Array.isArray(b.tgBoxes)) n.alerts.tgBoxes = b.tgBoxes.map(String).filter((x) => /^[a-z0-9]{1,12}$/i.test(x)).slice(0, 30);
    else if (prevTg) n.alerts.tgBoxes = prevTg;
  };
  router.post("/notify/link", authed, (req, res) => {
    const b = req.body || {};
    const cat = c.liveState.categories.find((x) => x.id === b.catId);
    const node = cat && cat.nodes.find((n) => n.uid === b.uid);
    if (!node) return bad(res, "Link not found", 404);
    setFlags(node, b); c.persist(); ok(res);
  });
  router.post("/notify/bulk", authed, (req, res) => {
    const b = req.body || {};
    const cat = c.liveState.categories.find((x) => x.id === b.catId);
    if (!cat) return bad(res, "Category not found", 404);
    cat.nodes.forEach((n) => setFlags(n, b)); c.persist(); ok(res);
  });

  // internal: the voice engine (same PC only) reports DOWN / RECOVERED events here
  c.app.post("/api/internal/notify", require("express").json({ limit: "200kb" }), (req, res) => {
    const a = req.socket.remoteAddress || "";
    if (!(a === "127.0.0.1" || a === "::1" || a === "::ffff:127.0.0.1")) return res.status(403).json({ error: "local only" });
    const b = req.body || {};
    if (b.type !== "down" && b.type !== "up") return res.status(400).json({ error: "bad type" });
    dispatch(b.type, Array.isArray(b.items) ? b.items : []).then((r) => res.json({ ok: true, sent: r.sent })).catch(() => res.json({ ok: false }));
  });
}

function start() {
  trimLog(); loadCfg();
  if (cfg.whatsapp.enabled) setTimeout(() => waStart().catch((e) => log("WhatsApp start error: " + e.message)), 3000);
}

module.exports = { attach, start, _t: { compose, inviteCode, dispatch, tgTest, tgDiscover, cfgRef: () => cfg, loadCfg } };

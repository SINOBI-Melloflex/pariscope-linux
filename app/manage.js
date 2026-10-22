"use strict";
// Pariscope "Manage" feature - backend (login + add/edit/delete links by category).
// Works together with manage-ui.js. Links are saved in categories.json.

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const express = require("express");

// ===== LOGIN: change here, then restart Pariscope =====
const ADMIN_USER = "ADMIN";
const ADMIN_PASS = "admin";
// ======================================================

const DATA_DIR = require("./datadir").DATA_DIR;
const DATA_FILE = path.join(DATA_DIR, "categories.json");
// ===== USERS: main admin + extra logins. Saved hashed in manage-users.json ===== USERS
const USERS_FILE = path.join(DATA_DIR, "manage-users.json");
const USER_RE = /^[A-Za-z0-9._-]{3,32}$/;
function readUsers() {
  try {
    const j = JSON.parse(fs.readFileSync(USERS_FILE, "utf8").replace(/^\uFEFF/, ""));
    return Array.isArray(j.users) ? j.users.filter((u) => u && typeof u.username === "string" && u.salt && u.hash) : [];
  } catch (e) { return []; }
}
function writeUsers(list) {
  const tmp = USERS_FILE + ".tmp";
  fs.writeFileSync(tmp, JSON.stringify({ users: list }, null, 2));
  fs.renameSync(tmp, USERS_FILE);
}
function hashPass(p, salt) { return crypto.scryptSync(String(p), salt, 32).toString("hex"); }
function findUser(name) {
  const n = String(name || "").trim().toLowerCase();
  return readUsers().find((u) => u.username.toLowerCase() === n) || null;
}
const ADMIN_NAME_FILE = path.join(DATA_DIR, "manage-admin.json");
function adminName() { try { const j = JSON.parse(fs.readFileSync(ADMIN_NAME_FILE, "utf8").replace(/^\uFEFF/, "")); if (j && USER_RE.test(String(j.username))) return String(j.username); } catch (e) {} return ADMIN_USER; } // ACCOUNTS
function isAdminName(name) { return String(name || "").trim().toLowerCase() === adminName().toLowerCase(); }
function userKnown(name) { return isAdminName(name) || !!findUser(name); }
function passOk(name, p) {
  p = String(p == null ? "" : p).trim();
  const u = findUser(name);
  if (!u) return isAdminName(name) && p.toLowerCase() === String(ADMIN_PASS).toLowerCase();
  try {
    const got = Buffer.from(hashPass(p, u.salt), "hex"), want = Buffer.from(String(u.hash), "hex");
    return got.length === want.length && crypto.timingSafeEqual(got, want);
  } catch (e) { return false; }
}
function saveUser(name, p) {
  const n = String(name).trim().toLowerCase();
  const prev = findUser(name), list = readUsers().filter((u) => u.username.toLowerCase() !== n);
  const salt = crypto.randomBytes(16).toString("hex");
  list.push({ username: isAdminName(name) ? adminName() : String(name).trim(), role: (arguments[2] || (prev && prev.role) || "write"), salt, hash: hashPass(p, salt), changedAt: new Date().toISOString() });
  writeUsers(list);
}
const uFails = new Map(); // helpers keep their own wrong-attempt table
function throttle(req, res) {
  const f = uFails.get(req.ip) || { n: 0, until: 0 };
  if (f.until > Date.now()) { res.status(429).json({ error: "Too many wrong attempts. Wait 1 minute." }); return null; }
  return f;
}
function bad(req, f) { f.n++; if (f.n >= 5) { f.until = Date.now() + 60000; f.n = 0; } uFails.set(req.ip, f); }
function adminGate(req, res) {
  const f = throttle(req, res); if (!f) return null;
  const b = req.body || {};
  if (!passOk(adminName(), b.adminPassword)) { bad(req, f); res.status(401).json({ error: "Admin password is wrong" }); return null; }
  uFails.delete(req.ip);
  return b;
}
// ===== ROLES + DASHBOARD LOCK ===== ROLES
const LOCK_FILE = path.join(DATA_DIR, "manage-lock.json");
let lockCache = { at: 0, v: false };
function isLocked() {
  if (Date.now() - lockCache.at < 1500) return lockCache.v;
  let v = false;
  try { v = JSON.parse(fs.readFileSync(LOCK_FILE, "utf8").replace(/^\uFEFF/, "")).locked === true; } catch (e) { v = false; }
  lockCache = { at: Date.now(), v };
  return v;
}
function setLocked(v) { fs.writeFileSync(LOCK_FILE, JSON.stringify({ locked: !!v })); lockCache = { at: Date.now(), v: !!v }; }
function roleOf(name) { if (isAdminName(name)) return "admin"; const u = findUser(name); return u && u.role === "read" ? "read" : "write"; }
const viewSess = new Map();
function cookieGet(req, k) {
  const m = String(req.headers.cookie || "").split(/;\s*/).find((c) => c.indexOf(k + "=") === 0);
  return m ? m.slice(k.length + 1) : "";
}
const GATE_PAGE = [
  "<!doctype html><html><head><meta charset='utf-8'><meta name='viewport' content='width=device-width,initial-scale=1'><title>Pariscope - Login</title></head>",
  "<body style='margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;background:#070b14;font-family:Segoe UI,Roboto,sans-serif;color:#f8fafc'>",
  "<div style='width:100%;max-width:340px;padding:24px;border-radius:16px;background:#0b1220;border:1px solid rgba(245,196,81,.35)'>",
  "<div style='font-size:20px;font-weight:800;margin:0 0 4px'>Pariscope</div>",
  "<div style='color:#94a3b8;font-size:13px;margin:0 0 16px'>This dashboard is private. Please log in.</div>",
  "<input id='u' placeholder='User name' autocomplete='username' style='width:100%;box-sizing:border-box;padding:11px 12px;margin:0 0 10px;border-radius:10px;border:1px solid rgba(255,255,255,.16);background:rgba(0,0,0,.4);color:#f8fafc;font-size:14px'>",
  "<input id='p' type='password' placeholder='Password' autocomplete='current-password' style='width:100%;box-sizing:border-box;padding:11px 12px;margin:0 0 10px;border-radius:10px;border:1px solid rgba(255,255,255,.16);background:rgba(0,0,0,.4);color:#f8fafc;font-size:14px'>",
  "<div id='m' style='min-height:18px;font-size:13px;font-weight:700;color:#fb7185;margin:0 0 10px'></div>",
  "<button onclick='go()' style='width:100%;padding:11px;border:0;border-radius:10px;cursor:pointer;font-weight:800;color:#1a1200;background:linear-gradient(135deg,#ffdf8a,#f5c451)'>Log in</button></div>",
  "<script>function go(){var m=document.getElementById('m');m.textContent='';fetch('/api/manage/viewer-login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({username:document.getElementById('u').value,password:document.getElementById('p').value})}).then(function(r){return r.json().catch(function(){return{}})}).then(function(j){if(j.ok){location.reload()}else{m.textContent=j.error||'Login failed'}}).catch(function(){m.textContent='Request failed'})}document.addEventListener('keydown',function(e){if(e.key==='Enter')go()})</script></body></html>"
].join("");
function viewGate(req, res, next) {
  if (!isLocked()) return next();
  const p = req.path;
  if (/^\/api\/(manage|licence)(\/|$)/.test(p) || /^\/licence/.test(p) || p === "/favicon.ico") return next(); const ra = req.socket.remoteAddress || ""; if ((ra === "127.0.0.1" || ra === "::1" || ra === "::ffff:127.0.0.1") && !req.headers["sec-fetch-mode"] && !req.headers.cookie && (p === "/api/status" || p.indexOf("/api/internal/") === 0)) return next(); // LOCALPASS
  const t = cookieGet(req, "psc_view"), exp = t && viewSess.get(t);
  if (exp && exp > Date.now()) return next();
  if (t) viewSess.delete(t);
  if (req.method === "GET" && (p === "/" || /\.html?$/i.test(p) || String(req.headers.accept || "").indexOf("text/html") >= 0)) {
    res.status(200).set("Content-Type", "text/html; charset=utf-8").set("Cache-Control", "no-store").send(GATE_PAGE);
    return;
  }
  res.status(401).json({ error: "Dashboard is locked. Log in first." });
}
function goodPass(p) { p = String(p == null ? "" : p).trim(); return p.length >= 4 && p.length <= 100 ? p : null; }
const BACKUP_DIR = path.join(DATA_DIR, "manage-backups");
const SESSION_MS = 2 * 60 * 60 * 1000;
const KEEP_BACKUPS = 50;
const IPV4 = /^(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}$/;

const newUid = () => crypto.randomBytes(4).toString("hex");
const BAD_CHARS = /[\u0000-\u001f<>"`]/;
function cleanName(s, max) {
  s = String(s == null ? "" : s).trim();
  return s && s.length <= max && !BAD_CHARS.test(s) ? s : null;
}
function fixName(s) {
  return String(s == null ? "" : s).replace(/[\u0000-\u001f<>"`]/g, "").trim().slice(0, 60);
}
const cleanIp = (s) => (IPV4.test(String(s || "").trim()) ? String(s).trim() : null);
const cleanColor = (s) => (/^#[0-9a-fA-F]{6}$/.test(String(s)) ? String(s) : null);
const cleanAlerts = (a) => { const o = { wa: !(a && a.wa === false), tg: !(a && a.tg === false) }; if (a && Array.isArray(a.boxes)) o.boxes = a.boxes.map((x) => String(x)).filter((x) => /^[a-z0-9]{1,12}$/i.test(x)).slice(0, 30); if (a && Array.isArray(a.tgBoxes)) o.tgBoxes = a.tgBoxes.map((x) => String(x)).filter((x) => /^[a-z0-9]{1,12}$/i.test(x)).slice(0, 30); return o; }; // 4.0: per-link WhatsApp / Telegram switches (default ON)
const cleanPrio = (s) => (["P1", "P2", "P3"].includes(s) ? s : "P3");
function clampInterval(v) {
  const n = Number(v);
  return n >= 2000 && n <= 120000 ? Math.round(n) : 10000;
}
function slug(name, taken) {
  const base = name.toLowerCase().replace(/[^a-z0-9]+/g, "").slice(0, 20) || "cat";
  let id = base, i = 2;
  while (taken.has(id)) id = base + i++;
  return id;
}
function plain(c) {
  return {
    id: c.id, name: c.name, color: c.color, priority: c.priority, interval: c.interval,
    nodes: c.nodes.map((n) => ({ name: n.name, ip: n.ip, alerts: cleanAlerts(n.alerts) }))
  };
}

// Reads categories.json (lenient, never drops a link that has a sane name + IP).
function sanitizeLoaded(list) {
  if (!Array.isArray(list)) return null;
  const out = [], ids = new Set();
  list.forEach((c) => {
    if (!c || typeof c !== "object") return;
    const name = fixName(c.name);
    if (!name) return;
    let id = typeof c.id === "string" && /^[a-z0-9]{1,24}$/.test(c.id) ? c.id : slug(name, ids);
    if (ids.has(id)) id = slug(name, ids);
    ids.add(id);
    const nodes = [];
    (Array.isArray(c.nodes) ? c.nodes : []).forEach((n) => {
      const nn = n ? fixName(n.name) : "";
      const ip = n && typeof n.ip === "string" ? n.ip.trim() : "";
      if (nn && /^[A-Za-z0-9.\-]{1,100}$/.test(ip)) nodes.push({ name: nn, ip, alerts: cleanAlerts(n.alerts) });
      else console.error("[manage] skipped invalid link entry:", JSON.stringify(n));
    });
    out.push({ id, name, color: cleanColor(c.color) || "#38bdf8", priority: cleanPrio(c.priority), interval: clampInterval(c.interval), nodes });
  });
  return out;
}

function save(categories) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
  if (fs.existsSync(DATA_FILE)) {
    const stamp = new Date().toISOString().replace(/[:.]/g, "-");
    fs.copyFileSync(DATA_FILE, path.join(BACKUP_DIR, "categories-" + stamp + ".json"));
    const old = fs.readdirSync(BACKUP_DIR).filter((f) => f.startsWith("categories-")).sort();
    old.slice(0, Math.max(0, old.length - KEEP_BACKUPS)).forEach((f) => {
      try { fs.unlinkSync(path.join(BACKUP_DIR, f)); } catch (e) {}
    });
  }
  const tmp = DATA_FILE + ".tmp";
  fs.writeFileSync(tmp, JSON.stringify({ version: 1, savedAt: new Date().toISOString(), categories: categories.map(plain) }, null, 2));
  fs.renameSync(tmp, DATA_FILE);
}

// Called once at startup, before liveState is created.
function loadSaved(rawCategories) {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const parsed = JSON.parse(fs.readFileSync(DATA_FILE, "utf8").replace(/^\uFEFF/, ""));
      const loaded = sanitizeLoaded(parsed && parsed.categories);
      if (loaded) {
        rawCategories.length = 0;
        loaded.forEach((c) => rawCategories.push(c));
        console.log("[manage] loaded " + loaded.length + " categories from categories.json");
      } else console.error("[manage] categories.json is not valid - using the built-in list (file left untouched)");
    } else {
      save(rawCategories);
      console.log("[manage] created categories.json from the built-in list");
    }
  } catch (e) {
    console.error("[manage] load problem, using the built-in list:", e.message);
  }
  rawCategories.forEach((c) => c.nodes.forEach((n) => { n.uid = newUid(); }));
}

// Keeps the manage files and data private (the app serves its whole folder).
function blockPrivate(req, res, next) {
  let p;
  try { p = path.posix.normalize(decodeURIComponent(req.path).replace(/\\/g, "/").toLowerCase()); }
  catch (e) { return res.status(400).end(); }
  if (/^\/(manage\.js|notify\.js|notify\.json|notify\.log|wa-auth|licence\.dat|licence\.js|categories\.json|manage-users|manage-backups|apply-manage-patch\.js|datadir\.js|pariscope-data|data(\/|$)|update-backup|state-cache|voice-state|voice\.log|install-)/.test(p)) return res.status(404).end();
  next();
}

function attach(ctx) {
  const app = ctx.app, liveState = ctx.liveState, pollCategory = ctx.pollCategory;
  const router = express.Router();
  const sessions = new Map();
  const fails = new Map();

  router.use(express.json({ limit: "100kb" }));
const sessRole = new Map(); // ROLES
  globalThis.__pariscopeRoleOf = function (t) { const e = t && sessions.get(t); return (e && e > Date.now()) ? (sessRole.get(t) || "write") : null; }; // NETMAP
router.use((req, res, next) => {
  if (req.method === "GET" || req.method === "HEAD") return next();
  if (/^\/(login|logout|password|viewer-login|viewer-logout|users\/|lock)/.test(req.path)) return next();
  if (sessRole.get(req.get("x-manage-token")) === "read") return res.status(403).json({ error: "Read-only login: you cannot change anything." });
  if (req.method === "DELETE" && sessRole.get(req.get("x-manage-token")) === "write") return res.status(403).json({ error: "Write login: you can add and edit links, but only the admin can delete." }); // ACCOUNTS
  next();
});
  router.use((req, res, next) => { res.set("Cache-Control", "no-store"); next(); });

  const findCat = (id) => liveState.categories.find((c) => c.id === id);
  const statusRank = (s) => (s === "DOWN" ? 1 : s === "FLAPPING" ? 2 : 3);

  function recount() {
    let on = 0, off = 0, fl = 0, tot = 0;
    liveState.categories.forEach((c) => c.nodes.forEach((n) => {
      tot++;
      if (n.status === "ONLINE") on++;
      if (n.status === "DOWN") off++;
      if (n.status === "FLAPPING") fl++;
    }));
    liveState.totalNodes = tot; liveState.onlineCount = on; liveState.offlineCount = off; liveState.flappingCount = fl;
  }
  function commit(res, extra) {
    const out = Object.assign({ ok: true }, extra || {});
    try { save(liveState.categories); }
    catch (e) { out.warn = "Applied, but saving to disk failed: " + e.message; console.error("[manage] save failed:", e.message); }
    recount();
    res.json(out);
  }
  async function probeNode(cat, node) {
    try { await pollCategory({ name: cat.name, priority: cat.priority, nodes: [node] }); } catch (e) {}
    return node;
  }
  // Polling loop for categories created from the Manage panel (same logic as the built-in ones).
  function startPoll(cat) {
    const tick = () => {
      if (cat.removed) return;
      Promise.resolve(pollCategory(cat)).catch(() => {}).then(() => {
        cat.nodes.sort((a, b) => statusRank(a.status) - statusRank(b.status));
        recount();
        if (!cat.removed) setTimeout(tick, cat.interval);
      });
    };
    tick();
  }

  function authed(req, res, next) {
    const t = req.get("x-manage-token");
    const exp = t && sessions.get(t);
    if (!exp || exp < Date.now()) {
      if (t) sessions.delete(t);
      return res.status(401).json({ error: "Please log in again" });
    }
    sessions.set(t, Date.now() + SESSION_MS);
    next();
  }

  router.post("/login", (req, res) => {
    const ip = req.ip;
    const f = fails.get(ip) || { n: 0, until: 0 };
    if (f.until > Date.now()) return res.status(429).json({ error: "Too many wrong attempts. Wait 1 minute." });
    const b = req.body || {};
    const okUser = userKnown(b.username); // USERS
    const okPass = passOk(b.username, b.password); // USERS
    if (!(okUser && okPass)) {
      f.n++;
      if (f.n >= 5) { f.until = Date.now() + 60000; f.n = 0; }
      fails.set(ip, f);
      return res.status(401).json({ error: "Wrong username or password" });
    }
    fails.delete(ip);
    sessions.forEach((exp, t) => { if (exp < Date.now()) sessions.delete(t); });
    const token = crypto.randomBytes(24).toString("hex");
    sessions.set(token, Date.now() + SESSION_MS);
    sessRole.set(token, roleOf(b.username)); res.json({ token, role: roleOf(b.username) });
  });

    router.post("/password", (req, res) => { // USERS
    const f = throttle(req, res); if (!f) return;
    const b = req.body || {};
    const name = String(b.username || "").trim();
    if (!userKnown(name) || !passOk(name, b.currentPassword)) { bad(req, f); return res.status(401).json({ error: "Wrong user name or current password" }); }
    const next = goodPass(b.newPassword);
    if (!next) return res.status(400).json({ error: "New password must be 4 to 100 characters" });
    try { saveUser(name, next); } catch (e) { return res.status(500).json({ error: "Could not save: " + e.message }); }
    uFails.delete(req.ip);
    res.json({ ok: true });
  });
  router.post("/admin/change", (req, res) => { // ACCOUNTS
    const f = throttle(req, res); if (!f) return;
    const b = req.body || {};
    const cur = String(b.username || "").trim();
    if (!isAdminName(cur) || !passOk(cur, b.currentPassword)) { bad(req, f); return res.status(401).json({ error: "Wrong admin user name or current password" }); }
    const old = adminName();
    const nn = String(b.newUsername || "").trim() || old;
    const pw = goodPass(b.newPassword);
    if (!USER_RE.test(nn)) return res.status(400).json({ error: "User name: 3 to 32 letters, numbers, . _ -" });
    const renamed = nn.toLowerCase() !== old.toLowerCase();
    if (renamed && findUser(nn)) return res.status(400).json({ error: "That user name already exists" });
    if (!pw) return res.status(400).json({ error: "New password must be 4 to 100 characters" });
    try {
      const salt = crypto.randomBytes(16).toString("hex");
      const list = readUsers().filter((u) => u.username.toLowerCase() !== nn.toLowerCase());
      list.push({ username: nn, role: "write", salt, hash: hashPass(pw, salt), changedAt: new Date().toISOString() });
      writeUsers(list);
      if (renamed) {
        try { fs.writeFileSync(ADMIN_NAME_FILE, JSON.stringify({ username: nn })); }
        catch (e2) { try { writeUsers(readUsers().filter((u) => u.username.toLowerCase() !== nn.toLowerCase())); } catch (e3) {} throw e2; }
        try { writeUsers(readUsers().filter((u) => u.username.toLowerCase() !== old.toLowerCase())); } catch (e4) {}
      }
    } catch (e) { return res.status(500).json({ error: "Could not save: " + e.message }); }
    uFails.delete(req.ip);
    res.json({ ok: true, username: nn });
  });
  router.post("/users/list", (req, res) => {
    if (!adminGate(req, res)) return;
    res.json({ ok: true, admin: adminName(), users: readUsers().filter((u) => !isAdminName(u.username)).map((u) => u.username), roles: readUsers().reduce((a, u) => { a[u.username] = u.role === "read" ? "read" : "write"; return a; }, {}), locked: isLocked() });
  });
  router.post("/users/add", (req, res) => {
    const b = adminGate(req, res); if (!b) return;
    const name = String(b.username || "").trim(), pw = goodPass(b.password);
    if (!USER_RE.test(name)) return res.status(400).json({ error: "User name: 3 to 32 letters, numbers, . _ -" });
    if (isAdminName(name) || findUser(name)) return res.status(400).json({ error: "That user name already exists" });
    if (!pw) return res.status(400).json({ error: "Password must be 4 to 100 characters" });
    try { saveUser(name, pw, b.role === "read" ? "read" : "write"); } catch (e) { return res.status(500).json({ error: "Could not save: " + e.message }); }
    res.json({ ok: true });
  });
  router.post("/users/reset", (req, res) => {
    const b = adminGate(req, res); if (!b) return;
    const u = findUser(b.username), pw = goodPass(b.password);
    if (!u || isAdminName(u.username)) return res.status(404).json({ error: "User not found" });
    if (!pw) return res.status(400).json({ error: "Password must be 4 to 100 characters" });
    try { saveUser(u.username, pw); } catch (e) { return res.status(500).json({ error: "Could not save: " + e.message }); }
    res.json({ ok: true });
  });
  router.get("/lock-state", authed, (req, res) => { // ROLES
    res.json({ ok: true, locked: isLocked(), role: sessRole.get(req.get("x-manage-token")) || "write" });
  });
  router.post("/lock-toggle", authed, (req, res) => {
    if (sessRole.get(req.get("x-manage-token")) !== "admin") return res.status(403).json({ error: "Only the admin can lock or open the dashboard." });
    const want = !!(req.body && req.body.locked === true);
    try { setLocked(want); } catch (e) { return res.status(500).json({ error: "Could not save: " + e.message }); }
    if (want) {
      const t = crypto.randomBytes(24).toString("hex");
      viewSess.set(t, Date.now() + 12 * 3600 * 1000);
      res.set("Set-Cookie", "psc_view=" + t + "; Path=/; HttpOnly; SameSite=Lax; Max-Age=43200");
    }
    res.json({ ok: true, locked: isLocked() });
  });
  router.post("/viewer-login", (req, res) => { // ROLES
    const f = throttle(req, res); if (!f) return;
    const b = req.body || {};
    if (!userKnown(b.username) || !passOk(b.username, b.password)) { bad(req, f); return res.status(401).json({ error: "Wrong user name or password" }); }
    uFails.delete(req.ip);
    viewSess.forEach((e, k) => { if (e < Date.now()) viewSess.delete(k); });
    const t = crypto.randomBytes(24).toString("hex");
    viewSess.set(t, Date.now() + 12 * 3600 * 1000);
    res.set("Set-Cookie", "psc_view=" + t + "; Path=/; HttpOnly; SameSite=Lax; Max-Age=43200");
    res.json({ ok: true });
  });
  router.post("/viewer-logout", (req, res) => {
    viewSess.delete(cookieGet(req, "psc_view"));
    res.set("Set-Cookie", "psc_view=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0");
    res.json({ ok: true });
  });
  router.post("/users/role", (req, res) => {
    const b = adminGate(req, res); if (!b) return;
    const u = findUser(b.username);
    if (!u || isAdminName(u.username)) return res.status(404).json({ error: "User not found" });
    const list = readUsers().map((x) => (x.username.toLowerCase() === u.username.toLowerCase() ? Object.assign({}, x, { role: b.role === "read" ? "read" : "write" }) : x));
    try { writeUsers(list); } catch (e) { return res.status(500).json({ error: "Could not save: " + e.message }); }
    res.json({ ok: true });
  });
  router.post("/lock", (req, res) => {
    const b = adminGate(req, res); if (!b) return;
    try { setLocked(b.locked === true); } catch (e) { return res.status(500).json({ error: "Could not save: " + e.message }); }
    res.json({ ok: true, locked: isLocked() });
  });
  router.post("/users/delete", (req, res) => {
    const b = adminGate(req, res); if (!b) return;
    const u = findUser(b.username);
    if (!u || isAdminName(u.username)) return res.status(404).json({ error: "User not found" });
    try { writeUsers(readUsers().filter((x) => x.username.toLowerCase() !== u.username.toLowerCase())); } catch (e) { return res.status(500).json({ error: "Could not save: " + e.message }); }
    res.json({ ok: true });
  });
router.post("/logout", (req, res) => {
    sessions.delete(req.get("x-manage-token"));
    res.json({ ok: true });
  });

  router.get("/data", authed, (req, res) => {
    res.json({
      categories: liveState.categories.map((c) => ({
        id: c.id, name: c.name, color: c.color, priority: c.priority, interval: c.interval,
        nodes: c.nodes.map((n) => ({ uid: n.uid, name: n.name, ip: n.ip, alerts: cleanAlerts(n.alerts) }))
      }))
    });
  });

  router.post("/category", authed, (req, res) => {
    const b = req.body || {};
    const name = cleanName(b.name, 60);
    if (!name) return res.status(400).json({ error: "Enter a category name (max 60 characters, no < > or quote characters)" });
    if (liveState.categories.some((c) => c.name.toLowerCase() === name.toLowerCase()))
      return res.status(409).json({ error: "A category with this name already exists" });
    const ids = new Set(liveState.categories.map((c) => c.id));
    const cat = { id: slug(name, ids), name, color: cleanColor(b.color) || "#38bdf8", priority: cleanPrio(b.priority), interval: clampInterval(b.interval), nodes: [] };
    liveState.categories.push(cat);
    startPoll(cat);
    commit(res, { id: cat.id });
  });

  router.delete("/category/:id", authed, (req, res) => {
    const i = liveState.categories.findIndex((c) => c.id === req.params.id);
    if (i < 0) return res.status(404).json({ error: "Category not found" });
    const cat = liveState.categories.splice(i, 1)[0];
    cat.removed = true; // stops its polling loop
    commit(res);
  });

  router.put("/category/:id", authed, (req, res) => {
    const cat = findCat(req.params.id);
    if (!cat) return res.status(404).json({ error: "Category not found" });
    const b = req.body || {};
    const name = cleanName(b.name, 60);
    if (!name) return res.status(400).json({ error: "Enter a category name (max 60 characters, no < > or quote characters)" });
    if (liveState.categories.some((c) => c !== cat && c.name.toLowerCase() === name.toLowerCase()))
      return res.status(409).json({ error: "A category with this name already exists" });
    cat.name = name;
    cat.color = cleanColor(b.color) || cat.color;
    cat.priority = cleanPrio(b.priority);
    cat.interval = clampInterval(b.interval);
    cat.nodes.forEach((n) => { n.categoryName = name; n.priority = cat.priority; });
    commit(res);
  });

  router.post("/category/:id/node", authed, async (req, res) => {
    try {
      const cat = findCat(req.params.id);
      if (!cat) return res.status(404).json({ error: "Category not found" });
      const b = req.body || {};
      const name = cleanName(b.name, 60), ip = cleanIp(b.ip);
      if (!name) return res.status(400).json({ error: "Enter a link name (max 60 characters, no < > or quote characters)" });
      if (!ip) return res.status(400).json({ error: "Enter a valid IPv4 address like 10.1.2.3" });
      if (cat.nodes.some((n) => n.ip === ip)) return res.status(409).json({ error: "This IP already exists in " + cat.name });
      const node = await probeNode(cat, { uid: newUid(), name, ip, alerts: cleanAlerts(b.alerts) });
      if (!findCat(cat.id)) return res.status(409).json({ error: "That category was removed" });
      if (cat.nodes.some((n) => n.ip === ip)) return res.status(409).json({ error: "This IP already exists in " + cat.name });
      cat.nodes.push(node);
      commit(res);
    } catch (e) { res.status(500).json({ error: e.message }); }
  });

  router.put("/category/:id/node/:uid", authed, async (req, res) => {
    try {
      const cat = findCat(req.params.id);
      const node = cat && cat.nodes.find((n) => n.uid === req.params.uid);
      if (!node) return res.status(404).json({ error: "Link not found" });
      const b = req.body || {};
      const name = cleanName(b.name, 60), ip = cleanIp(b.ip);
      if (!name) return res.status(400).json({ error: "Enter a link name (max 60 characters, no < > or quote characters)" });
      if (!ip) return res.status(400).json({ error: "Enter a valid IPv4 address like 10.1.2.3" });
      if (cat.nodes.some((n) => n !== node && n.ip === ip)) return res.status(409).json({ error: "This IP already exists in " + cat.name });
      if (ip === node.ip) { node.name = name; return commit(res); }
      const fresh = await probeNode(cat, { uid: node.uid, name, ip, alerts: cleanAlerts(node.alerts) });
      const i = cat.nodes.indexOf(node);
      if (i < 0) return res.status(409).json({ error: "That link was removed" });
      cat.nodes[i] = fresh;
      commit(res);
    } catch (e) { res.status(500).json({ error: e.message }); }
  });

  router.delete("/category/:id/node/:uid", authed, (req, res) => {
    const cat = findCat(req.params.id);
    const i = cat ? cat.nodes.findIndex((n) => n.uid === req.params.uid) : -1;
    if (i < 0) return res.status(404).json({ error: "Link not found" });
    cat.nodes.splice(i, 1);
    commit(res);
  });

  // 4.0: WhatsApp + Telegram alerts (see notify.js)
  const notify = require("./notify");
  notify.attach({ app, router, authed, liveState, persist: () => { try { save(liveState.categories); } catch (e) { console.error("[manage] save failed:", e.message); } } });
  notify.start();

  try { require("./snmp").attach({ app, router, authed, liveState }); } catch (e) { console.error("[snmp] disabled: " + e.message); } /* SNMP */ app.use("/api/manage", router);
  console.log("[manage] ready (/api/manage)");
}

module.exports = { blockPrivate, loadSaved, attach, viewGate };
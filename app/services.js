"use strict";
// Pariscope Service Monitor (separate add-on, loaded by ONE guarded line in app.js).
// Watches websites (Facebook, YouTube...) with a ping + a real page request. If anything here fails, Pariscope keeps running as before.
const fs = require("fs"), path = require("path"), https = require("https"), http = require("http"), crypto = require("crypto"), express = require("express");
const pingLib = require("ping");
const net = require("net");
const FILE = path.join(require("./datadir").DATA_DIR, "state-cache-services.json");

const S = (v, n) => String(v == null ? "" : v).replace(/[\u0000-\u001f<>"'`]/g, " ").trim().slice(0, n);
const N = (v, a, b, d) => { v = Number(v); return Number.isFinite(v) ? Math.min(b, Math.max(a, Math.round(v))) : d; };
const uid = () => crypto.randomBytes(5).toString("hex");
const COLOR = (v, d) => /^#[0-9a-fA-F]{6}$/.test(String(v || "")) ? String(v) : d;

let cfg = { version: 1, cats: [], items: [] };
function load() {
  try {
    const j = JSON.parse(fs.readFileSync(FILE, "utf8").replace(/^\uFEFF/, ""));
    if (j && Array.isArray(j.cats) && Array.isArray(j.items)) cfg = { version: 1, cats: j.cats, items: j.items };
  } catch (e) {}
}
function save() {
  const t = FILE + ".tmp";
  fs.writeFileSync(t, JSON.stringify(cfg, null, 1));
  fs.renameSync(t, FILE);
}

function normUrl(u) {
  u = String(u || "").trim();
  if (!u) throw new Error("Enter the website address.");
  if (!/^https?:\/\//i.test(u)) u = "https://" + u;
  let x; try { x = new URL(u); } catch (e) { throw new Error("This website address is not valid."); }
  if (!/^https?:$/.test(x.protocol)) throw new Error("Use a normal http or https address.");
  if (!/^[A-Za-z0-9.-]+$/.test(x.hostname)) throw new Error("Use a normal website name or IPv4 address.");
  return x.href;
}

function hostOnly(h) {
  h = String(h || "").trim().replace(/^[a-z]+:\/\//i, "").replace(/[\/?#].*$/, "").replace(/:\d+$/, "");
  if (!h) throw new Error("Enter the IP address or host name.");
  if (!/^[A-Za-z0-9]([A-Za-z0-9.-]{0,251}[A-Za-z0-9])?$/.test(h)) throw new Error("This IP address or host name is not valid.");
  return h;
}
function tcpCheck(host, port, limit) {
  return new Promise((resolve) => {
    const t0 = Date.now(); let done = false;
    const s = net.connect({ host: host, port: port });
    const fin = (r) => { if (done) return; done = true; try { s.destroy(); } catch (e) {} resolve(r); };
    s.setTimeout(limit, () => fin({ ok: false, err: "Timeout" }));
    s.on("connect", () => fin({ ok: true, ms: Date.now() - t0, err: "" }));
    s.on("error", (e) => fin({ ok: false, err: why(e) }));
  });
}
function why(e) {
  const c = String((e && e.code) || ""), m = String((e && e.message) || e);
  if (c === "ENOTFOUND" || c === "EAI_AGAIN") return "DNS failed";
  if (c === "ECONNREFUSED") return "Connection refused";
  if (c === "ECONNRESET") return "Connection reset";
  if (c === "ETIMEDOUT" || c === "ESOCKETTIMEDOUT") return "Timeout";
  if (/CERT|SSL|TLS|self.signed|expired/i.test(c + m)) return "Certificate problem";
  return (c || m).slice(0, 40);
}

// A real page request: connect, send GET, wait for the first answer (follows up to 4 redirects). Any answer below 500 means the site is reachable.
function browse(url, limit) {
  return new Promise((resolve) => {
    const t0 = Date.now(); let done = false, cur = null, hops = 0, tm = null;
    const fin = (r) => { if (done) return; done = true; clearTimeout(tm); try { if (cur) cur.destroy(); } catch (e) {} resolve(r); };
    tm = setTimeout(() => fin({ ok: false, err: "Timeout" }), limit);
    const go = (u) => {
      let x; try { x = new URL(u); } catch (e) { return fin({ ok: false, err: "Bad address" }); }
      const lib = x.protocol === "https:" ? https : http;
      try {
        cur = lib.request({
          protocol: x.protocol, hostname: x.hostname, port: x.port || undefined, path: (x.pathname || "/") + (x.search || ""), method: "GET", agent: false,
          headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Pariscope-ServiceMonitor", "Accept": "text/html,*/*;q=0.8", "Accept-Encoding": "identity", "Connection": "close" }
        }, (res) => {
          const code = res.statusCode || 0;
          if ([301, 302, 303, 307, 308].indexOf(code) >= 0 && res.headers.location && hops < 4) {
            res.resume(); hops++;
            let nx; try { nx = new URL(res.headers.location, x).href; } catch (e) { return fin({ ok: false, err: "Bad redirect" }); }
            return go(nx);
          }
          fin({ ok: code > 0 && code < 500, code: code, ms: Date.now() - t0, err: code < 500 ? "" : "HTTP " + code });
        });
        cur.on("error", (e) => fin({ ok: false, err: why(e) }));
        cur.end();
      } catch (e) { fin({ ok: false, err: why(e) }); }
    };
    go(url);
  });
}
function svcCat(it) { const c = cfg.cats.find((x) => x.id === it.cat); return c ? c.name : "Services"; }
function svcAddr(it) { return it.host + (it.kind === "tcp" && it.port ? ":" + it.port : ""); }
function histRec(it, st, now) {
  try {
    if (st === "CHECKING") return;
    require("./history").record("svc:" + it.id, it.name, svcCat(it), (st === "DOWN" || st === "FLAPPING") ? st : "ONLINE", now);
  } catch (e) {}
}
function sendAlert(type, it, ms) {
  try {
    const nt = require("./notify");
    const dsp = nt && nt._t && nt._t.dispatch;
    if (typeof dsp !== "function") return;
    Promise.resolve(dsp(type, [{ name: it.name, ip: svcAddr(it), cat: svcCat(it), ms: ms || 0, svc: true }])).catch(() => {});
  } catch (e) {}
}
function afterEval(it, r, st, now) {
  histRec(it, st, now);
  const bad = st === "DOWN" || st === "FLAPPING";
  if (bad && !r.alertOn) { r.alertOn = true; r.alertAt = r.failSince || now; sendAlert("down", it, 0); }
  else if (r.alertOn && (st === "ONLINE" || st === "WARNING")) { r.alertOn = false; sendAlert("up", it, now - (r.alertAt || now)); }
}
async function icmp(host) {
  try {
    const r = await pingLib.promise.probe(host, { timeout: 2 });
    if (r && r.alive) { const n = Number(r.time); return Number.isFinite(n) ? Math.max(1, Math.round(n)) : 1; }
  } catch (e) {}
  return null;
}

let active = 0; const waitQ = [];
function limited(fn) {
  return new Promise((res, rej) => {
    const go = () => { active++; fn().then(res, rej).finally(() => { active--; if (waitQ.length) waitQ.shift()(); }); };
    if (active < 8) go(); else waitQ.push(go);
  });
}

const rt = new Map();
function rtOf(id) {
  let r = rt.get(id);
  if (!r) { r = { status: "CHECKING", p: null, l: null, code: null, err: "", note: "", fails: 0, failSince: 0, lastOk: 0, lastAt: 0, since: Date.now(), hist: [], trans: [], flapUntil: 0, wasFailing: false, total: 0, okCount: 0, heat: 0 }; rt.set(id, r); }
  return r;
}
function evaluate(it, r, p, b, now) {
  r.lastAt = now; r.total++; r.p = p; r.l = b.ok ? b.ms : null; r.code = b.code || null; r.err = b.ok ? "" : (b.err || "Failed");
  if (b.ok) { r.okCount++; r.lastOk = now; r.fails = 0; r.failSince = 0; }
  else { if (!r.fails) r.failSince = now; r.fails++; }
  const failing = r.fails >= it.failAfter;
  if (failing !== r.wasFailing) { r.wasFailing = failing; r.trans.push(now); }
  r.trans = r.trans.filter((t) => now - t < 60000);
  if (r.trans.length >= 3) r.flapUntil = now + 50000;   // lost, found, lost again within a minute = flapping
  const failFor = failing ? now - r.failSince : 0;
  const slow = it.warnMs > 0 && p != null && p > it.warnMs;
  let st;
  if (now < r.flapUntil) st = "FLAPPING";
  else if (failing && failFor >= it.downAfter * 1000) st = "DOWN";
  else if (failing) st = "FAILING";
  else if (slow || r.fails > 0) st = "WARNING";
  else st = "ONLINE";
  r.heat = st === "DOWN" ? 1 : st === "FAILING" ? Math.min(1, Math.max(0.12, failFor / (it.downAfter * 1000))) : 0;
  r.note = r.fails > 0 ? "Check failed (" + r.err + ") - " + r.fails + " in a row" : (slow ? "Ping " + p + " ms is above your limit of " + it.warnMs + " ms" : "");
  if (st !== r.status) { r.status = st; r.since = now; }
  afterEval(it, r, st, now);
  r.hist.push(b.ok ? (p != null ? p : b.ms) : -1);
  if (r.hist.length > 60) r.hist.shift();
}
async function checkOne(it) {
  const r = rtOf(it.id);
  const kind = it.kind || "web";
  const both = await Promise.all([(kind !== "web" || it.ping) ? icmp(it.host) : Promise.resolve(null), kind === "web" ? browse(it.url, 4000) : null]);
  if (kind === "ip") both[1] = both[0] != null ? { ok: true, ms: both[0], code: null, err: "" } : { ok: false, err: "No ping reply" };
  else if (kind === "tcp") both[1] = await tcpCheck(it.host, it.port, 3000);
  if (cfg.items.indexOf(it) < 0) return;
  evaluate(it, r, both[0], both[1], Date.now());
}

const timers = new Map();
function unschedule(id) { const t = timers.get(id); if (t) clearTimeout(t); timers.delete(id); }
function schedule(it) {
  unschedule(it.id);
  const run = async () => {
    if (cfg.items.indexOf(it) < 0) return;
    const t0 = Date.now();
    try { await limited(() => checkOne(it)); } catch (e) {}
    if (cfg.items.indexOf(it) >= 0) timers.set(it.id, setTimeout(run, Math.max(300, it.every * 1000 - (Date.now() - t0))));
  };
  timers.set(it.id, setTimeout(run, 400 + Math.floor(Math.random() * 1500)));
}

function pubItem(it) {
  const r = rtOf(it.id);
  return {
    id: it.id, cat: it.cat, name: it.name, url: it.url, host: it.host, kind: it.kind || "web", port: it.port || 0, every: it.every, failAfter: it.failAfter, downAfter: it.downAfter, warnMs: it.warnMs, ping: it.ping,
    status: r.status, p: r.p, l: r.l, code: r.code, err: r.err, note: r.note, fails: r.fails, heat: r.heat, since: r.since, fs: r.failSince, lastOk: r.lastOk, lastAt: r.lastAt,
    up: r.total ? Math.round(r.okCount / r.total * 1000) / 10 : null, h: r.hist
  };
}
function buildItem(b, old) {
  const it = { id: old ? old.id : uid() };
  it.cat = S(b.cat, 32); if (!cfg.cats.some((c) => c.id === it.cat)) throw new Error("Choose a category first.");
  it.name = S(b.name, 60); if (!it.name) throw new Error("Enter a name, for example Facebook.");
  it.kind = ["web", "ip", "tcp"].indexOf(b.kind) >= 0 ? b.kind : "web";
  it.port = 0;
  if (it.kind === "web") { it.url = normUrl(b.url); it.host = new URL(it.url).hostname; }
  else { it.host = hostOnly(b.url); it.url = it.host; if (it.kind === "tcp") { it.port = N(b.port, 1, 65535, 0); if (!it.port) throw new Error("Enter the port number, for example 443."); } }
  it.every = N(b.every, 2, 60, 2); it.failAfter = N(b.failAfter, 1, 10, 3); it.downAfter = N(b.downAfter, 10, 600, 60); it.warnMs = N(b.warnMs, 0, 5000, 150);
  it.ping = !(b.ping === false || b.ping === "false");
  return it;
}

function roleOf(req) { const fn = globalThis.__pariscopeRoleOf; if (typeof fn !== "function") return undefined; try { return fn(req.get("x-manage-token")); } catch (e) { return null; } }
function need(req, res) {
  const r = roleOf(req);
  if (r === undefined) { res.status(503).json({ error: "Admin check is not installed." }); return false; }
  if (!r) { res.status(401).json({ error: "Please log in from the MANAGE button first." }); return false; }
  if (r !== "admin" && r !== "write") { res.status(403).json({ error: "Your account cannot change services." }); return false; }
  return true;
}

let attached = false;
function attach(app) {
  if (attached || !app) return; attached = true;
  load(); cfg.items.forEach((it) => schedule(it));
  const J = express.json({ limit: "50kb" });
  const nocache = (res) => res.set("Cache-Control", "no-store");

  app.get("/api/services/live", (req, res) => { nocache(res); res.json({ ok: true, now: Date.now(), cats: cfg.cats, items: cfg.items.map(pubItem) }); });
  app.get("/api/services/role", (req, res) => { nocache(res); const r = roleOf(req); res.json({ role: r || "none", canEdit: r === "admin" || r === "write" }); });

  app.post("/api/services/cat", J, (req, res) => {
    if (!need(req, res)) return;
    try {
      const b = req.body || {}, name = S(b.name, 40);
      if (!name) throw new Error("Enter a category name.");
      if (cfg.cats.length >= 40) throw new Error("Too many categories.");
      if (cfg.cats.some((c) => c.name.toLowerCase() === name.toLowerCase())) throw new Error("A category with this name already exists.");
      const c = { id: uid(), name, color: COLOR(b.color, "#38bdf8") };
      cfg.cats.push(c); save(); res.json({ ok: true, id: c.id });
    } catch (e) { res.status(400).json({ error: String(e.message || e) }); }
  });
  app.put("/api/services/cat/:id", J, (req, res) => {
    if (!need(req, res)) return;
    try {
      const c = cfg.cats.find((x) => x.id === req.params.id); if (!c) return res.status(404).json({ error: "Category not found." });
      const name = S((req.body || {}).name, 40); if (!name) throw new Error("Enter a category name.");
      if (cfg.cats.some((x) => x !== c && x.name.toLowerCase() === name.toLowerCase())) throw new Error("A category with this name already exists.");
      c.name = name; save(); res.json({ ok: true });
    } catch (e) { res.status(400).json({ error: String(e.message || e) }); }
  });
  app.delete("/api/services/cat/:id", (req, res) => {
    if (!need(req, res)) return;
    const i = cfg.cats.findIndex((x) => x.id === req.params.id); if (i < 0) return res.status(404).json({ error: "Category not found." });
    const id = cfg.cats[i].id; cfg.cats.splice(i, 1);
    cfg.items.filter((x) => x.cat === id).forEach((x) => { unschedule(x.id); rt.delete(x.id); });
    cfg.items = cfg.items.filter((x) => x.cat !== id); save(); res.json({ ok: true });
  });

  app.post("/api/services/item", J, (req, res) => {
    if (!need(req, res)) return;
    try {
      if (cfg.items.length >= 200) throw new Error("Too many services (200 is the limit).");
      const it = buildItem(req.body || {}, null);
      cfg.items.push(it); save(); schedule(it); res.json({ ok: true, id: it.id });
    } catch (e) { res.status(400).json({ error: String(e.message || e) }); }
  });
  app.put("/api/services/item/:id", J, (req, res) => {
    if (!need(req, res)) return;
    try {
      const old = cfg.items.find((x) => x.id === req.params.id); if (!old) return res.status(404).json({ error: "Service not found." });
      const it = buildItem(req.body || {}, old);
      cfg.items[cfg.items.indexOf(old)] = it; rt.delete(it.id); save(); schedule(it); res.json({ ok: true, id: it.id });
    } catch (e) { res.status(400).json({ error: String(e.message || e) }); }
  });
  app.delete("/api/services/item/:id", (req, res) => {
    if (!need(req, res)) return;
    const i = cfg.items.findIndex((x) => x.id === req.params.id); if (i < 0) return res.status(404).json({ error: "Service not found." });
    unschedule(cfg.items[i].id); rt.delete(cfg.items[i].id); cfg.items.splice(i, 1); save(); res.json({ ok: true });
  });
  app.post("/api/services/test", J, async (req, res) => {
    if (!need(req, res)) return;
    try {
      const b0 = req.body || {}, kind0 = ["ip", "tcp"].indexOf(b0.kind) >= 0 ? b0.kind : "web";
      if (kind0 !== "web") {
        const h0 = hostOnly(b0.url), p0 = await icmp(h0); let pg0;
        if (kind0 === "tcp") { const pt = N(b0.port, 1, 65535, 0); if (!pt) throw new Error("Enter the port number, for example 443."); pg0 = await tcpCheck(h0, pt, 3000); }
        else pg0 = p0 != null ? { ok: true, ms: p0, code: null, err: "" } : { ok: false, err: "No ping reply" };
        return res.json({ ok: true, ping: p0, page: pg0, kind: kind0 });
      }
      const url = normUrl(b0.url), host = new URL(url).hostname;
      const both = await Promise.all([icmp(host), browse(url, 4000)]);
      res.json({ ok: true, ping: both[0], page: both[1] });
    } catch (e) { res.status(400).json({ error: String(e.message || e) }); }
  });
  console.log("[services] ready (" + cfg.items.length + " service(s))");
}
module.exports = { attach };
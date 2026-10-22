"use strict";
// Pariscope SNMP add-on (Advanced mode). Separate module, loaded by ONE guarded line in manage.js.
// If anything here fails, Pariscope keeps running exactly as before.
const fs = require("fs"), path = require("path"), crypto = require("crypto");
const snmp = require("net-snmp");
const DATA_DIR = require("./datadir").DATA_DIR;
// File names start with "state-cache" on purpose: manage.js blockPrivate already hides those from the web.
const FILE = path.join(DATA_DIR, "state-cache-snmp.json");
const KEYF = path.join(DATA_DIR, "state-cache-snmp.key");

function getKey() {
  try { const k = Buffer.from(fs.readFileSync(KEYF, "utf8").trim(), "hex"); if (k.length === 32) return k; } catch (e) {}
  const k = crypto.randomBytes(32); fs.writeFileSync(KEYF, k.toString("hex")); return k;
}
const KEY = getKey();
function enc(t) {
  if (!t) return "";
  const iv = crypto.randomBytes(12), c = crypto.createCipheriv("aes-256-gcm", KEY, iv);
  const d = Buffer.concat([c.update(String(t), "utf8"), c.final()]);
  return "v1:" + Buffer.concat([iv, c.getAuthTag(), d]).toString("base64");
}
function dec(s) {
  try {
    if (!s || s.slice(0, 3) !== "v1:") return "";
    const b = Buffer.from(s.slice(3), "base64");
    const d = crypto.createDecipheriv("aes-256-gcm", KEY, b.subarray(0, 12));
    d.setAuthTag(b.subarray(12, 28));
    return Buffer.concat([d.update(b.subarray(28)), d.final()]).toString("utf8");
  } catch (e) { return ""; }
}

let devices = [];
function load() {
  try { const j = JSON.parse(fs.readFileSync(FILE, "utf8").replace(/^\uFEFF/, "")); devices = Array.isArray(j.devices) ? j.devices : []; }
  catch (e) { devices = []; }
}
function save() {
  const t = FILE + ".tmp";
  fs.writeFileSync(t, JSON.stringify({ version: 1, devices }, null, 2));
  fs.renameSync(t, FILE);
}

const HOST_RE = /^[A-Za-z0-9]([A-Za-z0-9.-]{0,251}[A-Za-z0-9])?$/;
const clean = (s, n) => String(s == null ? "" : s).replace(/[<>"'`]/g, "").trim().slice(0, n);
const AUTHP = ["md5", "sha", "sha224", "sha256", "sha384", "sha512"], PRIVP = ["des", "aes", "aes256b", "aes256r"];

function build(b, old) {
  const d = { id: old ? old.id : crypto.randomBytes(6).toString("hex") };
  d.name = clean(b.name, 60); if (!d.name) throw new Error("Enter a display name.");
  d.host = clean(b.host, 253); if (!HOST_RE.test(d.host)) throw new Error("Enter a valid IP address or host name (IPv4).");
  d.port = parseInt(b.port, 10) || 161; if (d.port < 1 || d.port > 65535) throw new Error("SNMP port must be 1-65535.");
  d.version = ["v1", "v2c", "v3"].includes(b.version) ? b.version : "v2c";
  d.pollSec = Math.min(3600, Math.max(10, parseInt(b.pollSec, 10) || 60));
  d.timeoutSec = Math.min(30, Math.max(1, parseInt(b.timeoutSec, 10) || 5));
  const m = b.metrics || {};
  d.metrics = { cpu: !!m.cpu, mem: !!m.mem, disk: !!m.disk };
  const keep = (nv, ov) => (nv === undefined || nv === null || nv === "") ? (ov || "") : enc(String(nv));
  if (d.version === "v3") {
    const v = b.v3 || {}, o = (old && old.v3) || {};
    const level = ["noAuthNoPriv", "authNoPriv", "authPriv"].includes(v.level) ? v.level : "authPriv";
    d.v3 = {
      user: clean(v.user, 64), context: clean(v.context, 64), level,
      authProto: AUTHP.includes(v.authProto) ? v.authProto : "sha",
      privProto: PRIVP.includes(v.privProto) ? v.privProto : "aes",
      authKey: keep(v.authKey, o.authKey), privKey: keep(v.privKey, o.privKey)
    };
    if (!d.v3.user) throw new Error("Enter the SNMPv3 username.");
    if (level !== "noAuthNoPriv" && !d.v3.authKey) throw new Error("Enter the authentication password.");
    if (level === "authPriv" && !d.v3.privKey) throw new Error("Enter the privacy (encryption) password.");
    if ((v.authKey && String(v.authKey).length < 8) || (v.privKey && String(v.privKey).length < 8)) throw new Error("SNMPv3 passwords must be at least 8 characters.");
  } else {
    d.community = keep(b.community, old && old.community);
    if (!d.community) throw new Error("Enter the community string.");
  }
  return d;
}

function session(d) {
  const o = { port: d.port, retries: 1, timeout: d.timeoutSec * 1000, transport: "udp4" };
  let s;
  if (d.version === "v3") {
    const v = d.v3, u = { name: v.user, level: snmp.SecurityLevel[v.level] };
    if (v.level !== "noAuthNoPriv") { u.authProtocol = snmp.AuthProtocols[v.authProto] || snmp.AuthProtocols.sha; u.authKey = dec(v.authKey); }
    if (v.level === "authPriv") { u.privProtocol = snmp.PrivProtocols[v.privProto] || snmp.PrivProtocols.aes; u.privKey = dec(v.privKey); }
    o.version = snmp.Version3; if (v.context) o.context = v.context;
    s = snmp.createV3Session(d.host, u, o);
  } else {
    o.version = d.version === "v1" ? snmp.Version1 : snmp.Version2c;
    s = snmp.createSession(d.host, dec(d.community), o);
  }
  s.on("error", () => {}); // a socket error must never crash Pariscope
  return s;
}
const P = (s, fn, ...a) => new Promise((res, rej) => s[fn](...a, (e, r) => (e ? rej(e) : res(r))));
const walk = (s, oid) => new Promise((res, rej) => {
  const out = [];
  s.subtree(oid, 20, (vbs) => { for (const v of vbs) if (!snmp.isVarbindError(v)) out.push(v); }, (e) => (e ? rej(e) : res(out)));
});
async function tcols(s, entry, cols) {
  const table = entry.replace(/\.1$/, "");
  try {
    const t = await P(s, "tableColumns", table, cols, 20);
    if (t && Object.keys(t).length) return t;
  } catch (e) {}
  const out = {};
  for (const c of cols) {
    let vbs = [];
    try { vbs = await walk(s, entry + "." + c); } catch (e) { continue; }
    const pre = entry + "." + c + ".";
    for (const v of vbs) { const ix = String(v.oid).slice(pre.length); if (!out[ix]) out[ix] = {}; out[ix][c] = v.value; }
  }
  return out;
}
const str = (v) => (v == null ? "" : Buffer.isBuffer(v) ? v.toString("utf8").replace(/\0/g, "") : String(v));
const num = (v) => (Buffer.isBuffer(v) ? (v.length ? Number(BigInt("0x" + v.toString("hex"))) : 0) : Number(v) || 0);
const cnt = (v) => (Buffer.isBuffer(v) ? (v.length ? BigInt("0x" + v.toString("hex")) : 0n) : BigInt(Math.trunc(Number(v) || 0)));

function nice(e) {
  const m = String((e && e.message) || e), n = String((e && e.name) || "");
  if (/timed out|RequestTimedOut/i.test(m + n)) return "No answer (timeout). Check: the IP and UDP port 161, that SNMP is enabled on the device, that the community/user is correct, and that the device allows this PC's address.";
  if (/ENOTFOUND|EAI_AGAIN/.test(m)) return "Host name not found.";
  if (/Authentication|Unknown user|digest|Decryption|not in time/i.test(m + n)) return "SNMPv3 login failed: check username, security level, passwords and protocols.";
  return m;
}
async function getSys(s) {
  const vb = await P(s, "get", ["1.3.6.1.2.1.1.1.0", "1.3.6.1.2.1.1.3.0", "1.3.6.1.2.1.1.5.0"]);
  const g = (i) => (vb[i] && !snmp.isVarbindError(vb[i]) ? vb[i].value : null);
  if (g(0) == null && g(1) == null && g(2) == null) throw new Error("The device answered but does not expose the standard system information.");
  return { descr: str(g(0)), uptimeSec: Math.floor(num(g(1)) / 100), name: str(g(2)) };
}
async function testDev(d) {
  const s = session(d);
  try { return await getSys(s); } finally { try { s.close(); } catch (e) {} }
}

async function readCpu(s) {
  const v = await walk(s, "1.3.6.1.2.1.25.3.3.1.2");
  if (!v.length) return null;
  return Math.round(v.reduce((a, x) => a + num(x.value), 0) / v.length);
}
async function readStorage(s) {
  const t = await tcols(s, "1.3.6.1.2.1.25.2.3.1", [2, 3, 4, 5, 6]);
  const out = { mem: null, disks: [] };
  Object.keys(t).forEach((ix) => {
    const r = t[ix], ty = String(r[2] || ""), al = num(r[4]) || 1, sz = num(r[5]), us = num(r[6]);
    if (!sz) return;
    const row = { name: str(r[3]), total: sz * al, used: us * al, pct: Math.round((us / sz) * 1000) / 10 };
    if (/\.25\.2\.1\.2$/.test(ty)) { if (!out.mem || (/cache|buffer|swap|virtual/i.test(out.mem.name) && !/cache|buffer|swap|virtual/i.test(row.name))) out.mem = row; }
    else if (/\.25\.2\.1\.4$/.test(ty)) out.disks.push(row);
  });
  return out;
}

const rt = new Map();
function rtOf(id) { if (!rt.has(id)) rt.set(id, { hist: [], prev: {}, rates: {} }); return rt.get(id); }
async function collect(d, s, r) {
  const sys = await getSys(s);
  r.ok = true; r.err = ""; r.sys = sys; r.lastOk = Date.now();
  if (d.metrics.cpu) { try { r.cpu = await readCpu(s); } catch (e) { r.cpu = null; } } else r.cpu = null;
  if (d.metrics.mem || d.metrics.disk) {
    try { const st = await readStorage(s); r.mem = d.metrics.mem ? st.mem : null; r.disks = d.metrics.disk ? st.disks : []; }
    catch (e) { r.mem = null; r.disks = []; }
  } else { r.mem = null; r.disks = []; }
  r.hist.push({ t: Date.now(), cpu: r.cpu, mem: r.mem ? r.mem.pct : null });
  if (r.hist.length > 120) r.hist.shift();
}
async function pollOne(d) {
  const r = rtOf(d.id), s = session(d);
  try { await collect(d, s, r); } catch (e) { r.ok = false; r.err = nice(e); }
  finally { r.at = Date.now(); try { s.close(); } catch (e) {} }
}
const timers = new Map();
function unschedule(id) { const t = timers.get(id); if (t) clearTimeout(t); timers.delete(id); }
function schedule(d) {
  unschedule(d.id);
  const tick = async () => {
    const cur = devices.find((x) => x.id === d.id); if (!cur) return;
    try { await pollOne(cur); } catch (e) {}
    if (devices.find((x) => x.id === d.id)) timers.set(d.id, setTimeout(tick, cur.pollSec * 1000));
  };
  timers.set(d.id, setTimeout(tick, 1500));
}

async function readIfs(s, r) {
  const t1 = await tcols(s, "1.3.6.1.2.1.2.2.1", [2, 3, 5, 7, 8, 10, 14, 16, 20]);
  let t2 = {};
  try { t2 = await tcols(s, "1.3.6.1.2.1.31.1.1.1", [1, 6, 10, 15, 18]); } catch (e) { t2 = {}; }
  const now = Date.now(), list = [];
  Object.keys(t1).forEach((ix) => {
    const a = t1[ix], x = t2[ix] || {};
    const hc = x[6] != null && x[10] != null;
    const inO = hc ? cnt(x[6]) : cnt(a[10]), outO = hc ? cnt(x[10]) : cnt(a[16]);
    const name = str(x[1]) || str(a[2]), type = num(a[3]);
    const p = r.prev[ix], dt = p ? (now - p.t) / 1000 : 0;
    if (!p || (dt >= 1 && p.hc === hc)) {
      if (p && dt >= 1 && p.hc === hc) {
        const wrap = hc ? 2n ** 64n : 2n ** 32n;
        let di = inO - p.i, dd = outO - p.o; if (di < 0n) di += wrap; if (dd < 0n) dd += wrap;
        r.rates[ix] = { in: (Number(di) * 8) / dt, out: (Number(dd) * 8) / dt };
      }
      r.prev[ix] = { t: now, i: inO, o: outO, hc };
    }
    const rate = r.rates[ix] || {};
    let kind = "other";
    if (/^<?pppoe-/i.test(name) || type === 23) kind = "pppoe";
    else if (type === 135 || type === 136 || /vlan/i.test(name)) kind = "vlan";
    list.push({
      index: Number(ix), name, alias: str(x[18]), type, kind,
      admin: num(a[7]), oper: num(a[8]),
      speed: x[15] != null ? num(x[15]) * 1e6 : num(a[5]),
      inBps: rate.in == null ? null : rate.in, outBps: rate.out == null ? null : rate.out,
      inBytes: Number(inO), outBytes: Number(outO), inErr: num(a[14]), outErr: num(a[20])
    });
  });
  return list.sort((p, q) => p.index - q.index);
}
async function liveOf(d) {
  const r = rtOf(d.id), s = session(d);
  try {
    await collect(d, s, r);
    const interfaces = await readIfs(s, r);
    let vlanNames = [];
    try { vlanNames = (await walk(s, "1.3.6.1.2.1.17.7.1.4.3.1.1")).map((v) => ({ id: Number(String(v.oid).split(".").pop()), name: str(v.value) })); } catch (e) {}
    r.at = Date.now();
    return { sys: r.sys, interfaces, vlanNames, rt: pubRt(r) };
  } catch (e) { r.ok = false; r.err = nice(e); throw new Error(nice(e)); }
  finally { try { s.close(); } catch (e) {} }
}

function pubRt(r) {
  if (!r) return { ok: null };
  return { ok: r.ok, err: r.err, at: r.at, lastOk: r.lastOk, sys: r.sys, cpu: r.cpu, mem: r.mem, disks: r.disks, hist: r.hist };
}
function pub(d) {
  return {
    id: d.id, name: d.name, host: d.host, port: d.port, version: d.version, pollSec: d.pollSec, timeoutSec: d.timeoutSec, metrics: d.metrics,
    v3: d.v3 ? { user: d.v3.user, context: d.v3.context, level: d.v3.level, authProto: d.v3.authProto, privProto: d.v3.privProto } : null,
    rt: pubRt(rt.get(d.id))
  };
}

function attach(ctx) {
  const router = ctx.router, authed = ctx.authed;
  load(); devices.forEach(schedule);
  const find = (id) => devices.find((x) => x.id === id);
  const dup = (d, ex) => devices.some((x) => x !== ex && x.host.toLowerCase() === d.host.toLowerCase() && x.port === d.port);

  router.get("/snmp/devices", authed, (req, res) => res.json({ devices: devices.map(pub) }));
  router.post("/snmp/test", authed, async (req, res) => {
    try { const d = build(req.body || {}, find((req.body || {}).id)); res.json({ ok: true, sys: await testDev(d) }); }
    catch (e) { res.status(400).json({ error: nice(e) }); }
  });
  router.post("/snmp/devices", authed, async (req, res) => {
    try {
      const d = build(req.body || {}, null);
      if (dup(d)) return res.status(409).json({ error: "This device (same address and port) is already added." });
      const sys = await testDev(d); // connection test BEFORE saving
      devices.push(d); save(); schedule(d);
      res.json({ ok: true, id: d.id, sys });
    } catch (e) { res.status(400).json({ error: "Not saved. " + nice(e) }); }
  });
  router.put("/snmp/devices/:id", authed, async (req, res) => {
    try {
      const old = find(req.params.id); if (!old) return res.status(404).json({ error: "Device not found" });
      const d = build(req.body || {}, old);
      if (dup(d, old)) return res.status(409).json({ error: "Another device already uses this address and port." });
      const sys = await testDev(d);
      devices[devices.indexOf(old)] = d; rt.delete(d.id); save(); schedule(d);
      res.json({ ok: true, id: d.id, sys });
    } catch (e) { res.status(400).json({ error: "Not saved. " + nice(e) }); }
  });
  router.delete("/snmp/devices/:id", authed, (req, res) => {
    const i = devices.findIndex((x) => x.id === req.params.id);
    if (i < 0) return res.status(404).json({ error: "Device not found" });
    unschedule(devices[i].id); rt.delete(devices[i].id); devices.splice(i, 1); save();
    res.json({ ok: true });
  });
  router.get("/snmp/devices/:id/live", authed, async (req, res) => {
    const d = find(req.params.id); if (!d) return res.status(404).json({ error: "Device not found" });
    try { res.json(await liveOf(d)); } catch (e) { res.status(502).json({ error: e.message }); }
  });
  if (ctx.app) ctx.app.get("/api/snmp-hosts", (req, res) => { res.set("Cache-Control", "no-store"); res.json({ hosts: devices.map((d) => d.host) }); });
  const lcache = new Map();
  if (ctx.app) {
    ctx.app.get("/api/snmp-view/devices", (req, res) => { res.set("Cache-Control", "no-store"); res.json({ devices: devices.map((d) => ({ id: d.id, name: d.name, host: d.host, port: d.port, version: d.version, metrics: d.metrics })) }); });
    ctx.app.get("/api/snmp-view/:id/live", async (req, res) => {
      res.set("Cache-Control", "no-store");
      const d = find(req.params.id); if (!d) return res.status(404).json({ error: "Device not found" });
      try {
        let c = lcache.get(d.id);
        if (!c || Date.now() - c.t > 4000) { c = { t: Date.now(), p: liveOf(d) }; lcache.set(d.id, c); }
        res.json(await c.p);
      } catch (e) { lcache.delete(d.id); res.status(502).json({ error: e.message }); }
    });
  }
  try { if (ctx.liveState) Object.defineProperty(ctx.liveState, "snmpDevices", { enumerable: true, configurable: true, get: () => devices.map((d) => ({ id: d.id, name: d.name, host: d.host, port: d.port, version: d.version, metrics: d.metrics })) }); } catch (e) {}
  try { require("./snmp-history").attach({ app: ctx.app, devices: function () { return devices; }, liveOf: liveOf, find: find }); } catch (e) { console.error("[snmp-history] disabled: " + e.message); }
  console.log("[snmp] ready (" + devices.length + " device(s))");
}
module.exports = { attach };
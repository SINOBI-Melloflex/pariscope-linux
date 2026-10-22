"use strict";
const fs = require("fs"), path = require("path"), express = require("express"), ping = require("ping");
const FILE = path.join(require("./datadir").DATA_DIR, "geomap.json");
let state = { rev: 0, data: { links: {} } };
try { const j = JSON.parse(fs.readFileSync(FILE, "utf8")); if (j && j.data && j.data.links) state = { rev: Number(j.rev) || 1, data: j.data }; } catch (e) {}
const pings = {};
const S = (v, n) => String(v == null ? "" : v).replace(/[\u0000-\u001f]/g, " ").slice(0, n);
const IPOK = (v) => /^[A-Za-z0-9.\-]{1,100}$/.test(String(v || ""));
const TP = (v, d) => /^[a-z0-9_]{1,16}$/.test(String(v)) ? String(v) : d;
const LA = (v) => { if (v === null || v === undefined || v === "") return null; v = Number(v); return Number.isFinite(v) && v >= -90 && v <= 90 ? Math.round(v * 1e6) / 1e6 : null; };
const LO = (v) => { if (v === null || v === undefined || v === "") return null; v = Number(v); return Number.isFinite(v) && v >= -180 && v <= 180 ? Math.round(v * 1e6) / 1e6 : null; };
function clean(d) {
  if (!d || typeof d !== "object" || !d.links || typeof d.links !== "object") throw new Error("Bad data");
  const links = {};
  Object.keys(d.links).slice(0, 1000).forEach((k) => {
    if (!/^[LS]:[A-Za-z0-9_.:\-]{1,100}$/.test(k)) return;
    const g = d.links[k] || {}, pts = [], sn = (Array.isArray(g.snmp) ? g.snmp : []).slice(0, 100).map((x) => ({ id: S(x && x.id, 60).replace(/[^A-Za-z0-9_.:\-]/g, ""), host: IPOK(x && x.host) ? String(x.host) : "" })).filter((x) => x.id);
    (Array.isArray(g.points) ? g.points : []).slice(0, 300).forEach((p) => {
      if (!p) return; const la = LA(p.lat), lo = LO(p.lng); if (la === null || lo === null) return;
      const id = S(p.id, 24).replace(/[^A-Za-z0-9_-]/g, "") || ("p" + Math.random().toString(36).slice(2, 9));
      pts.push({ id, type: TP(p.type, "other"), name: S(p.name, 60), ip: IPOK(p.ip) ? String(p.ip) : "", lat: la, lng: lo });
    });
    links[k] = { lat: LA(g.lat), lng: LO(g.lng), name: S(g.name, 60), ip: IPOK(g.ip) ? String(g.ip) : "", points: pts, snmp: sn };
  });
  return { links };
}
function roleOf(req) { const fn = globalThis.__pariscopeRoleOf; if (typeof fn !== "function") return undefined; try { return fn(req.get("x-manage-token")); } catch (e) { return null; } }
function save(data, rev) { const tmp = FILE + ".tmp"; try { if (fs.existsSync(FILE)) fs.copyFileSync(FILE, FILE + ".bak"); } catch (e) {} fs.writeFileSync(tmp, JSON.stringify({ rev, data })); fs.renameSync(tmp, FILE); }
let busy = false;
async function tick() {
  if (busy) return; busy = true;
  try {
    const ips = new Set();
    Object.keys(state.data.links).forEach((k) => { const g = state.data.links[k]; if (k[0] === "S" && g.ip) ips.add(g.ip); (g.points || []).forEach((p) => { if (p.ip) ips.add(p.ip); }); (g.snmp || []).forEach((x) => { if (x.host) ips.add(x.host); }); });
    const list = [...ips];
    for (let i = 0; i < list.length; i += 16) {
      await Promise.all(list.slice(i, i + 16).map(async (ip) => {
        const prev = pings[ip]; let ok = false, ms = null;
        try { const r = await ping.promise.probe(ip, { timeout: 1.5 }); ok = !!(r && r.alive && r.time !== "unknown" && r.time !== "undefined"); ms = ok ? (Number(r.time) || 0) : null; } catch (e) { ok = false; }
        const fails = ok ? 0 : ((prev && prev.fails) || 0) + 1;
        pings[ip] = { alive: ok || (!!(prev && prev.alive) && fails < 2), ms, fails, at: Date.now() };
      }));
    }
    Object.keys(pings).forEach((ip) => { if (!ips.has(ip)) delete pings[ip]; });
  } catch (e) {}
  busy = false;
}
function attach(app) {
  app.get("/api/geomap", (req, res) => { res.set("Cache-Control", "no-store"); res.json({ ok: true, rev: state.rev, data: state.data }); });
  app.get("/api/geomap/role", (req, res) => { res.set("Cache-Control", "no-store"); const r = roleOf(req); res.json({ role: r || "none", canSave: r === "admin" }); });
  app.get("/api/geomap/pings", (req, res) => { res.set("Cache-Control", "no-store"); res.json({ ok: true, pings }); });
  app.post("/api/geomap", express.json({ limit: "2mb" }), (req, res) => {
    const r = roleOf(req);
    if (r === undefined) return res.status(503).json({ error: "Admin check is not installed." });
    if (!r) return res.status(401).json({ error: "Please log in as admin from MANAGE." });
    if (r !== "admin") return res.status(403).json({ error: "Only the admin can edit locations." });
    try {
      const b = req.body || {};
      if (Number(b.rev) !== state.rev) return res.status(409).json({ error: "Locations changed elsewhere. Reload first.", rev: state.rev });
      const data = clean(b.data), rev = state.rev + 1; save(data, rev); state = { rev, data }; setTimeout(tick, 200); res.json({ ok: true, rev });
    } catch (e) { res.status(400).json({ error: String(e.message || e) }); }
  });
  setTimeout(tick, 2000); setInterval(tick, 5000);
  console.log("[geomap] ready, " + Object.keys(state.data.links).length + " mapped links");
}
module.exports = { attach };
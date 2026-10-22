"use strict";
const fs = require("fs"), path = require("path"), express = require("express");
const FILE = path.join(require("./datadir").DATA_DIR, "netmap.json");
let state = { rev: 0, map: { nodes: [], edges: [] } };
try { const j = JSON.parse(fs.readFileSync(FILE, "utf8")); if (j && j.map && Array.isArray(j.map.nodes)) state = { rev: Number(j.rev) || 1, map: j.map }; } catch (e) {}
const S = (v, n) => String(v == null ? "" : v).replace(/[\u0000-\u001f]/g, " ").slice(0, n);
const N = (v, a, b, d) => { v = Number(v); return Number.isFinite(v) ? Math.min(b, Math.max(a, v)) : d; };
const ID = (v) => /^[A-Za-z0-9_-]{1,32}$/.test(String(v || ""));
const TP = (v, d) => /^[a-z0-9_]{1,16}$/.test(String(v)) ? String(v) : d;
function clean(m) {
  if (!m || typeof m !== "object") throw new Error("Bad map");
  const nodes = [], seen = new Set();
  for (const n of (Array.isArray(m.nodes) ? m.nodes : []).slice(0, 600)) {
    if (!n || !ID(n.id) || seen.has(n.id)) continue; seen.add(n.id);
    nodes.push({ id: String(n.id), x: Math.round(N(n.x, -20000, 20000, 0)), y: Math.round(N(n.y, -20000, 20000, 0)), type: TP(n.type, "generic"), label: S(n.label, 60), uid: S(n.uid, 40), ip: S(n.ip, 45) });
  }
  const edges = [], es = new Set();
  for (const e of (Array.isArray(m.edges) ? m.edges : []).slice(0, 1800)) {
    if (!e || !ID(e.id) || es.has(e.id) || !seen.has(e.a) || !seen.has(e.b) || e.a === e.b) continue; es.add(e.id);
    edges.push({ id: String(e.id), a: String(e.a), b: String(e.b), type: TP(e.type, "utp"), label: S(e.label, 40), pa: S(e.pa, 60), pb: S(e.pb, 60) });
  }
  return { nodes, edges };
}
function roleOf(req) { const fn = globalThis.__pariscopeRoleOf; if (typeof fn !== "function") return undefined; try { return fn(req.get("x-manage-token")); } catch (e) { return null; } }
function save(map, rev) { const tmp = FILE + ".tmp"; try { if (fs.existsSync(FILE)) fs.copyFileSync(FILE, FILE + ".bak"); } catch (e) {} fs.writeFileSync(tmp, JSON.stringify({ rev, map })); fs.renameSync(tmp, FILE); }
function attach(app) {
  app.get("/api/netmap", (req, res) => { res.set("Cache-Control", "no-store"); res.json({ ok: true, rev: state.rev, map: state.map }); });
  app.get("/api/netmap/role", (req, res) => { res.set("Cache-Control", "no-store"); const r = roleOf(req); res.json({ role: r || "none", canSave: r === "admin" }); });
  app.post("/api/netmap", express.json({ limit: "1mb" }), (req, res) => {
    const r = roleOf(req);
    if (r === undefined) return res.status(503).json({ error: "Admin check is not installed." });
    if (!r) return res.status(401).json({ error: "Please log in as admin from MANAGE." });
    if (r !== "admin") return res.status(403).json({ error: "Only the admin can edit the map." });
    try {
      const b = req.body || {};
      if (Number(b.rev) !== state.rev) return res.status(409).json({ error: "Map changed elsewhere. Reload first.", rev: state.rev });
      const map = clean(b.map), rev = state.rev + 1; save(map, rev); state = { rev, map }; res.json({ ok: true, rev });
    } catch (e) { res.status(400).json({ error: String(e.message || e) }); }
  });
  console.log("[netmap] ready, " + state.map.nodes.length + " devices");
}
module.exports = { attach };
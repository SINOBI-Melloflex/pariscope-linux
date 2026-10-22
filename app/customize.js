"use strict";
// Pariscope - "Customize Your Own": super-admin dashboard designer (server part).
// Stores the saved design in the data folder (customize-layout.json). Fails safe.
const crypto = require("crypto");
const fs = require("fs");
const express = require("express");
const FILE = require("./datadir").file("customize-layout.json");

const SALT = "d39b5920407eae758247470105a7ade8";
const HASH = "03a27f8b475eb0493663b77517c02bc7989590e09fca04eadf921e4f725fa161";
const TTL = 2 * 60 * 60 * 1000;
const sessions = new Map();
const fails = new Map();
const PROTECTED = new Set(["logo-area", "mg-open"]);
const ID = /^[a-z0-9-]{1,40}$/;

function check(u, p) {
  try {
    const a = crypto.scryptSync(String(p == null ? "" : p), SALT, 32);
    const ok = crypto.timingSafeEqual(a, Buffer.from(HASH, "hex"));
    return ok && String(u) === "sd";
  } catch (e) { return false; }
}

function readLayout() {
  try { const j = JSON.parse(fs.readFileSync(FILE, "utf8")); return j && j.v === 1 ? j : {}; }
  catch (e) { return {}; }
}

function clean(l) {
  if (!l || typeof l !== "object" || l.v !== 1) return null;
  const out = { v: 1, place: {}, order: [], hidden: [], texts: {} };
  if (l.place && typeof l.place === "object") {
    for (const k of Object.keys(l.place).slice(0, 60)) {
      if (!ID.test(k)) continue;
      const x = l.place[k] || {};
      const p = String(x.p == null ? "" : x.p);
      const n = x.n == null ? null : String(x.n);
      if (!(p === "body" || p === "*" || ID.test(p))) continue;
      if (n !== null && !ID.test(n)) continue;
      out.place[k] = { p: p, n: n };
    }
  }
  if (Array.isArray(l.order)) out.order = l.order.map(String).filter((x) => ID.test(x)).slice(0, 60);
  if (Array.isArray(l.hidden)) out.hidden = l.hidden.map(String).filter((x) => ID.test(x) && !PROTECTED.has(x)).slice(0, 60);
  if (l.texts && typeof l.texts === "object") {
    for (const k of Object.keys(l.texts).slice(0, 300)) {
      if (!/^[a-z0-9-]{1,40}:\d{1,3}$/.test(k)) continue;
      const v = String(l.texts[k]).trim();
      if (!v || v.length > 200 || /[\u0000-\u001f]/.test(v)) continue;
      out.texts[k] = v;
    }
  }
  return out;
}

function attach(app) {
  const r = express.Router();
  r.use(express.json({ limit: "100kb" }));
  r.use((req, res, next) => { res.set("Cache-Control", "no-store"); next(); });

  function authed(req, res, next) {
    const t = req.get("x-cz-token");
    const exp = t && sessions.get(t);
    if (exp && exp > Date.now()) return next();
    if (t) sessions.delete(t);
    res.status(401).json({ error: "Session expired. Please log in again." });
  }

  r.get("/layout", (req, res) => res.json(readLayout()));

  r.post("/login", (req, res) => {
    const ip = req.socket.remoteAddress || "?";
    const f = fails.get(ip) || { n: 0, until: 0 };
    if (f.until > Date.now()) return res.status(429).json({ error: "Too many attempts. Wait one minute." });
    const b = req.body || {};
    if (check(b.username, b.password)) {
      fails.delete(ip);
      sessions.forEach((exp, t) => { if (exp < Date.now()) sessions.delete(t); });
      const token = crypto.randomBytes(24).toString("hex");
      sessions.set(token, Date.now() + TTL);
      return res.json({ ok: true, token: token });
    }
    f.n++;
    if (f.n >= 5) { f.until = Date.now() + 60000; f.n = 0; }
    fails.set(ip, f);
    res.status(401).json({ error: "Wrong user name or password." });
  });

  r.post("/save", authed, (req, res) => {
    const layout = clean(req.body && req.body.layout);
    if (!layout) return res.status(400).json({ error: "Bad design data." });
    try {
      const tmp = FILE + ".tmp";
      fs.writeFileSync(tmp, JSON.stringify(layout));
      fs.renameSync(tmp, FILE);
      res.json({ ok: true });
    } catch (e) { res.status(500).json({ error: "Could not save: " + e.message }); }
  });

  r.post("/reset", authed, (req, res) => {
    try { if (fs.existsSync(FILE)) fs.unlinkSync(FILE); res.json({ ok: true }); }
    catch (e) { res.status(500).json({ error: "Could not reset: " + e.message }); }
  });

  app.use("/api/customize", r);
  console.log("[customize] ready (/api/customize)");
}

module.exports = { attach };

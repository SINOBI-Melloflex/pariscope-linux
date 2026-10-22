"use strict";
// Pariscope history - records every UP / DOWN / FLAPPING change per IP and answers /api/history.
const fs = require("fs");
const path = require("path");
const DATA_DIR = require("./datadir").DATA_DIR;
const FILE = path.join(DATA_DIR, "history.json");
const SEEN = path.join(DATA_DIR, "history-seen.txt");
const KEEP_MS = 400 * 86400000;
const GAP_MS = 120000;
const DAY = 86400000;
const CODE = { ONLINE: 0, DOWN: 1, FLAPPING: 2 };
const RANGES = { "1d": [DAY, 48], "3d": [3 * DAY, 36], "7d": [7 * DAY, 28], "30d": [30 * DAY, 30], "365d": [365 * DAY, 52] };

let db = { links: {} };
try { const j = JSON.parse(fs.readFileSync(FILE, "utf8")); if (j && j.links && typeof j.links === "object") db = j; } catch (e) {}
let seen = 0;
try { seen = Number(fs.readFileSync(SEEN, "utf8")) || 0; } catch (e) {}

function writeDb() {
  try {
    const cut = Date.now() - KEEP_MS;
    for (const ip in db.links) {
      const l = db.links[ip];
      if (!l || !Array.isArray(l.e)) continue;
      while (l.e.length > 1 && l.e[1][0] < cut) l.e.shift();
      if (l.e.length && l.e[0][0] < cut) l.e[0][0] = cut;
    }
    const tmp = FILE + ".tmp";
    fs.writeFileSync(tmp, JSON.stringify(db));
    fs.renameSync(tmp, FILE);
  } catch (e) { console.error("[history] save failed: " + e.message); }
}
function writeSeen() { try { fs.writeFileSync(SEEN, String(Date.now())); } catch (e) {} }

// If Pariscope was off for a while, mark that time as "no data" (code 3).
if (seen && Date.now() - seen > GAP_MS) {
  for (const ip in db.links) {
    const l = db.links[ip];
    if (!l || !Array.isArray(l.e)) continue;
    const last = l.e[l.e.length - 1];
    if (last && last[1] !== 3) l.e.push([seen, 3]);
  }
  writeDb();
}

let pending = null;
function later() { if (!pending) pending = setTimeout(() => { pending = null; writeDb(); }, 2000); }
writeSeen();
setInterval(writeSeen, 30000);
process.on("exit", () => { writeSeen(); if (pending) writeDb(); });

function record(ip, name, cat, status, now) {
  const code = CODE[status];
  if (code === undefined || !ip) return;
  let l = db.links[ip];
  if (!l || !Array.isArray(l.e)) l = db.links[ip] = { n: name || ip, c: cat || "", e: [] };
  if (name) l.n = name;
  if (cat) l.c = cat;
  const last = l.e[l.e.length - 1];
  if (!last || last[1] !== code) { l.e.push([now, code]); later(); }
}

function analyse(l, range, now) {
  const R = RANGES[range];
  const from = now - R[0], N = R[1], bms = R[0] / N;
  const buckets = [];
  for (let i = 0; i < N; i++) buckets.push([0, 0, 0, 0]);
  const tot = [0, 0, 0, 0];
  let outages = 0, longest = 0, flapEpisodes = 0;
  const e = l.e;
  const segs = [];
  if (!e.length) segs.push([from, now, 3]);
  else {
    if (e[0][0] > from) segs.push([from, Math.min(e[0][0], now), 3]);
    for (let i = 0; i < e.length; i++) segs.push([e[i][0], i + 1 < e.length ? e[i + 1][0] : now, e[i][1]]);
  }
  for (const sg of segs) {
    const a = Math.max(sg[0], from), b = Math.min(sg[1], now), code = sg[2];
    if (b <= a) continue;
    tot[code] += b - a;
    if (code === 1) { outages++; if (b - a > longest) longest = b - a; }
    if (code === 2) flapEpisodes++;
    const k0 = Math.max(0, Math.floor((a - from) / bms));
    const k1 = Math.min(N - 1, Math.floor((b - from - 1) / bms));
    for (let k = k0; k <= k1; k++) {
      const lo = from + k * bms, hi = lo + bms;
      const ov = Math.min(b, hi) - Math.max(a, lo);
      if (ov > 0) buckets[k][code] += ov;
    }
  }
  const known = tot[0] + tot[1] + tot[2];
  const last = e[e.length - 1];
  return {
    from, to: now, bucketMs: bms, buckets,
    totals: { up: tot[0], down: tot[1], flap: tot[2], nodata: tot[3] },
    uptime: known > 0 ? (tot[0] / known) * 100 : null,
    outages, longestOutage: longest, avgOutage: outages ? Math.round(tot[1] / outages) : 0, flapEpisodes,
    current: last ? last[1] : null, since: last ? last[0] : null,
    trackingSince: e.length ? e[0][0] : null,
    events: e.filter((x) => x[0] >= from).slice(-25).reverse().map((x) => ({ t: x[0], s: x[1] }))
  };
}

function attach(app) {
  app.get("/api/history", (req, res) => {
    res.set("Cache-Control", "no-store");
    const ip = String(req.query.ip || "").trim();
    const range = RANGES[req.query.range] ? String(req.query.range) : "1d";
    if (!/^([0-9.]{7,15}|svc:[a-f0-9]{10})$/.test(ip)) return res.status(400).json({ ok: false, error: "bad ip" });
    const l = Object.prototype.hasOwnProperty.call(db.links, ip) ? db.links[ip] : null;
    if (!l || !Array.isArray(l.e)) return res.json({ ok: true, ip: ip, none: true });
    res.json(Object.assign({ ok: true, ip: ip, name: l.n, cat: l.c, range: range }, analyse(l, range, Date.now())));
  });
}

module.exports = { record, attach };
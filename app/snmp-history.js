"use strict";
// Pariscope - SNMP Interface History (separate add-on, loaded by one guarded line in snmp.js).
// Tier 1: one point per 5 minutes, kept 31 days.  Tier 2: one point per hour, kept 366 days (6 months / 1 year views).
const fs = require("fs"), path = require("path");
const DATA_DIR = require("./datadir").DATA_DIR;

const BUCKET = 5 * 60 * 1000;
const HOUR = 3600 * 1000;
const DAYMS = 86400000;
const KEEP = 31 * DAYMS;
const KEEP_H = 366 * DAYMS;
const POLL_MS = 60 * 1000;
const SAVE_MS = 5 * 60 * 1000;
const SAVE_H_MS = 15 * 60 * 1000;
const MAX_PTS = 360;
const MAX_PTS_H = 365;
const MAX_IFS = 400;
const dict = () => Object.create(null);
const RANGES = Object.assign(dict(), { "1h": 3600e3, "6h": 6 * 3600e3, "24h": DAYMS, "7d": 7 * DAYMS, "30d": 30 * DAYMS, "6m": 180 * DAYMS, "1y": 365 * DAYMS });
const HOURLY = Object.assign(dict(), { "6m": 1, "1y": 1 });
const OKID = /^[A-Za-z0-9]{1,32}$/;
const store = new Map();
const acc = new Map();
const fileOf = (id) => path.join(DATA_DIR, "state-cache-ifh-" + id + ".json");
const fileH = (id) => path.join(DATA_DIR, "state-cache-ifh-" + id + "-hourly.json");

function readJson(f) { try { return JSON.parse(fs.readFileSync(f, "utf8").replace(/^\uFEFF/, "")); } catch (e) { return null; } }
function writeJson(f, o) { const t = f + ".tmp"; fs.writeFileSync(t, JSON.stringify(o)); fs.renameSync(t, f); }

// 5-minute point  = [bucketStart, avgIn, avgOut, peakIn, peakOut, oper]
// hourly point    = [hourStart, avgIn, avgOut, peakIn, peakOut, oper, nData, nUp, nAll]
function aggHour(hs, pts) {
  let sI = 0, sO = 0, n = 0, mI = 0, mO = 0, up = 0, op = 1;
  for (const x of pts) {
    if (x[1] != null) { sI += x[1]; sO += x[2]; n++; if (x[3] > mI) mI = x[3]; if (x[4] > mO) mO = x[4]; }
    if (x[5] === 1) up++; else op = x[5];
  }
  return [hs, n ? Math.round(sI / n) : null, n ? Math.round(sO / n) : null, n ? mI : null, n ? mO : null, op, n, up, pts.length];
}
function backfill(p) {
  const out = []; let hs = null, grp = [];
  for (const x of p) {
    const k = Math.floor(x[0] / HOUR) * HOUR;
    if (hs !== k) { if (grp.length) out.push(aggHour(hs, grp)); hs = k; grp = []; }
    grp.push(x);
  }
  if (grp.length) out.push(aggHour(hs, grp));
  return out;
}

function loadDev(id) {
  const S = { ifs: dict(), dirty: false, hdirty: false };
  const j = readJson(fileOf(id));
  if (j && j.ifs) for (const k of Object.keys(j.ifs)) { const e = j.ifs[k]; if (e && Array.isArray(e.p)) S.ifs[k] = { m: e.m || {}, p: e.p, h: [] }; }
  const jh = readJson(fileH(id));
  if (jh && jh.ifs) for (const k of Object.keys(jh.ifs)) {
    const e = jh.ifs[k];
    if (e && Array.isArray(e.h)) { if (!S.ifs[k]) S.ifs[k] = { m: e.m || {}, p: [], h: [] }; S.ifs[k].h = e.h; }
  }
  for (const k of Object.keys(S.ifs)) {
    const e = S.ifs[k];
    if (!e.p.length) continue;
    const bf = backfill(e.p), cutoff = e.h.length ? e.h[e.h.length - 1][0] : 0;
    e.h = e.h.filter((x) => x[0] < cutoff).concat(bf.filter((x) => x[0] >= cutoff));
    S.hdirty = true;
  }
  store.set(id, S);
  return S;
}
const getS = (id) => store.get(id) || loadDev(id);

function saveP() {
  const cut = Date.now() - KEEP;
  store.forEach((S, id) => {
    if (!S.dirty || !OKID.test(id)) return;
    try {
      const o = dict();
      for (const k of Object.keys(S.ifs)) {
        const e = S.ifs[k]; let n = 0;
        while (n < e.p.length && e.p[n][0] < cut) n++;
        if (n) e.p.splice(0, n);
        if (e.p.length) o[k] = { m: e.m, p: e.p };
      }
      writeJson(fileOf(id), { v: 1, ifs: o });
      S.dirty = false;
    } catch (e) { console.error("[ifhistory] save failed: " + e.message); }
  });
}
function saveH() {
  const cut = Date.now() - KEEP_H;
  store.forEach((S, id) => {
    if (!S.hdirty || !OKID.test(id)) return;
    try {
      const o = dict();
      for (const k of Object.keys(S.ifs)) {
        const e = S.ifs[k]; let n = 0;
        while (n < e.h.length && e.h[n][0] < cut) n++;
        if (n) e.h.splice(0, n);
        if (e.h.length) o[k] = { m: e.m, h: e.h };
        else if (!e.p.length) delete S.ifs[k];
      }
      writeJson(fileH(id), { v: 1, ifs: o });
      S.hdirty = false;
    } catch (e) { console.error("[ifhistory] hourly save failed: " + e.message); }
  });
}

function sample(id, list, now) {
  const t0 = Math.floor(now / BUCKET) * BUCKET;
  const hs = Math.floor(t0 / HOUR) * HOUR;
  let a = acc.get(id);
  if (!a || a.t0 !== t0) { a = { t0, c: dict() }; acc.set(id, a); }
  const S = getS(id);
  let count = Object.keys(S.ifs).length;
  for (const x of list || []) {
    if (!x || x.kind === "pppoe") continue;
    const k = String(x.name || "").slice(0, 80);
    if (!k) continue;
    let e = S.ifs[k];
    if (!e) { if (count >= MAX_IFS) continue; e = S.ifs[k] = { m: {}, p: [], h: [] }; count++; }
    let c = a.c[k];
    if (!c) c = a.c[k] = { sI: 0, sO: 0, n: 0, mI: 0, mO: 0, down: false, op: 1 };
    const op = Number(x.oper) || 0;
    c.op = op; if (op !== 1) c.down = true;
    if (x.inBps != null && x.outBps != null) {
      c.sI += x.inBps; c.sO += x.outBps; c.n++;
      if (x.inBps > c.mI) c.mI = x.inBps;
      if (x.outBps > c.mO) c.mO = x.outBps;
    }
    e.m = { a: String(x.alias || "").slice(0, 80), k: x.kind || "other", s: Number(x.speed) || 0, i: Number(x.index) || 0 };
    const code = c.down ? ((c.op && c.op !== 1) ? c.op : 2) : 1;
    const pt = [t0, c.n ? Math.round(c.sI / c.n) : null, c.n ? Math.round(c.sO / c.n) : null, c.n ? Math.round(c.mI) : null, c.n ? Math.round(c.mO) : null, code];
    const last = e.p[e.p.length - 1];
    if (last && last[0] === t0) e.p[e.p.length - 1] = pt; else e.p.push(pt);
    const grp = [];
    for (let i = e.p.length - 1; i >= 0 && e.p[i][0] >= hs; i--) grp.unshift(e.p[i]);
    const hp = aggHour(hs, grp), lh = e.h[e.h.length - 1];
    if (lh && lh[0] === hs) e.h[e.h.length - 1] = hp; else e.h.push(hp);
  }
  S.dirty = true; S.hdirty = true;
}

function build(p, range, now, hourly) {
  const R = RANGES[range], from = now - R, B = hourly ? HOUR : BUCKET;
  const step = Math.max(B, Math.ceil(R / (hourly ? MAX_PTS_H : MAX_PTS) / B) * B);
  const raw = p.filter((x) => x[0] + B > from);
  const pts = []; let cur = null;
  let sI = 0, sO = 0, W = 0, pI = 0, pO = 0, pIt = null, pOt = null, up = 0, all = 0, bI = 0, bO = 0;
  for (const x of raw) {
    const k = Math.floor(x[0] / step) * step;
    if (!cur || cur.k !== k) { cur = { k, sI: 0, sO: 0, w: 0, mI: 0, mO: 0, op: 1 }; pts.push(cur); }
    if (x[1] != null) {
      const w = hourly ? (x[6] || 1) : 1;
      sI += x[1] * w; sO += x[2] * w; W += w;
      bI += x[1] * w * BUCKET / 8000; bO += x[2] * w * BUCKET / 8000;
      if (x[3] > pI) { pI = x[3]; pIt = x[0]; }
      if (x[4] > pO) { pO = x[4]; pOt = x[0]; }
      cur.sI += x[1] * w; cur.sO += x[2] * w; cur.w += w;
      if (x[3] > cur.mI) cur.mI = x[3];
      if (x[4] > cur.mO) cur.mO = x[4];
    }
    if (hourly) { up += x[7] || 0; all += x[8] || 0; } else { all++; if (x[5] === 1) up++; }
    if (x[5] !== 1) cur.op = x[5];
  }
  return {
    from, to: now, step, bucketMs: B,
    points: pts.map((c) => [c.k, c.w ? Math.round(c.sI / c.w) : null, c.w ? Math.round(c.sO / c.w) : null, c.w ? c.mI : null, c.w ? c.mO : null, c.op]),
    summary: {
      samples: all, avgIn: W ? sI / W : null, avgOut: W ? sO / W : null,
      peakIn: W ? pI : null, peakInAt: pIt, peakOut: W ? pO : null, peakOutAt: pOt,
      upPct: all ? (up / all) * 100 : null, bytesIn: bI, bytesOut: bO,
      current: raw.length ? raw[raw.length - 1][5] : null, trackingSince: p.length ? p[0][0] : null
    }
  };
}

function attach(ctx) {
  const app = ctx.app; if (!app) return;
  (ctx.devices() || []).forEach((d) => { if (OKID.test(d.id)) getS(d.id); });
  const lookup = (req, res) => {
    const d = ctx.find(String(req.params.id));
    if (!d || !OKID.test(d.id)) { res.status(404).json({ error: "Device not found" }); return null; }
    return d;
  };
  app.get("/api/snmp-view/:id/ifh/list", (req, res) => {
    res.set("Cache-Control", "no-store");
    const d = lookup(req, res); if (!d) return;
    const S = getS(d.id), now = Date.now(), out = [];
    for (const k of Object.keys(S.ifs)) {
      const e = S.ifs[k], l = e.p[e.p.length - 1] || e.h[e.h.length - 1]; if (!l) continue;
      const first = e.h.length ? e.h[0][0] : (e.p.length ? e.p[0][0] : l[0]);
      out.push({ name: k, alias: e.m.a || "", kind: e.m.k || "other", speed: e.m.s || 0, index: e.m.i || 0, op: l[5], inBps: l[1], outBps: l[2], lastSeen: l[0], since: first, points: e.p.length, stale: now - l[0] > 15 * 60000 });
    }
    out.sort((p, q) => (p.index - q.index) || (p.name < q.name ? -1 : 1));
    res.json({ ok: true, device: { id: d.id, name: d.name, host: d.host }, now, bucketMs: BUCKET, interfaces: out });
  });
  app.get("/api/snmp-view/:id/ifh/series", (req, res) => {
    res.set("Cache-Control", "no-store");
    const d = lookup(req, res); if (!d) return;
    const name = String(req.query.name || "").slice(0, 80);
    const range = RANGES[String(req.query.range)] ? String(req.query.range) : "24h";
    const e = getS(d.id).ifs[name];
    if (!e) return res.status(404).json({ error: "Interface not found" });
    const hourly = !!HOURLY[range];
    res.json(Object.assign({ ok: true, name, alias: e.m.a || "", kind: e.m.k || "other", speed: e.m.s || 0, range }, build(hourly ? e.h : e.p, range, Date.now(), hourly)));
  });
  const busy = new Set();
  async function pollDev(d) {
    if (!OKID.test(d.id) || busy.has(d.id)) return; busy.add(d.id);
    try { const r = await ctx.liveOf(d); sample(d.id, r && r.interfaces, Date.now()); }
    catch (e) {} finally { busy.delete(d.id); }
  }
  function tick() { (ctx.devices() || []).forEach((d, i) => setTimeout(() => pollDev(d), i * 2000)); }
  setTimeout(tick, 15000);
  setInterval(tick, POLL_MS);
  setInterval(saveP, SAVE_MS);
  setInterval(saveH, SAVE_H_MS);
  setTimeout(saveH, 60000);
  process.on("exit", () => { saveP(); saveH(); });
  console.log("[ifhistory] ready (5-min detail " + KEEP / DAYMS + " days, hourly summary " + KEEP_H / DAYMS + " days)");
}
module.exports = { attach, _sample: sample };
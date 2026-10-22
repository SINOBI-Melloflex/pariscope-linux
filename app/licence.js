"use strict";
// Pariscope licence module (v2.0) - one licence = one device.
// Checks the key against the licence server in the background and locks the app until valid.

const fs = require("fs");
const path = require("path");
const https = require("https");
const crypto = require("crypto");
const os = require("os");
const { execFile } = require("child_process");

// ===== SETTINGS =====
const SERVER_HOST = "velocitytech.top";
const SERVER_PATH = "/licence_cheek.php";
const APP_NAME = "Pariscope";
const GRACE_DAYS = 3;               // app keeps working this many days if the licence server cannot be reached
const RECHECK_OK_MS = 5 * 60e3;   // re-verify every 5 minutes while running
const RECHECK_RETRY_MS = 10 * 60e3; // retry every 10 minutes after a failed / offline check
// ====================

const SECRET = "psc2-7f3a91c4e0b84d6aa1d2c5e98b07f46e";
const DATA_FILE = path.join(require("./datadir").DATA_DIR, "licence.dat");
const HTML_FILE = path.join(__dirname, "licence.html");
const GRACE_MS = GRACE_DAYS * 24 * 3600e3;

const st = { licensed: false, status: "locked", message: "Please enter your licence key.", expires: null };
let deviceId = null, busy = false, timer = null, lastTry = 0;

/* ---------- device id (stable across reinstall: Windows MachineGuid) ---------- */
function getDevice() {
  if (deviceId) return Promise.resolve(deviceId);
  return new Promise((resolve) => {
    const done = (raw) => { deviceId = "PSC-" + crypto.createHash("sha256").update("pariscope|" + raw).digest("hex").slice(0, 32).toUpperCase(); resolve(deviceId); };
    const fallback = () => {
      let macs = "";
      try { Object.values(os.networkInterfaces()).flat().forEach((n) => { if (n && !n.internal && n.mac && n.mac !== "00:00:00:00:00:00") macs += n.mac; }); } catch (e) {}
      done("fallback|" + os.hostname() + "|" + ((os.cpus()[0] || {}).model || "") + "|" + macs);
    };
    if (process.platform !== "win32") {
      let id = "";
      for (const f of ["/etc/machine-id", "/var/lib/dbus/machine-id"]) { try { id = fs.readFileSync(f, "utf8").trim(); if (id) break; } catch (e) {} }
      return id ? done("linux|" + id.toLowerCase()) : fallback();
    }
    try {
      execFile("reg", ["query", "HKLM\\SOFTWARE\\Microsoft\\Cryptography", "/v", "MachineGuid", "/reg:64"], { windowsHide: true, timeout: 8000 }, (err, out) => {
        const m = /MachineGuid\s+REG_SZ\s+([0-9a-fA-F-]{16,})/.exec(String(out || ""));
        if (m) done(m[1].toLowerCase()); else fallback();
      });
    } catch (e) { fallback(); }
  });
}

/* ---------- saved licence (signed with the device id, so copying the file to another PC is useless) ---------- */
const sign = (key, lastOk, dev) => crypto.createHmac("sha256", SECRET + dev).update(key + "|" + lastOk).digest("hex");
function loadSaved(dev) {
  try {
    const j = JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
    if (!j || typeof j.key !== "string" || !j.key) return null;
    const ok = typeof j.sig === "string" && j.sig === sign(j.key, Number(j.lastOk) || 0, dev);
    return { key: j.key, lastOk: Number(j.lastOk) || 0, sigOk: ok };
  } catch (e) { return null; }
}
function saveLicence(key, lastOk, dev) {
  try {
    const tmp = DATA_FILE + ".tmp";
    fs.writeFileSync(tmp, JSON.stringify({ key, lastOk, sig: sign(key, lastOk, dev) }));
    fs.renameSync(tmp, DATA_FILE);
  } catch (e) { console.error("licence save failed:", e.message); }
}
function clearSaved() { try { fs.unlinkSync(DATA_FILE); } catch (e) {} }
const CLK_FILE = path.join(require("./datadir").DATA_DIR, "licence.clk");
const clkSign = (t, dev) => crypto.createHmac("sha256", SECRET + dev + "|clk").update(String(t)).digest("hex");
function clkRead() { let raw; try { raw = fs.readFileSync(CLK_FILE, "utf8"); } catch (e) { return 0; } try { const j = JSON.parse(raw); const t = Number(j && j.t) || 0; return (j && j.sig === clkSign(t, deviceId || "")) ? t : -1; } catch (e) { return -1; } }
function clkWrite(t, force) { try { if (!force && clkRead() > t) return; fs.writeFileSync(CLK_FILE, JSON.stringify({ t: t, sig: clkSign(t, deviceId || "") })); } catch (e) {} }
/* offline grace is refused when the PC clock was moved back */
function clockOk() { const m = clkRead(); if (m < 0) return false; if (Date.now() < m - 3600e3) return false; clkWrite(Date.now(), false); return true; }
const graceLeft = (saved) => saved && saved.sigOk && clockOk() && saved.lastOk <= Date.now() + 3600e3 && Date.now() - saved.lastOk < GRACE_MS;

/* ---------- server call ---------- */
function request(key, dev) {
  return new Promise((resolve) => {
    const q = "?action=check&key=" + encodeURIComponent(key) + "&device=" + encodeURIComponent(dev) + "&app=" + encodeURIComponent(APP_NAME);
    const req = https.request({ host: SERVER_HOST, path: SERVER_PATH + q, method: "GET", timeout: 12000, headers: { "User-Agent": "Pariscope/2.0", "Accept": "application/json" } }, (res) => {
      let d = ""; res.setEncoding("utf8");
      res.on("data", (c) => { d += c; if (d.length > 20000) req.destroy(); });
      res.on("end", () => {
        try { const j = JSON.parse(d); if (j && typeof j.status === "string") return resolve({ net: true, json: j }); } catch (e) {}
        resolve({ net: false, message: "Unexpected reply from the licence server." });
      });
    });
    req.on("timeout", () => req.destroy());
    req.on("error", () => resolve({ net: false, message: "Cannot reach the licence server." }));
    req.end();
  });
}

// returns {kind:'ok'} | {kind:'offline',message} | {kind:'denied',status,message}
async function verify(key) {
  const dev = await getDevice();
  const r = await request(key, dev);
  if (!r.net) { st.detail = String(r.message || ""); return { kind: "offline", message: r.message }; }
  const j = r.json;
  if (j.status === "valid") {
    saveLicence(key, Date.now(), dev); clkWrite(Date.now(), true); st.detail = "";
    st.licensed = true; st.status = "valid"; st.message = ""; st.expires = j.expires || null; st.lifetime = !j.expires; // DAYS-LEFT
    return { kind: "ok" };
  }
  if (j.status === "rate_limited" || j.status === "server_error") return { detail: (st.detail = "server said: " + j.status), kind: "offline", message: j.message || "Licence server busy. Try again shortly." };
  return { kind: "denied", status: j.status, message: j.message || "Licence not valid." };
}

function lock(status, message) { st.licensed = false; st.status = status; st.message = message; st.expires = null; st.lifetime = false; }

async function refresh() {
  if (busy) return; busy = true;
  try {
    const dev = await getDevice();
    const saved = loadSaved(dev);
    if (!saved) { lock("locked", "Please enter your licence key."); return; }
    const r = await verify(saved.key);
    if (r.kind === "ok") return;
    if (r.kind === "offline") {
      if (graceLeft(saved)) { st.licensed = true; st.status = "offline_grace"; st.message = "Licence will be re-checked when the internet is back."; }
      else lock("offline", "Cannot verify your licence. Connect this PC to the internet.");
      return;
    }
    if (r.status === "invalid") clearSaved();
    lock(r.status, r.message);
  } catch (e) {
    console.error("licence refresh failed:", e.message);
  } finally { busy = false; schedule(); }
}
function schedule() {
  if (timer) clearTimeout(timer);
  timer = setTimeout(refresh, st.status === "valid" ? RECHECK_OK_MS : RECHECK_RETRY_MS);
}

/* ---------- web part ---------- */
async function init() {
  const dev = await getDevice();
  const saved = loadSaved(dev);
  if (saved && graceLeft(saved)) { st.licensed = true; st.status = "starting"; st.message = ""; } // no flicker on restart; verified right below
  refresh();
}

function publicState() {
  return { licensed: st.licensed, status: st.status, message: st.message, expires: st.expires, lifetime: st.lifetime === true, detail: String(st.detail || ""), device: deviceId ? deviceId.slice(-12) : "" };
}

function attach(app) {
  const express = require("express");
  init();
  const noStore = (res) => res.set("Cache-Control", "no-store");
  app.get("/licence", (req, res) => { noStore(res); res.sendFile(HTML_FILE); });
  app.get("/api/licence/status", (req, res) => { noStore(res); res.json(publicState()); });
  app.post("/api/licence/activate", express.json({ limit: "2kb" }), async (req, res) => {
    noStore(res);
    if (st.status === "valid") return res.json({ ok: true });
    if (Date.now() - lastTry < 2000) return res.json({ ok: false, message: "Please wait a moment and try again." });
    lastTry = Date.now();
    const key = String((req.body && req.body.key) || "").trim().toUpperCase();
    if (!/^[A-Z0-9-]{5,64}$/.test(key)) return res.json({ ok: false, message: "Please enter a valid licence key." });
    try {
      const r = await verify(key);
      if (r.kind === "ok") { schedule(); return res.json({ ok: true }); }
      if (r.kind === "offline") return res.json({ ok: false, message: "Could not reach the licence server. Check the internet connection and try again." });
      return res.json({ ok: false, status: r.status, message: r.message });
    } catch (e) { return res.json({ ok: false, message: "Licence check failed. Try again." }); }
  });
}

function gate(req, res, next) {
  let p;
  try { p = decodeURIComponent(req.path).replace(/\\/g, "/").toLowerCase(); } catch (e) { return res.status(400).end(); }
  if (/^\/licence\.(dat|js)/.test(p)) return res.status(404).end(); // never serve the key file or this module
  if (st.licensed) return next();
  if (p === "/licence-guard.js" || p === "/pariscope-badge.ico" || p === "/favicon.ico") return next();
  noStoreHeader(res);
  if (p.startsWith("/api/")) return res.status(403).json({ error: "licence_required" });
  return res.status(200).sendFile(HTML_FILE);
}
function noStoreHeader(res) { res.set("Cache-Control", "no-store"); }

module.exports = { attach, gate, _t: { st, verify, refresh, loadSaved, getDevice, DATA_FILE } };
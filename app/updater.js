"use strict";
// Pariscope updater: reads the update page, offers the update, downloads + verifies the installer, then starts it.
const fs = require("fs"), path = require("path"), https = require("https"), crypto = require("crypto"), os = require("os");
const { spawn } = require("child_process");
const DATA_DIR = require("./datadir").DATA_DIR;
const MANIFEST_URL = String(process.env.PARISCOPE_UPDATE_URL || "https://velocitytech.top/pariscope.php");
const STATE_FILE = path.join(DATA_DIR, "update-state.json");
const DAY_MS = 24 * 60 * 60 * 1000, CHECK_MS = 3 * 24 * 60 * 60 * 1000, MAX_BYTES = 700 * 1024 * 1024;

function currentVersion() {
  try { const v = fs.readFileSync(path.join(__dirname, "version.txt"), "utf8").replace(/^\uFEFF/, "").trim(); if (/^\d+(\.\d+)*$/.test(v)) return v; } catch (e) {}
  try { return String(JSON.parse(fs.readFileSync(path.join(__dirname, "package.json"), "utf8")).version || "0"); } catch (e) { return "0"; }
}
function cmp(a, b) {
  const x = String(a).split(".").map(Number), y = String(b).split(".").map(Number);
  for (let i = 0; i < Math.max(x.length, y.length); i++) { const d = (x[i] || 0) - (y[i] || 0); if (d) return d > 0 ? 1 : -1; }
  return 0;
}
function readState() { try { return JSON.parse(fs.readFileSync(STATE_FILE, "utf8")) || {}; } catch (e) { return {}; } }
function writeState(s) { try { fs.writeFileSync(STATE_FILE, JSON.stringify(s)); } catch (e) {} }

let info = { latest: "", notes: "", url: "", sha256: "", readme: "", checkedAt: 0, error: "" };
let dl = { busy: false, pct: 0, stage: "", error: "", done: false };

function open(url, hops) {
  return new Promise((resolve, reject) => {
    let u; try { u = new URL(url); } catch (e) { return reject(new Error("bad address")); }
    if (u.protocol !== "https:") return reject(new Error("https is required"));
    const req = https.get(u, { headers: { "User-Agent": "Pariscope-Updater/" + currentVersion(), "Accept": "application/json,*/*" }, timeout: 20000 }, (res) => {
      if ([301, 302, 303, 307, 308].indexOf(res.statusCode) >= 0 && res.headers.location) {
        res.resume();
        if (hops >= 3) return reject(new Error("too many redirects"));
        let nx; try { nx = new URL(res.headers.location, u); } catch (e) { return reject(new Error("bad redirect")); }
        if (nx.hostname !== u.hostname) return reject(new Error("redirect to another site blocked"));
        return resolve(open(nx.href, hops + 1));
      }
      if (res.statusCode !== 200) { res.resume(); return reject(new Error("HTTP " + res.statusCode)); }
      resolve(res);
    });
    req.on("timeout", () => req.destroy(new Error("timeout")));
    req.on("error", reject);
  });
}

async function getManifest() {
  const res = await open(MANIFEST_URL, 0);
  let n = 0; const chunks = [];
  for await (const c of res) { n += c.length; if (n > 100000) { res.destroy(); throw new Error("update page too large"); } chunks.push(c); }
  let j; try { j = JSON.parse(Buffer.concat(chunks).toString("utf8").replace(/^\uFEFF/, "")); } catch (e) { throw new Error("update page is not valid JSON"); }
  if (!j || !/^\d+(\.\d+){1,3}$/.test(String(j.latest || ""))) throw new Error("update page has no valid version");
  const host = new URL(MANIFEST_URL).hostname;
  let u; try { u = new URL(String(j.installer_url || "")); } catch (e) { throw new Error("update page has no installer link"); }
  if (u.protocol !== "https:" || u.hostname !== host) throw new Error("installer link must be on " + host);
  if (!/^[a-f0-9]{64}$/i.test(String(j.sha256 || ""))) throw new Error("update page has no valid sha256");
  let readme = ""; try { const r = new URL(String(j.readme_url || "")); if (r.protocol === "https:" && r.hostname === host) readme = r.href; } catch (e) {}
  return { latest: String(j.latest), notes: String(j.notes || "").slice(0, 600), url: u.href, sha256: String(j.sha256).toLowerCase(), readme: readme };
}

async function check() {
  try { const m = await getManifest(); info = { latest: m.latest, notes: m.notes, url: m.url, sha256: m.sha256, readme: m.readme, checkedAt: Date.now(), error: "" }; }
  catch (e) { info.error = String((e && e.message) || e); info.checkedAt = Date.now(); }
}
const isAvailable = () => !!info.latest && cmp(info.latest, currentVersion()) > 0;

async function install() {
  if (dl.busy) return;
  if (!isAvailable()) throw new Error("No update is available");
  if (process.platform !== "win32") { dl = { busy: false, pct: 0, stage: "", error: "On Linux, update with:  sudo pariscope update   (then the service restarts by itself)", done: false, file: "" }; return; }
  dl = { busy: true, pct: 0, stage: "Downloading...", error: "", done: false, file: "" };
  try {
    const dir = (function () { const home = path.join(os.homedir(), "Downloads"); const c = [fs.existsSync(home) ? home : "", path.join(DATA_DIR, "updates"), path.join(os.tmpdir(), "pariscope-update")]; for (const d of c) { if (!d) continue; try { fs.mkdirSync(d, { recursive: true }); fs.accessSync(d, fs.constants.W_OK); return d; } catch (e) {} } throw new Error("no folder to save the download"); })();
    const file = path.join(dir, "Pariscope-Update-" + info.latest + ".exe");
    try { fs.unlinkSync(file); } catch (e) {}
    let res = null; for (let k = 0; k < 3 && !res; k++) { try { res = await open(info.url, 0); } catch (e) { if (k === 2) throw e; dl.stage = "Connection problem - trying again..."; await new Promise((r) => setTimeout(r, 2500)); } }
    const total = Number(res.headers["content-length"] || 0);
    if (total > MAX_BYTES) throw new Error("installer is too large");
    const hash = crypto.createHash("sha256"), out = fs.createWriteStream(file); let got = 0;
    await new Promise((resolve, reject) => {
      res.on("data", (c) => { got += c.length; if (got > MAX_BYTES) { res.destroy(new Error("installer is too large")); return; } hash.update(c); if (total) dl.pct = Math.floor(got * 100 / total); });
      res.on("error", reject); out.on("error", reject); out.on("finish", resolve);
      res.pipe(out);
    });
    dl.stage = "Checking the download...";
    if (hash.digest("hex") !== info.sha256) { try { fs.unlinkSync(file); } catch (e) {} throw new Error("checksum does not match - download deleted"); }
    const fd = fs.openSync(file, "r"); const b = Buffer.alloc(2); fs.readSync(fd, b, 0, 2, 0); fs.closeSync(fd);
    if (b.toString("latin1") !== "MZ" || got < 1024 * 1024) { try { fs.unlinkSync(file); } catch (e) {} throw new Error("downloaded file is not an installer"); }
    dl.stage = "Saving the verified update..."; dl.pct = 100; dl.file = file;
    dl.stage = "Starting the installer..."; dl.pct = 100; dl.file = file;
    const startErr = await new Promise((resolve) => {
      let fin = false; const end = (v) => { if (!fin) { fin = true; resolve(v); } };
      try {
        const viaShell = () => { try { const q = spawn(process.env.ComSpec || "cmd.exe", ["/d", "/c", "start", "", file, "/SILENT", "/SUPPRESSMSGBOXES", "/NORESTART", "/CLOSEAPPLICATIONS"], { detached: true, stdio: "ignore", windowsHide: true }); q.on("error", (e2) => end(String((e2 && e2.message) || e2))); q.on("spawn", () => setTimeout(() => end(""), 1500)); q.unref(); } catch (e3) { end(String((e3 && e3.message) || e3)); } }; const p = spawn(file, ["/SILENT", "/SUPPRESSMSGBOXES", "/NORESTART", "/CLOSEAPPLICATIONS"], { detached: true, stdio: "ignore" });
        p.on("error", () => viaShell());
        p.on("spawn", () => setTimeout(() => end(""), 1500));
        p.unref();
      } catch (e) { end(String((e && e.message) || e)); }
      setTimeout(() => end(""), 5000);
    });
    if (startErr) throw new Error("could not start the installer (" + startErr + "). The checked file is saved here, open it by hand: " + file);
    dl.done = true; dl.busy = false; dl.stage = "Installer started";
  } catch (e) { dl.error = String((e && e.message) || e); dl.busy = false; }
}

function attach(app) {
  const local = (req) => { const a = (req.socket && req.socket.remoteAddress) || ""; return a === "127.0.0.1" || a === "::1" || a === "::ffff:127.0.0.1"; };
  const guard = (req, res, next) => {
    if (!local(req)) return res.status(403).json({ error: "Only on the computer running Pariscope" });
    if (req.get("x-pariscope-update") !== "1") return res.status(400).json({ error: "Bad request" });
    next();
  };
  app.get("/api/update/status", (req, res) => {
    res.set("Cache-Control", "no-store");
    const st = readState(), av = isAvailable();
    res.json({ current: currentVersion(), latest: info.latest, available: av, notes: info.notes, readme: info.readme, url: info.url, checkedAt: info.checkedAt, error: info.error, popup: av && !(st.snoozedUntil > Date.now()), local: local(req) });
  });
  app.get("/api/update/progress", (req, res) => { res.set("Cache-Control", "no-store"); res.json({ busy: dl.busy, pct: dl.pct, stage: dl.stage, error: dl.error, done: dl.done, file: dl.file || "" }); });
  app.post("/api/update/later", guard, (req, res) => { const st = readState(); st.snoozedUntil = Date.now() + DAY_MS; writeState(st); res.json({ ok: true }); });
  app.post("/api/update/check", guard, async (req, res) => { await check(); res.json({ ok: true, latest: info.latest, error: info.error }); });
  app.post("/api/update/install", guard, (req, res) => {
    if (!isAvailable()) return res.status(409).json({ error: "No update is available" });
    install(); res.json({ ok: true });
  });
  setTimeout(check, 15000).unref();
  setInterval(check, CHECK_MS).unref();
  console.log("[updater] ready, version " + currentVersion());
}
module.exports = { attach };
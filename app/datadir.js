"use strict";
// Pariscope 0.9 - where the user's DATA lives (links, licence, alert settings, WhatsApp login, logs).
// The installer writes the chosen folder into pariscope-data.txt (next to this file).
// Order: PARISCOPE_DATA environment variable > pariscope-data.txt > the program folder (old behaviour).
const fs = require("fs");
const path = require("path");

let dir = String(process.env.PARISCOPE_DATA || "").trim();
if (!dir) {
  try { dir = fs.readFileSync(path.join(__dirname, "pariscope-data.txt"), "utf8").replace(/^\uFEFF/, "").trim(); }
  catch (e) { dir = ""; }
}
if (!dir || !path.isAbsolute(dir)) dir = __dirname;
try {
  fs.mkdirSync(dir, { recursive: true });
  const t = path.join(dir, ".write-test");
  fs.writeFileSync(t, "x"); fs.unlinkSync(t);
} catch (e) {
  console.error("[data] cannot use data folder " + dir + " (" + e.message + ") - using the program folder instead");
  dir = __dirname;
}
console.log("[data] data folder: " + dir);

module.exports = { DATA_DIR: dir, file: (name) => path.join(dir, name) };

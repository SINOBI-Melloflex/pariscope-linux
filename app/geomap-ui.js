(function () {
"use strict";
if (window.__gmLoaded) return; window.__gmLoaded = 1;
var tok = "";
try { var _f = window.fetch; if (_f) window.fetch = function (u, o) { try { var hd = o && o.headers, t = hd && (typeof hd.get === "function" ? hd.get("x-manage-token") : hd["x-manage-token"]); if (t && !window.__gmLock) tok = t; } catch (e) {} return _f.apply(this, arguments); }; } catch (e) {}
var COL = { up: "#22e58b", down: "#ff3b5c", flap: "#ff4fa3", unk: "#7b8798" };
var TYPES = [["fiber", "Fiber", "FB"], ["onu", "ONU", "ON"], ["tj", "TJ box", "TJ"], ["switch", "Switch", "SW"], ["box", "Box", "BX"], ["server", "Server", "SV"], ["olt", "OLT", "OL"], ["other", "Other", "--"]];
function tinfo(t) { for (var i = 0; i < TYPES.length; i++) if (TYPES[i][0] === t) return TYPES[i]; return TYPES[7]; }
var S = { open: false, map: null, mapReady: false, nodes: [], snmp: [], snmpSt: {}, geo: { links: {} }, rev: 0, pings: {}, admin: false, edit: false, sel: null, q: "", openCats: {}, spin: true, mode: "sat", pick: null, markers: {}, ptMarkers: [], ptSig: "", listSig: "", timers: [], saving: false, popup: null };
function h(t, a, c) { var e = document.createElement(t); if (a) for (var k in a) { if (k === "class") e.className = a[k]; else if (k === "text") e.textContent = a[k]; else if (k === "html") e.innerHTML = a[k]; else if (k === "on") { for (var ev in a.on) e.addEventListener(ev, a.on[ev]); } else e.setAttribute(k, a[k]); } (c || []).forEach(function (x) { if (x) e.appendChild(x); }); return e; }
function api(p, o) { o = o || {}; o.cache = "no-store"; return fetch(p, o).then(function (r) { return r.json().then(function (j) { j.__status = r.status; return j; }); }); }
function cls(s) { s = String(s || "").toUpperCase(); if (/FLAP/.test(s)) return "flap"; if (/DOWN|OFFLINE|TIMEOUT|CRIT|FAIL/.test(s)) return "down"; if (/ONLINE|^UP$|^OK$|ALIVE/.test(s)) return "up"; return "unk"; }
function r6(v) { return Math.round(v * 1e6) / 1e6; }
function parseLL0(s) { var m = String(s || "").match(/(-?\d+(?:\.\d+)?)\s*[, ]\s*(-?\d+(?:\.\d+)?)/); if (!m) return null; var la = +m[1], lo = +m[2]; if (!(la >= -90 && la <= 90 && lo >= -180 && lo <= 180)) return null; return { lat: r6(la), lng: r6(lo) }; }
function gUrl(la, lo) { return "https://www.google.com/maps?q=" + la + "," + lo + "&z=19"; }
function eUrl(la, lo) { return "https://earth.google.com/web/@" + la + "," + lo + ",0a,500d,35y,0h,45t,0r"; }
function walk(o, out, d) { if (!o || typeof o !== "object" || d > 6) return; if (Array.isArray(o)) { o.forEach(function (x) { walk(x, out, d + 1); }); return; } if (typeof o.ip === "string" && typeof o.status === "string") { out.push(o); return; } Object.keys(o).forEach(function (k) { if (k === "snmpDevices") return; walk(o[k], out, d + 1); }); }
function snmpCls(d) { var s = S.snmpSt[d.id]; if (s) return s; var g = S.pings[d.host]; if (g) return g.alive ? "up" : "down"; return "unk"; }
function items() {
  var arr = [], seen = {};
  S.nodes.forEach(function (n) { var k = "L:" + n.ip; if (seen[k]) return; seen[k] = 1; arr.push({ key: k, kind: "link", name: n.name || n.ip, ip: n.ip, cat: n.categoryName || "Links", st: cls(n.status) }); });
  S.snmp.forEach(function (d) { var k = "S:" + d.id; arr.push({ key: k, kind: "snmp", id: d.id, name: d.name || d.host, ip: d.host, cat: "SNMP devices", st: snmpCls(d) }); });
  return arr;
}
function itemByKey(k) { var a = items(); for (var i = 0; i < a.length; i++) if (a[i].key === k) return a[i]; return null; }
function toast(msg, bad) { if (!S.toastEl) return; S.toastEl.textContent = msg; S.toastEl.className = "gm-toast on" + (bad ? " bad" : ""); clearTimeout(S.tt); S.tt = setTimeout(function () { S.toastEl.className = "gm-toast"; }, 3200); }
var CSS = "" +
"#gm-open{position:fixed;right:40px;bottom:92px;z-index:9000;display:flex;align-items:center;gap:8px;padding:12px 20px;border-radius:999px;border:1px solid rgba(245,196,81,.55);background:linear-gradient(135deg,rgba(38,30,10,.95),rgba(12,16,34,.95));color:#f5c451;font:800 13px/1 system-ui,Segoe UI,sans-serif;letter-spacing:.4px;cursor:pointer;box-shadow:0 8px 30px rgba(0,0,0,.55),0 0 24px rgba(245,196,81,.2);transition:.2s}" +
"#gm-open:hover{transform:translateY(-2px);box-shadow:0 12px 36px rgba(0,0,0,.6),0 0 34px rgba(245,196,81,.38)}" +
"#gm-ov{position:fixed;inset:0;z-index:99990;display:none;background:radial-gradient(ellipse at 25% 0%,#0c1634,#02040a 70%);color:#e8edf7;font-family:system-ui,Segoe UI,sans-serif}" +
"#gm-ov.on{display:flex;flex-direction:column}" +
".gm-top{display:flex;align-items:center;gap:10px;padding:12px 18px;border-bottom:1px solid rgba(245,196,81,.28);background:rgba(6,10,24,.92)}" +
".gm-ti{font:800 20px system-ui;color:#f5c451;letter-spacing:.3px}.gm-su{font-size:12px;color:#8ea0c4;margin-left:6px}.gm-sp{flex:1}" +
".gm-chip{display:flex;align-items:center;gap:7px;padding:8px 13px;border-radius:12px;border:1px solid rgba(255,255,255,.1);background:rgba(255,255,255,.04);font:700 12px system-ui}" +
".gm-chip i{width:8px;height:8px;border-radius:50%;background:var(--c)}" +
".gm-b{display:inline-block;padding:9px 14px;border-radius:12px;border:1px solid rgba(255,255,255,.14);background:rgba(255,255,255,.05);color:#e8edf7;font:700 12px system-ui;cursor:pointer;text-decoration:none;transition:.15s}" +
".gm-b:hover{border-color:#f5c451;color:#f5c451}.gm-b.on{border-color:#f5c451;color:#f5c451;background:rgba(245,196,81,.12)}.gm-b.gold{background:linear-gradient(135deg,#f5c451,#d69e2e);color:#1a1405;border-color:transparent}" +
".gm-body{flex:1;display:flex;min-height:0}" +
".gm-tray{width:350px;flex:none;display:flex;flex-direction:column;border-right:1px solid rgba(255,255,255,.08);background:rgba(7,11,26,.94);min-height:0}" +
".gm-sc{padding:12px}.gm-in{width:100%;box-sizing:border-box;padding:10px 12px;border-radius:12px;border:1px solid rgba(255,255,255,.12);background:rgba(255,255,255,.04);color:#e8edf7;font:13px system-ui;outline:none}.gm-in:focus{border-color:#f5c451}" +
".gm-scr{flex:1;overflow:auto;padding:0 12px 14px;min-height:0}" +
".gm-cat{display:flex;align-items:center;gap:8px;margin:12px 0 4px;padding:9px 12px;border-radius:12px;background:rgba(245,196,81,.07);border:1px solid rgba(245,196,81,.25);color:#f5c451;font:800 12px system-ui;cursor:pointer;letter-spacing:.4px;text-transform:uppercase}" +
".gm-cat .gm-n{margin-left:auto;font-weight:700;color:#8ea0c4}.gm-cat .gm-bad{background:#ff3b5c;color:#fff;border-radius:99px;padding:1px 8px;font-size:11px}" +
".gm-row{display:flex;align-items:center;gap:10px;padding:10px 12px;margin:6px 0;border-radius:12px;border:1px solid rgba(255,255,255,.08);background:rgba(255,255,255,.035);cursor:pointer;transition:.15s}" +
".gm-row:hover{border-color:rgba(245,196,81,.55);background:rgba(245,196,81,.07)}.gm-row small{display:block;color:#8ea0c4;font-size:11px;margin-top:2px}.gm-row b{font-size:13px}" +
".gm-d{width:10px;height:10px;border-radius:50%;flex:none;background:var(--c,#7b8798);box-shadow:0 0 10px var(--c,#7b8798)}" +
".gm-tag{margin-left:auto;font-size:10px;color:#f5c451;border:1px solid rgba(245,196,81,.4);border-radius:99px;padding:2px 8px;white-space:nowrap}" +
".gm-hd{display:flex;align-items:center;gap:10px;margin:12px 0;padding:12px;border-radius:14px;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.1)}.gm-hn{flex:1;min-width:0}.gm-hn b{display:block;font-size:15px}.gm-hn small{color:#8ea0c4;font-size:11px}" +
".gm-pill{font:800 10px system-ui;padding:4px 10px;border-radius:99px;background:var(--c);color:#06101c}" +
".gm-card{margin:10px 0;padding:12px;border-radius:14px;background:rgba(255,255,255,.035);border:1px solid rgba(255,255,255,.09)}.gm-k{font:800 10px system-ui;letter-spacing:.7px;color:#f5c451;text-transform:uppercase;margin-bottom:6px}.gm-v{font:600 13px ui-monospace,Consolas,monospace;margin-bottom:8px}" +
".gm-note{color:#8ea0c4;font-size:12px;line-height:1.5}.gm-r{display:flex;gap:8px;flex-wrap:wrap;margin-top:8px}.gm-f{display:flex;flex-direction:column;gap:8px}.gm-f select{background:#0b1226;color:#e8edf7}" +
".gm-x{margin-left:auto;border:0;background:rgba(255,59,92,.15);color:#ff6b86;border-radius:8px;padding:4px 9px;cursor:pointer;font:700 12px system-ui}" +
".gm-chipt{font:800 10px system-ui;background:var(--c,#7b8798);color:#06101c;border-radius:8px;padding:4px 6px;min-width:20px;text-align:center}" +
".gm-mapw{flex:1;position:relative;min-width:0}.gm-map,.gm-map.maplibregl-map{position:absolute!important;inset:0;width:100%;height:100%}" +
".gm-leg{position:absolute;left:14px;bottom:30px;z-index:5;padding:10px 14px;border-radius:14px;background:rgba(6,10,24,.85);border:1px solid rgba(255,255,255,.1);font:600 11px system-ui;display:flex;gap:14px}.gm-leg span{display:flex;align-items:center;gap:6px}.gm-leg i{width:9px;height:9px;border-radius:50%;background:var(--c)}" +
".gm-toast{position:absolute;top:16px;left:50%;transform:translateX(-50%) translateY(-20px);z-index:6;padding:10px 18px;border-radius:99px;background:rgba(8,14,32,.95);border:1px solid #f5c451;color:#f5c451;font:700 12px system-ui;opacity:0;pointer-events:none;transition:.25s}.gm-toast.on{opacity:1;transform:translateX(-50%)}.gm-toast.bad{border-color:#ff3b5c;color:#ff6b86}" +
".gm-mk{width:0;height:0;cursor:pointer}.gm-mk .gm-dot{position:absolute;left:-8px;top:-8px;width:16px;height:16px;border-radius:50%;background:var(--c);border:2px solid #fff;box-shadow:0 0 14px var(--c),0 2px 8px rgba(0,0,0,.6);transition:transform .2s}.gm-mk.sel .gm-dot{transform:scale(1.4)}" +
".gm-mk .gm-pulse{position:absolute;left:-18px;top:-18px;width:36px;height:36px;border-radius:50%;background:var(--c);opacity:.35;animation:gmp 2s ease-out infinite}@keyframes gmp{0%{transform:scale(.4);opacity:.6}100%{transform:scale(1.5);opacity:0}}" +
".gm-lb{position:absolute;left:0;top:12px;transform:translateX(-50%);white-space:nowrap;font:700 11px system-ui;color:#fff;text-shadow:0 1px 4px #000,0 0 8px #000;pointer-events:none}.gm-pt .gm-lb{top:17px}" +
".gm-pt .gm-pdot{position:absolute;left:-12px;top:-12px;width:24px;height:24px;border-radius:8px;background:var(--c);color:#04101a;font:800 9px/20px system-ui;text-align:center;border:2px solid #fff;box-shadow:0 0 12px var(--c);box-sizing:border-box}" +
".gm-pop .maplibregl-popup-content{background:#0b1226;color:#e8edf7;border:1px solid rgba(245,196,81,.5);border-radius:14px;padding:14px;font-family:system-ui;box-shadow:0 12px 40px rgba(0,0,0,.6)}.gm-pop .maplibregl-popup-tip{border-top-color:#0b1226;border-bottom-color:#0b1226}.gm-pop .maplibregl-popup-close-button{color:#8ea0c4;font-size:18px}" +
"body.gm-on>*:not(#gm-ov):not(#gm-sig){visibility:hidden!important}" + "#gm-sig{position:fixed;left:50%;bottom:3px;transform:translateX(-50%);z-index:2147483000;pointer-events:none;font:600 10.5px system-ui,Segoe UI,sans-serif;letter-spacing:.5px;color:rgba(245,196,81,.75);text-shadow:0 1px 3px #000;white-space:nowrap}";
function injectCss() { if (document.getElementById("gm-css")) return; var s = h("style", { id: "gm-css" }); s.textContent = CSS; document.head.appendChild(s); }
function loadLib(cb) {
  if (window.maplibregl) return cb();
  if (!document.getElementById("gm-ml-css")) { var l = h("link", { id: "gm-ml-css", rel: "stylesheet", href: "/maplibre-gl.css" }); document.head.appendChild(l); }
  var sc = h("script", { src: "/maplibre-gl.js" });
  sc.onload = function () { cb(); }; sc.onerror = function () { toast("3D map engine file is missing. Run the update again.", true); };
  document.head.appendChild(sc);
}
function styleSpec() {
  return { version: 8, projection: { type: "globe" }, sources: {
    sat: { type: "raster", tiles: ["https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"], tileSize: 256, maxzoom: 19, attribution: "Imagery &copy; Esri, Maxar, Earthstar Geographics" },
    lbl: { type: "raster", tiles: ["https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}"], tileSize: 256, maxzoom: 19 },
    osm: { type: "raster", tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"], tileSize: 256, maxzoom: 19, attribution: "&copy; OpenStreetMap contributors" } },
    layers: [{ id: "bg", type: "background", paint: { "background-color": "#02040a" } }, { id: "sat", type: "raster", source: "sat" }, { id: "lbl", type: "raster", source: "lbl" }, { id: "osm", type: "raster", source: "osm", layout: { visibility: "none" } }] };
}
function setMode(m) { S.mode = m; if (!S.map || !S.mapReady) return; var sat = m === "sat"; S.map.setLayoutProperty("sat", "visibility", sat ? "visible" : "none"); S.map.setLayoutProperty("lbl", "visibility", sat ? "visible" : "none"); S.map.setLayoutProperty("osm", "visibility", sat ? "none" : "visible"); if (S.btnMode) S.btnMode.textContent = sat ? "Street map" : "Satellite"; }
function initMap() {
  var m = new maplibregl.Map({ container: S.mapEl, style: styleSpec(), center: [90.4, 23.8], zoom: 1.6, pitch: 0, attributionControl: { compact: true } });
  S.map = m; try { m.setMaxPitch(80); } catch (e) {} setTimeout(function () { try { m.resize(); } catch (e) {} }, 400); setTimeout(function () { try { m.resize(); } catch (e) {} }, 1500); m.addControl(new maplibregl.NavigationControl({ visualizePitch: true }), "top-right");
  m.on("load", function () {
    try { m.addSource("ofm", { type: "vector", url: "https://tiles.openfreemap.org/planet", attribution: '<a href="https://openfreemap.org" target="_blank">OpenFreeMap</a> &copy; OpenMapTiles Data from <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a>' }); m.addLayer({ id: "gm-bld", type: "fill-extrusion", source: "ofm", "source-layer": "building", minzoom: 14, paint: { "fill-extrusion-color": ["interpolate", ["linear"], ["coalesce", ["get", "render_height"], 8], 0, "#5b7bb5", 40, "#8fb2ff", 120, "#f5c451"], "fill-extrusion-height": ["coalesce", ["get", "render_height"], 8], "fill-extrusion-base": ["coalesce", ["get", "render_min_height"], 0], "fill-extrusion-opacity": 0.7 } }); } catch (e) {}
m.addSource("gm-lines", { type: "geojson", data: { type: "FeatureCollection", features: [] } });
    m.addLayer({ id: "gm-glow", type: "line", source: "gm-lines", paint: { "line-color": ["get", "c"], "line-width": 9, "line-opacity": 0.25, "line-blur": 4 } });
    m.addLayer({ id: "gm-line", type: "line", source: "gm-lines", paint: { "line-color": ["get", "c"], "line-width": 3 } });
    S.mapReady = true; setMode(S.mode); tick();
  });
  m.on("click", function (e) { if (S.pick) { var f = S.pick; S.pick = null; S.mapEl.style.cursor = ""; f(e.lngLat); } });
  m.on("error", function (ev) { try { var ms = String((ev && ev.error && ev.error.message) || ""); if (/webgl|context|style|worker/i.test(ms)) toast("Map error: " + ms, true); } catch (e) {} }); m.on("dragstart", function () { if (S.spin) { S.spin = false; spinBtn(); } });
}
function spinBtn() { if (S.btnSpin) { S.btnSpin.textContent = S.spin ? "Spin: On" : "Spin: Off"; S.btnSpin.className = "gm-b" + (S.spin ? " on" : ""); } }
function startPick(cb) { S.pick = cb; S.mapEl.style.cursor = "crosshair"; toast("Click the exact spot on the map"); }
function ensureEntry(it) { var g = S.geo.links[it.key]; if (!g) g = S.geo.links[it.key] = { lat: null, lng: null, name: it.name, ip: it.kind === "snmp" ? (it.ip || "") : "", points: [] }; if (!g.points) g.points = []; return g; }
function saveGeo() {
  if (S.saving) { S.again = true; return; } S.saving = true;
  fetch("/api/geomap", { method: "POST", headers: { "Content-Type": "application/json", "x-manage-token": tok }, body: JSON.stringify({ rev: S.rev, data: S.geo }) })
    .then(function (r) { return r.json().then(function (j) { return { s: r.status, j: j }; }); })
    .then(function (x) { S.saving = false; if (x.s === 200 && x.j.ok) { S.rev = x.j.rev; toast("Saved"); } else if (x.s === 409) { toast("Changed elsewhere - reloading", true); pullGeo(true); } else toast((x.j && x.j.error) || "Could not save", true); if (S.again) { S.again = false; saveGeo(); } })
    .catch(function () { S.saving = false; toast("Could not save", true); });
}
function pullGeo(force) { if (S.saving && !force) return; api("/api/geomap").then(function (j) { if (j && j.ok && (force || j.rev !== S.rev)) { S.geo = j.data && j.data.links ? j.data : { links: {} }; S.rev = j.rev; S.listSig = ""; S.ptSig = ""; tick(); if (S.sel) renderDetail(); } }).catch(function () {}); }
function pullStatus() {
  api("/api/status").then(function (j) {
    var out = []; walk(j, out, 0); S.nodes = out; var sm = {}, arr = Array.isArray(j.snmpDevices) ? j.snmpDevices : [];
    arr.forEach(function (d) { var c = null; if (typeof d.status === "string") c = cls(d.status); else if (typeof d.state === "string") c = cls(d.state); else if (typeof d.up === "boolean") c = d.up ? "up" : "down"; else if (typeof d.online === "boolean") c = d.online ? "up" : "down"; if (c && c !== "unk") sm[d.id] = c; });
    S.snmpSt = sm; if (arr.length) S.snmp = arr; tick();
  }).catch(function () {});
}
function pullSnmp() { if (S.snmp.length) return; api("/api/snmp-view/devices").then(function (j) { if (j && Array.isArray(j.devices)) { S.snmp = j.devices; tick(); } }).catch(function () {}); }
function pullPings() { api("/api/geomap/pings").then(function (j) { if (j && j.pings) { S.pings = j.pings; tick(); } }).catch(function () {}); }
function pullRole() { api("/api/geomap/role", { headers: { "x-manage-token": tok } }).then(function (j) { var a = !!(j && j.canSave); if (a !== S.admin) { S.admin = a; if (!a) S.edit = false; updateTop(); if (S.sel) renderDetail(); renderMarkers(); } }).catch(function () {}); }
function ptCls(ls, p) { if (ls === "down") return "down"; if (ls === "flap") return "flap"; if (p.ip) { var g = S.pings[p.ip]; if (!g) return "unk"; return g.alive ? "up" : "down"; } return ls === "up" ? "up" : "unk"; }
function tick() { updateChips(); renderList(); renderMarkers(); paintDetail(); updateLines(); }
function updateChips() { var c = { up: 0, down: 0, flap: 0 }; items().forEach(function (i) { if (c[i.st] !== undefined) c[i.st]++; }); if (S.chips) { S.chips.up.textContent = "Online " + c.up; S.chips.down.textContent = "Down " + c.down; S.chips.flap.textContent = "Flapping " + c.flap; } }
function rank(s) { return s === "down" ? 0 : s === "flap" ? 1 : s === "unk" ? 2 : 3; }
function renderList() {
  if (S.sel || !S.listEl) return;
  var its = items(), q = S.q.toLowerCase();
  var sig = JSON.stringify([q, S.openCats, its.map(function (i) { var g = S.geo.links[i.key]; return [i.key, i.st, i.name, !!(g && g.lat != null)]; })]);
  if (sig === S.listSig) return; S.listSig = sig;
  var cats = {}; its.forEach(function (i) { if (q && (i.name + " " + i.ip + " " + i.cat).toLowerCase().indexOf(q) < 0) return; (cats[i.cat] = cats[i.cat] || []).push(i); });
  var names = Object.keys(cats), dc = function (a) { return a.filter(function (x) { return x.st === "down"; }).length; };
  names.sort(function (a, b) { return dc(cats[b]) - dc(cats[a]) || a.localeCompare(b); });
  var top = S.listEl.scrollTop; S.listEl.innerHTML = "";
  if (!names.length) S.listEl.appendChild(h("div", { class: "gm-note", text: "No links found." }));
  names.forEach(function (n) {
    var arr = cats[n].slice().sort(function (a, b) { return rank(a.st) - rank(b.st) || a.name.localeCompare(b.name); });
    var open = q ? true : S.openCats[n] !== false, bad = dc(arr);
    var head = h("div", { class: "gm-cat", on: { click: function () { S.openCats[n] = !open; S.listSig = ""; renderList(); } } }, [h("span", { text: open ? "\u25BE" : "\u25B8" }), h("span", { text: n }), h("span", { class: "gm-n", text: String(arr.length) }), bad ? h("span", { class: "gm-bad", text: String(bad) }) : null]);
    S.listEl.appendChild(head);
    if (open) arr.forEach(function (i) {
      var g = S.geo.links[i.key], has = g && g.lat != null, d = h("span", { class: "gm-d" }); d.style.setProperty("--c", COL[i.st]);
      S.listEl.appendChild(h("div", { class: "gm-row", on: { click: function () { selectLink(i.key, true); } } }, [d, h("div", {}, [h("b", { text: i.name }), h("small", { text: i.ip || "" })]), has ? null : h("span", { class: "gm-tag", text: "no location" })]));
    });
  });
  S.listEl.scrollTop = top;
}
function renderMarkers() {
  if (!S.map || !S.mapReady) return;
  var its = items(), keep = {};
  its.forEach(function (it) {
    var g = S.geo.links[it.key]; if (!g || g.lat == null || g.lng == null) return; keep[it.key] = 1;
    var m = S.markers[it.key];
    if (!m) {
      var el = h("div", { class: "gm-mk" }); el.innerHTML = '<i class="gm-pulse"></i><i class="gm-dot"></i><b class="gm-lb"></b>';
      el.addEventListener("click", function (ev) { ev.stopPropagation(); selectLink(it.key, true); });
      var mk = new maplibregl.Marker({ element: el, draggable: false }).setLngLat([g.lng, g.lat]).addTo(S.map);
      mk.on("dragend", function () { var p = mk.getLngLat(), gg = S.geo.links[it.key]; if (!gg) return; gg.lat = r6(p.lat); gg.lng = r6(p.lng); saveGeo(); if (S.sel === it.key) renderDetail(); });
      m = S.markers[it.key] = { mk: mk, el: el };
    }
    m.el.style.setProperty("--c", COL[it.st]); m.el.querySelector(".gm-lb").textContent = it.name;
    m.el.classList.toggle("sel", S.sel === it.key);
    var drag = !!(S.admin && S.edit && S.sel === it.key); if (m.mk.isDraggable() !== drag) m.mk.setDraggable(drag);
    var ll = m.mk.getLngLat(); if (!drag && (Math.abs(ll.lat - g.lat) > 1e-7 || Math.abs(ll.lng - g.lng) > 1e-7)) m.mk.setLngLat([g.lng, g.lat]);
  });
  Object.keys(S.markers).forEach(function (k) { if (!keep[k]) { S.markers[k].mk.remove(); delete S.markers[k]; } });
  var sel = S.sel && S.geo.links[S.sel], sig = sel ? S.sel + "|" + S.edit + S.admin + JSON.stringify(sel.points) : "";
  if (sig !== S.ptSig) {
    S.ptSig = sig; S.ptMarkers.forEach(function (x) { x.mk.remove(); }); S.ptMarkers = [];
    if (sel) (sel.points || []).forEach(function (p) {
      var ti = tinfo(p.type), el = h("div", { class: "gm-mk gm-pt" }); el.innerHTML = '<i class="gm-pdot"></i><b class="gm-lb"></b>';
      el.querySelector(".gm-pdot").textContent = ti[2]; el.querySelector(".gm-lb").textContent = p.name || ti[1];
      el.addEventListener("click", function (ev) { ev.stopPropagation(); focusPoint(p); });
      var mk = new maplibregl.Marker({ element: el, draggable: !!(S.admin && S.edit) }).setLngLat([p.lng, p.lat]).addTo(S.map);
      mk.on("dragend", function () { var ll = mk.getLngLat(); p.lat = r6(ll.lat); p.lng = r6(ll.lng); S.ptSig = S.sel + "|" + S.edit + S.admin + JSON.stringify(sel.points); saveGeo(); renderDetail(); updateLines(); });
      S.ptMarkers.push({ mk: mk, el: el, p: p });
    });
  }
  var it2 = S.sel && itemByKey(S.sel);
  S.ptMarkers.forEach(function (x) { x.el.style.setProperty("--c", COL[ptCls(it2 ? it2.st : "unk", x.p)]); });
}
function updateLines() {
  if (!S.map || !S.mapReady) return; var src = S.map.getSource("gm-lines"); if (!src) return;
  var feats = [], it = S.sel && itemByKey(S.sel), g = S.sel && S.geo.links[S.sel];
  if (it && g && g.lat != null) { var prev = [g.lng, g.lat]; (g.points || []).forEach(function (p) { var cur = [p.lng, p.lat]; feats.push({ type: "Feature", properties: { c: COL[ptCls(it.st, p)] }, geometry: { type: "LineString", coordinates: [prev, cur] } }); prev = cur; }); }
  src.setData({ type: "FeatureCollection", features: feats });
}
function selectLink(key, fly) {
  S.sel = key; S.spin = false; spinBtn(); if (S.popup) { S.popup.remove(); S.popup = null; }
  S.listWrap.style.display = "none"; S.detEl.style.display = "block"; S.ptSig = "x"; renderDetail(); renderMarkers(); updateLines();
  var g = S.geo.links[key];
  if (g && g.lat != null && fly && S.map) {
    var pts = g.points || [];
    if (pts.length) { var b = new maplibregl.LngLatBounds([g.lng, g.lat], [g.lng, g.lat]); pts.forEach(function (p) { b.extend([p.lng, p.lat]); }); S.map.fitBounds(b, { padding: { top: 120, bottom: 120, left: 80, right: 80 }, maxZoom: 17, pitch: 55, duration: 2200 }); }
    else S.map.flyTo({ center: [g.lng, g.lat], zoom: 16, pitch: 55, bearing: -15, duration: 2400 });
  } else toast(S.admin ? "No location yet - press Edit locations and set it" : "This link has no location yet", false);
}
function backToGlobe() {
  S.sel = null; S.pick = null; if (S.popup) { S.popup.remove(); S.popup = null; } S.detEl.style.display = "none"; S.listWrap.style.display = "flex"; S.listSig = ""; S.ptSig = "x";
  renderList(); renderMarkers(); updateLines();
  if (S.map) S.map.flyTo({ center: [S.map.getCenter().lng, 20], zoom: 1.6, pitch: 0, bearing: 0, duration: 2200 }); S.spin = true; spinBtn();
}
function focusPoint(p) {
  if (!S.map) return; S.map.flyTo({ center: [p.lng, p.lat], zoom: 18, pitch: 60, duration: 1800 });
  if (S.popup) S.popup.remove(); var ti = tinfo(p.type), it = S.sel && itemByKey(S.sel), c = ptCls(it ? it.st : "unk", p), pg = p.ip && S.pings[p.ip];
  var node = h("div", {}, [h("div", { class: "gm-k", text: ti[1] }), h("div", { style: "font:800 15px system-ui;margin-bottom:6px", text: p.name || ti[1] }),
    h("div", { class: "gm-note", text: (p.ip ? "IP " + p.ip + (pg && pg.alive && pg.ms != null ? " \u2022 " + pg.ms + " ms" : "") : "No IP (follows main link)") }),
    h("div", { class: "gm-v", style: "margin-top:6px", text: p.lat.toFixed(6) + ", " + p.lng.toFixed(6) }), h("div", { class: "gm-pill", style: "display:inline-block;--c:" + COL[c], text: c === "up" ? "ONLINE" : c === "down" ? "DOWN" : c === "flap" ? "FLAPPING" : "UNKNOWN" }), btnRow(p.lat, p.lng)]);
  S.popup = new maplibregl.Popup({ offset: 22, className: "gm-pop", maxWidth: "280px" }).setLngLat([p.lng, p.lat]).setDOMContent(node).addTo(S.map);
}
function btnRow0(la, lo) { return h("div", { class: "gm-r" }, [h("a", { class: "gm-b", href: gUrl(la, lo), target: "_blank", rel: "noopener", text: "Open in Google Maps" }), h("a", { class: "gm-b", href: eUrl(la, lo), target: "_blank", rel: "noopener", text: "Google Earth" })]); }
function renderDetail0() {
  var box = S.detEl; if (!box) return; box.innerHTML = ""; var it = itemByKey(S.sel);
  if (!it) { box.appendChild(h("button", { class: "gm-b", text: "\u2190 All links", on: { click: backToGlobe } })); box.appendChild(h("div", { class: "gm-note", style: "margin-top:12px", text: "This link is not available any more." })); return; }
  var g = S.geo.links[it.key], edit = S.admin && S.edit;
  box.appendChild(h("button", { class: "gm-b", text: "\u2190 All links", on: { click: backToGlobe } }));
  box.appendChild(h("div", { class: "gm-hd" }, [h("span", { class: "gm-d", "data-st": "1" }), h("div", { class: "gm-hn" }, [h("b", { text: it.name }), h("small", { text: (it.ip || "") + " \u2022 " + it.cat })]), h("span", { class: "gm-pill", "data-pill": "1" })]));
  var loc = h("div", { class: "gm-card" }); loc.appendChild(h("div", { class: "gm-k", text: "Link location" }));
  if (g && g.lat != null) { loc.appendChild(h("div", { class: "gm-v", text: g.lat.toFixed(6) + ", " + g.lng.toFixed(6) })); loc.appendChild(btnRow(g.lat, g.lng)); }
  else loc.appendChild(h("div", { class: "gm-note", text: S.admin ? "No location yet." : "No location yet. The admin can set the Lat/Long after logging in from MANAGE." }));
  if (edit) {
    var inp = h("input", { class: "gm-in", placeholder: "Lat, Long  e.g. 23.810300, 90.412500 (or paste a Google Maps link)", value: g && g.lat != null ? g.lat + ", " + g.lng : "" });
    loc.appendChild(h("div", { class: "gm-f", style: "margin-top:10px" }, [inp, h("div", { class: "gm-r" }, [
      h("button", { class: "gm-b", text: "Pick on map", on: { click: function () { startPick(function (ll) { inp.value = r6(ll.lat) + ", " + r6(ll.lng); }); } } }),
      h("button", { class: "gm-b gold", text: "Set location", on: { click: function () { var v = parseLL(inp.value); if (!v) return toast("Enter a valid Lat, Long", true); var e = ensureEntry(it); e.lat = v.lat; e.lng = v.lng; e.name = it.name; if (it.kind === "snmp") e.ip = it.ip || ""; saveGeo(); S.listSig = ""; tick(); renderDetail(); if (S.map) S.map.flyTo({ center: [v.lng, v.lat], zoom: 16, pitch: 55, duration: 1800 }); } } })])]));
  } else if (S.admin) loc.appendChild(h("div", { class: "gm-note", style: "margin-top:8px", text: "Press Edit locations (top bar) to change." }));
  box.appendChild(loc);
  var pc = h("div", { class: "gm-card" }); pc.appendChild(h("div", { class: "gm-k", text: "Points on this link (" + ((g && g.points) || []).length + ")" }));
  var pts = (g && g.points) || [];
  if (!pts.length) pc.appendChild(h("div", { class: "gm-note", text: "No fiber / ONU / TJ box / switch points added yet." }));
  pts.forEach(function (p, idx) {
    var ti = tinfo(p.type), ch = h("span", { class: "gm-chipt", text: ti[2] }), d = h("span", { class: "gm-d", "data-pid": p.id });
    var row = h("div", { class: "gm-row", on: { click: function () { focusPoint(p); } } }, [ch, h("div", {}, [h("b", { text: (idx + 1) + ". " + (p.name || ti[1]) }), h("small", { text: (p.ip ? p.ip : "no IP") + " \u2022 " + p.lat.toFixed(5) + ", " + p.lng.toFixed(5) })]), d]);
    if (edit) row.appendChild(h("button", { class: "gm-x", text: "\u2715", on: { click: function (ev) { ev.stopPropagation(); if (!confirm("Delete this point?")) return; g.points = g.points.filter(function (x) { return x.id !== p.id; }); saveGeo(); S.ptSig = "x"; renderDetail(); renderMarkers(); updateLines(); } } }));
    pc.appendChild(row);
  });
  if (edit) {
    var sel = h("select", { class: "gm-in" }); TYPES.forEach(function (t) { sel.appendChild(h("option", { value: t[0], text: t[1] })); });
    var nm = h("input", { class: "gm-in", placeholder: "Name (e.g. TJ-12 Mirpur)" }), ip = h("input", { class: "gm-in", placeholder: "IP (optional - green/red by ping)" }), ll = h("input", { class: "gm-in", placeholder: "Lat, Long or Google Maps link (required)" });
    pc.appendChild(h("div", { class: "gm-k", style: "margin-top:14px", text: "Add a point (added after the last one)" }));
    pc.appendChild(h("div", { class: "gm-f" }, [sel, nm, ip, ll, h("div", { class: "gm-r" }, [
      h("button", { class: "gm-b", text: "Pick on map", on: { click: function () { startPick(function (x) { ll.value = r6(x.lat) + ", " + r6(x.lng); }); } } }),
      h("button", { class: "gm-b gold", text: "Add point", on: { click: function () {
        var v = parseLL(ll.value); if (!v) return toast("Lat, Long is required", true);
        var ipv = ip.value.trim(); if (ipv && !/^[A-Za-z0-9.\-]{1,100}$/.test(ipv)) return toast("IP looks wrong", true);
        var e = ensureEntry(it); e.name = it.name; if (it.kind === "snmp") e.ip = it.ip || "";
        e.points.push({ id: "p" + Date.now().toString(36) + Math.random().toString(36).slice(2, 5), type: sel.value, name: nm.value.trim(), ip: ipv, lat: v.lat, lng: v.lng });
        saveGeo(); S.ptSig = "x"; renderDetail(); renderMarkers(); updateLines(); } } })])]));
  }
  box.appendChild(pc); paintDetail();
}
function paintDetail() {
  if (!S.sel || !S.detEl) return; var it = itemByKey(S.sel); if (!it) return;
  var d = S.detEl.querySelector("[data-st]"), p = S.detEl.querySelector("[data-pill]");
  if (d) d.style.setProperty("--c", COL[it.st]);
  if (p) { p.style.setProperty("--c", COL[it.st]); p.textContent = it.st === "up" ? "ONLINE" : it.st === "down" ? "DOWN" : it.st === "flap" ? "FLAPPING" : "UNKNOWN"; }
  var g = S.geo.links[it.key]; ((g && g.points) || []).forEach(function (pt) { var e = S.detEl.querySelector('[data-pid="' + pt.id + '"]'); if (e) e.style.setProperty("--c", COL[ptCls(it.st, pt)]); });
}
function updateTop() { if (S.btnEdit) { S.btnEdit.style.display = S.admin ? "" : "none"; S.btnEdit.textContent = S.edit ? "Editing" : "Edit locations"; S.btnEdit.className = "gm-b" + (S.edit ? " on" : ""); } }
function build() {
  if (S.ov) return; injectCss();
  S.chips = { up: h("span"), down: h("span"), flap: h("span") };
  function chip(k, c) { var e = h("div", { class: "gm-chip" }, [h("i"), S.chips[k]]); e.firstChild.style.setProperty("--c", c); return e; }
  S.btnMode = h("button", { class: "gm-b", text: "Street map", on: { click: function () { setMode(S.mode === "sat" ? "street" : "sat"); } } });
  S.btnSpin = h("button", { class: "gm-b on", text: "Spin: On", on: { click: function () { S.spin = !S.spin; spinBtn(); } } });
  S.btnEdit = h("button", { class: "gm-b", style: "display:none", text: "Edit locations", on: { click: function () { if (!S.admin) { pullRole(); askLogin(); return; } S.edit = !S.edit; S.pick = null; updateTop(); S.ptSig = "x"; if (S.sel) renderDetail(); renderMarkers(); } } });
  var top = h("div", { class: "gm-top" }, [h("span", { class: "gm-ti", text: "Infrastructure 3D" }), h("span", { class: "gm-su", text: "Live fiber, ONU, TJ box and switch locations" }), h("span", { class: "gm-sp" }), chip("up", COL.up), chip("down", COL.down), chip("flap", COL.flap), S.btnMode, S.btnSpin, S.btnEdit, h("button", { class: "gm-b", text: "Close", on: { click: closeOv } })]);
  var search = h("input", { class: "gm-in", placeholder: "Search links, IP or category...", on: { input: function () { S.q = this.value; S.listSig = ""; renderList(); } } });
  S.listEl = h("div", { class: "gm-scr" }); S.listWrap = h("div", { style: "display:flex;flex-direction:column;flex:1;min-height:0" }, [h("div", { class: "gm-sc" }, [search]), S.listEl]);
  S.detEl = h("div", { class: "gm-scr", style: "display:none;padding-top:12px" });
  var tray = h("div", { class: "gm-tray" }, [S.listWrap, S.detEl]);
  S.mapEl = h("div", { class: "gm-map" }); S.toastEl = h("div", { class: "gm-toast" });
  var leg = h("div", { class: "gm-leg" }); [["Online", COL.up], ["Down", COL.down], ["Flapping", COL.flap], ["Unknown", COL.unk]].forEach(function (x) { var s = h("span", {}, [h("i"), h("b", { text: x[0] })]); s.firstChild.style.setProperty("--c", x[1]); leg.appendChild(s); });
  S.ov = h("div", { id: "gm-ov" }, [top, h("div", { class: "gm-body" }, [tray, h("div", { class: "gm-mapw" }, [S.mapEl, leg, S.toastEl])])]);
  document.body.appendChild(S.ov);
}
function stop() { S.timers.forEach(clearInterval); S.timers = []; }
function start() {
  stop(); pullStatus(); pullGeo(true); pullPings(); pullRole(); pullSnmp();
  S.timers.push(setInterval(pullStatus, 3000), setInterval(pullPings, 3000), setInterval(function () { pullGeo(false); pullSnmp(); }, 15000), setInterval(pullRole, 5000));
  S.timers.push(setInterval(function () { if (S.spin && !S.sel && S.map && S.mapReady && S.map.getZoom() < 4) { var c = S.map.getCenter(); S.map.jumpTo({ center: [c.lng + 0.18, Math.max(-5, Math.min(45, c.lat))] }); } }, 50));
}
function openOv0() { build(); S.ov.classList.add("on"); document.body.classList.add("gm-on"); S.open = true; updateTop(); start(); S.timers.push(setInterval(function () { if (S.sel) paintSnmp(); }, 3000)); loadLib(function () { try { if (!S.map) initMap(); else S.map.resize(); } catch (e) { toast("3D map could not start: " + e.message, true); } }); }
function closeOv() { stop(); S.open = false; S.pick = null; document.body.classList.remove("gm-on"); if (S.ov) S.ov.classList.remove("on"); }
function init() {
  injectCss();
  if (!document.getElementById("gm-sig")) document.body.appendChild(h("div", { id: "gm-sig", text: "Created by SD Sifat \u00B7 velocitytech.top" }));
  if (!document.getElementById("gm-open")) document.body.appendChild(h("button", { id: "gm-open", type: "button", html: "\uD83C\uDF0D&nbsp;View 3D", on: { click: openOv } }));
}
function storeTokens() {
  var c = [];
  [window.localStorage, window.sessionStorage].forEach(function (st) {
    try { for (var i = 0; i < st.length; i++) { var v = st.getItem(st.key(i)); if (!v) continue; if (v.length >= 16 && v.length <= 300) c.push(v); try { var j = JSON.parse(v); if (j && typeof j === "object") Object.keys(j).forEach(function (k) { if (typeof j[k] === "string" && j[k].length >= 16 && j[k].length <= 300) c.push(j[k]); }); } catch (e2) {} } } catch (e) {}
  });
  return c;
}
function setAdmin(a) { if (a !== S.admin) { S.admin = a; if (!a) S.edit = false; updateTop(); if (S.sel) renderDetail(); renderMarkers(); } }
function pullRole() {
  var c = [tok].concat(storeTokens()).filter(function (v, i, a) { return v && a.indexOf(v) === i; }).slice(0, 12);
  var next = function (i) {
    if (i >= c.length) { setAdmin(false); return; }
    api("/api/geomap/role", { headers: { "x-manage-token": c[i] } }).then(function (j) { if (j && j.canSave) { tok = c[i]; setAdmin(true); } else next(i + 1); }).catch(function () { next(i + 1); });
  };
  next(0);
}
function updateTop() { if (S.btnEdit) { S.btnEdit.style.display = ""; S.btnEdit.textContent = !S.admin ? "Admin edit" : (S.edit ? "Editing" : "Edit locations"); S.btnEdit.className = "gm-b" + (S.edit ? " on" : ""); } }
function items() {
  var arr = [], seen = {};
  S.nodes.forEach(function (n) { var k = "L:" + n.ip; if (seen[k]) return; seen[k] = 1; arr.push({ key: k, kind: "link", name: n.name || n.ip, ip: n.ip, cat: n.categoryName || "Links", st: cls(n.status) }); });
  return arr;
}
function snmpOf(it) {
  var g = S.geo.links[it.key], out = [], seen = {};
  S.snmp.forEach(function (d) { if (it.ip && d.host === it.ip) { seen[d.id] = 1; out.push({ id: d.id, name: d.name || d.host, host: d.host, st: S.snmpSt[d.id] || it.st, auto: true }); } });
  ((g && g.snmp) || []).forEach(function (x) {
    if (seen[x.id]) return; seen[x.id] = 1; var d = null; S.snmp.forEach(function (z) { if (z.id === x.id) d = z; }); if (!d) return;
    var pg = S.pings[d.host]; out.push({ id: d.id, name: d.name || d.host, host: d.host, st: S.snmpSt[d.id] || (pg ? (pg.alive ? "up" : "down") : "unk"), auto: false });
  });
  return out;
}
function paintSnmp() { var it = itemByKey(S.sel); if (!it || !S.detEl) return; snmpOf(it).forEach(function (x) { var e = S.detEl.querySelector('[data-sn="' + x.id + '"]'); if (e) e.style.setProperty("--c", COL[x.st]); }); }
function renderDetail() {
  renderDetail0();
  var it = itemByKey(S.sel); if (!it || !S.detEl) return;
  var edit = S.admin && S.edit, list = snmpOf(it), card = h("div", { class: "gm-card" });
  card.appendChild(h("div", { class: "gm-k", text: "SNMP devices on this link (" + list.length + ")" }));
  if (!list.length) card.appendChild(h("div", { class: "gm-note", text: "No SNMP device attached to this link." }));
  list.forEach(function (x) {
    var d = h("span", { class: "gm-d", "data-sn": x.id }); d.style.setProperty("--c", COL[x.st]);
    var row = h("div", { class: "gm-row", style: "cursor:default" }, [d, h("div", {}, [h("b", { text: x.name }), h("small", { text: (x.host || "") + (x.auto ? " \u2022 same IP as link" : "") })])]);
    if (edit && !x.auto) row.appendChild(h("button", { class: "gm-x", text: "\u2715", on: { click: function () { var e = ensureEntry(it); e.snmp = (e.snmp || []).filter(function (y) { return y.id !== x.id; }); saveGeo(); renderDetail(); } } }));
    card.appendChild(row);
  });
  if (edit) {
    var sel = h("select", { class: "gm-in" }); sel.appendChild(h("option", { value: "", text: "Attach an SNMP device..." }));
    S.snmp.forEach(function (d) { sel.appendChild(h("option", { value: d.id, text: (d.name || d.host) + " (" + d.host + ")" })); });
    card.appendChild(h("div", { class: "gm-f", style: "margin-top:10px" }, [sel, h("button", { class: "gm-b gold", text: "Attach", on: { click: function () {
      if (!sel.value) return; var d = null; S.snmp.forEach(function (z) { if (z.id === sel.value) d = z; }); if (!d) return;
      var e = ensureEntry(it); e.name = it.name; e.snmp = e.snmp || [];
      if (!e.snmp.some(function (y) { return y.id === d.id; })) e.snmp.push({ id: d.id, host: d.host || "" });
      saveGeo(); renderDetail(); } } })]));
  }
  S.detEl.appendChild(card);
}function askLogin() {
  if (document.getElementById("gm-login")) return;
  var un = h("input", { class: "gm-in", placeholder: "Admin username", autocomplete: "username" });
  var pw = h("input", { class: "gm-in", type: "password", placeholder: "Password", autocomplete: "current-password" });
  var msg = h("div", { class: "gm-note", style: "color:#ff6b86;min-height:18px;margin-top:8px", text: "" });
  var box = h("div", { id: "gm-login", style: "position:fixed;inset:0;z-index:100000;display:flex;align-items:center;justify-content:center;background:rgba(2,4,10,.72)" });
  function shut() { if (box.parentNode) box.parentNode.removeChild(box); }
  function go() {
    var uv = un.value.trim(); if (!uv || !pw.value) { msg.textContent = "Enter username and password"; return; }
    msg.style.color = "#8ea0c4"; msg.textContent = "Checking...";
    fetch("/api/manage/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ username: uv, password: pw.value }) })
      .then(function (r) { return r.json().then(function (j) { return { s: r.status, j: j }; }); })
      .then(function (x) {
        msg.style.color = "#ff6b86";
        if (x.j && x.j.token) {
          if (x.j.role === "admin") { window.__gmLock = 1; tok = x.j.token; shut(); setAdmin(true); toast("Admin unlocked. Press Edit locations."); }
          else msg.textContent = "This user is not the admin (role: " + x.j.role + ").";
        } else msg.textContent = (x.j && x.j.error) || "Wrong username or password";
      })
      .catch(function () { msg.style.color = "#ff6b86"; msg.textContent = "Could not reach the server."; });
  }
  pw.addEventListener("keydown", function (e) { if (e.key === "Enter") go(); });
  un.addEventListener("keydown", function (e) { if (e.key === "Enter") pw.focus(); });
  var card = h("div", { class: "gm-card", style: "width:330px;background:#0b1226;border-color:rgba(245,196,81,.5);box-shadow:0 20px 60px rgba(0,0,0,.7)" }, [
    h("div", { class: "gm-k", text: "Admin login" }),
    h("div", { class: "gm-note", style: "margin-bottom:10px", text: "Only the admin can edit locations. Viewers can only look." }),
    h("div", { class: "gm-f" }, [un, pw]), msg,
    h("div", { class: "gm-r" }, [h("button", { class: "gm-b gold", text: "Unlock", on: { click: go } }), h("button", { class: "gm-b", text: "Cancel", on: { click: shut } })])
  ]);
  box.appendChild(card); (S.ov || document.body).appendChild(box); setTimeout(function () { un.focus(); }, 50);
}function btnRow() { return h("span"); }
function parseLL(s) {
  s = String(s || "");
  var m = s.match(/!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/) || s.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/) || s.match(/[?&](?:q|ll|query)=(-?\d+\.\d+)(?:,|%2C)(-?\d+\.\d+)/);
  if (m) { var la = +m[1], lo = +m[2]; if (la >= -90 && la <= 90 && lo >= -180 && lo <= 180) return { lat: r6(la), lng: r6(lo) }; }
  return /^https?:/i.test(s.trim()) ? null : parseLL0(s);
}
function stopOrbit() { if (S.orbit) { S.orbit = false; if (S.btnOrb) { S.btnOrb.textContent = "Orbit: Off"; S.btnOrb.className = "gm-b"; } } }
function ensureExtras() {
  var top = S.ov && S.ov.querySelector(".gm-top"); if (!top || top.querySelector("[data-gmx]")) return;
  var close = top.lastChild; S.bld = true; S.orbit = true;
  S.btnBld = h("button", { class: "gm-b on", "data-gmx": "1", text: "3D buildings: On", on: { click: function () { S.bld = !S.bld; if (S.map && S.mapReady) { try { S.map.setLayoutProperty("gm-bld", "visibility", S.bld ? "visible" : "none"); } catch (e) {} } S.btnBld.textContent = "3D buildings: " + (S.bld ? "On" : "Off"); S.btnBld.className = "gm-b" + (S.bld ? " on" : ""); } } });
  S.btnOrb = h("button", { class: "gm-b on", "data-gmx": "1", text: "Orbit: On", on: { click: function () { S.orbit = !S.orbit; S.btnOrb.textContent = "Orbit: " + (S.orbit ? "On" : "Off"); S.btnOrb.className = "gm-b" + (S.orbit ? " on" : ""); } } });
  top.insertBefore(S.btnBld, close); top.insertBefore(S.btnOrb, close);
  setInterval(function () {
    if (S.map && S.mapReady && !S.mapHook) { S.mapHook = 1; S.map.on("dragstart", stopOrbit); S.map.on("rotatestart", stopOrbit); }
    if (S.open && S.orbit && S.sel && S.map && S.mapReady && !S.pick && S.map.getZoom() >= 13 && !S.map.isMoving()) S.map.setBearing((S.map.getBearing() + 0.12) % 360);
  }, 33);
}
function openOv(edit) {
  S.wantEdit = (edit === true); openOv0(); ensureExtras();
  if (S.wantEdit) {
    var n = 0, iv = setInterval(function () {
      n++;
      if (!S.open) { clearInterval(iv); return; }
      if (S.admin) { clearInterval(iv); S.wantEdit = false; S.edit = true; S.pick = null; updateTop(); S.ptSig = "x"; if (S.sel) renderDetail(); renderMarkers(); toast("Edit mode is ON"); }
      else if (n === 6) askLogin();
      else if (n > 160) clearInterval(iv);
    }, 500);
  }
}
function addSideBtn() {
  if (document.querySelector("[data-gm3d]")) return;
  var re = /^\S{0,6}\s*Edit Graphical Mode$/, norm = function (s) { return String(s || "").replace(/\s+/g, " ").trim(); };
  var w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null), n, el = null;
  while ((n = w.nextNode())) { if (/Edit Graphical Mode/.test(n.nodeValue) && !(n.parentElement && n.parentElement.closest("#gm-ov"))) { el = n.parentElement; break; } }
  if (!el) return;
  while (el.parentElement && !re.test(norm(el.textContent))) el = el.parentElement;
  if (!re.test(norm(el.textContent))) return;
  while (el.parentElement && re.test(norm(el.parentElement.textContent))) el = el.parentElement;
  var c = el.cloneNode(true); c.setAttribute("data-gm3d", "1"); c.removeAttribute("id"); c.removeAttribute("onclick"); c.removeAttribute("href");
  [].forEach.call(c.querySelectorAll("[onclick],[id]"), function (x) { x.removeAttribute("onclick"); x.removeAttribute("id"); });
  var tw = document.createTreeWalker(c, NodeFilter.SHOW_TEXT, null), t, hit = false;
  while ((t = tw.nextNode())) { if (/Edit Graphical Mode/.test(t.nodeValue)) { t.nodeValue = t.nodeValue.replace(/^(\s*)(\S{1,6}\s+)?Edit Graphical Mode/, function (m, a, b) { return a + (b ? "\uD83C\uDF0D " : "") + "Edit 3D Graphical Mode"; }); hit = true; } }
  if (!hit) c.textContent = "Edit 3D Graphical Mode";
  c.addEventListener("click", function (ev) { ev.preventDefault(); ev.stopPropagation(); ev.stopImmediatePropagation(); openOv(true); }, true);
  el.parentNode.insertBefore(c, el.nextSibling);
}
setInterval(addSideBtn, 3000); setTimeout(addSideBtn, 800);if (document.body) init(); else document.addEventListener("DOMContentLoaded", init);
})();
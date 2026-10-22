(function () {
  "use strict";
  if (window.__pmLoaded) return; window.__pmLoaded = 1;
  var NS = "http://www.w3.org/2000/svg", tok = "";
  try { var _f = window.fetch; if (_f) window.fetch = function (u, o) { try { var hd = o && o.headers, t = hd && (typeof hd.get === "function" ? hd.get("x-manage-token") : hd["x-manage-token"]); if (t) tok = t; } catch (e) {} return _f.apply(this, arguments); }; } catch (e) {}
  var RT = "M-10 0H10M0 -10V10M-10 0l4 -3M-10 0l4 3M10 0l-4 -3M10 0l-4 3M0 -10l-3 4M0 -10l3 4M0 10l-3 -4M0 10l3 -4";
  var SW = "M-11 -5H10M6 -9l4 4l-4 4M11 5H-10M-6 1l-4 4l4 4";
  var TY = [
    ["internet", "Internet", "Core", "#38bdf8", "M-10 0a10 10 0 1 0 20 0a10 10 0 1 0 -20 0M-10 0h20M0 -10c-6 6 -6 14 0 20M0 -10c6 6 6 14 0 20"],
    ["mikrotik", "MikroTik router", "Core", "#f5a623", RT],
    ["router", "Router", "Core", "#fbbf24", RT],
    ["firewall", "Firewall", "Core", "#fb7185", "M-11 -9h22v18h-22zM-11 -3h22M-11 3h22M-3 -9v6M5 -3v6M-3 3v6"],
    ["switch", "Switch", "Switching", "#22d3ee", SW],
    ["l3switch", "Layer 3 switch", "Switching", "#2dd4bf", SW + "M-3 -12h6M-3 12h6"],
    ["olt", "OLT (EPON / GPON)", "Fiber", "#fb923c", "M-11 -10h22v6h-22zM-11 -3h22v6h-22zM-11 4h22v6h-22zM-7 -7h.01M-7 0h.01M-7 7h.01"],
    ["odf", "ODF / splitter", "Fiber", "#fdba74", "M-11 0h8M-3 0l11 -7h3M-3 0h14M-3 0l11 7h3"],
    ["onu", "ONU / CPE", "Fiber", "#fcd34d", "M-9 -1h18v9h-18zM-4 -1v-8M4 -1v-8M-4 4h.01M0 4h.01"],
    ["server", "Server", "Servers", "#a78bfa", "M-9 -11h18v8h-18zM-9 -1h18v8h-18zM-9 9h18M-5 -7h.01M-5 3h.01"],
    ["nas", "Storage / NAS", "Servers", "#c4b5fd", "M-9 -7a9 3 0 1 0 18 0a9 3 0 1 0 -18 0M-9 -7v14a9 3 0 0 0 18 0v-14M-9 0a9 3 0 0 0 18 0"],
    ["ap", "Wi-Fi access point", "Wireless", "#4ade80", "M-10 -3a14 14 0 0 1 20 0M-6 1a8 8 0 0 1 12 0M0 7h.01"],
    ["radio", "Radio / PTP dish", "Wireless", "#86efac", "M-9 -9c9 -1 15 6 12 15M-9 -9c-1 9 6 15 15 12M-9 -9l13 13M4 4l6 6"],
    ["site", "POP / building", "Sites", "#f9a8d4", "M-9 10v-18h12v18M3 -2h6v12M-5 -4h4M-5 1h4M-5 6h4M-10 10h20"],
    ["pc", "PC / client", "Sites", "#94a3b8", "M-11 -9h22v14h-22zM-4 9h8M0 5v4"],
    ["cctv", "CCTV camera", "Sites", "#e879f9", "M-11 -5h15v10h-15zM4 -2l8 -4v12l-8 -4M-6 9h6"],
    ["ups", "UPS / power", "Sites", "#facc15", "M-11 -7h20v14h-20zM9 -3h3v6h-3zM-1 -5l-4 6h5l-3 5"],
    ["generic", "Other device", "Sites", "#94a3b8", "M-10 0a10 10 0 1 0 20 0a10 10 0 1 0 -20 0M0 0h.01"]
  ];
  var TYPE = {}; TY.forEach(function (t) { TYPE[t[0]] = { id: t[0], name: t[1], grp: t[2], c: t[3], p: t[4] }; });
  var WR = [
    ["fiber", "Fiber - single-mode", "#ff9f1c", 3, ""], ["fibermm", "Fiber - multi-mode", "#ffd166", 3, ""],
    ["utp", "UTP Cat5e / Cat6", "#cbd5e1", 2.2, ""], ["dac", "DAC / SFP direct cable", "#a78bfa", 3, ""],
    ["lag", "LAG / trunk bundle", "#22d3ee", 4, ""], ["wireless", "Wireless / radio link", "#22d3ee", 2.4, "2 7"],
    ["vpn", "VPN / tunnel", "#34d399", 2.4, "10 5 2 5"], ["mpls", "Metro-E / leased line", "#f472b6", 3, ""],
    ["coax", "Coax", "#fdba74", 3.5, "1 6"], ["serial", "Serial / E1", "#fb7185", 2.4, "14 4 3 4"]
  ];
  var WIRE = {}; WR.forEach(function (w) { WIRE[w[0]] = { id: w[0], name: w[1], c: w[2], w: w[3], d: w[4] }; });
  var HALF = 32, STX = { up: "Online", down: "Down", flap: "Flapping", unk: "Not monitored" };
  function fill(e, a) { if (a) for (var k in a) { if (a[k] == null) continue; if (k === "text") e.textContent = a[k]; else if (k === "on") { for (var ev in a.on) e.addEventListener(ev, a.on[ev]); } else e.setAttribute(k, a[k]); } return e; }
  function h(tag, a, kids) { var e = fill(document.createElement(tag), a); (kids || []).forEach(function (c) { if (c) e.appendChild(c); }); return e; }
  function s(tag, a, kids) { var e = fill(document.createElementNS(NS, tag), a); (kids || []).forEach(function (c) { if (c) e.appendChild(c); }); return e; }
  function clr(e) { while (e.firstChild) e.removeChild(e.firstChild); }
  function rid(p) { return p + Math.random().toString(36).slice(2, 8) + Date.now().toString(36).slice(-2); }
  function trunc(t, n) { t = String(t || ""); return t.length > n ? t.slice(0, n - 1) + "\u2026" : t; }
  function dur(ms) { var m = Math.floor(ms / 60000); if (m < 1) return Math.max(1, Math.floor(ms / 1000)) + "s"; if (m < 60) return m + "m"; if (m < 1440) return Math.floor(m / 60) + "h " + (m % 60) + "m"; return Math.floor(m / 1440) + "d " + Math.floor((m % 1440) / 60) + "h"; }
  var CSS = [
    ".pm-launch{position:fixed;left:18px;bottom:18px;z-index:2147479000;display:flex;align-items:center;gap:9px;padding:11px 18px 11px 14px;border-radius:999px;border:1px solid #d4af37;background:linear-gradient(135deg,#1b1506,#0a1020);color:#f5d77a;font:600 13px 'Segoe UI',system-ui,sans-serif;cursor:pointer;box-shadow:0 8px 28px rgba(0,0,0,.55),0 0 20px rgba(212,175,55,.25);transition:transform .15s}",
    ".pm-launch:hover{transform:translateY(-2px)}.pm-launch svg{width:20px;height:20px}",
    ".pm-ov{position:fixed;inset:0;z-index:2147479500;display:flex;flex-direction:column;background:#050810;color:#e2e8f0;font:13px/1.4 'Segoe UI',system-ui,sans-serif}.pm-ov *{box-sizing:border-box}",
    ".pm-top,.pm-bar2{display:flex;align-items:center;gap:10px;padding:0 16px;flex:none}",
    ".pm-top{height:58px;background:linear-gradient(180deg,#0e1830,#080d1a);border-bottom:1px solid rgba(212,175,55,.45)}",
    ".pm-bar2{height:48px;background:#0a1020;border-bottom:1px solid #18233b;overflow-x:auto}",
    ".pm-title{font:700 18px 'Segoe UI Semibold','Segoe UI',sans-serif;color:#f5d77a;white-space:nowrap}.pm-sub{color:#7c8aa5;font-size:12px;white-space:nowrap}.pm-sp{flex:1}",
    ".pm-chip{display:flex;align-items:center;gap:7px;padding:5px 11px;border-radius:9px;background:#0e1730;border:1px solid #1a2744;white-space:nowrap}.pm-chip i{width:8px;height:8px;border-radius:50%;display:block}",
    ".pm-b{padding:7px 14px;border-radius:9px;border:1px solid #243457;background:#0e1730;color:#dbe4f5;font:600 12px 'Segoe UI',sans-serif;cursor:pointer;white-space:nowrap}.pm-b:hover{border-color:#d4af37;color:#f5d77a}",
    ".pm-b.gold{background:linear-gradient(135deg,#d4af37,#f5d77a);border-color:#f5d77a;color:#1a1405}.pm-b.on{border-color:#d4af37;color:#f5d77a;background:#1a1608}.pm-b.red:hover{border-color:#ff2d55;color:#ff6b86}",
    ".pm-sel,.pm-in{padding:7px 9px;border-radius:9px;border:1px solid #243457;background:#0a1226;color:#e2e8f0;font:12px 'Segoe UI',sans-serif;max-width:100%}.pm-in,.pm-sel.w{width:100%}",
    ".pm-body{flex:1;min-height:0;display:flex;position:relative}.pm-pal,.pm-side{flex:none;overflow:auto;background:#0a1020;padding:12px}.pm-pal{width:260px;border-right:1px solid #18233b}.pm-side{width:290px;border-left:1px solid #18233b}",
    ".pm-sec{margin:8px 0 6px;font:600 12px 'Segoe UI',sans-serif;color:#7c8aa5}.pm-card{padding:12px;border-radius:14px;background:#0d1730;border:1px solid #1a2744;margin-bottom:12px}",
    ".pm-pi{display:flex;align-items:center;gap:9px;width:100%;margin:0 0 5px;padding:6px 8px;border-radius:10px;border:1px solid #18233b;background:#0b1328;color:#dbe4f5;font:12px 'Segoe UI',sans-serif;cursor:pointer;text-align:left}.pm-pi:hover{border-color:#d4af37}.pm-pi svg{width:26px;height:26px;flex:none}",
    ".pm-canvas{flex:1;min-width:0;position:relative;overflow:hidden;background:radial-gradient(ellipse at 50% 30%,#0b1428,#050810 70%)}.pm-canvas>svg{position:absolute;inset:0;width:100%;height:100%;touch-action:none;cursor:grab;user-select:none}.pm-canvas.wire>svg{cursor:crosshair}",
    ".pm-field{margin:0 0 10px}.pm-field label{display:block;margin:0 0 4px;color:#7c8aa5;font-size:12px}.pm-kv{display:flex;justify-content:space-between;gap:10px;padding:4px 0;border-bottom:1px solid #15213a}.pm-kv span:first-child{color:#7c8aa5}",
    ".pm-note{color:#ffd27d;font-size:12px;margin:0 0 10px}.pm-alert{position:absolute;top:14px;left:50%;transform:translateX(-50%);z-index:4;max-width:80%;padding:9px 18px;border-radius:999px;font-weight:600;border:1px solid;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;backdrop-filter:blur(6px)}",
    ".pm-alert.ok{background:rgba(46,213,115,.1);border-color:rgba(46,213,115,.45);color:#7ff0b0}.pm-alert.bad{background:rgba(255,45,85,.16);border-color:#ff2d55;color:#ff9db0;animation:pmB 1.4s infinite}.pm-alert.warn{background:rgba(245,166,35,.14);border-color:#f5a623;color:#ffd27d}",
    ".pm-tip{position:fixed;z-index:2147480000;pointer-events:none;padding:9px 12px;border-radius:10px;background:#0b1328;border:1px solid #2a3a60;box-shadow:0 10px 30px rgba(0,0,0,.6);font-size:12px;max-width:260px}.pm-tip b{display:block;margin-bottom:3px}",
    ".pm-toast{position:absolute;bottom:18px;left:50%;transform:translateX(-50%);z-index:5;padding:10px 18px;border-radius:10px;background:#0b1328;border:1px solid #d4af37;color:#f5d77a;font-weight:600}.pm-toast.err{border-color:#ff2d55;color:#ff9db0}",
    ".pm-empty{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;text-align:center;color:#7c8aa5;pointer-events:none;padding:30px;font-size:15px}.pm-empty b{display:block;color:#e2e8f0;font-size:19px;margin-bottom:6px}",
    ".pm-tile{stroke:#475569;stroke-width:2}.pm-glow{fill:none;stroke:none}.pm-gl{fill:none;stroke-width:2.1;stroke-linecap:round;stroke-linejoin:round}",
    ".pm-nm{fill:#e8eefb;font:600 12px 'Segoe UI',sans-serif;paint-order:stroke;stroke:#050810;stroke-width:4px}.pm-sb{fill:#8795b3;font:11px 'Segoe UI',sans-serif;paint-order:stroke;stroke:#050810;stroke-width:3px}.pm-dot{fill:#64748b;stroke:#050810;stroke-width:2}.pm-n{cursor:pointer}",
    ".pm-n.up .pm-tile{stroke:#2ed573}.pm-n.up .pm-dot{fill:#2ed573}.pm-n.down .pm-tile{stroke:#ff2d55;fill:#2a0a14}.pm-n.down .pm-dot{fill:#ff2d55}.pm-n.down .pm-glow{animation:pmP 1.2s infinite}.pm-n.down .pm-sb{fill:#ff8ca1;font-weight:600}",
    ".pm-n.flap .pm-tile{stroke:#ff4fa3}.pm-n.flap .pm-dot{fill:#ff4fa3}.pm-n.flap{animation:pmB .9s infinite}.pm-ring{fill:none;stroke:#f5d77a;stroke-width:1.6;stroke-dasharray:4 4;opacity:0;pointer-events:none}.pm-n.sel .pm-ring{opacity:1}",
    ".pm-edge .pm-hit{fill:none;stroke:transparent;stroke-width:16;cursor:pointer}.pm-edge .pm-main{fill:none}.pm-edge .pm-flow{fill:none;stroke:#fff;stroke-width:2;stroke-linecap:round;stroke-dasharray:2 16;opacity:0;pointer-events:none}",
    ".pm-edge.st-up .pm-flow{opacity:.5;animation:pmF 1.1s linear infinite}.pm-edge.st-down .pm-main{stroke:#ff2d55;stroke-dasharray:none;filter:drop-shadow(0 0 5px #ff2d55)}.pm-edge.st-flap .pm-main{stroke:#ff4fa3;animation:pmB .9s infinite}.pm-edge.st-unk .pm-main{opacity:.6}.pm-edge.sel .pm-main{filter:drop-shadow(0 0 6px #f5d77a)}",
    ".pm-el{fill:#cbd5e1;font:11px 'Segoe UI',sans-serif;paint-order:stroke;stroke:#050810;stroke-width:4px;pointer-events:none}",
    "@keyframes pmP{0%,100%{stroke:rgba(255,45,85,.1);stroke-width:2}50%{stroke:rgba(255,45,85,.55);stroke-width:12}}@keyframes pmB{50%{opacity:.45}}@keyframes pmF{to{stroke-dashoffset:-36}}",
    "@media (max-width:900px){.pm-side{position:absolute;left:0;right:0;bottom:0;width:auto;max-height:46%;z-index:6}.pm-pal{width:150px}.pm-sub{display:none}}"
  ].join("\n") + "\n" + [
 ".pm-depth{fill:#070b16;stroke-width:1.5;pointer-events:none}",
 ".pm-gloss{pointer-events:none}",
 ".pm-n .pm-tile{stroke-width:1.6;filter:drop-shadow(0 6px 8px rgba(0,0,0,.65))}",
 ".pm-gl{stroke-width:2.6;filter:drop-shadow(0 2px 1.5px rgba(0,0,0,.85))}",
 ".pm-n{transition:filter .2s}.pm-n.up{filter:drop-shadow(0 0 7px rgba(46,213,115,.28))}",
 ".pm-n.down{filter:drop-shadow(0 0 12px rgba(255,45,85,.9))}",
 ".pm-n:hover{filter:brightness(1.18)}",
 ".pm-n.down .pm-tile{fill:url(#pm-red)!important;stroke:#ff2d55}",
 ".pm-n.down .pm-depth{fill:#5c0719;stroke:#ff2d55}",
 ".pm-n.down .pm-gl{stroke:#fff}",
 ".pm-tb{fill:none;stroke:#02040a;stroke-linecap:round;opacity:.85;pointer-events:none}",
 ".pm-hl{fill:none;stroke:#fff;stroke-width:1;stroke-linecap:round;opacity:.38;pointer-events:none}",
 ".pm-edge.st-up .pm-main{filter:drop-shadow(0 0 3px rgba(46,213,115,.35))}",
 ".pm-edge.st-down .pm-tb{stroke:#ff2d55;opacity:.5;animation:pmB 1s infinite}",
 ".pm-edge.st-down .pm-hl{stroke:#ffb3c0}",
 ".pm-b.vo{border-color:#2ed573;color:#7ff0b0;background:#0b2016}"
].join("\n");  var map = { nodes: [], edges: [] }, rev = 0, view = { x: 0, y: 0, k: 1 }, cats = [], byUid = {}, byIp = {}, snmpHosts = [], live = true;
  var edit = false, canEdit = false, tool = "select", wireType = "utp", wireFrom = "", sel = null, dirty = false, drag = null, nodeBy = {}, els = { n: {}, e: {} }, stat = {}, pickCat = "";
  var ov, svg, world, edgeL, nodeL, rub, canvas, sideEl, palEl, barEl, topEl, alertEl, chipsEl, tipEl, tm = [], toastT = 0;
  function find(a, id) { for (var i = 0; i < a.length; i++) if (a[i].id === id) return a[i]; return null; }
  function norm(m) { m = m && typeof m === "object" ? m : {}; m.nodes = Array.isArray(m.nodes) ? m.nodes : []; m.edges = Array.isArray(m.edges) ? m.edges : []; return m; }
  function pullStatus(cb) {
    fetch("/api/status", { cache: "no-store" }).then(function (r) { return r.json(); }).then(function (j) {
      cats = (j && j.categories) || []; byUid = {}; byIp = {};
      cats.forEach(function (c) { (c.nodes || []).forEach(function (n) { n._cat = c.name; if (n.uid) byUid[n.uid] = n; byIp[n.ip] = n; }); });
      live = true; if (cb) cb();
    }).catch(function () { live = false; if (cb) cb(); });
  }
  function pullSnmp() { fetch("/api/snmp-hosts", { cache: "no-store" }).then(function (r) { return r.json(); }).then(function (j) { snmpHosts = (j && j.hosts) || []; }).catch(function () {}); }
  function pullMap(force, cb) {
    fetch("/api/netmap", { cache: "no-store" }).then(function (r) { return r.json(); }).then(function (j) {
      if (!j || !j.map) throw new Error("no map");
      if (force || (j.rev !== rev && !dirty)) { rev = j.rev; map = norm(j.map); if (sel && !(sel.t === "n" ? find(map.nodes, sel.id) : find(map.edges, sel.id))) sel = null; rebuild(); }
      if (cb) cb(true);
    }).catch(function () { if (cb) cb(false); });
  }
  function pullRole(cb) {
    if (!tok) { if (canEdit) { canEdit = false; if (edit) setEdit(false); renderTop(); } if (cb) cb(); return; }
    fetch("/api/netmap/role", { cache: "no-store", headers: { "x-manage-token": tok } }).then(function (r) { return r.json(); }).then(function (j) {
      var v = !!(j && j.canSave); if (v !== canEdit) { canEdit = v; if (!v && edit) setEdit(false); renderTop(); } if (cb) cb();
    }).catch(function () { if (cb) cb(); });
  }
  function linkOf(n) { return (n.uid && byUid[n.uid]) || (n.ip && byIp[n.ip]) || null; }
  function compute() {
    var R = {};
    map.nodes.forEach(function (n) { var l = linkOf(n), st = "unk"; if (l && live) st = l.status === "DOWN" ? "down" : l.status === "FLAPPING" ? "flap" : l.status === "ONLINE" ? "up" : "unk"; R[n.id] = { l: l, s: st }; });
    return R;
  }
  function edgeState(e) { var x = [stat[e.a] && stat[e.a].s, stat[e.b] && stat[e.b].s]; if (x.indexOf("down") > -1) return "down"; if (x.indexOf("flap") > -1) return "flap"; if (x.indexOf("up") > -1) return "up"; return "unk"; }
  function clip(n, tx, ty) { var dx = tx - n.x, dy = ty - n.y, m = Math.max(Math.abs(dx), Math.abs(dy)) || 1, k = (HALF + 4) / m; return { x: n.x + dx * k, y: n.y + dy * k }; }
  function geom(e) {
    var A = nodeBy[e.a], B = nodeBy[e.b]; if (!A || !B) return null;
    var p1 = clip(A, B.x, B.y), p2 = clip(B, A.x, A.y);
    return { d: "M" + p1.x + " " + p1.y + "L" + p2.x + " " + p2.y, mx: (p1.x + p2.x) / 2, my: (p1.y + p2.y) / 2 };
  }
  function wpt(ev) { var r = svg.getBoundingClientRect(); return { x: (ev.clientX - r.left - view.x) / view.k, y: (ev.clientY - r.top - view.y) / view.k }; }
  function applyView() { world.setAttribute("transform", "translate(" + view.x + " " + view.y + ") scale(" + view.k + ")"); }
  function fit() {
    var r = svg.getBoundingClientRect(), W = r.width || 900, H = r.height || 600;
    if (!map.nodes.length) { view = { x: W / 2, y: H / 2, k: 1 }; return applyView(); }
    var x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
    map.nodes.forEach(function (n) { x0 = Math.min(x0, n.x); y0 = Math.min(y0, n.y); x1 = Math.max(x1, n.x); y1 = Math.max(y1, n.y); });
    var k = Math.min(W / (x1 - x0 + 160), H / (y1 - y0 + 190), 1.3);
    view = { k: k, x: W / 2 - (x0 + x1) / 2 * k, y: H / 2 - (y0 + y1) / 2 * k }; applyView();
  }
  function iconSvg(t, size) { var T = TYPE[t] || TYPE.generic; return s("svg", { viewBox: "-16 -16 32 32", width: size, height: size }, [s("path", { d: T.p, fill: "none", stroke: T.c, "stroke-width": 2, "stroke-linecap": "round", "stroke-linejoin": "round" })]); }
  function build() {
    clr(world); els = { n: {}, e: {} }; nodeBy = {};
    map.nodes.forEach(function (n) { nodeBy[n.id] = n; });
    world.appendChild(s("rect", { x: -6000, y: -6000, width: 12000, height: 12000, fill: "url(#pm-dots)" }));
    edgeL = s("g"); nodeL = s("g"); rub = s("path", { fill: "none", stroke: "#f5d77a", "stroke-width": 2, "stroke-dasharray": "6 5", "pointer-events": "none", d: "" });
    world.appendChild(edgeL); world.appendChild(nodeL); world.appendChild(rub);
    map.edges.forEach(function (e) {
      if (!nodeBy[e.a] || !nodeBy[e.b]) return;
      var w = WIRE[e.type] || WIRE.utp;
      var o = { hit: s("path", { "class": "pm-hit" }), main: s("path", { "class": "pm-main", stroke: w.c, "stroke-width": w.w, "stroke-dasharray": w.d || "none", "stroke-linecap": "round" }), flow: s("path", { "class": "pm-flow" }), lb: s("text", { "class": "pm-el", "text-anchor": "middle" }) };
      o.g = s("g", { "class": "pm-edge", "data-eid": e.id }, [o.hit, o.main, o.flow, o.lb]); els.e[e.id] = o; edgeL.appendChild(o.g);
    });
    map.nodes.forEach(function (n) {
      var T = TYPE[n.type] || TYPE.generic;
      var o = { glow: s("rect", { x: -HALF, y: -HALF, width: HALF * 2, height: HALF * 2, rx: 16, "class": "pm-glow" }), tile: s("rect", { x: -HALF, y: -HALF, width: HALF * 2, height: HALF * 2, rx: 16, fill: "url(#pm-tile)", "class": "pm-tile" }), gl: s("path", { d: T.p, stroke: T.c, "class": "pm-gl", transform: "scale(1.2)" }), dot: s("circle", { cx: HALF - 5, cy: -HALF + 5, r: 5, "class": "pm-dot" }), nm: s("text", { y: HALF + 17, "text-anchor": "middle", "class": "pm-nm" }), sb: s("text", { y: HALF + 31, "text-anchor": "middle", "class": "pm-sb" }), ring: s("rect", { x: -HALF - 6, y: -HALF - 6, width: HALF * 2 + 12, height: HALF * 2 + 12, rx: 20, "class": "pm-ring" }) };
      o.g = s("g", { "class": "pm-n", "data-nid": n.id }, [o.ring, o.glow, o.tile, o.gl, o.dot, o.nm, o.sb]); els.n[n.id] = o; nodeL.appendChild(o.g);
    });
    layout();
  }
  function layout() {
    map.nodes.forEach(function (n) { var o = els.n[n.id]; if (o) o.g.setAttribute("transform", "translate(" + n.x + " " + n.y + ")"); });
    map.edges.forEach(function (e) {
      var o = els.e[e.id], g = o && geom(e); if (!g) return;
      o.hit.setAttribute("d", g.d); o.main.setAttribute("d", g.d); o.flow.setAttribute("d", g.d); o.lb.setAttribute("x", g.mx); o.lb.setAttribute("y", g.my - 6);
    });
  }
  function paint() {
    stat = compute();
    var cnt = { up: 0, down: 0, flap: 0 }, bad = [];
    map.nodes.forEach(function (n) {
      var o = els.n[n.id], S = stat[n.id]; if (!o) return;
      if (cnt[S.s] !== undefined) cnt[S.s]++; if (S.s === "down" || S.s === "flap") bad.push(n);
      o.g.setAttribute("class", "pm-n " + S.s + (sel && sel.t === "n" && sel.id === n.id ? " sel" : ""));
      var T = TYPE[n.type] || TYPE.generic; o.nm.textContent = trunc(n.label || (S.l && S.l.name) || T.name, 24);
      var since = S.l && S.l.downSince;
      o.sb.textContent = (S.s === "down" && since) ? "Down " + dur(Date.now() - since) : S.s === "flap" ? "Unstable" : (S.l ? S.l.ip : "");
    });
    map.edges.forEach(function (e) {
      var o = els.e[e.id]; if (!o) return;
      o.g.setAttribute("class", "pm-edge st-" + edgeState(e) + (sel && sel.t === "e" && sel.id === e.id ? " sel" : "")); o.lb.textContent = e.label || ((e.pa || e.pb) ? ((e.pa || "?") + " - " + (e.pb || "?")) : "");
    });
    renderChips(cnt, bad);
  }
  function renderChips(cnt, bad) {
    if (!chipsEl) return; clr(chipsEl);
    [["Online", "#2ed573", cnt.up], ["Down", "#ff2d55", cnt.down], ["Flapping", "#ff4fa3", cnt.flap]].forEach(function (c) { chipsEl.appendChild(h("div", { "class": "pm-chip" }, [h("i", { style: "background:" + c[1] }), h("span", { text: c[0] + " " + c[2] })])); });
    var msg = "", cls = "ok";
    if (!live) { msg = "Live feed lost. Showing the last known layout."; cls = "warn"; }
    else if (bad.length) { msg = bad.length + (bad.length > 1 ? " devices need attention: " : " device needs attention: ") + bad.slice(0, 3).map(function (n) { return n.label || "device"; }).join(", "); cls = "bad"; }
    else if (map.nodes.length) msg = "All mapped devices are online";
    alertEl.className = "pm-alert " + cls; alertEl.style.display = msg ? "" : "none"; alertEl.textContent = msg;
  }
  function rebuild() { build(); paint(); renderSide(); renderBar(); renderEmpty(); renderPal(); }  function markDirty() { dirty = true; renderBar(); }
  function card(title) { return h("div", { "class": "pm-card" }, [h("div", { "class": "pm-sec", text: title })]); }
  function kv(par, k, v) { par.appendChild(h("div", { "class": "pm-kv" }, [h("span", { text: k }), h("span", { text: v })])); }
  function field(label, el) { return h("div", { "class": "pm-field" }, [h("label", { text: label }), el]); }
  function renderTop() {
    if (!ov) return; clr(topEl); chipsEl = h("div", { style: "display:flex;gap:8px" });
    topEl.appendChild(h("div", { "class": "pm-title", text: "Network map" })); topEl.appendChild(h("div", { "class": "pm-sub", text: "Live status of every mapped device and wire" }));
    topEl.appendChild(h("div", { "class": "pm-sp" })); topEl.appendChild(chipsEl);
    topEl.appendChild(h("button", { "class": "pm-b", type: "button", text: "Fit to screen", on: { click: fit } }));
    topEl.appendChild(h("button", { "class": "pm-b", type: "button", text: "Full screen", on: { click: function () { try { if (document.fullscreenElement) document.exitFullscreen(); else ov.requestFullscreen(); } catch (e) {} } } }));
    if (canEdit) topEl.appendChild(h("button", { "class": "pm-b" + (edit ? " on" : ""), type: "button", text: edit ? "Editing" : "Edit map", on: { click: function () { setEdit(!edit); } } }));
    topEl.appendChild(h("button", { "class": "pm-b", type: "button", text: "Close", on: { click: close } })); paint();
  }
  function renderEmpty() {
    var old = canvas && canvas.querySelector(".pm-empty"); if (old) old.parentNode.removeChild(old);
    if (map.nodes.length || !canvas) return;
    canvas.appendChild(h("div", { "class": "pm-empty" }, [h("div", null, [h("b", { text: edit ? "Your map is empty" : "No map has been designed yet" }), h("span", { text: edit ? "Click a device on the left to place it, then use Draw wire to connect devices." : "The admin has not published a network map yet." })])]));
  }
  function renderBar() {
    if (!barEl) return; barEl.style.display = edit ? "" : "none"; clr(barEl); if (!edit) return;
    var ws = h("select", { "class": "pm-sel", on: { change: function () { wireType = this.value; } } });
    WR.forEach(function (w) { var op = h("option", { value: w[0], text: w[1] }); if (w[0] === wireType) op.selected = true; ws.appendChild(op); });
    barEl.appendChild(h("button", { "class": "pm-b" + (tool === "select" ? " on" : ""), type: "button", text: "Select and move", on: { click: function () { setTool("select"); } } }));
    barEl.appendChild(h("button", { "class": "pm-b" + (tool === "wire" ? " on" : ""), type: "button", text: "Draw wire", on: { click: function () { setTool("wire"); } } }));
    barEl.appendChild(h("span", { "class": "pm-sub", text: "Wire type" })); barEl.appendChild(ws);
    barEl.appendChild(h("button", { "class": "pm-b red", type: "button", text: "Delete selected", on: { click: delSel } }));
    barEl.appendChild(h("div", { "class": "pm-sp" })); barEl.appendChild(h("span", { "class": "pm-sub", text: dirty ? "Unsaved changes" : "All changes saved" }));
    barEl.appendChild(h("button", { "class": "pm-b", type: "button", text: "Discard", on: { click: function () { if (confirm("Discard all unsaved changes?")) pullMap(true, function () { dirty = false; renderBar(); toast("Changes discarded"); }); } } }));
    barEl.appendChild(h("button", { "class": "pm-b gold", type: "button", text: "Save map", on: { click: save } }));
  }
  var trayOpen = {}, trayQ = "";
  function onMapFor(l) { for (var i = 0; i < map.nodes.length; i++) { var n = map.nodes[i]; if ((l.uid && n.uid === l.uid) || ((!n.uid || !byUid[n.uid]) && n.ip === l.ip)) return n; } return null; }
  function nextPos() { var k = map.nodes.length; return { x: (k % 6) * 140 - 350, y: Math.floor(k / 6) * 140 - 100 }; }
  function addLinkNode(l, type) { var p = nextPos(), n = { id: rid("n"), x: p.x, y: p.y, type: type, label: l.name, uid: l.uid || "", ip: l.ip }; map.nodes.push(n); sel = { t: "n", id: n.id }; markDirty(); rebuild(); fit(); }
  function pickType(l) {
    var hasSnmp = snmpHosts.indexOf(l.ip) > -1;
    var ovl = h("div", { style: "position:absolute;inset:0;z-index:30;background:rgba(3,6,14,.75);display:flex;align-items:center;justify-content:center;overflow:auto;padding:16px" });
    function done() { if (ovl.parentNode) ovl.parentNode.removeChild(ovl); }
    var box = h("div", { "class": "pm-card", style: "width:420px;max-width:100%;margin:0;padding:18px;max-height:100%;overflow:auto" });
    box.appendChild(h("div", { style: "font:700 16px 'Segoe UI';color:#f5d77a;margin-bottom:4px", text: "What type of device is this?" }));
    box.appendChild(h("div", { "class": "pm-sub", style: "white-space:normal;margin-bottom:6px", text: l.name + "  (" + l.ip + ")" }));
    box.appendChild(h("div", { "class": "pm-note", text: hasSnmp ? "SNMP is added for this link. Its interfaces are listed when you connect a wire." : "No SNMP for this link. It will be monitored by ping (ICMP)." }));
    var last = "";
    TY.forEach(function (t) {
      if (t[2] !== last) { box.appendChild(h("div", { "class": "pm-sec", text: t[2] })); last = t[2]; }
      box.appendChild(h("button", { "class": "pm-pi", type: "button", on: { click: function () { done(); addLinkNode(l, t[0]); } } }, [iconSvg(t[0], 26), h("span", { text: t[1] })]));
    });
    box.appendChild(h("button", { "class": "pm-b", type: "button", style: "width:100%;margin-top:8px", text: "Cancel", on: { click: done } }));
    ovl.appendChild(box); canvas.appendChild(ovl);
  }
  function renderPal() {
    if (!palEl) return;
    clr(palEl); palEl.style.display = edit ? "" : "none"; if (!edit) return;
    palEl.appendChild(h("div", { "class": "pm-sec", style: "color:#f5d77a", text: "Your links - click to add" }));
    var q = h("input", { "class": "pm-in", placeholder: "Search links...", value: trayQ, style: "margin-bottom:8px" });
    palEl.appendChild(q);
    var items = [];
    if (!cats.length) { palEl.appendChild(h("div", { "class": "pm-sub", style: "white-space:normal", text: "Loading links..." })); setTimeout(function () { if (edit && !cats.length) renderPal(); }, 1200); }
    cats.forEach(function (ct) {
      var list = ct.nodes || [], open = trayOpen[ct.name] !== false;
      palEl.appendChild(h("button", { "class": "pm-pi", type: "button", style: "background:#101a33;border-color:#243457", on: { click: function () { trayOpen[ct.name] = !open; renderPal(); } } }, [h("span", { text: (open ? "\u25BE " : "\u25B8 ") + ct.name + " (" + list.length + ")" })]));
      if (!open) return;
      list.forEach(function (l) {
        var on = onMapFor(l), col = l.status === "DOWN" ? "#ff2d55" : l.status === "FLAPPING" ? "#ff4fa3" : l.status === "ONLINE" ? "#2ed573" : "#64748b";
        var it = h("button", { "class": "pm-pi", type: "button", "data-q": (l.name + " " + l.ip).toLowerCase(), style: "padding-left:14px", on: { click: function () { var m = onMapFor(l); if (m) { sel = { t: "n", id: m.id }; paint(); renderSide(); } else pickType(l); } } }, [
          h("i", { style: "width:10px;height:10px;border-radius:50%;flex:none;background:" + col }),
          h("div", { style: "min-width:0" }, [h("div", { style: "overflow:hidden;text-overflow:ellipsis;white-space:nowrap", text: l.name }), h("div", { "class": "pm-sub", text: l.ip + (on ? "  \u2022 on map" : "") })])
        ]);
        items.push(it); palEl.appendChild(it);
      });
    });
    function filt() { trayQ = q.value.toLowerCase(); items.forEach(function (it) { it.style.display = (!trayQ || it.getAttribute("data-q").indexOf(trayQ) > -1) ? "" : "none"; }); }
    q.addEventListener("input", filt); if (trayQ) filt();
    var xo = trayOpen.__x === true;
    palEl.appendChild(h("button", { "class": "pm-pi", type: "button", style: "margin-top:10px;background:#101a33;border-color:#243457", on: { click: function () { trayOpen.__x = !xo; renderPal(); } } }, [h("span", { text: (xo ? "\u25BE " : "\u25B8 ") + "Other devices (no link)" })]));
    if (xo) TY.forEach(function (t) {
      palEl.appendChild(h("button", { "class": "pm-pi", type: "button", style: "padding-left:14px", on: { click: function () { var r = svg.getBoundingClientRect(), j = map.nodes.length % 6 * 24; addNode(t[0], (r.width / 2 - view.x) / view.k + j, (r.height / 2 - view.y) / view.k + j); } } }, [iconSvg(t[0], 26), h("span", { text: t[1] })]));
    });
  }
  function renderSide() {
    if (!sideEl) return; clr(sideEl);
    if (sel && sel.t === "n") return nodePanel(find(map.nodes, sel.id));
    if (sel && sel.t === "e") return edgePanel(find(map.edges, sel.id));
    var c1 = card("Device colours");
    [["#2ed573", "Online"], ["#ff2d55", "Down"], ["#ff4fa3", "Flapping"], ["#64748b", "Not monitored"]].forEach(function (r) { c1.appendChild(h("div", { style: "display:flex;align-items:center;gap:9px;margin:0 0 6px" }, [h("i", { style: "width:10px;height:10px;border-radius:50%;background:" + r[0] }), h("span", { text: r[1] })])); });
    sideEl.appendChild(c1);
    var c2 = card("Wires"), used = {}; map.edges.forEach(function (e) { used[e.type] = 1; });
    WR.forEach(function (w) { if (used[w[0]]) c2.appendChild(h("div", { style: "display:flex;align-items:center;gap:9px;margin:0 0 6px" }, [s("svg", { viewBox: "0 0 44 10", width: 44, height: 10 }, [s("path", { d: "M2 5H42", stroke: w[2], "stroke-width": w[3], "stroke-dasharray": w[4] || "none", "stroke-linecap": "round", fill: "none" })]), h("span", { text: w[1] })])); });
    c2.appendChild(h("div", { style: "display:flex;align-items:center;gap:9px" }, [s("svg", { viewBox: "0 0 44 10", width: 44, height: 10 }, [s("path", { d: "M2 5H42", stroke: "#ff2d55", "stroke-width": 3, "stroke-linecap": "round", fill: "none" })]), h("span", { text: "Red wire: a device on it is down" })]));
    sideEl.appendChild(c2); sideEl.appendChild(h("div", { "class": "pm-sub", style: "white-space:normal", text: "Click a device or wire for details. Scroll to zoom, drag the background to move." }));
  }
  function nodePanel(n) {
    if (!n) return; var S = stat[n.id] || { s: "unk", l: null }, l = S.l, T = TYPE[n.type] || TYPE.generic;
    var info = card("Status"); kv(info, "State", STX[S.s]);
    if (l) { kv(info, "Linked to", l.name); kv(info, "IP address", l.ip); kv(info, "Checked by", snmpHosts.indexOf(l.ip) > -1 ? "SNMP + ping" : "Ping (ICMP)"); if (S.s === "down" && l.downSince) kv(info, "Down for", dur(Date.now() - l.downSince)); else if (l.time) kv(info, "Response", l.time); } else kv(info, "Linked to", "Nothing yet");
    if (!edit) { var t0 = card(n.label || T.name); t0.appendChild(h("div", { "class": "pm-sub", text: T.name })); sideEl.appendChild(t0); sideEl.appendChild(info); return; }
    var c = card("Device");
    var ni = h("input", { "class": "pm-in", value: n.label || "", maxlength: "60" }); ni.addEventListener("input", function () { n.label = ni.value; paint(); markDown(); });
    function markDown() { dirty = true; }
    ni.addEventListener("change", renderBar); c.appendChild(field("Name on the map", ni));
    var ts = h("select", { "class": "pm-sel w" }), grp = null, last = "";
    TY.forEach(function (t) { if (t[2] !== last) { grp = h("optgroup", { label: t[2] }); ts.appendChild(grp); last = t[2]; } var op = h("option", { value: t[0], text: t[1] }); if (t[0] === n.type) op.selected = true; grp.appendChild(op); });
    ts.addEventListener("change", function () { n.type = ts.value; markDirty(); rebuild(); }); c.appendChild(field("Device type", ts));
    var cur = pickCat || (l && l._cat) || "";
    var cs = h("select", { "class": "pm-sel w" }, [h("option", { value: "", text: "- Not linked -" })]);
    cats.forEach(function (ct) { var op = h("option", { value: ct.name, text: ct.name }); if (ct.name === cur) op.selected = true; cs.appendChild(op); });
    var ls = h("select", { "class": "pm-sel w" }, [h("option", { value: "", text: "- Choose a link -" })]);
    cats.forEach(function (ct) { if (ct.name === cur) (ct.nodes || []).forEach(function (x) { var op = h("option", { value: x.uid || x.ip, text: x.name + "  (" + x.ip + ")" }); if (l && x.uid === l.uid) op.selected = true; ls.appendChild(op); }); });
    cs.addEventListener("change", function () { pickCat = cs.value; if (!cs.value) { n.uid = ""; n.ip = ""; markDirty(); } renderSide(); paint(); });
    ls.addEventListener("change", function () {
      var x = byUid[ls.value] || byIp[ls.value];
      if (x) { var auto = !n.label || n.label === T.name || (l && n.label === l.name); n.uid = x.uid || ""; n.ip = x.ip; if (auto) n.label = x.name; markDirty(); }
      renderSide(); paint();
    });
    c.appendChild(field("Category", cs)); c.appendChild(field("Monitored link", ls));
    if (l && snmpHosts.indexOf(l.ip) < 0) c.appendChild(h("div", { "class": "pm-note", text: "No SNMP for this link. It is tracked by ping. Choose the device type above." }));
    if (l && snmpHosts.indexOf(l.ip) > -1) c.appendChild(h("div", { "class": "pm-note", text: "SNMP found for this link. Its interfaces are listed when you connect a wire." }));
    c.appendChild(h("button", { "class": "pm-b red", type: "button", style: "width:100%", text: "Delete device", on: { click: delSel } }));
    sideEl.appendChild(c); sideEl.appendChild(info);
  }
  function edgePanel(e) {
    if (!e) return; var A = nodeBy[e.a], B = nodeBy[e.b], w = WIRE[e.type] || WIRE.utp, st = edgeState(e);
    var info = card("Wire"); kv(info, "From", A ? (A.label || "unnamed") : "-"); kv(info, "To", B ? (B.label || "unnamed") : "-"); kv(info, "From port", e.pa || "-"); kv(info, "To port", e.pb || "-"); kv(info, "Type", w.name); kv(info, "State", st === "down" ? "Broken: a device on it is down" : STX[st]);
    if (!edit) { sideEl.appendChild(info); return; }
    var c = card("Wire settings"), ts = h("select", { "class": "pm-sel w" });
    WR.forEach(function (x) { var op = h("option", { value: x[0], text: x[1] }); if (x[0] === e.type) op.selected = true; ts.appendChild(op); });
    ts.addEventListener("change", function () { e.type = ts.value; wireType = ts.value; markDirty(); rebuild(); }); c.appendChild(field("Wire type", ts));
    var li = h("input", { "class": "pm-in", value: e.label || "", maxlength: "40", placeholder: "10G, ether5, Dhaka-Uttara" }); li.addEventListener("input", function () { e.label = li.value; dirty = true; paint(); }); li.addEventListener("change", renderBar);
    c.appendChild(field("Label (speed, port, name)", li));
    c.appendChild(h("button", { "class": "pm-b red", type: "button", style: "width:100%", text: "Delete wire", on: { click: delSel } }));
    sideEl.appendChild(c); sideEl.appendChild(info);
  }
  function addNode(type, x, y) { var T = TYPE[type] || TYPE.generic, n = { id: rid("n"), x: Math.round(x / 20) * 20, y: Math.round(y / 20) * 20, type: type, label: T.name, uid: "", ip: "" }; map.nodes.push(n); sel = { t: "n", id: n.id }; pickCat = ""; markDirty(); rebuild(); }
  
  function pmPortsFor(n, cb) {
    var def = [{ name: "Port 1" }, { name: "Port 2" }];
    var l = n ? linkOf(n) : null;
    if (!l || snmpHosts.indexOf(l.ip) < 0) return cb(def, "No SNMP for this device - default 2 ports.");
    var fin = false;
    function end(p, note) { if (fin) return; fin = true; cb(p, note); }
    setTimeout(function () { end(def, "SNMP did not answer in time - default 2 ports."); }, 15000);
    fetch("/api/snmp-view/devices", { cache: "no-store" }).then(function (r) { return r.json(); }).then(function (j) {
      var d = ((j && j.devices) || []).filter(function (x) { return x.host === l.ip; })[0];
      if (!d) throw new Error("no device");
      return fetch("/api/snmp-view/" + encodeURIComponent(d.id) + "/live", { cache: "no-store" }).then(function (r) { return r.json(); });
    }).then(function (j) {
      var all = (j && j.interfaces) || [];
      var phys = all.filter(function (x) { return x.kind === "other" && x.type !== 24; });
      if (!phys.length) phys = all.filter(function (x) { return x.kind !== "pppoe"; });
      if (!phys.length) throw new Error("no interfaces");
      var out = phys.map(function (x) { return { name: String(x.name || ("if" + x.index)), oper: x.oper, speed: x.speed, alias: x.alias || "" }; });
      end(out, "Interfaces read from SNMP (" + out.length + ").");
    }).catch(function () { end(def, "SNMP did not answer - default 2 ports."); });
  }
  function pmAskPorts(aId, bId, done) {
    var A = nodeBy[aId], B = nodeBy[bId];
    function used(id) { var u = {}; map.edges.forEach(function (e) { if (e.a === id && e.pa) u[e.pa] = 1; if (e.b === id && e.pb) u[e.pb] = 1; }); return u; }
    function fmt(b) { if (!b) return ""; if (b >= 1e9) return (b / 1e9) + "G"; if (b >= 1e6) return (b / 1e6) + "M"; return ""; }
    var ov2 = document.createElement("div");
    ov2.style.cssText = "position:fixed;left:0;top:0;right:0;bottom:0;z-index:2147483647;background:rgba(3,6,14,.78);display:flex;align-items:center;justify-content:center;padding:16px;font-family:'Segoe UI',sans-serif";
    var box = document.createElement("div");
    box.style.cssText = "width:460px;max-width:100%;max-height:100%;overflow:auto;background:#0b1326;border:1px solid #243457;border-radius:12px;padding:18px;color:#e6edf7";
    ov2.appendChild(box); (ov || document.body).appendChild(ov2);
    function txt(t, css) { var d = document.createElement("div"); d.style.cssText = css || ""; d.textContent = t; box.appendChild(d); return d; }
    txt("Reading interfaces...", "color:#8fa3c7");
    pmPortsFor(A, function (pa, na) { pmPortsFor(B, function (pb, nb) {
      if (!ov2.parentNode) return;
      box.innerHTML = "";
      function pick(title, ports, uu, note) {
        txt(title, "font-weight:700;color:#f5d77a;margin:14px 0 4px");
        var sel = document.createElement("select");
        sel.style.cssText = "width:100%;padding:8px;background:#101a33;color:#e6edf7;border:1px solid #243457;border-radius:8px";
        ports.forEach(function (p) {
          var o = document.createElement("option"); o.value = p.name; var t = p.name;
          if (p.alias) t += "  (" + p.alias + ")";
          if (p.oper === 1) t += "  - up"; else if (p.oper === 2) t += "  - down";
          var sp = fmt(p.speed); if (sp) t += "  - " + sp;
          if (uu[p.name]) { t += "  [in use]"; o.disabled = true; }
          o.textContent = t; sel.appendChild(o);
        });
        sel.selectedIndex = -1;
        for (var i = 0; i < sel.options.length; i++) { if (!sel.options[i].disabled) { sel.selectedIndex = i; break; } }
        box.appendChild(sel);
        txt("Port name on the wire (you can edit):", "font-size:12px;color:#8fa3c7;margin-top:8px");
        var inp = document.createElement("input"); inp.type = "text"; inp.maxLength = 60;
        inp.style.cssText = "width:100%;box-sizing:border-box;padding:8px;background:#101a33;color:#e6edf7;border:1px solid #243457;border-radius:8px;margin-top:4px";
        inp.value = sel.selectedIndex >= 0 ? sel.value : "";
        sel.onchange = function () { inp.value = sel.value; };
        box.appendChild(inp); txt(note, "font-size:12px;color:#8fa3c7;margin-top:4px");
        return inp;
      }
      txt("Connect wire", "font:700 16px 'Segoe UI';color:#f5d77a");
      txt((A.label || "device") + "   to   " + (B.label || "device"), "font-size:13px;color:#8fa3c7;margin-top:2px");
      var iA = pick("Interface on " + (A.label || "device"), pa, used(aId), na);
      var iB = pick("Interface on " + (B.label || "device"), pb, used(bId), nb);
      var row = document.createElement("div"); row.style.cssText = "display:flex;gap:8px;margin-top:16px;flex-wrap:wrap"; box.appendChild(row);
      function btn(t, bg, fn) { var b = document.createElement("button"); b.type = "button"; b.textContent = t; b.style.cssText = "padding:8px 14px;border:0;border-radius:8px;cursor:pointer;color:#fff;background:" + bg; b.onclick = function () { if (ov2.parentNode) ov2.parentNode.removeChild(ov2); fn(); }; row.appendChild(b); }
      btn("Connect", "#1f8f55", function () { done(iA.value.trim(), iB.value.trim()); });
      btn("Connect without ports", "#33466e", function () { done("", ""); });
      btn("Cancel", "#7a2b3b", function () {});
    }); });
  }
  function addEdge(a, b) { pmAskPorts(a, b, function (pa, pb) { var e = { id: rid("w"), a: a, b: b, type: wireType, label: "", pa: pa, pb: pb }; map.edges.push(e); sel = { t: "e", id: e.id }; markDirty(); rebuild(); }); }
  function delSel() {
    if (!edit || !sel) return;
    if (sel.t === "n") { map.nodes = map.nodes.filter(function (n) { return n.id !== sel.id; }); map.edges = map.edges.filter(function (e) { return e.a !== sel.id && e.b !== sel.id; }); }
    else map.edges = map.edges.filter(function (e) { return e.id !== sel.id; });
    sel = null; markDirty(); rebuild();
  }
  function setTool(t) { tool = t; wireFrom = ""; rub.setAttribute("d", ""); canvas.className = "pm-canvas" + (t === "wire" ? " wire" : ""); renderBar(); paint(); }
  function setEdit(v) { edit = !!v && canEdit; tool = "select"; wireFrom = ""; sel = null; renderTop(); renderPal(); renderBar(); renderSide(); renderEmpty(); if (canvas) canvas.className = "pm-canvas"; }
  function save() {
    if (!tok) return toast("Log in from MANAGE first, then save again.", true);
    fetch("/api/netmap", { method: "POST", headers: { "Content-Type": "application/json", "x-manage-token": tok }, body: JSON.stringify({ map: { nodes: map.nodes, edges: map.edges }, rev: rev }) })
      .then(function (r) { return r.json().then(function (j) { return { ok: r.ok, j: j }; }); })
      .then(function (x) { if (x.ok) { rev = x.j.rev; dirty = false; renderBar(); toast("Map saved. Everyone sees it now."); } else toast(x.j.error || "Could not save the map.", true); })
      .catch(function () { toast("Could not reach Pariscope. Try again.", true); });
  }
  function toast(t, err) {
    if (!canvas) return; var old = canvas.querySelector(".pm-toast"); if (old) old.parentNode.removeChild(old);
    var el = h("div", { "class": "pm-toast" + (err ? " err" : ""), text: t }); canvas.appendChild(el);
    clearTimeout(toastT); toastT = setTimeout(function () { if (el.parentNode) el.parentNode.removeChild(el); }, err ? 5200 : 2600);
  }
  function hit(ev) { var t = ev.target; return t && t.closest ? t.closest("[data-nid],[data-eid]") : null; }
  function onDown(ev) {
    if (ev.button !== undefined && ev.button !== 0) return;
    var t = hit(ev), nid = t && t.getAttribute("data-nid"), eid = t && t.getAttribute("data-eid"); hideTip();
    if (edit && tool === "wire") {
      if (nid) { if (!wireFrom) { wireFrom = nid; } else if (wireFrom !== nid) { var a = wireFrom; wireFrom = ""; rub.setAttribute("d", ""); addEdge(a, nid); } } else { wireFrom = ""; rub.setAttribute("d", ""); }
      return;
    }
    if (nid) {
      sel = { t: "n", id: nid }; pickCat = "";
      if (edit) { var n = nodeBy[nid], p = wpt(ev); drag = { t: "n", id: nid, ox: p.x - n.x, oy: p.y - n.y, moved: false, sx: ev.clientX, sy: ev.clientY }; try { svg.setPointerCapture(ev.pointerId); } catch (e) {} }
      paint(); renderSide(); return;
    }
    if (eid) { sel = { t: "e", id: eid }; paint(); renderSide(); return; }
    sel = null; drag = { t: "p", sx: ev.clientX, sy: ev.clientY, vx: view.x, vy: view.y }; try { svg.setPointerCapture(ev.pointerId); } catch (e) {}
    paint(); renderSide();
  }
  function onMove(ev) {
    if (drag) {
      if (drag.t === "p") { view.x = drag.vx + ev.clientX - drag.sx; view.y = drag.vy + ev.clientY - drag.sy; applyView(); }
      else { if (!drag.moved && Math.abs(ev.clientX - drag.sx) + Math.abs(ev.clientY - drag.sy) < 4) return; drag.moved = true; var n = nodeBy[drag.id], p = wpt(ev); n.x = Math.round((p.x - drag.ox) / 20) * 20; n.y = Math.round((p.y - drag.oy) / 20) * 20; layout(); }
      return;
    }
    if (wireFrom && nodeBy[wireFrom]) { var q = wpt(ev), A = nodeBy[wireFrom]; rub.setAttribute("d", "M" + A.x + " " + A.y + "L" + q.x + " " + q.y); }
    var t = hit(ev); if (t) showTip(ev, t); else hideTip();
  }
  function onUp() { if (drag && drag.t === "n" && drag.moved) markDirty(); drag = null; }
  function onWheel(ev) {
    ev.preventDefault(); var r = svg.getBoundingClientRect(), mx = ev.clientX - r.left, my = ev.clientY - r.top, k2 = Math.min(3, Math.max(0.15, view.k * Math.exp(-ev.deltaY * 0.0015)));
    view.x = mx - (mx - view.x) * (k2 / view.k); view.y = my - (my - view.y) * (k2 / view.k); view.k = k2; applyView();
  }
  function onKey(ev) {
    if (!ov) return; var tg = ev.target && ev.target.tagName, typing = tg === "INPUT" || tg === "SELECT" || tg === "TEXTAREA";
    if ((ev.ctrlKey || ev.metaKey) && ev.key.toLowerCase() === "s" && edit) { ev.preventDefault(); return save(); }
    if (typing) return;
    if ((ev.key === "Delete" || ev.key === "Backspace") && edit && sel) { ev.preventDefault(); return delSel(); }
    if (ev.key === "Escape") { if (wireFrom) { wireFrom = ""; rub.setAttribute("d", ""); } else if (tool === "wire") setTool("select"); else if (sel) { sel = null; paint(); renderSide(); } else if (!document.fullscreenElement) close(); }
  }
  function showTip(ev, t) {
    var nid = t.getAttribute("data-nid"), eid = t.getAttribute("data-eid"), lines = [], title = "";
    if (nid) { var n = nodeBy[nid], S = stat[nid], T = TYPE[n.type] || TYPE.generic; title = n.label || T.name; lines.push(T.name + " - " + STX[S.s]); if (S.l) { lines.push(S.l.ip + (S.l.time && S.s !== "down" ? "  " + S.l.time : "")); if (S.s === "down" && S.l.downSince) lines.push("Down for " + dur(Date.now() - S.l.downSince)); } }
    else if (eid) { var e = find(map.edges, eid), A = nodeBy[e.a], B = nodeBy[e.b], w = WIRE[e.type] || WIRE.utp; title = (A.label || "device") + "  to  " + (B.label || "device"); lines.push(w.name + (e.label ? " - " + e.label : "")); lines.push(edgeState(e) === "down" ? "Broken: a device on this wire is down" : STX[edgeState(e)]); }
    clr(tipEl); tipEl.appendChild(h("b", { text: title })); lines.forEach(function (x) { tipEl.appendChild(h("div", { text: x })); });
    tipEl.style.display = "block"; tipEl.style.left = Math.min(window.innerWidth - 280, ev.clientX + 16) + "px"; tipEl.style.top = Math.min(window.innerHeight - 90, ev.clientY + 16) + "px";
  }
  function hideTip() { if (tipEl) tipEl.style.display = "none"; }
  function ensureCss() { if (!document.getElementById("pm-css")) { var st = h("style", { id: "pm-css" }); st.textContent = CSS; document.head.appendChild(st); } }
  function open(wantEdit) {
    ensureCss();
    if (!ov) {
      svg = s("svg", { xmlns: NS }, [s("defs", null, [
        s("pattern", { id: "pm-dots", width: 24, height: 24, patternUnits: "userSpaceOnUse" }, [s("circle", { cx: 1.5, cy: 1.5, r: 1.2, fill: "#1b2a4a" })]),
        s("linearGradient", { id: "pm-tile", x1: 0, y1: 0, x2: 0, y2: 1 }, [s("stop", { offset: "0", "stop-color": "#121c34" }), s("stop", { offset: "1", "stop-color": "#0a1122" })])
      ])]);
      world = s("g"); svg.appendChild(world);
      svg.addEventListener("pointerdown", onDown); svg.addEventListener("pointermove", onMove); svg.addEventListener("pointerup", onUp); svg.addEventListener("pointercancel", onUp); svg.addEventListener("pointerleave", hideTip); svg.addEventListener("wheel", onWheel, { passive: false });
      alertEl = h("div", { "class": "pm-alert ok", style: "display:none" }); canvas = h("div", { "class": "pm-canvas" }, [svg, alertEl]);
      palEl = h("div", { "class": "pm-pal", style: "display:none" }); sideEl = h("div", { "class": "pm-side" }); barEl = h("div", { "class": "pm-bar2", style: "display:none" }); tipEl = h("div", { "class": "pm-tip", style: "display:none" }); topEl = h("div", { "class": "pm-top" });
      ov = h("div", { "class": "pm-ov", role: "dialog", "aria-label": "Network map" }, [topEl, barEl, h("div", { "class": "pm-body" }, [palEl, canvas, sideEl]), tipEl]);
      document.body.appendChild(ov); document.addEventListener("keydown", onKey);
      edit = false; tool = "select"; sel = null; dirty = false; stat = {}; renderTop(); build();
      pullSnmp(); pullStatus(function () { pullMap(true, function (ok) { if (!ok) toast("Could not load the map. Sign in to the dashboard and try again.", true); paint(); renderSide(); renderEmpty(); fit(); }); });
      tm.push(setInterval(function () { pullStatus(paint); }, 2000)); tm.push(setInterval(function () { pullMap(false); }, 15000)); tm.push(setInterval(pullSnmp, 15000)); tm.push(setInterval(function () { pullRole(); }, 5000)); tm.push(setInterval(function () { if (!drag) paint(); }, 1000));
    }
    if (wantEdit) setTimeout(function () { pullRole(function () { if (canEdit) setEdit(true); else toast("Log in as admin in MANAGE first, then press Edit Graphical Mode again.", true); }); }, 450); else pullRole();
  }
  function close() {
    if (!ov) return; if (dirty && !confirm("You have unsaved changes. Close without saving?")) return;
    tm.forEach(clearInterval); tm = []; document.removeEventListener("keydown", onKey);
    try { if (document.fullscreenElement) document.exitFullscreen(); } catch (e) {}
    ov.parentNode.removeChild(ov); ov = null; edit = false; dirty = false;
  }
  function mount() {
    if (document.getElementById("pm-launch")) return; ensureCss();
    var b = h("button", { id: "pm-launch", "class": "pm-launch", type: "button", "aria-label": "Open graphical mode", on: { click: function () { open(false); } } });
    b.appendChild(s("svg", { viewBox: "0 0 24 24", fill: "none", stroke: "#f5d77a", "stroke-width": 1.8, "stroke-linecap": "round", "stroke-linejoin": "round" }, [s("circle", { cx: 12, cy: 5, r: 2.4 }), s("circle", { cx: 5, cy: 18, r: 2.4 }), s("circle", { cx: 19, cy: 18, r: 2.4 }), s("path", { d: "M12 7.4V12M12 12L6.3 16M12 12l5.7 4" })]));
    b.appendChild(h("span", { text: "Graphical Mode" })); document.body.appendChild(b);
  }
    var voiceOn = false, lastS = null, ico = 0;
  try { voiceOn = localStorage.getItem("pm-voice") === "1"; } catch (e) {}
  function mix(hex, k) { var n = parseInt(hex.slice(1), 16), r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255; function m(v, t) { return Math.round(v * k + t * (1 - k)); } return "rgb(" + m(r, 10) + "," + m(g, 17) + "," + m(b, 34) + ")"; }
  function lin(id, a, b) { return s("linearGradient", { id: id, x1: 0, y1: 0, x2: 0, y2: 1 }, [s("stop", { offset: "0", "stop-color": a }), s("stop", { offset: "1", "stop-color": b })]); }
  function defs3() {
    var d = svg && svg.querySelector("defs"); if (!d || d.querySelector("#pm-red")) return;
    d.appendChild(lin("pm-red", "#ff5d7a", "#6e0a20"));
    d.appendChild(s("linearGradient", { id: "pm-gloss", x1: 0, y1: 0, x2: 0, y2: 1 }, [s("stop", { offset: "0", "stop-color": "#fff", "stop-opacity": ".5" }), s("stop", { offset: "1", "stop-color": "#fff", "stop-opacity": "0" })]));
    TY.forEach(function (t) { d.appendChild(lin("pm3-" + t[0], mix(t[3], .5), mix(t[3], .12))); });
  }
  function decorate() {
    defs3();
    map.nodes.forEach(function (n) {
      var o = els.n[n.id]; if (!o || o.g.querySelector(".pm-depth")) return;
      var T = TYPE[n.type] || TYPE.generic;
      var dep = s("rect", { x: -HALF, y: -HALF + 7, width: HALF * 2, height: HALF * 2, rx: 16, "class": "pm-depth", stroke: T.c, "stroke-opacity": ".45" });
      o.tile.setAttribute("fill", "url(#pm3-" + (TYPE[n.type] ? n.type : "generic") + ")");
      var gloss = s("rect", { x: -HALF + 3, y: -HALF + 3, width: HALF * 2 - 6, height: HALF - 2, rx: 13, fill: "url(#pm-gloss)", "class": "pm-gloss" });
      var emb = s("path", { d: T.p, fill: "none", stroke: "#000", "stroke-opacity": ".55", "stroke-width": 2.6, "stroke-linecap": "round", "stroke-linejoin": "round", transform: "translate(0 2) scale(1.2)", "class": "pm-gloss" });
      o.g.insertBefore(dep, o.glow); o.g.insertBefore(gloss, o.gl); o.g.insertBefore(emb, o.gl);
    });
    map.edges.forEach(function (e) {
      var o = els.e[e.id]; if (!o || o.g.querySelector(".pm-tb")) return;
      var w = WIRE[e.type] || WIRE.utp;
      o.tb = s("path", { "class": "pm-tb", "stroke-width": w.w + 4 });
      o.hl = s("path", { "class": "pm-hl", transform: "translate(0 -.8)" });
      o.g.insertBefore(o.tb, o.g.firstChild); o.g.insertBefore(o.hl, o.flow);
    });
    layout();
  }
  var _lay = layout; layout = function () { _lay(); map.edges.forEach(function (e) { var o = els.e[e.id]; if (o && o.tb) { var d = o.main.getAttribute("d"); o.tb.setAttribute("d", d); o.hl.setAttribute("d", d); } }); };
  var _bld = build; build = function () { _bld(); decorate(); };
  iconSvg = function (t, size) {
    var T = TYPE[t] || TYPE.generic, id = "pmi" + (++ico);
    return s("svg", { viewBox: "-16 -16 32 32", width: size, height: size }, [
      s("defs", null, [lin(id, mix(T.c, .5), mix(T.c, .12))]),
      s("rect", { x: -15, y: -14, width: 30, height: 30, rx: 8, fill: "#05080f", stroke: T.c, "stroke-opacity": ".4" }),
      s("rect", { x: -15, y: -15, width: 30, height: 29, rx: 8, fill: "url(#" + id + ")", stroke: T.c, "stroke-opacity": ".8" }),
      s("rect", { x: -13, y: -13, width: 26, height: 12, rx: 6, fill: "url(#pm-gloss)" }),
      s("path", { d: T.p, fill: "none", stroke: "#000", "stroke-opacity": ".5", "stroke-width": 2.4, "stroke-linecap": "round", "stroke-linejoin": "round", transform: "translate(0 1.2)" }),
      s("path", { d: T.p, fill: "none", stroke: T.c, "stroke-width": 2.2, "stroke-linecap": "round", "stroke-linejoin": "round" })
    ]);
  };
  function say(t) { try { if (!window.speechSynthesis) return; var u = new SpeechSynthesisUtterance(t); u.rate = 0.95; u.lang = "en-US"; window.speechSynthesis.speak(u); } catch (e) {} }
  function vname(n) { var S = stat[n.id]; return n.label || (S && S.l && S.l.name) || "device"; }
  function voiceCheck() {
    var cur = {}, first = (lastS === null);
    map.nodes.forEach(function (n) { var S = stat[n.id]; if (S) cur[n.id] = S.s; });
    if (!first && voiceOn && live) {
      map.nodes.forEach(function (n) {
        var a = lastS[n.id], b = cur[n.id]; if (!a || !b || a === b) return;
        if (b === "down") say("Alert. " + vname(n) + " is down.");
        else if (b === "flap") say("Warning. " + vname(n) + " is flapping.");
        else if (b === "up" && (a === "down" || a === "flap")) say(vname(n) + " is back online.");
      });
    }
    lastS = cur;
  }
  function toggleVoice() {
    voiceOn = !voiceOn; try { localStorage.setItem("pm-voice", voiceOn ? "1" : "0"); } catch (e) {}
    if (voiceOn) { var bad = 0; map.nodes.forEach(function (n) { var S = stat[n.id]; if (S && S.s === "down") bad++; }); say("Voice alert is on." + (bad ? " " + bad + (bad > 1 ? " devices are" : " device is") + " down now." : "")); }
    else { try { window.speechSynthesis.cancel(); } catch (e) {} }
    renderTop();
  }
  var _rtop = renderTop;
  renderTop = function () {
    _rtop();
    if (!topEl || !chipsEl) return;
    var b = h("button", { "class": "pm-b" + (voiceOn ? " vo" : ""), type: "button", title: "Speak a warning when a device goes down", text: voiceOn ? "\uD83D\uDD0A Voice alert: On" : "\uD83D\uDD07 Voice alert: Off", on: { click: toggleVoice } });
    topEl.insertBefore(b, chipsEl.nextSibling);
  };
  var _pt = paint; paint = function () { _pt(); voiceCheck(); };
  var _cl = close; close = function () { _cl(); lastS = null; };
  window.PariscopeMap = { open: open, close: close };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", mount); else mount();
})();
(function () {
  "use strict";
  if (window.__ifhLoaded) return; window.__ifhLoaded = 1;
  var BASE = "/api/snmp-view/";
  var RANGES = [["1h", "1 Hour"], ["6h", "6 Hours"], ["24h", "24 Hours"], ["7d", "7 Days"], ["30d", "30 Days"], ["6m", "6 Months"], ["1y", "1 Year"]];
  var C = { inn: "#2fd39a", out: "#5aa9ff", down: "#ff5d7a" };
  var MON = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  var G = { W: 900, H: 300, L: 66, R: 14, T: 14, B: 30 };
  var esc = function (s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); };
  function two(n) { return n < 10 ? "0" + n : "" + n; }
  function fmtT(ms, long) { var d = new Date(ms), t = two(d.getHours()) + ":" + two(d.getMinutes()); if (long === 2) return MON[d.getMonth()] + " " + d.getDate() + ", " + d.getFullYear(); return long ? MON[d.getMonth()] + " " + d.getDate() + ", " + t : t; }
  function fmtStep(ms) { var m = Math.round(ms / 60000); if (m < 60) return m + " min"; var h = m / 60; if (h < 24) return (Math.round(h * 10) / 10) + " hour"; return (Math.round(h / 24 * 10) / 10) + " day"; }
  function fmtRate(b) { if (b == null) return "-"; if (b < 1e3) return Math.round(b) + " bps"; if (b < 1e6) return (b / 1e3).toFixed(1) + " Kbps"; if (b < 1e9) return (b / 1e6).toFixed(2) + " Mbps"; return (b / 1e9).toFixed(2) + " Gbps"; }
  function fmtBytes(b) { if (b == null) return "-"; var u = ["B", "KB", "MB", "GB", "TB", "PB"], i = 0; while (b >= 1024 && i < u.length - 1) { b /= 1024; i++; } return b.toFixed(i ? 1 : 0) + " " + u[i]; }
  function niceMax(v) { if (!(v > 0)) return 1; var p = Math.pow(10, Math.floor(Math.log(v) / Math.LN10)), n = v / p; return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10) * p; }
  function getJ(u) {
    return fetch(u, { cache: "no-store" }).then(function (r) {
      return r.json().catch(function () { return {}; }).then(function (j) { if (!r.ok) throw new Error(j.error || ("HTTP " + r.status)); return j; });
    });
  }

  function css() {
    if (document.getElementById("ifh-css")) return;
    var s = document.createElement("style"); s.id = "ifh-css";
    s.textContent = [
      ".ifh-open{margin-left:14px;padding:8px 16px;border:0;border-radius:10px;cursor:pointer;font:700 13px system-ui,Segoe UI,sans-serif;color:#1a1304;background:linear-gradient(135deg,#ffd86b,#c9960c);box-shadow:0 4px 14px rgba(245,197,66,.25);vertical-align:middle}",
      ".ifh-open:hover{filter:brightness(1.1)}",
      ".ifh-ov{position:fixed;inset:0;z-index:2147483000;background:rgba(3,6,12,.78);backdrop-filter:blur(4px);display:flex;align-items:center;justify-content:center;padding:18px;font-family:system-ui,Segoe UI,sans-serif;color:#e8edf5}",
      ".ifh-box{width:min(1240px,100%);height:min(780px,100%);background:#0b111b;border:1px solid rgba(245,197,66,.28);border-radius:18px;box-shadow:0 30px 90px rgba(0,0,0,.65);display:flex;flex-direction:column;overflow:hidden}",
      ".ifh-top{display:flex;justify-content:space-between;align-items:center;padding:16px 22px;border-bottom:1px solid rgba(255,255,255,.07);background:linear-gradient(180deg,#121a29,#0b111b)}",
      ".ifh-title{font-size:20px;font-weight:800}.ifh-dev{color:#f5c542}",
      ".ifh-sub{font-size:12px;color:#8b97ab;margin-top:3px}",
      ".ifh-x{padding:8px 20px;border:0;border-radius:10px;cursor:pointer;font-weight:700;color:#1a1304;background:linear-gradient(135deg,#ffd86b,#c9960c)}",
      ".ifh-body{flex:1;display:flex;min-height:0}",
      ".ifh-side{width:290px;border-right:1px solid rgba(255,255,255,.07);display:flex;flex-direction:column;padding:14px;gap:10px;background:#0d1420}",
      ".ifh-side input{width:100%;box-sizing:border-box;padding:9px 12px;border-radius:10px;border:1px solid rgba(255,255,255,.1);background:#070b12;color:#e8edf5;outline:none}",
      ".ifh-side input:focus{border-color:#f5c542}",
      ".ifh-tabs{display:flex;gap:8px}",
      ".ifh-tab{flex:1;padding:8px 6px;border-radius:10px;border:1px solid rgba(255,255,255,.1);background:#141c2b;color:#c5cddb;font-weight:700;font-size:12px;cursor:pointer}",
      ".ifh-tab.on{background:linear-gradient(135deg,#ffd86b,#c9960c);color:#1a1304;border-color:transparent}",
      ".ifh-list{flex:1;overflow:auto;display:flex;flex-direction:column;gap:6px;padding-right:2px}",
      ".ifh-it{display:flex;align-items:center;gap:10px;text-align:left;padding:10px 12px;border-radius:11px;border:1px solid rgba(255,255,255,.06);background:#121a29;color:#e8edf5;cursor:pointer}",
      ".ifh-it:hover{border-color:rgba(245,197,66,.45)}",
      ".ifh-it.on{border-color:#f5c542;background:linear-gradient(135deg,rgba(245,197,66,.16),rgba(245,197,66,.04))}",
      ".ifh-dot{width:9px;height:9px;border-radius:50%;flex:none}.ifh-dot.up{background:#2fd39a;box-shadow:0 0 8px #2fd39a}.ifh-dot.dn{background:#ff5d7a}.ifh-dot.na{background:#566074}",
      ".ifh-nm{flex:1;min-width:0;font-weight:700;font-size:13px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}",
      ".ifh-nm small{display:block;font-weight:400;color:#8b97ab;font-size:11px;overflow:hidden;text-overflow:ellipsis}",
      ".ifh-rt{font-size:11px;color:#8b97ab;font-family:Consolas,monospace;white-space:nowrap}",
      ".ifh-main{flex:1;overflow:auto;padding:18px 22px}",
      ".ifh-mh{display:flex;justify-content:space-between;align-items:flex-start;gap:12px;flex-wrap:wrap;margin-bottom:14px}",
      ".ifh-mt{font-size:20px;font-weight:800;display:flex;align-items:center;gap:10px}",
      ".ifh-ms{font-size:12px;color:#8b97ab;margin-top:3px}",
      ".ifh-pill{font-size:11px;font-weight:800;padding:3px 10px;border-radius:99px;border:1px solid}",
      ".ifh-pill.up{color:#2fd39a;border-color:#2fd39a}.ifh-pill.dn{color:#ff5d7a;border-color:#ff5d7a}.ifh-pill.na{color:#8b97ab;border-color:#566074}",
      ".ifh-rng{display:flex;gap:8px;flex-wrap:wrap}",
      ".ifh-r{padding:7px 14px;border-radius:99px;border:1px solid rgba(255,255,255,.12);background:#141c2b;color:#c5cddb;font-weight:700;font-size:12px;cursor:pointer}",
      ".ifh-r.on{background:#2f6fed;color:#fff;border-color:#2f6fed}",
      ".ifh-cards{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:12px;margin-bottom:16px}",
      ".ifh-c{background:#121a29;border:1px solid rgba(255,255,255,.07);border-radius:13px;padding:12px 14px}",
      ".ifh-c b{display:block;font-size:11px;letter-spacing:.06em;color:#8b97ab;text-transform:uppercase}",
      ".ifh-c span{display:block;font-size:21px;font-weight:800;margin-top:4px}",
      ".ifh-c i{display:block;font-style:normal;font-size:11px;color:#8b97ab;margin-top:2px}",
      ".ifh-chart{position:relative;background:#0d1420;border:1px solid rgba(255,255,255,.07);border-radius:14px;padding:8px}",
      ".ifh-svg{width:100%;height:auto;display:block}",
      ".ifh-grid{stroke:rgba(255,255,255,.07);stroke-width:1}",
      ".ifh-ax{fill:#8b97ab;font-size:11px;font-family:Consolas,monospace}",
      ".ifh-vl{stroke:rgba(245,197,66,.7);stroke-width:1;stroke-dasharray:4 3}",
      ".ifh-tip{position:absolute;top:12px;z-index:3;pointer-events:none;min-width:200px;background:rgba(8,12,20,.96);border:1px solid rgba(245,197,66,.4);border-radius:10px;padding:10px 12px;font-size:12px;line-height:1.55}",
      ".ifh-tip b{color:#f5c542}",
      ".ifh-leg{display:flex;gap:18px;font-size:12px;color:#8b97ab;margin:10px 4px;flex-wrap:wrap}",
      ".ifh-leg i{display:inline-block;width:12px;height:12px;border-radius:3px;margin-right:6px;vertical-align:-2px}",
      ".ifh-note{font-size:11px;color:#6f7b90;margin:0 4px}",
      ".ifh-empty{padding:30px 16px;text-align:center;color:#8b97ab;font-size:13px;line-height:1.7}",
      ".ifh-empty.big{padding:90px 30px;font-size:15px}"
    ].join("");
    document.head.appendChild(s);
  }

  function open(dev) {
    css();
    var S = { list: [], tab: "if", sel: null, range: "24h", q: "", seq: 0, timer: 0, data: null };
    var ov = document.createElement("div"); ov.className = "ifh-ov";
    ov.innerHTML = '<div class="ifh-box"><div class="ifh-top"><div><div class="ifh-title">Interface History <span class="ifh-dev">' + esc(dev.name) + '</span></div><div class="ifh-sub">' + esc(dev.host) + ' &middot; links &amp; VLANs &middot; 5-minute detail for 31 days, hourly summary kept for 1 year</div></div><button class="ifh-x" data-f="x">Close</button></div>' +
      '<div class="ifh-body"><div class="ifh-side"><input data-f="q" placeholder="Search interface..."><div class="ifh-tabs" data-f="tabs"></div><div class="ifh-list" data-f="list"></div></div><div class="ifh-main" data-f="main"><div class="ifh-empty big">Loading...</div></div></div></div>';
    document.body.appendChild(ov);
    function F(n) { return ov.querySelector('[data-f="' + n + '"]'); }
    function close() { clearInterval(S.timer); document.removeEventListener("keydown", onKey, true); if (ov.parentNode) ov.parentNode.removeChild(ov); }
    function onKey(e) { if (e.key === "Escape") { e.stopPropagation(); close(); } }
    document.addEventListener("keydown", onKey, true);
    ov.addEventListener("mousedown", function (e) { if (e.target === ov) close(); });
    F("x").onclick = close;

    function inTab(i) { return S.tab === "vl" ? i.kind === "vlan" : i.kind !== "vlan"; }
    function pickDefault() {
      var l = S.list.filter(inTab);
      if (!l.some(function (i) { return i.name === S.sel; })) S.sel = l.length ? l[0].name : null;
    }
    function paintList() {
      var nI = S.list.filter(function (i) { return i.kind !== "vlan"; }).length, nV = S.list.length - nI;
      F("tabs").innerHTML = '<button class="ifh-tab' + (S.tab === "if" ? " on" : "") + '" data-t="if">Interfaces (' + nI + ')</button><button class="ifh-tab' + (S.tab === "vl" ? " on" : "") + '" data-t="vl">VLANs (' + nV + ')</button>';
      var items = S.list.filter(inTab).filter(function (i) { return !S.q || (i.name + " " + i.alias).toLowerCase().indexOf(S.q) >= 0; });
      F("list").innerHTML = items.length ? items.map(function (i) {
        var cls = i.stale ? "na" : (i.op === 1 ? "up" : "dn");
        var tot = i.stale ? "no data" : fmtRate((i.inBps || 0) + (i.outBps || 0));
        return '<button class="ifh-it' + (i.name === S.sel ? " on" : "") + '" data-n="' + esc(i.name) + '"><span class="ifh-dot ' + cls + '"></span><span class="ifh-nm">' + esc(i.name) + (i.alias ? "<small>" + esc(i.alias) + "</small>" : "") + '</span><span class="ifh-rt">' + tot + "</span></button>";
      }).join("") : '<div class="ifh-empty">' + (S.tab === "vl" ? "No VLAN found on this device." : "Nothing found.") + "</div>";
    }
    F("q").oninput = function () { S.q = this.value.toLowerCase(); paintList(); };
    F("tabs").onclick = function (e) { var b = e.target.closest("[data-t]"); if (!b) return; S.tab = b.getAttribute("data-t"); pickDefault(); paintList(); loadSeries(); };
    F("list").onclick = function (e) { var b = e.target.closest("[data-n]"); if (!b) return; S.sel = b.getAttribute("data-n"); paintList(); loadSeries(); };
    F("main").onclick = function (e) { var b = e.target.closest("[data-r]"); if (!b) return; S.range = b.getAttribute("data-r"); loadSeries(); };

    function loadList() {
      return getJ(BASE + encodeURIComponent(dev.id) + "/ifh/list").then(function (j) {
        S.list = j.interfaces || [];
        if (!S.list.length) {
          paintList();
          F("main").innerHTML = '<div class="ifh-empty big">History collection has started for this device.<br>The first points appear within a minute or two. Come back in a few minutes.<br>(History is recorded from now on; older traffic was never stored.)</div>';
          return;
        }
        pickDefault(); paintList(); return loadSeries();
      }).catch(function (e) { F("main").innerHTML = '<div class="ifh-empty big">\u26A0 ' + esc(e.message) + "</div>"; });
    }

    function loadSeries() {
      if (!S.sel) { F("main").innerHTML = '<div class="ifh-empty big">Select an interface on the left.</div>'; return; }
      var my = ++S.seq;
      return getJ(BASE + encodeURIComponent(dev.id) + "/ifh/series?name=" + encodeURIComponent(S.sel) + "&range=" + S.range).then(function (j) {
        if (my !== S.seq) return; S.data = j; paintMain();
      }).catch(function (e) { if (my === S.seq) F("main").innerHTML = '<div class="ifh-empty big">\u26A0 ' + esc(e.message) + "</div>"; });
    }

    function card(l, v, s, col) { return '<div class="ifh-c"><b>' + l + "</b><span" + (col ? ' style="color:' + col + '"' : "") + ">" + v + "</span><i>" + (s || "&nbsp;") + "</i></div>"; }

    function chartSvg(j) {
      var W = G.W, H = G.H, L = G.L, R = G.R, T = G.T, B = G.B, cw = W - L - R, ch = H - T - B, span = (j.to - j.from) || 1;
      var pts = j.points || [], mx = 0, any = false;
      pts.forEach(function (p) { if (p[1] != null) { any = true; if (p[1] > mx) mx = p[1]; if (p[2] > mx) mx = p[2]; } });
      if (!any) return null;
      var ymax = niceMax(mx);
      function X(t) { return L + Math.max(0, Math.min(1, (t - j.from) / span)) * cw; }
      function Y(v) { return T + ch - (v / ymax) * ch; }
      var s = '<svg class="ifh-svg" viewBox="0 0 ' + W + " " + H + '">', i;
      for (i = 0; i <= 4; i++) { var y = Y(ymax * i / 4); s += '<line class="ifh-grid" x1="' + L + '" x2="' + (W - R) + '" y1="' + y + '" y2="' + y + '"/><text class="ifh-ax" x="' + (L - 8) + '" y="' + (y + 4) + '" text-anchor="end">' + esc(fmtRate(ymax * i / 4)) + "</text>"; }
      var long = (S.range === "6m" || S.range === "1y") ? 2 : (S.range === "7d" || S.range === "30d");
      for (i = 0; i <= 5; i++) { var t = j.from + span * i / 5; s += '<text class="ifh-ax" x="' + X(t) + '" y="' + (H - 8) + '" text-anchor="' + (i === 0 ? "start" : i === 5 ? "end" : "middle") + '">' + esc(fmtT(t, long)) + "</text>"; }
      var bw = Math.max(2, j.step / span * cw);
      pts.forEach(function (p) { if (p[5] !== 1) s += '<rect x="' + X(p[0]) + '" y="' + T + '" width="' + bw + '" height="' + ch + '" fill="' + C.down + '" opacity=".22"/>'; });
      function layer(idx, col) {
        var segs = [], cur = [], out = "";
        pts.forEach(function (p) { if (p[idx] == null) { if (cur.length) segs.push(cur); cur = []; } else cur.push([X(Math.min(p[0] + j.step / 2, j.to)), Y(p[idx])]); });
        if (cur.length) segs.push(cur);
        segs.forEach(function (sg) {
          if (sg.length === 1) { out += '<circle cx="' + sg[0][0] + '" cy="' + sg[0][1] + '" r="2.5" fill="' + col + '"/>'; return; }
          var d = "M" + sg.map(function (q) { return q[0].toFixed(1) + "," + q[1].toFixed(1); }).join(" L");
          out += '<path d="' + d + " L" + sg[sg.length - 1][0].toFixed(1) + "," + (T + ch) + " L" + sg[0][0].toFixed(1) + "," + (T + ch) + ' Z" fill="' + col + '" opacity=".14"/><path d="' + d + '" fill="none" stroke="' + col + '" stroke-width="1.8" stroke-linejoin="round"/>';
        });
        return out;
      }
      s += layer(1, C.inn) + layer(2, C.out);
      s += '<line class="ifh-vl" x1="0" x2="0" y1="' + T + '" y2="' + (T + ch) + '" style="display:none"/></svg>';
      return s;
    }

    function bindChart(j) {
      var wrap = F("main").querySelector(".ifh-chart"); if (!wrap) return;
      var svg = wrap.querySelector("svg"); if (!svg) return;
      var vl = svg.querySelector(".ifh-vl"), tip = wrap.querySelector(".ifh-tip");
      var cw = G.W - G.L - G.R, span = (j.to - j.from) || 1;
      function hide() { vl.style.display = "none"; tip.style.display = "none"; }
      wrap.onmouseleave = hide;
      wrap.onmousemove = function (e) {
        var r = svg.getBoundingClientRect(), sx = (e.clientX - r.left) / r.width * G.W;
        if (sx < G.L || sx > G.W - G.R) return hide();
        var t = j.from + (sx - G.L) / cw * span, best = null, bd = 1e18;
        (j.points || []).forEach(function (p) { var dd = Math.abs(p[0] + j.step / 2 - t); if (dd < bd) { bd = dd; best = p; } });
        if (!best || bd > j.step) return hide();
        var px = G.L + Math.max(0, Math.min(1, (Math.min(best[0] + j.step / 2, j.to) - j.from) / span)) * cw;
        vl.setAttribute("x1", px); vl.setAttribute("x2", px); vl.style.display = "";
        var st = best[5] === 1 ? '<span style="color:' + C.inn + '">UP</span>' : '<span style="color:' + C.down + '">DOWN at some point</span>';
        tip.innerHTML = "<b>" + esc(fmtT(best[0], (S.range === "6m" || S.range === "1y") ? 2 : true)) + "</b> (" + fmtStep(j.step) + ")<br><span style=\"color:" + C.inn + '">\u25CF In</span> ' + fmtRate(best[1]) + " &middot; peak " + fmtRate(best[3]) + '<br><span style="color:' + C.out + '">\u25CF Out</span> ' + fmtRate(best[2]) + " &middot; peak " + fmtRate(best[4]) + "<br>" + st;
        tip.style.display = "";
        var wr = wrap.getBoundingClientRect(), left = e.clientX - wr.left + 16;
        if (left + 230 > wr.width) left = e.clientX - wr.left - 236;
        tip.style.left = Math.max(4, left) + "px";
      };
    }

    function paintMain() {
      var j = S.data, su = j.summary || {}, it = null;
      S.list.forEach(function (i) { if (i.name === j.name) it = i; });
      var pill = (it && it.stale) ? '<span class="ifh-pill na">NO RECENT DATA</span>' : (su.current == null ? '<span class="ifh-pill na">NO DATA</span>' : (su.current === 1 ? '<span class="ifh-pill up">UP</span>' : '<span class="ifh-pill dn">DOWN</span>'));
      var rng = RANGES.map(function (r) { return '<button class="ifh-r' + (r[0] === S.range ? " on" : "") + '" data-r="' + r[0] + '">' + r[1] + "</button>"; }).join("");
      var cards = card("Average In", fmtRate(su.avgIn), "download", C.inn) + card("Average Out", fmtRate(su.avgOut), "upload", C.out) +
        card("Peak In", fmtRate(su.peakIn), su.peakInAt ? fmtT(su.peakInAt, true) : "") + card("Peak Out", fmtRate(su.peakOut), su.peakOutAt ? fmtT(su.peakOutAt, true) : "") +
        card("Link up", su.upPct == null ? "-" : su.upPct.toFixed(2) + "%", (su.samples || 0) + " samples", su.upPct != null && su.upPct < 99 ? C.down : null) +
        card("Data transferred", fmtBytes(su.bytesIn), "in &middot; out " + fmtBytes(su.bytesOut));
      var svg = chartSvg(j);
      F("main").innerHTML = '<div class="ifh-mh"><div><div class="ifh-mt">' + esc(j.name) + " " + pill + '</div><div class="ifh-ms">' + (j.kind === "vlan" ? "VLAN interface" : "Interface") + (j.alias ? " &middot; " + esc(j.alias) : "") + (j.speed ? " &middot; " + esc(fmtRate(j.speed)) : "") + '</div></div><div class="ifh-rng">' + rng + "</div></div>" +
        '<div class="ifh-cards">' + cards + "</div>" +
        '<div class="ifh-chart">' + (svg || '<div class="ifh-empty">No traffic samples in this period yet.</div>') + '<div class="ifh-tip" style="display:none"></div></div>' +
        '<div class="ifh-leg"><span><i style="background:' + C.inn + '"></i>In (download)</span><span><i style="background:' + C.out + '"></i>Out (upload)</span><span><i style="background:' + C.down + ';opacity:.5"></i>Interface was down</span></div>' +
        '<div class="ifh-note">History is recorded from ' + (su.trackingSince ? esc(fmtT(su.trackingSince, true)) : "now") + ". Each point is the average of " + fmtStep(j.step) + "; peaks are shown on hover.</div>";
      bindChart(j);
    }

    loadList();
    S.timer = setInterval(loadList, 60000);
  }

  function findRoot(from) {
    var el = from;
    for (var i = 0; i < 14 && el; i++) {
      el = el.parentNode; if (!el || el === document.body) return null;
      var bs = el.querySelectorAll("button");
      for (var k = 0; k < bs.length; k++) if (/^\s*close\s*$/i.test(bs[k].textContent)) return el;
    }
    return null;
  }
  function resolve(root, cb) {
    getJ(BASE + "devices").then(function (j) {
      var txt = root.textContent || "", l = (j.devices || []).filter(function (d) { return txt.indexOf(d.host) >= 0; });
      if (l.length > 1) { var l2 = l.filter(function (d) { return txt.indexOf(d.name) >= 0; }); if (l2.length) l = l2; }
      if (!l.length) { alert("Interface History: could not tell which SNMP device this window shows."); return; }
      cb(l[0]);
    }).catch(function (e) { alert("Interface History: " + e.message); });
  }
  function scan() {
    css();
    var qs = document.querySelectorAll('[data-f="q"]');
    for (var i = 0; i < qs.length; i++) {
      var q = qs[i];
      if (q.closest(".ifh-ov") || !q.parentNode || q.parentNode.querySelector(".ifh-open")) continue;
      var root = findRoot(q);
      if (!root || !root.querySelector('[data-f="tabs"]')) continue;
      var b = document.createElement("button");
      b.type = "button"; b.className = "ifh-open"; b.textContent = "\uD83D\uDCC8 Interface History";
      (function (rt) { b.onclick = function (e) { e.preventDefault(); e.stopPropagation(); resolve(rt, open); }; })(root);
      q.parentNode.appendChild(b);
    }
  }
  var pend = 0;
  function later() { if (pend) return; pend = setTimeout(function () { pend = 0; try { scan(); } catch (e) {} }, 150); }
  function start() { new MutationObserver(later).observe(document.body, { childList: true, subtree: true }); later(); }
  if (document.body) start(); else document.addEventListener("DOMContentLoaded", start);
  window.PariscopeIfHistory = { open: open };
})();
(function () {
  "use strict";
  if (window.__svcLoaded) return; window.__svcLoaded = 1;
  var STAND = /\/services\.html$/i.test(location.pathname), TOK = "";
  try { var _f = window.fetch; if (_f) window.fetch = function (u, o) { try { var hd = o && o.headers, t = hd && (typeof hd.get === "function" ? hd.get("x-manage-token") : hd["x-manage-token"]); if (t) TOK = t; } catch (e) {} return _f.apply(this, arguments); }; } catch (e) {}
  var ST = {
    DOWN: { l: "DOWN", r: 0, c: "#ff3b57" }, FLAPPING: { l: "FLAPPING", r: 1, c: "#ff2f95" }, FAILING: { l: "FAILING", r: 2, c: "#ff6b57" },
    WARNING: { l: "WARNING", r: 3, c: "#f5a623" }, CHECKING: { l: "CHECKING", r: 4, c: "#8b97ab" }, ONLINE: { l: "ONLINE", r: 5, c: "#2fd39a" }
  };
  var PRESETS = [["Facebook", "facebook.com"], ["YouTube", "youtube.com"], ["X (Twitter)", "x.com"], ["TikTok", "tiktok.com"], ["Instagram", "instagram.com"], ["WhatsApp", "web.whatsapp.com"], ["Google", "google.com"], ["Telegram", "web.telegram.org"]];
  var PAL = ["#38bdf8", "#f5c542", "#a78bfa", "#34d399", "#fb7185", "#fb923c", "#22d3ee", "#f472b6"];
  var EVERY = [[2, "Every 2 seconds"], [3, "Every 3 seconds"], [5, "Every 5 seconds"], [10, "Every 10 seconds"], [30, "Every 30 seconds"], [60, "Every minute"]];
  var FAILS = [1, 2, 3, 4, 5, 6, 8, 10].map(function (n) { return [n, "After " + n + " failed page loads"]; });
  var DOWNS = [[30, "30 seconds"], [60, "1 minute"], [120, "2 minutes"], [300, "5 minutes"]];
  var KINDS = [["web", "Website (ping + real page load)"], ["ip", "IP address / device (ping only)"], ["tcp", "IP or host + port (port check)"]];
  var esc = function (s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); };
  function two(n) { return n < 10 ? "0" + n : "" + n; }
  function dur(ms) { var s = Math.max(0, Math.floor(ms / 1000)); if (s < 60) return s + "s"; var m = Math.floor(s / 60); if (m < 60) return m + "m " + (s % 60) + "s"; var h = Math.floor(m / 60); if (h < 24) return h + "h " + (m % 60) + "m"; return Math.floor(h / 24) + "d " + (h % 24) + "h"; }
  function api(method, url, body, auth) {
    var h = {}; if (body) h["Content-Type"] = "application/json"; if (auth && TOK) h["x-manage-token"] = TOK;
    return fetch(url, { method: method, headers: h, body: body ? JSON.stringify(body) : undefined, cache: "no-store" }).then(function (r) {
      return r.json().catch(function () { return {}; }).then(function (j) { if (!r.ok) throw new Error(j.error || ("HTTP " + r.status)); return j; });
    });
  }
  function opts(list, sel) {
    var l = list.slice(), has = l.some(function (x) { return String(x[0]) === String(sel); });
    if (!has && sel != null) l.push([sel, String(sel)]);
    return l.map(function (x) { return '<option value="' + x[0] + '"' + (String(x[0]) === String(sel) ? " selected" : "") + ">" + esc(x[1]) + "</option>"; }).join("");
  }

  function css() {
    if (document.getElementById("svc-css")) return;
    var s = document.createElement("style"); s.id = "svc-css";
    s.textContent = [
      ".svc-fab{position:fixed;left:12px;bottom:58px;z-index:9000;padding:9px 16px;border-radius:999px;border:1px solid rgba(245,197,66,.45);background:rgba(10,14,22,.92);color:#f5c542;font:700 12px system-ui,Segoe UI,sans-serif;cursor:pointer;box-shadow:0 6px 20px rgba(0,0,0,.45)}",
      ".svc-fab:hover{background:rgba(245,197,66,.14)}",
      ".svc-ov{position:fixed;inset:0;z-index:2147483000;background:rgba(3,6,12,.82);backdrop-filter:blur(5px);display:flex;align-items:center;justify-content:center;padding:16px;font-family:system-ui,Segoe UI,sans-serif;color:#e8edf5}",
      ".svc-ov.mng{z-index:2147483200}.svc-ov.stand{padding:0;background:#070b12;backdrop-filter:none}",
      ".svc-box{width:min(1320px,100%);height:min(840px,100%);display:flex;flex-direction:column;background:#0b111b;border:1px solid rgba(245,197,66,.28);border-radius:18px;box-shadow:0 30px 90px rgba(0,0,0,.65);overflow:hidden}",
      ".stand .svc-box{width:100%;height:100%;border-radius:0;border:0}",
      ".svc-top{display:flex;justify-content:space-between;align-items:center;gap:12px;padding:16px 22px;border-bottom:1px solid rgba(255,255,255,.07);background:linear-gradient(180deg,#121a29,#0b111b);flex-wrap:wrap}",
      ".svc-title{font-size:21px;font-weight:800}.svc-sub{font-size:12px;color:#8b97ab;margin-top:3px}.svc-acts{display:flex;gap:8px;flex-wrap:wrap}",
      ".svc-b{padding:8px 16px;border-radius:10px;border:1px solid rgba(255,255,255,.14);background:#141c2b;color:#e8edf5;font:700 12px system-ui,Segoe UI,sans-serif;cursor:pointer}",
      ".svc-b:hover{border-color:#f5c542}.svc-b.gold{border:0;color:#1a1304;background:linear-gradient(135deg,#ffd86b,#c9960c)}.svc-b.dng{color:#ff8da1;border-color:rgba(255,93,122,.5)}.svc-b:disabled{opacity:.5}",
      ".svc-kpis{display:grid;grid-template-columns:repeat(auto-fit,minmax(120px,1fr));gap:12px;padding:14px 22px 6px}",
      ".svc-k{background:#121a29;border:1px solid rgba(255,255,255,.07);border-radius:13px;padding:10px 14px}.svc-k b{display:block;font-size:10px;letter-spacing:.08em;color:#8b97ab;text-transform:uppercase}.svc-k span{display:block;font-size:24px;font-weight:800;margin-top:2px}",
      ".svc-bar{display:flex;gap:12px;align-items:center;padding:10px 22px;flex-wrap:wrap}",
      ".svc-bar input{flex:1;min-width:200px;box-sizing:border-box;padding:9px 13px;border-radius:10px;border:1px solid rgba(255,255,255,.1);background:#070b12;color:#e8edf5;outline:none}.svc-bar input:focus{border-color:#f5c542}",
      ".svc-chips{display:flex;gap:8px}.svc-chip{padding:7px 14px;border-radius:99px;border:1px solid rgba(255,255,255,.12);background:#141c2b;color:#c5cddb;font:700 12px system-ui,sans-serif;cursor:pointer}.svc-chip.on{background:#2f6fed;border-color:#2f6fed;color:#fff}",
      ".svc-main{flex:1;overflow:auto;padding:6px 22px 18px}.svc-foot{padding:8px 22px;border-top:1px solid rgba(255,255,255,.06);font-size:11px;color:#6f7b90}",
      ".svc-crit{margin:6px 0 18px;padding:14px;border-radius:18px;background:linear-gradient(160deg,rgba(244,63,94,.12),rgba(10,14,26,.4));border:1px solid rgba(244,63,94,.5)}.svc-ct{font-weight:800;letter-spacing:.06em;font-size:13px;color:#ffb4c0;margin-bottom:12px}",
      ".svc-ch2{display:flex;align-items:center;gap:10px;font-weight:800;font-size:15px;margin:16px 0 10px}.svc-ch2 i{width:10px;height:10px;border-radius:50%}.svc-ch2 small{font-weight:600;color:#8b97ab;font-size:11px}",
      ".svc-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:14px}",
      ".svc-card{cursor:pointer;user-select:none}",
      ".svh-box{width:min(1100px,100%)}.svh-k{padding:0 0 6px}",
      ".svh-bars{display:flex;gap:2px;height:96px;align-items:stretch}.svh-bar{flex:1;display:flex;flex-direction:column;border-radius:3px;overflow:hidden;background:#1a2231;min-width:2px}.svh-bar i{display:block}",
      ".svh-ax{display:flex;justify-content:space-between;font-size:11px;color:#8b97ab;margin-top:6px}",
      ".svh-lg{display:flex;gap:16px;margin-top:10px;font-size:11px;color:#c5cddb}.svh-lg i{display:inline-block;width:9px;height:9px;border-radius:2px;margin-right:6px}",
      ".svc-card{position:relative;background:#101827;border:1px solid rgba(255,255,255,.08);border-radius:15px;padding:13px 15px;color:#e8edf5}",
      ".svc-card.st-ONLINE{border-color:rgba(47,211,154,.55)}.svc-card.st-WARNING{border-color:rgba(245,166,35,.75);background:rgba(245,166,35,.07)}",
      ".svc-card.st-FAILING{background:rgba(255,59,87,calc(.05 + var(--h,0) * .22));border-color:rgba(255,59,87,calc(.3 + var(--h,0) * .7))}",
      ".svc-card.st-DOWN{background:rgba(255,0,0,.2);border:2px solid #ff0000;box-shadow:0 0 16px rgba(255,0,0,.55);animation:svcR 1.6s ease-in-out infinite}",
      ".svc-card.st-FLAPPING{background:rgba(255,0,127,.2);border:2px solid #ff007f;box-shadow:0 0 16px rgba(255,0,127,.6);animation:svcP 1.4s ease-in-out infinite}",
      "@keyframes svcR{50%{box-shadow:0 0 26px rgba(255,0,0,.85)}}@keyframes svcP{50%{box-shadow:0 0 26px rgba(255,0,127,.9)}}",
      ".svc-ch{display:flex;justify-content:space-between;align-items:center;gap:8px}.svc-nm{font-weight:800;font-size:15px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}",
      ".svc-bd{font:800 10px system-ui,sans-serif;padding:3px 9px;border-radius:99px;border:1px solid currentColor;white-space:nowrap}",
      ".svc-host{font:11px Consolas,monospace;color:#8b97ab;margin:3px 0 10px;overflow:hidden;text-overflow:ellipsis}",
      ".svc-mt{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}.svc-mt b{display:block;font-size:9px;letter-spacing:.07em;color:#8b97ab;text-transform:uppercase}.svc-mt span{font:700 13px Consolas,monospace}",
      ".svc-sp{height:30px;margin:10px 0 4px}.svc-sp svg{width:100%;height:30px;display:block}.svc-note{font-size:11px;color:#ffd0a0;margin:2px 0 6px}",
      ".svc-ft{display:flex;justify-content:space-between;font-size:11px;color:#8b97ab}",
      ".svc-empty{padding:26px 14px;text-align:center;color:#8b97ab;font-size:13px;line-height:1.7}.svc-empty.big{padding:90px 24px;font-size:15px}",
      ".svm-body{flex:1;display:flex;min-height:0}.svm-side{width:250px;border-right:1px solid rgba(255,255,255,.07);padding:14px;display:flex;flex-direction:column;gap:7px;overflow:auto;background:#0d1420}",
      ".svm-lbl{font-size:10px;letter-spacing:.1em;color:#8b97ab;text-transform:uppercase;margin:2px 4px 4px}",
      ".svm-cat{display:flex;align-items:center;gap:9px;text-align:left;padding:10px 12px;border-radius:11px;border:1px solid rgba(255,255,255,.07);background:#121a29;color:#e8edf5;font:700 13px system-ui,sans-serif;cursor:pointer}",
      ".svm-cat i{width:9px;height:9px;border-radius:50%}.svm-cat em{margin-left:auto;font-style:normal;color:#8b97ab;font-size:11px}",
      ".svm-cat.on{border-color:#f5c542;background:linear-gradient(135deg,rgba(245,197,66,.16),rgba(245,197,66,.04))}.svm-cat.add{border-style:dashed;color:#f5c542}",
      ".svm-main{flex:1;overflow:auto;padding:18px 22px;display:flex;flex-direction:column;gap:16px}",
      ".svm-card{background:#121a29;border:1px solid rgba(255,255,255,.08);border-radius:14px;padding:16px}.svm-card h4{margin:0 0 10px;font-size:15px}.svm-card p{color:#8b97ab;font-size:13px;line-height:1.6}",
      ".svm-h{display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap}.svm-h h3{margin:0;font-size:19px}",
      ".svm-t{width:100%;border-collapse:collapse;font-size:12px}.svm-t th{text-align:left;color:#8b97ab;font-size:10px;letter-spacing:.08em;text-transform:uppercase;padding:6px 8px}",
      ".svm-t td{padding:9px 8px;border-top:1px solid rgba(255,255,255,.06)}.svm-t td.m{font-family:Consolas,monospace;color:#a9b4c6}.svm-t td.r{text-align:right;white-space:nowrap}",
      ".svm-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(210px,1fr));gap:12px;margin:10px 0}.svm-grid label{display:flex;flex-direction:column;gap:5px;font-size:11px;color:#8b97ab;font-weight:700}",
      ".svm-grid input,.svm-grid select{padding:9px 11px;border-radius:9px;border:1px solid rgba(255,255,255,.12);background:#070b12;color:#e8edf5;outline:none;font-size:13px}",
      ".svm-grid input:focus,.svm-grid select:focus{border-color:#f5c542}.svm-grid select option{background:#0b111b}",
      ".svm-chk{display:flex;align-items:center;gap:8px;font-size:12px;color:#c5cddb;font-weight:700}.svm-chk input{width:16px;height:16px}",
      ".svm-row{display:flex;gap:10px;margin-top:12px;flex-wrap:wrap}.svm-chips{display:flex;gap:7px;flex-wrap:wrap}",
      ".svm-pre{padding:6px 12px;border-radius:99px;border:1px solid rgba(255,255,255,.12);background:#0d1420;color:#c5cddb;font:700 11px system-ui,sans-serif;cursor:pointer}.svm-pre:hover{border-color:#f5c542}",
      ".svm-msg{margin-top:10px;font-size:12px;min-height:16px}.svm-msg.ok{color:#2fd39a}.svm-msg.bad{color:#ff8da1}",
      ".svc-ov{background:radial-gradient(1100px 560px at 12% -10%,rgba(245,197,66,.12),transparent 60%),radial-gradient(900px 480px at 100% 0,rgba(56,189,248,.10),transparent 55%),rgba(3,6,12,.9)}",
      ".svc-ov.stand{background:radial-gradient(1100px 560px at 12% -10%,rgba(245,197,66,.12),transparent 60%),radial-gradient(900px 480px at 100% 0,rgba(56,189,248,.10),transparent 55%),#070b12}",
      ".svc-box{background:linear-gradient(180deg,#0f1624,#0a0f19);border:1px solid rgba(245,197,66,.22);box-shadow:0 40px 120px rgba(0,0,0,.7),inset 0 1px 0 rgba(255,255,255,.05)}",
      ".svc-top{background:linear-gradient(180deg,rgba(255,255,255,.05),transparent);padding:18px 26px}",
      ".svc-title{font-size:24px;letter-spacing:.02em;background:linear-gradient(90deg,#ffe29a,#f5c542 55%,#c9960c);-webkit-background-clip:text;background-clip:text;color:transparent}",
      ".svc-sub{letter-spacing:.02em}",
      ".svc-kpis{gap:14px;padding:16px 26px 8px}",
      ".svc-k{position:relative;overflow:hidden;background:linear-gradient(160deg,rgba(255,255,255,.06),rgba(255,255,255,.01));border:1px solid rgba(255,255,255,.08);border-radius:16px;padding:13px 16px 10px}",
      ".svc-k::before{content:'';position:absolute;left:0;right:0;top:0;height:3px;background:var(--a,#f5c542)}",
      ".svc-k span{font-size:29px;font-weight:800}",
      ".svc-kpis[data-f=kpis] .svc-k:nth-child(1){--a:#8fa3c4}.svc-kpis[data-f=kpis] .svc-k:nth-child(2){--a:#2fd39a}.svc-kpis[data-f=kpis] .svc-k:nth-child(3){--a:#f5a623}.svc-kpis[data-f=kpis] .svc-k:nth-child(4){--a:#ff6b57}.svc-kpis[data-f=kpis] .svc-k:nth-child(5){--a:#ff3b57}.svc-kpis[data-f=kpis] .svc-k:nth-child(6){--a:#ff2f95}",
      ".svc-bar{padding:10px 26px 4px}",
      ".svc-bar input{border-radius:14px;padding:11px 16px;background:rgba(7,11,18,.85)}",
      ".svc-chip{padding:8px 16px}",
      ".svc-chip.on{background:linear-gradient(135deg,#ffd86b,#c9960c);border-color:transparent;color:#1a1304;box-shadow:0 0 18px rgba(245,197,66,.35)}",
      ".svc-cats{display:flex;gap:10px;flex-wrap:wrap;padding:8px 26px 4px}",
      ".svc-cc{display:flex;align-items:center;gap:9px;padding:10px 18px;border-radius:14px;border:1px solid rgba(255,255,255,.1);background:rgba(18,26,41,.85);color:#aab6cb;font:800 12px system-ui,Segoe UI,sans-serif;letter-spacing:.06em;text-transform:uppercase;cursor:pointer;transition:all .18s}",
      ".svc-cc i{width:9px;height:9px;border-radius:50%;box-shadow:0 0 8px rgba(255,255,255,.35)}",
      ".svc-cc em{font-style:normal;font-size:10px;padding:2px 8px;border-radius:99px;background:rgba(255,255,255,.08);color:#c5cddb}",
      ".svc-cc b{font-size:10px;padding:2px 8px;border-radius:99px;background:#ff3b57;color:#fff;box-shadow:0 0 12px rgba(255,59,87,.75);animation:svcB 1.4s ease-in-out infinite}",
      ".svc-cc:hover{transform:translateY(-1px);border-color:rgba(245,197,66,.55);color:#fff}",
      ".svc-cc.on{background:linear-gradient(135deg,#ffd86b,#c9960c);border-color:transparent;color:#1a1304;box-shadow:0 6px 22px rgba(245,197,66,.35)}",
      ".svc-cc.on em{background:rgba(0,0,0,.18);color:#1a1304}",
      ".svc-cc.bad:not(.on){border-color:rgba(255,59,87,.6)}",
      "@keyframes svcB{50%{opacity:.5}}",
      ".svc-main{padding:6px 26px 20px}",
      ".svc-main::-webkit-scrollbar{width:10px}.svc-main::-webkit-scrollbar-thumb{background:rgba(255,255,255,.14);border-radius:10px}",
      ".svc-crit{border-radius:22px;box-shadow:0 0 44px rgba(244,63,94,.16)}",
      ".svc-ch2{font-size:14px;letter-spacing:.09em;text-transform:uppercase;margin:24px 0 12px}",
      ".svc-ch2 i{box-shadow:0 0 10px rgba(255,255,255,.3)}",
      ".svc-grid{gap:16px;grid-template-columns:repeat(auto-fill,minmax(275px,1fr))}",
      ".svc-card{background:linear-gradient(160deg,rgba(24,35,55,.96),rgba(12,18,30,.96));border-radius:18px;padding:16px 18px 14px 21px;overflow:hidden;box-shadow:0 10px 30px rgba(0,0,0,.35);transition:transform .15s,box-shadow .15s}",
      ".svc-card:hover{transform:translateY(-2px);box-shadow:0 18px 44px rgba(0,0,0,.5)}",
      ".svc-card::before{content:'';position:absolute;left:0;top:0;bottom:0;width:5px;background:#3a4558}",
      ".svc-card.st-ONLINE::before{background:linear-gradient(180deg,#2fd39a,#12805e)}",
      ".svc-card.st-WARNING::before{background:linear-gradient(180deg,#ffc14d,#c77c0a)}",
      ".svc-card.st-FAILING::before{background:linear-gradient(180deg,#ff7a63,#d2342a)}",
      ".svc-card.st-DOWN::before{background:linear-gradient(180deg,#ff3b57,#a80f25)}",
      ".svc-card.st-FLAPPING::before{background:linear-gradient(180deg,#ff2f95,#a0106a)}",
      ".svc-nm{font-size:16px}",
      ".svc-bd{padding:4px 11px;background:rgba(255,255,255,.05)}",
      ".svc-mt{background:rgba(255,255,255,.035);border-radius:12px;padding:9px 11px;gap:6px}.svc-mt span{font-size:14px}",
      ".svc-fab{background:linear-gradient(135deg,#ffd86b,#c9960c);color:#1a1304;border:0;box-shadow:0 8px 26px rgba(245,197,66,.4)}.svc-fab:hover{background:linear-gradient(135deg,#ffe08a,#d9a516)}",
      ".svm-side{background:linear-gradient(180deg,#0e1524,#0a1019)}",
      ".svm-card{background:linear-gradient(160deg,rgba(255,255,255,.045),rgba(255,255,255,.015));border-radius:16px}",
      ".svm-cat:hover{border-color:rgba(245,197,66,.5)}"
    ].join("");
    document.head.appendChild(s);
  }

  function spark(h) {
    if (!h || h.length < 2) return "";
    var W = 150, H = 30, mx = 1, n = h.length, pts = [], bad = "";
    h.forEach(function (v) { if (v > mx) mx = v; });
    h.forEach(function (v, k) {
      var x = (k * W / (n - 1));
      if (v < 0) bad += '<rect x="' + (x - 1).toFixed(1) + '" y="' + (H - 5) + '" width="2.4" height="5" fill="#ff3b57"/>';
      else pts.push(x.toFixed(1) + "," + (H - 7 - (v / mx) * (H - 12)).toFixed(1));
    });
    return '<svg viewBox="0 0 150 30" preserveAspectRatio="none">' + (pts.length > 1 ? '<polyline points="' + pts.join(" ") + '" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/>' : "") + bad + "</svg>";
  }
  function card(i, now) {
    var s = ST[i.status] || ST.CHECKING, heat = i.status === "FAILING" ? i.heat : 0;
    var slow = i.warnMs > 0 && i.p != null && i.p > i.warnMs;
    var pt = !i.ping ? "off" : (i.p == null ? "no reply" : i.p + " ms");
    var foot = (i.status === "DOWN" || i.status === "FAILING") ? "Not loading for " + dur(now - (i.fs || i.since)) : (i.status === "FLAPPING" ? "Unstable for " + dur(now - i.since) : (i.status === "CHECKING" ? "First check..." : "Stable for " + dur(now - i.since)));
    return '<div class="svc-card st-' + i.status + '" data-id="' + esc(i.id) + '" title="Double-click for history" style="--h:' + heat.toFixed(2) + '"><div class="svc-ch"><span class="svc-nm" title="' + esc(i.name) + '">' + esc(i.name) + '</span><span class="svc-bd" style="color:' + s.c + '">' + s.l + "</span></div>" +
      '<div class="svc-host">' + esc(i.host) + (i.kind === "tcp" ? ":" + i.port : "") + (i.kind === "ip" ? " - ping" : "") + "</div>" +
      '<div class="svc-mt"><div><b>Ping</b><span' + (slow ? ' style="color:#f5a623"' : "") + ">" + esc(pt) + "</span></div><div><b>Page load</b><span>" + (i.l == null ? "-" : i.l + " ms") + "</span></div><div><b>HTTP</b><span>" + (i.code || "-") + "</span></div></div>" +
      '<div class="svc-sp" style="color:' + s.c + '">' + spark(i.h) + "</div>" + (i.note ? '<div class="svc-note">' + esc(i.note) + "</div>" : "") +
      '<div class="svc-ft"><span>' + esc(foot) + "</span><span>Uptime " + (i.up == null ? "-" : i.up.toFixed(1) + "%") + "</span></div></div>";
  }

  function openViewer() {
    css();
    if (document.getElementById("svc-view")) return;
    var S = { q: "", c: "all", f: "all", data: null, timer: 0 };
    var ov = document.createElement("div"); ov.id = "svc-view"; ov.className = "svc-ov" + (STAND ? " stand" : "");
    ov.innerHTML = '<div class="svc-box"><div class="svc-top"><div><div class="svc-title">\uD83C\uDF10 Service Monitor</div><div class="svc-sub" data-f="sub">Loading...</div></div><div class="svc-acts">' +
      (STAND ? "" : '<button class="svc-b" data-f="new">New window</button>') + '<button class="svc-b" data-f="mng">Manage services</button>' + (STAND ? "" : '<button class="svc-b gold" data-f="x">Close</button>') + "</div></div>" +
      '<div class="svc-kpis" data-f="kpis"></div><div class="svc-bar"><input data-f="q" placeholder="Search a service or website..."><div class="svc-chips" data-f="chips"></div></div>' +
      '<div class="svc-cats" data-f="cats"></div><div class="svc-main" data-f="main"><div class="svc-empty big">Loading...</div></div><div class="svc-foot">Second monitor: open <b data-f="addr"></b> in any browser.</div></div>';
    document.body.appendChild(ov);
    function F(n) { return ov.querySelector('[data-f="' + n + '"]'); }
    function close() { clearInterval(S.timer); document.removeEventListener("keydown", onKey, true); if (ov.parentNode) ov.parentNode.removeChild(ov); }
    function onKey(e) { if (STAND || e.key !== "Escape" || document.getElementById("svc-mng") || document.getElementById("svc-hist")) return; e.stopPropagation(); close(); }
    document.addEventListener("keydown", onKey, true);
    F("addr").textContent = location.origin + "/services.html";
    if (!STAND) {
      F("x").onclick = close;
      F("new").onclick = function () { var w = null; try { w = window.open("/services.html", "pariscope-services", "width=1280,height=800"); } catch (e) {} if (!w) alert("Could not open a new window here. Open this address in any browser instead:\n" + location.origin + "/services.html"); };
    }
    F("mng").onclick = function () { openManager(); };
    F("main").ondblclick = function (e) { var c = e.target && e.target.closest ? e.target.closest(".svc-card") : null; if (!c) return; var n = c.querySelector(".svc-nm"); try { window.getSelection().removeAllRanges(); } catch (x) {} openHistory(c.getAttribute("data-id"), n ? n.textContent : ""); };
    F("q").oninput = function () { S.q = this.value.toLowerCase(); paint(); };
    F("cats").onclick = function (e) { var b = e.target && e.target.closest ? e.target.closest("[data-c]") : null; if (!b) return; S.c = b.getAttribute("data-c"); paint(); };
    F("chips").onclick = function (e) { var b = e.target.closest("[data-k]"); if (!b) return; S.f = b.getAttribute("data-k"); paint(); };

    function paint() {
      var j = S.data; if (!j) return;
      var items = j.items || [], cats = j.cats || [], now = j.now || Date.now();
      var c = { ONLINE: 0, WARNING: 0, FAILING: 0, DOWN: 0, FLAPPING: 0, CHECKING: 0 };
      items.forEach(function (i) { c[i.status] = (c[i.status] || 0) + 1; });
      F("kpis").innerHTML = [["Services", items.length, "#e8edf5"], ["Online", c.ONLINE, ST.ONLINE.c], ["Warning", c.WARNING, ST.WARNING.c], ["Failing", c.FAILING, ST.FAILING.c], ["Down", c.DOWN, ST.DOWN.c], ["Flapping", c.FLAPPING, ST.FLAPPING.c]].map(function (k) {
        return '<div class="svc-k"><b>' + k[0] + '</b><span style="color:' + k[2] + '">' + k[1] + "</span></div>";
      }).join("");
      F("chips").innerHTML = [["all", "All"], ["prob", "Problems"], ["ok", "Online"]].map(function (x) { return '<button class="svc-chip' + (S.f === x[0] ? " on" : "") + '" data-k="' + x[0] + '">' + x[1] + "</button>"; }).join("");
      var rk = function (id) { var m = 9; items.forEach(function (i) { if (i.cat === id) { var r = (ST[i.status] || ST.CHECKING).r; if (r < m) m = r; } }); return m; };
      if (S.c !== "all" && !cats.some(function (x) { return x.id === S.c; })) S.c = "all";
      F("cats").innerHTML = '<button class="svc-cc' + (S.c === "all" ? " on" : "") + '" data-c="all">\uD83C\uDF10 All services<em>' + items.length + "</em></button>" + cats.map(function (ct) {
        var its = items.filter(function (i) { return i.cat === ct.id; }), bad = its.filter(function (i) { return i.status === "DOWN" || i.status === "FLAPPING" || i.status === "FAILING"; }).length;
        return '<button class="svc-cc' + (S.c === ct.id ? " on" : "") + (bad ? " bad" : "") + '" data-c="' + esc(ct.id) + '"><i style="background:' + esc(ct.color) + '"></i>' + esc(ct.name) + "<em>" + its.length + "</em>" + (bad ? "<b>" + bad + "</b>" : "") + "</button>";
      }).join("");
      var d = new Date(now); F("sub").textContent = items.length + " service(s) - checked by ping and a real page load - updated " + two(d.getHours()) + ":" + two(d.getMinutes()) + ":" + two(d.getSeconds());
      var shown = items.filter(function (i) {
        if (S.c !== "all" && i.cat !== S.c) return false;
        if (S.q && (i.name + " " + i.host).toLowerCase().indexOf(S.q) < 0) return false;
        if (S.f === "prob") return i.status !== "ONLINE" && i.status !== "CHECKING";
        if (S.f === "ok") return i.status === "ONLINE";
        return true;
      }).sort(function (a, b) { return ((ST[a.status] || ST.CHECKING).r - (ST[b.status] || ST.CHECKING).r) || (a.name < b.name ? -1 : 1); });
      var crit = shown.filter(function (i) { return i.status === "DOWN" || i.status === "FLAPPING"; });
      var rest = shown;
      var html = "";
      if (!items.length) html = '<div class="svc-empty big">No services yet.<br>Click <b>Manage services</b> to add Facebook, YouTube and other websites.</div>';
      else {
        if (crit.length) html += '<section class="svc-crit"><div class="svc-ct">\uD83D\uDEA8 CRITICAL / FLAPPING (' + crit.length + ')</div><div class="svc-grid">' + crit.map(function (i) { return card(i, now); }).join("") + "</div></section>";
        cats.slice().sort(function (a, b) { return rk(a.id) - rk(b.id); }).forEach(function (ct) {
          var all = items.filter(function (i) { return i.cat === ct.id; }).length, l = rest.filter(function (i) { return i.cat === ct.id; });
          if (!l.length) return;
          html += '<section><div class="svc-ch2"><i style="background:' + esc(ct.color) + '"></i>' + esc(ct.name) + "<small>" + all + " service(s)</small></div><div class=\"svc-grid\">" + l.map(function (i) { return card(i, now); }).join("") + "</div></section>";
        });
        if (!html) html = '<div class="svc-empty">Nothing matches your search.</div>';
      }
      F("main").innerHTML = html;
    }
    function pull() { api("GET", "/api/services/live").then(function (j) { S.data = j; paint(); }).catch(function (e) { F("sub").textContent = "\u26A0 " + e.message; }); }
    pull(); S.timer = setInterval(pull, 1500);
  }

  function openManager() {
    css();
    if (document.getElementById("svc-mng")) return;
    var M = { cats: [], items: [], cur: null, edit: null, role: null };
    var ov = document.createElement("div"); ov.id = "svc-mng"; ov.className = "svc-ov mng";
    ov.innerHTML = '<div class="svc-box"><div class="svc-top"><div><div class="svc-title">\uD83C\uDF10 Manage services</div><div class="svc-sub">Each service is checked by ping and a real page load. Phone alerts go to the same WhatsApp / Telegram groups as your links (change groups in Alerts).</div></div><button class="svc-b gold" data-a="x">Close</button></div><div class="svm-body" data-f="body"><div class="svc-empty big">Loading...</div></div></div>';
    document.body.appendChild(ov);
    function F(n) { return ov.querySelector('[data-f="' + n + '"]'); }
    function v(n) { var e = F(n); return e ? e.value : ""; }
    function close() { document.removeEventListener("keydown", onKey, true); if (ov.parentNode) ov.parentNode.removeChild(ov); }
    function onKey(e) { if (e.key === "Escape") { e.stopPropagation(); close(); } }
    document.addEventListener("keydown", onKey, true);
    ov.addEventListener("mousedown", function (e) { if (e.target === ov) close(); });
    function say(t, good) { var m = F("msg"); if (m) { m.className = "svm-msg " + (good === false ? "bad" : "ok"); m.textContent = t; } }
    function reload() {
      return Promise.all([api("GET", "/api/services/role", null, true), api("GET", "/api/services/live")]).then(function (r) {
        M.role = r[0]; M.cats = r[1].cats || []; M.items = r[1].items || [];
        if (!M.cats.some(function (c) { return c.id === M.cur; })) M.cur = M.cats.length ? M.cats[0].id : null;
        render();
      }).catch(function (e) { F("body").innerHTML = '<div class="svc-empty big">\u26A0 ' + esc(e.message) + "</div>"; });
    }
    function run(p, okMsg, btn) {
      return p.then(function () { return reload(); }).then(function () { say(okMsg); }).catch(function (e) { if (btn) btn.disabled = false; say(e.message, false); });
    }
    function render() {
      var b = F("body");
      if (!M.role || !M.role.canEdit) { b.innerHTML = '<div class="svc-empty big">Please log in from the <b>MANAGE</b> button first (as admin), then open this page again.</div>'; return; }
      var cur = M.cats.filter(function (c) { return c.id === M.cur; })[0] || null;
      var side = '<div class="svm-side"><div class="svm-lbl">Categories</div>' + M.cats.map(function (c) {
        return '<button class="svm-cat' + (c.id === M.cur ? " on" : "") + '" data-a="cat" data-id="' + esc(c.id) + '"><i style="background:' + esc(c.color) + '"></i>' + esc(c.name) + "<em>" + M.items.filter(function (i) { return i.cat === c.id; }).length + "</em></button>";
      }).join("") + '<button class="svm-cat add" data-a="newcat">+ New category</button></div>';
      var main;
      if (!cur) main = '<div class="svm-main"><div class="svm-card"><h4>Welcome</h4><p>Create your first category, for example <b>Social media</b>, then add the websites you want to watch.</p><button class="svc-b gold" data-a="newcat">Create category</button></div></div>';
      else {
        var its = M.items.filter(function (i) { return i.cat === cur.id; }).sort(function (a, b) { return ((ST[a.status] || ST.CHECKING).r - (ST[b.status] || ST.CHECKING).r) || (a.name < b.name ? -1 : 1); });
        var ed = M.edit ? M.items.filter(function (i) { return i.id === M.edit; })[0] : null;
        var dv = ed || { name: "", url: "", kind: "web", port: "", every: 2, failAfter: 3, downAfter: 60, warnMs: 150, ping: true };
        var rows = its.length ? '<table class="svm-t"><tr><th>Name</th><th>Website</th><th>Check</th><th>Turns red</th><th>Ping limit</th><th></th></tr>' + its.map(function (i) {
          return "<tr><td><b>" + esc(i.name) + '</b></td><td class="m">' + esc(i.url) + (i.kind === "tcp" ? ":" + i.port : "") + (i.kind === "ip" ? " (ping only)" : "") + "</td><td>" + i.every + "s</td><td>" + i.failAfter + " fails / " + i.downAfter + 's</td><td>' + (i.warnMs ? i.warnMs + " ms" : "off") + '</td><td class="r"><button class="svc-b" data-a="edit" data-id="' + esc(i.id) + '">Edit</button> <button class="svc-b dng" data-a="del" data-id="' + esc(i.id) + '">Delete</button></td></tr>';
        }).join("") + "</table>" : '<div class="svc-empty">No services in this category yet. Add the first one below.</div>';
        main = '<div class="svm-main"><div class="svm-h"><h3>' + esc(cur.name) + '</h3><div><button class="svc-b" data-a="ren">Rename</button> <button class="svc-b dng" data-a="delcat">Delete category</button></div></div>' +
          '<div class="svm-card">' + rows + "</div>" +
          '<div class="svm-card"><h4>' + (ed ? "Edit service" : "Add a service to " + esc(cur.name)) + "</h4>" +
          (ed ? "" : '<div class="svm-chips">' + PRESETS.map(function (p, k) { return '<button class="svm-pre" data-a="pre" data-id="' + k + '">' + esc(p[0]) + "</button>"; }).join("") + "</div>") +
          '<div class="svm-grid"><label>Name<input data-f="name" value="' + esc(dv.name) + '" placeholder="e.g. Facebook"></label><label>Website or IP address<input data-f="url" value="' + esc(dv.url) + '" placeholder="e.g. facebook.com or 192.168.0.10"></label><label>What to watch<select data-f="kind">' + opts(KINDS, dv.kind || "web") + '</select></label><label>Port (only for port check)<input type="number" min="1" max="65535" data-f="port" value="' + esc(dv.port || "") + '" placeholder="e.g. 443"></label>' +
          '<label>Check<select data-f="every">' + opts(EVERY, dv.every) + '</select></label><label>Starts turning red<select data-f="failAfter">' + opts(FAILS, dv.failAfter) + "</select></label>" +
          '<label>Fully red after<select data-f="downAfter">' + opts(DOWNS, dv.downAfter) + '</select></label><label>Ping warning above (ms, 0 = off)<input type="number" min="0" max="5000" data-f="warnMs" value="' + esc(dv.warnMs) + '"></label></div>' +
          '<label class="svm-chk"><input type="checkbox" data-f="ping"' + (dv.ping ? " checked" : "") + "> Also measure ping (some websites do not answer ping; the page check still works)</label>" +
          '<div class="svm-row"><button class="svc-b" data-a="test">Test now</button><button class="svc-b gold" data-a="save">' + (ed ? "Save changes" : "Add service") + "</button>" + (ed ? '<button class="svc-b" data-a="cancel">Cancel</button>' : "") + '</div><div class="svm-msg" data-f="msg"></div></div></div>';
      }
      b.innerHTML = side + main;
    }
    ov.addEventListener("click", function (e) {
      var t = e.target.closest("[data-a]"); if (!t) return;
      var a = t.getAttribute("data-a"), id = t.getAttribute("data-id");
      if (a === "x") return close();
      if (a === "cat") { M.cur = id; M.edit = null; return render(); }
      if (a === "newcat") { var n = prompt("Name of the new category (for example: Social media)"); if (n && n.trim()) run(api("POST", "/api/services/cat", { name: n, color: PAL[M.cats.length % PAL.length] }, true).then(function (r) { M.cur = r.id; }), "Category created. Now add your websites."); return; }
      if (a === "ren") { var cc = M.cats.filter(function (c) { return c.id === M.cur; })[0]; var nn = cc && prompt("New name for this category", cc.name); if (nn && nn.trim()) run(api("PUT", "/api/services/cat/" + M.cur, { name: nn }, true), "Renamed."); return; }
      if (a === "delcat") { if (confirm("Delete this category and all services inside it?")) run(api("DELETE", "/api/services/cat/" + M.cur, null, true), "Category deleted."); return; }
      if (a === "edit") { M.edit = id; render(); var f = F("name"); if (f) f.focus(); return; }
      if (a === "cancel") { M.edit = null; return render(); }
      if (a === "del") { if (confirm("Delete this service?")) run(api("DELETE", "/api/services/item/" + id, null, true), "Service deleted."); return; }
      if (a === "pre") { var p = PRESETS[Number(id)]; if (p) { F("name").value = p[0]; F("url").value = p[1]; } return; }
      if (a === "test") { say("Testing..."); api("POST", "/api/services/test", { url: v("url"), kind: v("kind"), port: v("port") }, true).then(function (r) { var pg = r.page || {}; say((pg.ok ? "Reachable: " + pg.ms + " ms" + (pg.code ? " (HTTP " + pg.code + ")" : "") + "." : "Not reachable: " + (pg.err || "failed") + ".") + " Ping: " + (r.ping == null ? "no reply" : r.ping + " ms."), !!pg.ok); }).catch(function (er) { say(er.message, false); }); return; }
      if (a === "save") {
        var p2 = { cat: M.cur, name: v("name"), url: v("url"), kind: v("kind"), port: v("port"), every: v("every"), failAfter: v("failAfter"), downAfter: v("downAfter"), warnMs: v("warnMs"), ping: F("ping").checked }, ed2 = M.edit;
        t.disabled = true; say("Saving...");
        run(api(ed2 ? "PUT" : "POST", ed2 ? "/api/services/item/" + ed2 : "/api/services/item", p2, true).then(function () { M.edit = null; }), ed2 ? "Saved." : "Service added. It is being checked now.", t);
      }
    });
    reload();
  }

  var HC = ["#2fd39a", "#ff3b57", "#ff2f95", "#3a4558"], HNAME = ["Online", "Down", "Flapping", "No data"];
  var RNG = [["1d", "24 hours"], ["3d", "3 days"], ["7d", "7 days"], ["30d", "30 days"], ["365d", "1 year"]];
  function fdt(t) { var d = new Date(t); return d.getFullYear() + "-" + two(d.getMonth() + 1) + "-" + two(d.getDate()) + " " + two(d.getHours()) + ":" + two(d.getMinutes()) + ":" + two(d.getSeconds()); }
  function openHistory(id, nm) {
    css();
    var old = document.getElementById("svc-hist"); if (old && old.parentNode) old.parentNode.removeChild(old);
    var range = "1d", ov = document.createElement("div"); ov.id = "svc-hist"; ov.className = "svc-ov mng";
    ov.innerHTML = '<div class="svc-box svh-box"><div class="svc-top"><div><div class="svc-title" data-f="t"></div><div class="svc-sub" data-f="s">Loading...</div></div><button class="svc-b gold" data-a="x">Close</button></div><div class="svc-bar"><div class="svc-chips" data-f="r"></div></div><div class="svc-main" data-f="b"><div class="svc-empty big">Loading...</div></div></div>';
    document.body.appendChild(ov);
    function F(n) { return ov.querySelector('[data-f="' + n + '"]'); }
    function close() { document.removeEventListener("keydown", onKey, true); if (ov.parentNode) ov.parentNode.removeChild(ov); }
    function onKey(e) { if (e.key === "Escape") { e.stopPropagation(); close(); } }
    document.addEventListener("keydown", onKey, true);
    ov.addEventListener("mousedown", function (e) { if (e.target === ov) close(); });
    F("t").textContent = "\uD83D\uDCCA " + (nm || id) + " - history";
    ov.addEventListener("click", function (e) {
      var t = e.target.closest("[data-a],[data-k]"); if (!t) return;
      if (t.getAttribute("data-a") === "x") return close();
      if (t.getAttribute("data-k")) { range = t.getAttribute("data-k"); pull(); }
    });
    function chips() { F("r").innerHTML = RNG.map(function (x) { return '<button class="svc-chip' + (range === x[0] ? " on" : "") + '" data-k="' + x[0] + '">' + x[1] + "</button>"; }).join(""); }
    function paint(j) {
      chips();
      if (!j || j.none) { F("s").textContent = "No history yet"; F("b").innerHTML = '<div class="svc-empty big">No history recorded yet.<br>It starts after the first status check and keeps growing.</div>'; return; }
      var T = j.totals || {}, cur = j.current == null ? 3 : j.current;
      F("s").textContent = "Now: " + HNAME[cur] + (j.since ? " since " + fdt(j.since) : "") + " - tracking since " + (j.trackingSince ? fdt(j.trackingSince) : "-");
      var k = [["Uptime", j.uptime == null ? "-" : j.uptime.toFixed(2) + "%", HC[0]], ["Outages", j.outages, HC[1]], ["Longest outage", j.longestOutage ? dur(j.longestOutage) : "-", HC[1]], ["Average outage", j.avgOutage ? dur(j.avgOutage) : "-", "#e8edf5"], ["Flapping episodes", j.flapEpisodes, HC[2]], ["Total down time", dur(T.down || 0), HC[1]]];
      var html = '<div class="svc-kpis svh-k">' + k.map(function (x) { return '<div class="svc-k"><b>' + x[0] + '</b><span style="color:' + x[2] + '">' + esc(x[1]) + "</span></div>"; }).join("") + "</div>";
      var bars = (j.buckets || []).map(function (b, n) {
        var tot = (b[0] + b[1] + b[2] + b[3]) || 1, tip = fdt(j.from + n * j.bucketMs) + " | ";
        var segs = [1, 2, 3, 0].map(function (c) { return b[c] > 0 ? '<i style="flex:' + b[c] + ' 1 0;min-height:3px;background:' + HC[c] + '"></i>' : ""; }).join("");
        [0, 1, 2, 3].forEach(function (c) { if (b[c] > 0) tip += HNAME[c] + " " + Math.round(b[c] / tot * 100) + "% "; });
        return '<div class="svh-bar" title="' + esc(tip) + '">' + segs + "</div>";
      }).join("");
      html += '<div class="svm-card"><h4>Timeline</h4><div class="svh-bars">' + bars + '</div><div class="svh-ax"><span>' + fdt(j.from) + "</span><span>" + fdt(j.to) + '</span></div><div class="svh-lg">' + [0, 1, 2, 3].map(function (c) { return '<span><i style="background:' + HC[c] + '"></i>' + HNAME[c] + "</span>"; }).join("") + "</div></div>";
      var ev = (j.events || []).map(function (x, n, a) { var until = n === 0 ? Date.now() : a[n - 1].t; return '<tr><td class="m">' + fdt(x.t) + '</td><td><b style="color:' + HC[x.s] + '">' + HNAME[x.s] + '</b></td><td class="m">' + dur(until - x.t) + "</td></tr>"; }).join("");
      html += '<div class="svm-card"><h4>Recent changes</h4>' + (ev ? '<table class="svm-t"><tr><th>When</th><th>Became</th><th>Lasted</th></tr>' + ev + "</table>" : '<div class="svc-empty">No changes in this period.</div>') + "</div>";
      F("b").innerHTML = html;
    }
    function pull() { chips(); api("GET", "/api/history?ip=" + encodeURIComponent("svc:" + id) + "&range=" + range).then(paint).catch(function (e) { F("s").textContent = "\u26A0 " + e.message; }); }
    pull();
  }
  function fab() {
    if (STAND || document.getElementById("svc-fab") || !document.body) return;
    css();
    var b = document.createElement("button"); b.id = "svc-fab"; b.className = "svc-fab"; b.textContent = "\uD83C\uDF10  View Services"; b.onclick = openViewer; document.body.appendChild(b);
  }
  var injN = 0, injT = Date.now();
  function injectNav() {
    if (STAND || document.querySelector("[data-svc-nav]")) return;
    var bs = document.querySelectorAll("button"), g = null, i;
    for (i = 0; i < bs.length; i++) if (/Edit Graphical Mode/i.test(bs[i].textContent || "")) { g = bs[i]; break; }
    if (!g || !g.parentNode) return;
    if (Date.now() - injT > 60000) { injT = Date.now(); injN = 0; }
    if (++injN > 25) return;
    var side = g.parentNode, acc = null, gl = null, ls = side.querySelectorAll(".mgs-lbl");
    for (i = 0; i < ls.length; i++) { if (/account/i.test(ls[i].textContent)) acc = ls[i]; if (/graphical/i.test(ls[i].textContent)) gl = ls[i]; }
    var btn = g.cloneNode(false); btn.setAttribute("data-svc-nav", "1"); btn.classList.remove("on"); btn.textContent = "\uD83C\uDF10  Service Monitor";
    btn.onclick = function (e) { e.preventDefault(); e.stopPropagation(); openManager(); };
    var src = gl || acc, lab = null;
    if (src) { lab = src.cloneNode(false); lab.setAttribute("data-svc-nav", "1"); lab.textContent = "Services"; }
    if (acc) { if (lab) side.insertBefore(lab, acc); side.insertBefore(btn, acc); }
    else side.insertBefore(btn, g.nextSibling);
  }
  function tick() { try { fab(); injectNav(); } catch (e) {} }
  var pend = 0;
  function later() { if (pend) return; pend = setTimeout(function () { pend = 0; tick(); }, 200); }
  function start() { if (STAND) { openViewer(); return; } new MutationObserver(later).observe(document.body, { childList: true, subtree: true }); tick(); }
  if (document.body) start(); else document.addEventListener("DOMContentLoaded", start);
  window.PariscopeServices = { open: openViewer, manage: openManager };
})();
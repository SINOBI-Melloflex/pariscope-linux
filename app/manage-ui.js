/* Pariscope "Manage" feature - button + panel. Loaded by one <script> tag in index.html. */
(function () {
  "use strict";
  if (window.__manageUiLoaded) return;
  window.__manageUiLoaded = true;

  var token = null, cats = [], curId = null, filterText = "", ov = null;
  var view = "links", alertTimer = null; // 4.0: "links" or "alerts"

  var css = [
    ".mg-btn{margin-left:auto;background:linear-gradient(135deg,#6366f1 0%,#8b5cf6 100%);color:#fff;border:0;padding:10px 20px;border-radius:12px;cursor:pointer;font-weight:800;font-size:11px;letter-spacing:.8px;text-transform:uppercase;box-shadow:0 6px 20px rgba(139,92,246,.5);white-space:nowrap}",
    ".mg-btn:hover{filter:brightness(1.12)}",
    ".mg-ov{position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(2,4,10,.8);backdrop-filter:blur(6px);z-index:5000;display:flex;align-items:center;justify-content:center;padding:20px;box-sizing:border-box}",
    ".mg-box{width:100%;max-width:940px;max-height:92vh;overflow:auto;background:#0b1220;border:1px solid rgba(255,255,255,.14);border-radius:16px;padding:24px;box-shadow:0 20px 60px rgba(0,0,0,.7);color:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;box-sizing:border-box}",
    ".mg-box h3{margin:0;font-size:19px;font-weight:800}",
    ".mg-sub{color:#94a3b8;font-size:12px;font-weight:600}",
    ".mg-row{display:flex;gap:10px;flex-wrap:wrap;align-items:center;margin:12px 0}",
    ".mg-in{background:rgba(0,0,0,.4);border:1px solid rgba(255,255,255,.16);color:#f8fafc;padding:9px 12px;border-radius:9px;font-size:13px;outline:none;box-sizing:border-box}",
    ".mg-in:focus{border-color:#8b5cf6}",
    "select.mg-in option{background:#0b1220}",
    "input[type=color].mg-in{padding:2px;width:44px;height:36px;cursor:pointer}",
    ".mg-b{background:rgba(30,41,59,.9);color:#e2e8f0;border:1px solid rgba(255,255,255,.16);padding:8px 14px;border-radius:9px;cursor:pointer;font-weight:700;font-size:12px}",
    ".mg-b:hover{border-color:rgba(255,255,255,.4)}",
    ".mg-b.pri{background:linear-gradient(135deg,#6366f1,#8b5cf6);border-color:transparent;color:#fff}",
    ".mg-b.dng{background:rgba(153,27,27,.55);border-color:#f43f5e;color:#fff}",
    ".mg-b:disabled{opacity:.5;cursor:wait}",
    ".mg-msg{font-size:12px;min-height:16px;font-weight:700}",
    ".mg-list{max-height:40vh;overflow:auto;border:1px solid rgba(255,255,255,.09);border-radius:10px}",
    ".mg-tbl{width:100%;border-collapse:collapse;font-size:13px}",
    ".mg-tbl td{padding:7px 10px;border-bottom:1px solid rgba(255,255,255,.07)}",
    ".mg-tbl td.ip{font-family:monospace;color:#cbd5e1}",
    ".mg-sec{border-top:1px solid rgba(255,255,255,.1);margin-top:16px;padding-top:12px;font-size:13px}",
    ".mg-chip{display:inline-flex;align-items:center;gap:4px;margin-right:8px;font-size:11px;font-weight:800;color:#cbd5e1;cursor:pointer;user-select:none}",
    ".mg-chip input{accent-color:#8b5cf6;width:15px;height:15px;cursor:pointer}",
    ".mg-card{border:1px solid rgba(255,255,255,.12);border-radius:12px;padding:14px 16px;margin-top:14px;background:rgba(255,255,255,.03)}",
    ".mg-card h4{margin:0 0 4px 0;font-size:15px;font-weight:800}",
    ".mg-help{color:#94a3b8;font-size:12px;line-height:1.6;margin:4px 0 8px}",
    ".mg-stat{border-radius:10px;padding:10px 12px;font-size:12px;font-weight:700;background:rgba(0,0,0,.35);margin:8px 0;line-height:1.6}",
    ".mg-qr{background:#fff;border-radius:12px;padding:8px;width:300px;max-width:100%;height:auto;display:block;margin:8px 0}",
    ".mg-pick{display:inline-block;margin:4px 6px 0 0;padding:5px 10px;border-radius:8px;border:1px solid #8b5cf6;color:#e9d5ff;font-size:12px;font-weight:700;cursor:pointer}",
    ".mg-hint{border:1px dashed rgba(255,255,255,.25);border-radius:12px;padding:16px 20px;margin:-15px 0 30px 0;color:#94a3b8;font-size:13px;font-weight:600}"
  ].join("\n");
  var st = document.createElement("style");
  st.textContent = css;
  document.head.appendChild(st);
  var st6 = document.createElement("style");
  st6.textContent = "/* ===== PARISCOPE 6.0 PREMIUM SKIN (look only - no feature changes) ===== */\n:root{--gold:#f5c451;--gold2:#ffdf8a;--gold-deep:#b8860b;--ink:#05070f;--violet:#8b5cf6;--cyan:#22d3ee}\n@keyframes p6-aurora{0%{background-position:0% 0%,100% 0%,50% 100%}50%{background-position:30% 20%,70% 10%,40% 90%}100%{background-position:0% 0%,100% 0%,50% 100%}}\n@keyframes p6-shine{0%{background-position:-200% 0}100%{background-position:200% 0}}\n@keyframes p6-pulse{0%,100%{box-shadow:0 0 0 0 rgba(245,196,81,.35)}50%{box-shadow:0 0 0 8px rgba(245,196,81,0)}}\nbody{background:radial-gradient(900px 500px at 12% -5%,rgba(139,92,246,.22),transparent 60%),radial-gradient(800px 500px at 95% 0%,rgba(245,196,81,.13),transparent 60%),radial-gradient(900px 600px at 50% 110%,rgba(34,211,238,.09),transparent 60%),linear-gradient(180deg,#070a14 0%,#04060d 100%)!important;background-attachment:fixed!important;background-size:140% 140%,140% 140%,140% 140%,100% 100%!important;animation:p6-aurora 28s ease-in-out infinite}\n::-webkit-scrollbar{width:10px;height:10px}::-webkit-scrollbar-track{background:#070a14}::-webkit-scrollbar-thumb{background:linear-gradient(180deg,#f5c451,#8b5cf6);border-radius:10px;border:2px solid #070a14}\n.header-bar{background:linear-gradient(180deg,rgba(10,14,28,.88),rgba(10,14,28,.55))!important;border-bottom:1px solid rgba(245,196,81,.28)!important;box-shadow:0 8px 40px rgba(0,0,0,.45),0 1px 0 rgba(245,196,81,.15) inset!important;position:sticky}\n.header-bar::after{content:\"\";position:absolute;left:0;right:0;bottom:-1px;height:2px;background:linear-gradient(90deg,transparent,#f5c451,#8b5cf6,#22d3ee,transparent);background-size:200% 100%;animation:p6-shine 6s linear infinite;opacity:.9}\n.logo-badge{background:linear-gradient(135deg,#f5c451 0%,#b8860b 100%)!important;color:#1a1200!important;box-shadow:0 0 24px rgba(245,196,81,.55),0 0 0 1px rgba(255,255,255,.25) inset!important;animation:p6-pulse 3.2s ease-in-out infinite}\n.brand-title{background:linear-gradient(90deg,#fff 30%,#ffdf8a 100%);-webkit-background-clip:text;background-clip:text;color:transparent!important;text-shadow:none}\n.brand-title .pro-badge,.brand-title .soc-badge{-webkit-text-fill-color:initial}\n.pro-badge,.pro-tag{background:linear-gradient(135deg,#ffdf8a,#f5c451 55%,#b8860b)!important;color:#1a1200!important;border:0!important;font-weight:900!important;letter-spacing:1.4px;box-shadow:0 4px 16px rgba(245,196,81,.4)}\n.stats-capsule{background:linear-gradient(135deg,rgba(15,23,42,.85),rgba(10,14,26,.7))!important;border:1px solid rgba(245,196,81,.22)!important}\n.lic-chip{background:linear-gradient(135deg,rgba(245,196,81,.22),rgba(184,134,11,.12))!important;border-color:rgba(245,196,81,.6)!important;box-shadow:0 0 18px rgba(245,196,81,.2)}\n.welcome-banner{position:relative;overflow:hidden;background:linear-gradient(135deg,rgba(30,27,75,.65) 0%,rgba(15,23,42,.6) 55%,rgba(60,45,10,.45) 100%)!important;border:1px solid rgba(245,196,81,.3)!important;box-shadow:0 18px 50px rgba(0,0,0,.45),0 0 0 1px rgba(255,255,255,.04) inset!important}\n.welcome-banner::before{content:\"\";position:absolute;inset:0;background:linear-gradient(110deg,transparent 30%,rgba(245,196,81,.10) 50%,transparent 70%);background-size:200% 100%;animation:p6-shine 7s linear infinite;pointer-events:none}\n.welcome-avatar{border:1px solid rgba(245,196,81,.5)!important;box-shadow:0 0 22px rgba(245,196,81,.3)!important}\n.welcome-text h2{font-size:24px!important;background:linear-gradient(90deg,#fff,#ffdf8a);-webkit-background-clip:text;background-clip:text;color:transparent!important}\n.kpi{position:relative;overflow:hidden;background:linear-gradient(160deg,rgba(20,28,50,.85),rgba(10,14,26,.8))!important;border:1px solid rgba(255,255,255,.10)!important;border-radius:16px!important;box-shadow:0 14px 40px rgba(0,0,0,.4)!important;transition:transform .25s ease,border-color .25s ease,box-shadow .25s ease}\n.kpi::before{content:\"\";position:absolute;left:0;right:0;top:0;height:3px;background:linear-gradient(90deg,#f5c451,#8b5cf6)}\n.kpi.k-on::before{background:linear-gradient(90deg,#10b981,#34d399)}.kpi.k-off::before{background:linear-gradient(90deg,#e11d48,#fb7185)}.kpi.k-flap::before{background:linear-gradient(90deg,#db2777,#f472b6)}.kpi.k-tot::before{background:linear-gradient(90deg,#6366f1,#a855f7)}\n.kpi:hover{transform:translateY(-4px);border-color:rgba(245,196,81,.45)!important;box-shadow:0 22px 55px rgba(0,0,0,.55),0 0 28px rgba(245,196,81,.12)!important}\n.kpi-num{font-size:40px!important;font-weight:900!important;letter-spacing:-1px;text-shadow:0 0 28px currentColor}\n.kpi-label,.feed-title{letter-spacing:1.6px!important}\n.feed-card{background:linear-gradient(160deg,rgba(20,28,50,.85),rgba(10,14,26,.8))!important;border:1px solid rgba(245,196,81,.2)!important;border-radius:16px!important;box-shadow:0 14px 40px rgba(0,0,0,.4)!important}\n.search{background:rgba(8,12,24,.8)!important;border:1px solid rgba(255,255,255,.14)!important;border-radius:14px!important}\n.chip-st,.filter-btn,.view-toggle{border-radius:12px!important;transition:all .2s ease!important}\n.chip-st.on,.filter-btn.active{background:linear-gradient(135deg,#ffdf8a,#f5c451 55%,#b8860b)!important;color:#1a1200!important;border-color:transparent!important;box-shadow:0 8px 24px rgba(245,196,81,.35)!important}\n.filter-btn.active .btn-logo{filter:none}\n.category-title{border-bottom:0!important;position:relative;padding-bottom:14px!important}\n.category-title::after{content:\"\";position:absolute;left:0;right:0;bottom:0;height:2px;border-radius:2px;background:linear-gradient(90deg,#f5c451,rgba(139,92,246,.6) 40%,transparent)}\n.card{background:linear-gradient(165deg,rgba(24,33,58,.78),rgba(10,14,26,.78))!important;border:1px solid rgba(255,255,255,.10)!important;border-radius:16px!important;box-shadow:0 12px 34px rgba(0,0,0,.4)!important;transition:transform .22s ease,box-shadow .22s ease,border-color .22s ease!important;overflow:hidden}\n.card::before{content:\"\";position:absolute;left:0;right:0;top:0;height:2px;background:linear-gradient(90deg,transparent,rgba(245,196,81,.7),transparent);opacity:.55}\n.card:hover{transform:translateY(-5px);border-color:rgba(245,196,81,.5)!important;box-shadow:0 22px 50px rgba(0,0,0,.55),0 0 26px rgba(245,196,81,.14)!important}\n.card.card-offline,.card.card-flapping-box{border-radius:16px!important}\n.node-name{font-size:15px!important}\n.badge-online{background:linear-gradient(135deg,rgba(16,185,129,.25),rgba(16,185,129,.1))!important;box-shadow:0 0 14px rgba(16,185,129,.2)}\n.critical-section{border-radius:20px!important;background:linear-gradient(160deg,rgba(244,63,94,.10),rgba(10,14,26,.4))!important;border:1px solid rgba(244,63,94,.5)!important}\n.voice-floating{border:1px solid rgba(245,196,81,.35)!important;box-shadow:0 14px 40px rgba(0,0,0,.6),0 0 22px rgba(245,196,81,.12)!important}\n.voice-floating.active{background:linear-gradient(135deg,#ffdf8a,#f5c451 55%,#b8860b)!important;color:#1a1200!important}\n.foot{letter-spacing:2px}\n/* --- Manage / Admin console --- */\n.mg-btn{background:linear-gradient(135deg,#ffdf8a,#f5c451 55%,#b8860b)!important;color:#1a1200!important;box-shadow:0 8px 26px rgba(245,196,81,.4)!important;font-weight:900!important}\n.mg-ov{background:radial-gradient(700px 420px at 20% 10%,rgba(139,92,246,.28),transparent 60%),radial-gradient(700px 420px at 85% 90%,rgba(245,196,81,.18),transparent 60%),rgba(3,5,12,.88)!important;backdrop-filter:blur(14px)!important}\n.mg-ov .mg-box{position:relative;background:linear-gradient(165deg,#0f1730 0%,#0a1020 55%,#120f06 100%)!important;border:1px solid transparent!important;border-radius:22px!important;padding:74px 30px 28px!important;box-shadow:0 30px 90px rgba(0,0,0,.8),0 0 0 1px rgba(245,196,81,.35),0 0 60px rgba(139,92,246,.18)!important}\n.mg-ov .mg-box::before{content:\"PARISCOPE  \\2022  PREMIUM ADMIN CONSOLE\";position:absolute;left:0;right:0;top:0;height:46px;display:flex;align-items:center;padding:0 30px;font-size:11px;font-weight:900;letter-spacing:2.2px;color:#1a1200;background:linear-gradient(90deg,#ffdf8a,#f5c451 45%,#b8860b);border-radius:22px 22px 0 0}\n.mg-ov .mg-box::after{content:\"\";position:absolute;left:0;right:0;top:46px;height:2px;background:linear-gradient(90deg,#8b5cf6,#22d3ee,#f5c451)}\n.mg-box h3{font-size:24px!important;background:linear-gradient(90deg,#fff,#ffdf8a);-webkit-background-clip:text;background-clip:text;color:transparent}\n.mg-sub,.mg-help{color:#a8b3c7!important}\n.mg-in{background:rgba(5,8,18,.85)!important;border:1px solid rgba(255,255,255,.16)!important;border-radius:11px!important;padding:11px 14px!important;transition:border-color .2s,box-shadow .2s}\n.mg-in:focus{border-color:#f5c451!important;box-shadow:0 0 0 3px rgba(245,196,81,.18)!important}\n.mg-b{border-radius:11px!important;padding:10px 18px!important;background:linear-gradient(160deg,rgba(40,52,84,.9),rgba(22,30,52,.9))!important;border:1px solid rgba(255,255,255,.18)!important;transition:all .2s ease}\n.mg-b:hover{transform:translateY(-2px);border-color:rgba(245,196,81,.6)!important;box-shadow:0 8px 22px rgba(0,0,0,.45)}\n.mg-b.pri{background:linear-gradient(135deg,#ffdf8a,#f5c451 55%,#b8860b)!important;color:#1a1200!important;border-color:transparent!important;font-weight:900!important;box-shadow:0 8px 24px rgba(245,196,81,.35)}\n.mg-b.dng{background:linear-gradient(135deg,#be123c,#7f1d1d)!important;border-color:#fb7185!important}\n.mg-card{background:linear-gradient(160deg,rgba(255,255,255,.05),rgba(255,255,255,.015))!important;border:1px solid rgba(245,196,81,.2)!important;border-radius:16px!important}\n.mg-list{border:1px solid rgba(245,196,81,.2)!important;border-radius:14px!important;background:rgba(4,6,14,.55)}\n.mg-tbl tr:hover td{background:rgba(245,196,81,.06)}\n.mg-sec{border-top:1px solid rgba(245,196,81,.2)!important}\n.mg-pick{border-color:rgba(245,196,81,.6)!important;color:#ffe9a8!important;border-radius:10px!important}\n.mg-chip input{accent-color:#f5c451!important}\n.mg-hint{border:1px dashed rgba(245,196,81,.4)!important;border-radius:14px!important}\n.mg-tbl td.ip{display:table-cell!important;background:none!important;border:0!important;border-bottom:1px solid rgba(255,255,255,.07)!important;margin:0!important;padding:7px 10px!important;border-radius:0!important;color:#cbd5e1!important}\n.mg-tbl td{vertical-align:middle}";
  document.head.appendChild(st6);
  var st7 = document.createElement("style");
  st7.textContent = [
    "/* ===== 0.9 friendly console ===== */",
    ".mg-box.mg-wide{max-width:1060px}",
    ".mg-head{margin:0 0 2px}",
    ".mg-tabs{display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin:14px 0 16px;padding-bottom:14px;border-bottom:1px solid rgba(245,196,81,.2)}",
    ".mg-grow{flex:1}",
    ".mg-tab{background:rgba(255,255,255,.04);color:#cbd5e1;border:1px solid rgba(255,255,255,.14);padding:10px 18px;border-radius:12px;font-weight:800;font-size:13px;cursor:pointer;transition:all .2s}",
    ".mg-tab:hover{border-color:rgba(245,196,81,.6);color:#fff}",
    ".mg-tab.on{background:linear-gradient(135deg,#ffdf8a,#f5c451 55%,#b8860b);color:#1a1200;border-color:transparent;box-shadow:0 8px 22px rgba(245,196,81,.3)}",
    ".mg-toast{border-radius:12px;padding:11px 15px;font-size:13px;font-weight:700;margin:0 0 14px}",
    ".mg-toast.none{display:none}",
    ".mg-toast.ok{background:rgba(16,185,129,.14);border:1px solid rgba(52,211,153,.5);color:#6ee7b7}",
    ".mg-toast.bad{background:rgba(244,63,94,.14);border:1px solid rgba(251,113,133,.5);color:#fda4af}",
    ".mg-steps{display:flex;gap:10px;flex-wrap:wrap;margin:0 0 16px;padding:12px 14px;border-radius:14px;border:1px solid rgba(245,196,81,.25);background:rgba(245,196,81,.05);align-items:center}",
    ".mg-steps b{font-size:11px;letter-spacing:1.4px;color:#ffdf8a;margin-right:6px}",
    ".mg-step{display:inline-flex;align-items:center;gap:6px;padding:6px 12px;border-radius:999px;font-size:12px;font-weight:800;border:1px solid rgba(255,255,255,.16);color:#cbd5e1}",
    ".mg-step.done{border-color:rgba(52,211,153,.6);color:#6ee7b7;background:rgba(16,185,129,.1)}",
    ".mg-cats{display:flex;gap:8px;flex-wrap:wrap;margin:0 0 16px}",
    ".mg-cat{display:inline-flex;align-items:center;gap:8px;padding:9px 15px;border-radius:12px;border:1px solid rgba(255,255,255,.16);background:rgba(255,255,255,.04);color:#e2e8f0;font-weight:800;font-size:13px;cursor:pointer;transition:all .2s}",
    ".mg-cat:hover{border-color:rgba(245,196,81,.6);transform:translateY(-1px)}",
    ".mg-cat.on{border-color:#f5c451;background:rgba(245,196,81,.14);color:#ffe9a8;box-shadow:0 0 0 3px rgba(245,196,81,.12)}",
    ".mg-cat.add{border-style:dashed;color:#ffdf8a}",
    ".mg-count{background:rgba(255,255,255,.12);border-radius:999px;padding:1px 8px;font-size:11px}",
    ".mg-pill{display:inline-block;padding:3px 11px;border-radius:999px;border:1px solid rgba(255,255,255,.16);font-size:11px;font-weight:800;color:#cbd5e1;margin:6px 6px 0 0}",
    ".mg-pill.on{border-color:rgba(52,211,153,.55);color:#6ee7b7}",
    ".mg-pill.off{border-color:rgba(251,113,133,.6);color:#fda4af}",
    ".mg-pill.flap{border-color:rgba(244,114,182,.6);color:#f9a8d4}",
    ".mg-ctitle{display:flex;gap:10px;flex-wrap:wrap;align-items:flex-start;justify-content:space-between;margin-bottom:6px}",
    ".mg-ctitle h4{font-size:20px!important;margin:0}",
    ".mg-fl{display:flex;flex-direction:column;gap:5px;font-size:11px;font-weight:800;color:#a8b3c7;letter-spacing:.3px}",
    ".mg-st{font-size:12px;font-weight:800;white-space:nowrap}",
    ".mg-st.on{color:#34d399}.mg-st.off{color:#fb7185}.mg-st.flap{color:#f472b6}.mg-st.wait{color:#94a3b8}",
    ".mg-tbl th{text-align:left;font-size:11px;letter-spacing:1px;text-transform:uppercase;color:#94a3b8;padding:10px;border-bottom:1px solid rgba(245,196,81,.25);position:sticky;top:0;background:#0b1220;z-index:1}",
    ".mg-det{margin-top:16px;border:1px solid rgba(255,255,255,.1);border-radius:12px;padding:11px 15px}",
    ".mg-det summary{cursor:pointer;font-weight:800;font-size:13px;color:#ffe9a8}",
    ".mg-tools{display:flex;gap:10px;flex-wrap:wrap;align-items:center;margin:14px 0}",
    ".mg-empty{padding:28px!important;text-align:center;color:#94a3b8;font-size:13px;font-weight:600}"
  ].join("\n");
  document.head.appendChild(st7);

  function h(tag, attrs, kids) {
    var el = document.createElement(tag);
    for (var k in (attrs || {})) {
      if (k === "class") el.className = attrs[k];
      else if (k === "text") el.textContent = attrs[k];
      else if (k.slice(0, 2) === "on") el[k] = attrs[k];
      else el.setAttribute(k, attrs[k]);
    }
    (kids || []).forEach(function (c) {
      if (c) el.appendChild(typeof c === "string" ? document.createTextNode(c) : c);
    });
    return el;
  }

  function api(method, url, body) {
    var opt = { method: method, headers: { "Content-Type": "application/json" } };
    if (token) opt.headers["x-manage-token"] = token;
    if (body) opt.body = JSON.stringify(body);
    return fetch(url, opt).then(function (r) {
      return r.json().catch(function () { return {}; }).then(function (j) {
        if (r.status === 401 && token) { token = null; showLogin("Session expired. Please log in again."); }
        if (!r.ok) throw new Error(j.error || ("Error " + r.status));
        return j;
      });
    });
  }

  // After a change, make the main dashboard pick it up immediately.
  function refreshDash(catChanged) {
    try {
      lastTopologyHash = "";
      if (catChanged) {
        var c = document.getElementById("filter-controls");
        while (c.children.length > 1) c.removeChild(c.lastChild);
        currentFilter = "all";
        c.firstElementChild.className = "filter-btn active";
      }
      fetchTelemetry();
    } catch (e) {}
  }

  function openPanel() {
    closePanel();
    ov = h("div", { class: "mg-ov" });
    document.body.appendChild(ov);
    showLogin();
  }
  function closePanel() {
    if (alertTimer) { clearInterval(alertTimer); alertTimer = null; }
    view = "links";
    if (token) {
      try { fetch("/api/manage/logout", { method: "POST", headers: { "x-manage-token": token } }); } catch (e) {}
      token = null;
    }
    if (ov && ov.parentNode) ov.parentNode.removeChild(ov);
    ov = null;
  }
  document.addEventListener("keydown", function (e) { if (e.key === "Escape" && ov) closePanel(); });

  function showLogin(msg) {
    if (!ov) return;
    var u = h("input", { class: "mg-in", placeholder: "Username", autocomplete: "off", style: "width:100%" });
    var p = h("input", { class: "mg-in", type: "password", placeholder: "Password", style: "width:100%" });
    var m = h("div", { class: "mg-msg", text: msg || "" });
    m.style.color = "#fb7185";
    function go() {
      m.textContent = "Checking...";
      api("POST", "/api/manage/login", { username: u.value, password: p.value })
        .then(function (j) { token = j.token; return load(); })
        .catch(function (e) { m.textContent = e.message; });
    }
    u.onkeydown = p.onkeydown = function (e) { if (e.key === "Enter") go(); };
    ov.innerHTML = "";
    ov.appendChild(h("div", { class: "mg-box", style: "max-width:380px" }, [
      h("h3", { text: "Manage links" }),
      h("div", { class: "mg-sub", text: "Admin login required" }),
      h("div", { class: "mg-row" }, [u]),
      h("div", { class: "mg-row" }, [p]),
      m,
      h("div", { class: "mg-row" }, [
        h("button", { class: "mg-b pri", text: "Log in", onclick: go }),
        h("button", { class: "mg-b", text: "Cancel", onclick: closePanel })
      ])
    ]));
    u.focus();
  }

  function load() {
    return api("GET", "/api/manage/data").then(function (j) {
      cats = j.categories || [];
      if (!cats.some(function (c) { return c.id === curId; })) curId = cats.length ? cats[0].id : null;
      render("");
    });
  }
  function cur() {
    for (var i = 0; i < cats.length; i++) if (cats[i].id === curId) return cats[i];
    return null;
  }
  function done(text, catChanged) {
    if (catChanged) filterText = "";
    refreshDash(catChanged);
    return load().then(function () { render(text, true); });
  }
  function fail(e) { render(e.message, false); }

  /* ===== 0.9 friendly console ===== */
  var alertsInfo = null, alertsAsked = false, showNew = false, showSettings = false, focusNew = false, liveEls = [], sumRef = null;

  function prioName(p) { return p === "P1" ? "Critical" : (p === "P2" ? "High" : "Normal"); }
  function prioOpts() {
    return [["P1", "Critical - needs attention at once"], ["P2", "High"], ["P3", "Normal"]].map(function (x) { return h("option", { value: x[0], text: x[1] }); });
  }
  function secLabel(x) { return x === 60 ? "Every minute" : "Every " + x + " seconds"; }
  function intOpts(extra) {
    var list = [5, 10, 15, 30, 60];
    if (extra && list.indexOf(extra) < 0) { list.push(extra); list.sort(function (a, b) { return a - b; }); }
    return list.map(function (x) { return h("option", { value: String(x), text: secLabel(x) }); });
  }
  function stInfo(s) {
    if (s === "ONLINE") return ["on", "Online"];
    if (s === "DOWN") return ["off", "Down"];
    if (s === "FLAPPING") return ["flap", "Unstable"];
    return ["wait", "Checking..."];
  }
  function liveStatus(c, n) {
    try {
      var cs = globalData.categories, cc = null, i, j;
      for (i = 0; i < cs.length; i++) if (cs[i].id === c.id) cc = cs[i];
      if (!cc) for (i = 0; i < cs.length; i++) if (cs[i].name === c.name) cc = cs[i];
      if (cc) for (j = 0; j < cc.nodes.length; j++) if (cc.nodes[j].ip === n.ip) return cc.nodes[j].status;
    } catch (e) {}
    return null;
  }
  function fillSummary(el, c) {
    var on = 0, off = 0, flap = 0;
    c.nodes.forEach(function (n) {
      var s = liveStatus(c, n);
      if (s === "ONLINE") on++; else if (s === "DOWN") off++; else if (s === "FLAPPING") flap++;
    });
    el.innerHTML = "";
    if (!c.nodes.length) return;
    el.appendChild(h("span", { class: "mg-pill on", text: "\u25CF " + on + " online" }));
    if (off) el.appendChild(h("span", { class: "mg-pill off", text: "\u25CF " + off + " down" }));
    if (flap) el.appendChild(h("span", { class: "mg-pill flap", text: "\u25CF " + flap + " unstable" }));
  }
  function paintLive() {
    if (!ov || !token || view !== "links") return;
    liveEls.forEach(function (o) {
      var i = stInfo(liveStatus(o.c, o.n));
      o.el.className = "mg-st " + i[0];
      o.el.textContent = "\u25CF " + i[1];
    });
    if (sumRef) fillSummary(sumRef.el, sumRef.c);
  }
  function tabs(active) {
    return h("div", { class: "mg-tabs" }, [
      h("button", { class: "mg-tab" + (active === "links" ? " on" : ""), text: "\uD83D\uDCCB My links", onclick: function () { view = "links"; render(""); } }),
      h("button", { class: "mg-tab" + (active === "alerts" ? " on" : ""), text: "\uD83D\uDD14 Alerts (WhatsApp / Telegram)", onclick: function () { alertsAsked = false; view = "alerts"; render(""); } }),
      h("span", { class: "mg-grow" }),
      h("button", { class: "mg-b", text: "Close and log out", onclick: closePanel })
    ]);
  }
  function csvCell(v) {
    v = String(v == null ? "" : v);
    if (/^[=+\-@]/.test(v)) v = "'" + v;
    return '"' + v.replace(/"/g, '""') + '"';
  }
  function exportCsv() {
    var rows = ["Category,Name,IP address"];
    cats.forEach(function (c) { c.nodes.forEach(function (n) { rows.push([csvCell(c.name), csvCell(n.name), csvCell(n.ip)].join(",")); }); });
    var blob = new Blob(["\uFEFF" + rows.join("\r\n")], { type: "text/csv" });
    var a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "pariscope-links.csv";
    document.body.appendChild(a);
    a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); if (a.parentNode) a.parentNode.removeChild(a); }, 800);
  }
  function paintSteps(el) {
    var total = 0;
    cats.forEach(function (c) { total += c.nodes.length; });
    var known = alertsInfo !== null;
    var a = !!(alertsInfo && ((alertsInfo.whatsapp && alertsInfo.whatsapp.enabled) || (alertsInfo.telegram && alertsInfo.telegram.enabled)));
    var st = [[cats.length > 0, "1. Create a category"], [total > 0, "2. Add your links"], [a, "3. Turn on phone alerts"]];
    el.innerHTML = "";
    if (cats.length > 0 && total > 0 && (!known || a)) { el.className = ""; return; }
    el.className = "mg-steps";
    el.appendChild(h("b", { text: "GETTING STARTED" }));
    st.forEach(function (x) { el.appendChild(h("span", { class: "mg-step" + (x[0] ? " done" : ""), text: (x[0] ? "\u2714 " : "") + x[1] })); });
    if (!a && known && cats.length > 0) el.appendChild(h("button", { class: "mg-b", text: "Set up alerts", onclick: function () { alertsAsked = false; view = "alerts"; render(""); } }));
  }

  function render(msg, good) {
    if (!ov || !token) return;
    if (view === "alerts") { renderAlerts(msg, good); return; }
    if (alertTimer) { clearInterval(alertTimer); alertTimer = null; }
    liveEls = []; sumRef = null;
    if (!cats.length) showNew = true;
    var c = showNew ? null : cur();
    var nnRef = null;
    var kids = [];

    kids.push(h("div", { class: "mg-head" }, [
      h("h3", { text: "Manage your links" }),
      h("div", { class: "mg-sub", text: "Everything you change here is live on the dashboard straight away." })
    ]));
    kids.push(tabs("links"));
    kids.push(h("div", { class: "mg-toast " + (msg ? (good ? "ok" : "bad") : "none"), text: msg ? (good ? "\u2714  " : "\u26A0  ") + msg : "" }));

    var ckEl = h("div");
    kids.push(ckEl);
    paintSteps(ckEl);
    if (!alertsAsked) {
      alertsAsked = true;
      api("GET", "/api/manage/notify")
        .then(function (s) { alertsInfo = s; paintSteps(ckEl); })
        .catch(function () { alertsInfo = null; });
    }

    /* category picker */
    var chips = cats.map(function (x) {
      return h("button", { class: "mg-cat" + (x.id === curId && !showNew ? " on" : ""), onclick: function () { curId = x.id; showNew = false; showSettings = false; filterText = ""; render(""); } }, [
        x.name,
        h("span", { class: "mg-count", text: String(x.nodes.length) })
      ]);
    });
    chips.push(h("button", { class: "mg-cat add" + (showNew ? " on" : ""), text: "+ New category", onclick: function () { showNew = true; render(""); } }));
    kids.push(h("div", { class: "mg-cats" }, chips));

    /* new category */
    if (showNew) {
      var cn = h("input", { class: "mg-in", placeholder: "For example: Internet Lines, Routers or Servers", style: "width:100%" });
      var cp = h("select", { class: "mg-in" }, prioOpts()); cp.value = "P3";
      var ci = h("select", { class: "mg-in" }, intOpts()); ci.value = "10";
      var go = h("button", { class: "mg-b pri", text: "Create category" });
      var create = function () {
        go.disabled = true; go.textContent = "Creating...";
        api("POST", "/api/manage/category", { name: cn.value, priority: cp.value, interval: Number(ci.value) * 1000 })
          .then(function (j) { curId = j.id; showNew = false; focusNew = true; return done("Category created. Now add your links to it.", true); })
          .catch(function (e) { go.disabled = false; go.textContent = "Create category"; fail(e); });
      };
      go.onclick = create;
      cn.onkeydown = function (e) { if (e.key === "Enter") create(); };
      var nk = [h("h4", { text: cats.length ? "New category" : "Welcome! Let us set up in 3 easy steps" })];
      nk.push(h("div", { class: "mg-help", text: cats.length
        ? "A category is a group of links, for example all your internet lines. You can add as many as you like."
        : "1) Give your first group of links a name below and press Create category.   2) Add your links to it, one by one or by pasting a whole list.   3) Open the Alerts tab to get messages on your phone." }));
      nk.push(h("div", { class: "mg-row" }, [h("label", { class: "mg-fl", style: "flex:1;min-width:260px" }, [h("span", { text: "Category name" }), cn])]));
      nk.push(h("div", { class: "mg-row" }, [
        h("label", { class: "mg-fl" }, [h("span", { text: "Importance" }), cp]),
        h("label", { class: "mg-fl" }, [h("span", { text: "How often to check" }), ci]),
        go,
        cats.length ? h("button", { class: "mg-b", text: "Cancel", onclick: function () { showNew = false; render(""); } }) : null
      ]));
      kids.push(h("div", { class: "mg-card" }, nk));
      setTimeout(function () { try { cn.focus(); } catch (e) {} }, 0);
    }

    /* selected category */
    if (c) {
      var secs = Math.round((c.interval || 10000) / 1000);
      var settingsBtn = h("button", { class: "mg-b", text: showSettings ? "Hide settings" : "\u2699 Category settings", onclick: function () { showSettings = !showSettings; render(""); } });
      var delCat = h("button", { class: "mg-b dng", text: "Delete category", onclick: function () {
        if (!confirm("Delete the whole category \"" + c.name + "\" and its " + c.nodes.length + " links?\nThis stops monitoring all of them.")) return;
        api("DELETE", "/api/manage/category/" + c.id).then(function () { curId = null; showSettings = false; return done("Category deleted.", true); }).catch(fail);
      } });
      var sumEl = h("span");
      sumRef = { el: sumEl, c: c };
      fillSummary(sumEl, c);
      var ck = [];
      ck.push(h("div", { class: "mg-ctitle" }, [
        h("div", {}, [
          h("h4", { text: c.name }),
          h("div", {}, [
            h("span", { class: "mg-pill", text: c.nodes.length + (c.nodes.length === 1 ? " link" : " links") }),
            h("span", { class: "mg-pill", text: "Importance: " + prioName(c.priority) }),
            h("span", { class: "mg-pill", text: secLabel(secs) }),
            sumEl
          ])
        ]),
        h("div", {}, [settingsBtn, " ", delCat])
      ]));

      if (showSettings) {
        var en = h("input", { class: "mg-in", value: c.name, style: "width:100%" });
        var ep = h("select", { class: "mg-in" }, prioOpts()); ep.value = c.priority || "P3";
        var ei = h("select", { class: "mg-in" }, intOpts(secs)); ei.value = String(secs);
        var esave = h("button", { class: "mg-b pri", text: "Save changes" });
        esave.onclick = function () {
          api("PUT", "/api/manage/category/" + c.id, { name: en.value, priority: ep.value, interval: Number(ei.value) * 1000 })
            .then(function () { showSettings = false; return done("Category updated.", true); })
            .catch(fail);
        };
        ck.push(h("div", { class: "mg-sec" }, [
          h("b", { text: "Category settings" }),
          h("div", { class: "mg-row" }, [h("label", { class: "mg-fl", style: "flex:1;min-width:240px" }, [h("span", { text: "Category name" }), en])]),
          h("div", { class: "mg-row" }, [
            h("label", { class: "mg-fl" }, [h("span", { text: "Importance" }), ep]),
            h("label", { class: "mg-fl" }, [h("span", { text: "How often to check" }), ei]),
            esave
          ])
        ]));
      }

      var q = h("input", { class: "mg-in", placeholder: "\uD83D\uDD0D  Search by name or IP", value: filterText, style: "flex:1;min-width:220px" });
      var bulk = function (on) {
        api("POST", "/api/manage/notify/bulk", { catId: c.id, wa: on, tg: on })
          .then(function () { return done("Alerts for all links in " + c.name + " are now " + (on ? "ON" : "OFF") + ".", false); }).catch(fail);
      };
      ck.push(h("div", { class: "mg-tools" }, [
        q,
        h("span", { class: "mg-sub", text: "Phone alerts for every link here:" }),
        h("button", { class: "mg-b", text: "All ON", onclick: function () { bulk(true); } }),
        h("button", { class: "mg-b", text: "All OFF", onclick: function () { bulk(false); } }),
        h("button", { class: "mg-b", text: "\u2B07 Export all links (CSV)", onclick: function () { exportCsv(); } })
      ]));

      var tbody = h("tbody");
      var fill = function () {
        liveEls = [];
        tbody.innerHTML = "";
        var f = filterText.toLowerCase();
        var rows = c.nodes.filter(function (n) { return !f || n.name.toLowerCase().indexOf(f) >= 0 || n.ip.indexOf(f) >= 0; });
        rows.sort(function (a, b) { return a.name.toLowerCase() < b.name.toLowerCase() ? -1 : 1; });
        if (!rows.length) tbody.appendChild(h("tr", {}, [h("td", { colspan: "5", class: "mg-empty", text: c.nodes.length ? "No link matches your search." : "No links here yet. Add your first link below." })]));
        rows.forEach(function (n) { tbody.appendChild(rowFor(c, n)); });
      };
      q.oninput = function () { filterText = q.value; fill(); };
      var thead = h("thead", {}, [h("tr", {}, ["Status", "Name", "IP address", "Send alerts to", ""].map(function (t) { return h("th", { text: t }); }))]);
      ck.push(h("div", { class: "mg-list" }, [h("table", { class: "mg-tbl" }, [thead, tbody])]));
      fill();

      var nn = h("input", { class: "mg-in", placeholder: "Link name, e.g. Main Office Router", style: "flex:2;min-width:200px" });
      var ni = h("input", { class: "mg-in", placeholder: "IP address, e.g. 10.1.2.3", style: "flex:1;min-width:160px" });
      nnRef = nn;
      var grpBox = h("div", { class: "mg-row" });
      var grpSel = { wa: [], tg: [] };
      function paintGrp(s) {
        grpBox.innerHTML = ""; grpSel = { wa: [], tg: [] };
        var wb = (s && s.whatsapp && s.whatsapp.boxes) || [];
        var tb = ((s && s.telegram && s.telegram.boxes) || []);
        if (!wb.length && !tb.length) return;
        grpBox.appendChild(h("span", { class: "mg-sub", text: "Send this link's alerts to:" }));
        wb.forEach(function (b) {
          var cb = h("input", { type: "checkbox" }); cb.checked = true; grpSel.wa.push({ cb: cb, id: b.id });
          grpBox.appendChild(h("label", { class: "mg-chip" }, [cb, "WA: " + (b.name || "Group")]));
        });
        tb.forEach(function (b) {
          var cb = h("input", { type: "checkbox" }); cb.checked = true; grpSel.tg.push({ cb: cb, id: b.id });
          grpBox.appendChild(h("label", { class: "mg-chip", title: b.chatId ? "Send to this Telegram group" : "Add the chat ID for this box in the Alerts tab first" }, [cb, "TG: " + (b.name || "Group") + (b.chatId ? "" : " (set chat ID in Alerts)")]));
        });
      }
      function grpAlerts() {
        var o = { wa: true, tg: true };
        if (grpSel.wa.length) { o.boxes = grpSel.wa.filter(function (x) { return x.cb.checked; }).map(function (x) { return x.id; }); o.wa = o.boxes.length > 0; }
        if (grpSel.tg.length) { o.tgBoxes = grpSel.tg.filter(function (x) { return x.cb.checked; }).map(function (x) { return x.id; }); o.tg = o.tgBoxes.length > 0; }
        return o;
      }
      paintGrp(alertsInfo);
      if (!alertsInfo) api("GET", "/api/manage/notify").then(function (s) { alertsInfo = s; paintGrp(s); }).catch(function () {});
      var add = h("button", { class: "mg-b pri", text: "+ Add link" });
      var addOne = function () {
        add.disabled = true; add.textContent = "Adding...";
        api("POST", "/api/manage/category/" + c.id + "/node", { name: nn.value, ip: ni.value, alerts: grpAlerts() })
          .then(function () { focusNew = true; return done("Link added.", false); })
          .catch(function (e) { add.disabled = false; add.textContent = "+ Add link"; fail(e); });
      };
      add.onclick = addOne;
      nn.onkeydown = ni.onkeydown = function (e) { if (e.key === "Enter") addOne(); };
      ck.push(h("div", { class: "mg-sec" }, [h("b", { text: "Add a link to " + c.name }), h("div", { class: "mg-help", text: "Type a name you will recognise and the IP address of the device. Press Enter to add." }), h("div", { class: "mg-row" }, [nn, ni, add]), grpBox]));

      var bt = h("textarea", { class: "mg-in", rows: "5", placeholder: "One link per line, like this:\nOffice Router, 10.1.2.3\nBranch Switch, 10.1.2.4", style: "width:100%;resize:vertical;font-family:inherit" });
      var bb = h("button", { class: "mg-b pri", text: "Add all these links" });
      bb.onclick = function () {
        var items = [], skipped = [];
        bt.value.split(/\r?\n/).forEach(function (raw) {
          var ln = raw.trim(); if (!ln) return;
          var m = /^(.*?)[\s,;]+((?:\d{1,3}\.){3}\d{1,3})$/.exec(ln), o = /^((?:\d{1,3}\.){3}\d{1,3})$/.exec(ln);
          if (m && m[1].trim()) items.push({ name: m[1].trim(), ip: m[2] });
          else if (o) items.push({ name: o[1], ip: o[1] });
          else skipped.push(ln);
        });
        if (!items.length) { fail(new Error("Nothing to add. Write each link like this:  Name, 10.1.2.3")); return; }
        bb.disabled = true; bb.textContent = "Adding " + items.length + " links...";
        var added = 0, errs = [];
        (function next(i) {
          if (i >= items.length) {
            var tx = added + " link(s) added.";
            if (errs.length) tx += " Not added: " + errs.join(" | ");
            if (skipped.length) tx += " Could not read: " + skipped.join(" | ");
            done(tx, false); return;
          }
          api("POST", "/api/manage/category/" + c.id + "/node", Object.assign({}, items[i], { alerts: grpAlerts() })).then(function () { added++; }).catch(function (e) { errs.push(items[i].name + " (" + e.message + ")"); }).then(function () { next(i + 1); });
        })(0);
      };
      ck.push(h("details", { class: "mg-det" }, [
        h("summary", { text: "\uD83D\uDCCB Add many links at once (paste a list)" }),
        h("div", { class: "mg-help", text: "Paste a list - one link per line: a name, a comma, then the IP address. The groups ticked above are used for all of them." }),
        bt, h("div", { class: "mg-row" }, [bb])
      ]));
      kids.push(h("div", { class: "mg-card" }, ck));
    }

    ov.innerHTML = "";
    ov.appendChild(h("div", { class: "mg-box mg-wide" }, kids));
    alertTimer = setInterval(paintLive, 3000);
    if (focusNew && nnRef) { focusNew = false; setTimeout(function () { try { nnRef.focus(); } catch (e) {} }, 0); }
  }

  function when(ts) { return ts ? new Date(ts).toLocaleString() : ""; }

  function renderAlerts(msg, good) {
    var msgEl = h("div", { class: "mg-msg", text: msg || "" });
    msgEl.style.color = good ? "#34d399" : "#fb7185";
    var box = h("div", { class: "mg-box" });
    ov.innerHTML = "";
    ov.appendChild(box);
    var say = function (t, ok) { msgEl.textContent = t; msgEl.style.color = ok ? "#34d399" : "#fb7185"; };

    var siteIn = h("input", { class: "mg-in", placeholder: "Site name, e.g. Dhaka Office (shown in every alert)", style: "flex:1;min-width:240px" });
    var siteBtn = h("button", { class: "mg-b", text: "Save name" });

    var tgOn = h("input", { type: "checkbox" });
    var tgToken = h("input", { class: "mg-in", type: "password", placeholder: "Bot API token", style: "flex:2;min-width:240px", autocomplete: "off" });
    var tgChat = h("input", { class: "mg-in", placeholder: "Group chat ID, e.g. -1001234567890", style: "flex:1;min-width:200px" });
    var tgFind = h("button", { class: "mg-b", text: "Find my group" });
    var tgSave = h("button", { class: "mg-b pri", text: "Save Telegram" });
    var tgTest = h("button", { class: "mg-b", text: "Send test" });
    var tgPicks = h("div");
    var tgStat = h("div", { class: "mg-stat" });
    var tgBoxesEl = h("div");
    var tgAdd = h("button", { class: "mg-b", text: "+ Add another Telegram box" });
    var tgBoxState = [];
    var tgBoxEls = {};
    function buildTgState(t) {
      var bl = (t.boxes && t.boxes.length) ? t.boxes : [{ id: "t1", name: "Telegram box 1", chatId: t.chatId || "" }, { id: "t2", name: "Telegram box 2", chatId: "" }, { id: "t3", name: "Telegram box 3", chatId: "" }];
      return bl.map(function (b) { return { id: b.id, name: b.name, chatId: b.chatId || "" }; });
    }
    function tgSyncState() {
      tgBoxState.forEach(function (bx) { var e = tgBoxEls[bx.id]; if (e) { bx.name = e.name.value; bx.chatId = e.chat.value; } });
      return tgBoxState;
    }
    function tgFillPick(id) {
      tgSyncState();
      var free = tgBoxState.filter(function (b) { return !String(b.chatId).trim(); })[0];
      if (!free) { say("All boxes already have a chat ID. Add another box or clear one first.", false); return; }
      free.chatId = id; renderTgBoxes();
      say("Chat ID put in " + free.name + ". Click Save Telegram when done.", true);
    }
    function renderTgBoxes() {
      tgBoxesEl.innerHTML = "";
      tgBoxEls = {};
      tgBoxState.forEach(function (bx, idx) {
        var nameIn = h("input", { class: "mg-in", placeholder: "Box name, e.g. Notification group", style: "flex:1;min-width:180px" });
        nameIn.value = bx.name;
        var chatIn = h("input", { class: "mg-in", placeholder: "Group chat ID, e.g. -1001234567890", style: "flex:1;min-width:200px" });
        chatIn.value = bx.chatId;
        var tBtn = h("button", { class: "mg-b", text: "Send test" });
        tBtn.onclick = function () {
          busy(tBtn, "Sending...", api("POST", "/api/manage/notify/telegram/test", { token: tgToken.value, chatId: chatIn.value }), "Test message sent. Look in this Telegram group.");
        };
        tgBoxEls[bx.id] = { name: nameIn, chat: chatIn };
        var top = [nameIn, chatIn, tBtn];
        if (idx >= 3) {
          top.push(h("button", { class: "mg-b dng", text: "Remove box", onclick: function () {
            tgSyncState(); tgBoxState.splice(idx, 1); renderTgBoxes();
            say("Box removed from the screen. Press Save Telegram to apply.", true);
          } }));
        }
        tgBoxesEl.appendChild(h("div", { style: "border:1px solid rgba(148,163,184,.25);border-radius:10px;padding:10px;margin:8px 0" }, [h("div", { class: "mg-row" }, top)]));
      });
    }

    var waOn = h("input", { type: "checkbox" });
    var waLink = h("textarea", { class: "mg-in", rows: "4", placeholder: "Paste your WhatsApp group links here - ONE LINK PER LINE\nhttps://chat.whatsapp.com/XXXXXXXXXX\nhttps://chat.whatsapp.com/YYYYYYYYYY", style: "flex:1;min-width:280px;resize:vertical;font-family:inherit" });
    var waSave = h("button", { class: "mg-b pri", text: "Save and connect" });
    var waTest = h("button", { class: "mg-b", text: "Send test" });
    var waUnlink = h("button", { class: "mg-b dng", text: "Unlink WhatsApp" });
    var waStat = h("div", { class: "mg-stat", style: "white-space:pre-line" });
    var waImg = h("div");
    var waBoxesEl = h("div");
    var waAdd = h("button", { class: "mg-b", text: "+ Add another group box" });
    var boxState = [];
    var boxEls = {};
    function buildBoxState(w) {
      var bl = (w.boxes && w.boxes.length) ? w.boxes : [{ id: "b1", name: "Group box 1" }, { id: "b2", name: "Group box 2" }, { id: "b3", name: "Group box 3" }];
      var gs = w.groups || [];
      return bl.map(function (b) { return { id: b.id, name: b.name, links: gs.filter(function (g) { return g.box === b.id; }).map(function (g) { return g.inviteLink; }).join("\n") }; });
    }
    function syncFromEls() {
      boxState.forEach(function (bx) { var e = boxEls[bx.id]; if (e) { bx.name = e.name.value; bx.links = e.links.value; } });
    }
    function paintBoxStats(w) {
      var names = { joined: "READY", pending: "waiting for admin approval", error: "problem", checking: "checking...", "": "waiting" };
      Object.keys(boxEls).forEach(function (id) {
        var gs = (w.groups || []).filter(function (g) { return g.box === id; });
        boxEls[id].stat.textContent = gs.length ? gs.map(function (g) { return "\u2022 " + (g.name || g.inviteLink) + " - " + (names[g.state] || g.state) + (g.error ? " (" + g.error + ")" : ""); }).join("\n") : "No link saved in this box yet.";
        boxEls[id].stat.style.color = gs.some(function (g) { return g.state === "joined"; }) ? "#34d399" : "#94a3b8";
      });
    }
    function renderBoxes() {
      waBoxesEl.innerHTML = "";
      boxEls = {};
      boxState.forEach(function (bx, idx) {
        var nameIn = h("input", { class: "mg-in", placeholder: "Box name, e.g. Notification group", style: "flex:1;min-width:180px" });
        nameIn.value = bx.name;
        var linksIn = h("textarea", { class: "mg-in", rows: "3", placeholder: "Paste the group link(s) for this box - ONE LINK PER LINE\nhttps://chat.whatsapp.com/XXXXXXXXXX", style: "flex:1;min-width:280px;resize:vertical;font-family:inherit" });
        linksIn.value = bx.links;
        var tBtn = h("button", { class: "mg-b", text: "Send test" });
        tBtn.onclick = function () {
          busy(tBtn, "Sending...", api("POST", "/api/manage/notify/whatsapp/test", { box: bx.id }), "Test message sent. Look in the WhatsApp group(s) of this box.");
        };
        var st = h("div", { class: "mg-stat", style: "white-space:pre-line" });
        boxEls[bx.id] = { name: nameIn, links: linksIn, stat: st };
        var top = [nameIn, tBtn];
        if (idx >= 3) {
          top.push(h("button", { class: "mg-b dng", text: "Remove box", onclick: function () {
            syncFromEls(); boxState.splice(idx, 1); renderBoxes();
            say("Box removed from the screen. Press Save and connect to apply.", true);
          } }));
        }
        waBoxesEl.appendChild(h("div", { style: "border:1px solid rgba(148,163,184,.25);border-radius:10px;padding:10px;margin:8px 0" }, [
          h("div", { class: "mg-row" }, top),
          h("div", { class: "mg-row" }, [linksIn]),
          st
        ]));
      });
    }

    box.appendChild(h("div", { class: "mg-head" }, [
      h("h3", { text: "Alerts: WhatsApp and Telegram" }),
      h("div", { class: "mg-sub", text: "Get a message on your phone when a link goes DOWN, and again when it is back UP and stable." })
    ]));
    box.appendChild(tabs("alerts"));
    box.appendChild(msgEl);
    box.appendChild(h("div", { class: "mg-row" }, [siteIn, siteBtn]));

    box.appendChild(h("div", { class: "mg-card" }, [
      h("h4", { text: "WhatsApp groups (add as many as you need)" }),
      h("div", { class: "mg-help", text: "1) Tick the box, then paste group invite links into the boxes below (one link per line, a different box for each type of group), then press Save and connect.  2) Scan the QR code: WhatsApp on the phone > Settings > Linked devices > Link a device.  3) Pariscope joins every group by its link and sends alerts to the boxes ticked for each link (see the tick boxes in My links). The group must allow members to send messages." }),
      h("div", { class: "mg-row" }, [h("label", { class: "mg-chip" }, [waOn, "Send alerts to WhatsApp"]), waSave, waAdd]),
      waBoxesEl,
      waStat, waImg,
      h("div", { class: "mg-row" }, [waUnlink])
    ]));
    box.appendChild(h("div", { class: "mg-card" }, [
      h("h4", { text: "Telegram group" }),
      h("div", { class: "mg-help", text: "1) In Telegram talk to @BotFather, send /newbot and copy the token.  2) Add your bot to the group and write any message in the group.  3) Paste the token once (one bot works for all groups), click Find my group or type each chat ID into a box below, then press Save Telegram and Send test in each box." }),
      h("div", { class: "mg-row" }, [h("label", { class: "mg-chip" }, [tgOn, "Send alerts to Telegram"])]),
      h("div", { class: "mg-row" }, [tgToken]),
      tgBoxesEl,
      tgPicks,
      h("div", { class: "mg-row" }, [tgFind, tgSave, tgAdd]),
      tgStat
    ]));
    box.appendChild(h("div", { class: "mg-help", text: "Switch alerts on or off for each link in the links list (WhatsApp and Telegram tick boxes). New links start with both ON." }));

    var firstFill = true;
    function waText(w) {
      var m = {
        off: "Not connected.", loading: "Starting WhatsApp...", connecting: "Connecting to WhatsApp...",
        qr: "Waiting for you to scan the QR code below.", connected: "Connected" + (w.number ? " as +" + w.number : "") + ".",
        missing: "WhatsApp component not installed on this PC.", error: "WhatsApp error.", logged_out: "Logged out from the phone. A new QR code will appear."
      };
      var t = m[w.status] || w.status;
      if (w.status === "connected") {
        if (w.group === "joined") t += " Group: " + (w.groupName || "ready") + " (ready).";
        else if (w.group === "pending") t += " Group: waiting for an admin to approve.";
        else if (w.group === "no_link") t += " No group link saved.";
        else t += " Checking the group...";
      }
      return t;
    }
    function groupLines(w) { return ""; }
    function groupLinesOld(w) {
      var gs = w.groups || [];
      if (!gs.length) return "";
      var names = { joined: "READY", pending: "waiting for admin approval", error: "problem", checking: "checking...", "": "waiting" };
      return "\n" + gs.map(function (g, i) { return "\u2022 Group " + (i + 1) + ": " + (g.name || g.inviteLink) + " - " + (names[g.state] || g.state) + (g.error ? " (" + g.error + ")" : ""); }).join("\n");
    }
    function paint(s, init) {
      if (init) {
        siteIn.value = s.siteName || "";
        tgOn.checked = s.telegram.enabled; tgBoxState = buildTgState(s.telegram); renderTgBoxes();
        tgToken.placeholder = s.telegram.tokenSet ? "Saved: " + s.telegram.tokenMask + " (leave empty to keep)" : "Bot API token";
        waOn.checked = s.whatsapp.enabled; boxState = buildBoxState(s.whatsapp); renderBoxes();
      }
      var w = s.whatsapp, t = s.telegram; paintBoxStats(w);
      waStat.textContent = waText(w) + (w.lastError ? "  \u26A0 " + w.lastError : "") + (w.lastOk ? "  Last alert sent: " + when(w.lastOk) : "") + groupLines(w);
      waStat.style.color = w.status === "connected" && w.group !== "error" ? "#34d399" : (w.status === "off" ? "#94a3b8" : "#fbbf24");
      var wantQr = w.status === "qr" && w.qr;
      if (wantQr && (!waImg.firstChild || waImg.firstChild.getAttribute("src") !== w.qr)) {
        waImg.innerHTML = "";
        if (/^data:image\/png;base64,[A-Za-z0-9+\/=]+$/.test(w.qr)) waImg.appendChild(h("img", { class: "mg-qr", src: w.qr, alt: "WhatsApp QR code" }));
      } else if (!wantQr) waImg.innerHTML = "";
      tgStat.textContent = !t.tokenSet && !t.chatId ? "Not set up." : ((t.enabled ? "ON" : "OFF") + (t.lastError ? "  \u26A0 " + t.lastError : "") + (t.lastOk ? "  Last alert sent: " + when(t.lastOk) : ""));
      tgStat.style.color = t.lastError ? "#fbbf24" : (t.enabled ? "#34d399" : "#94a3b8");
    }
    function poll() {
      if (!ov || !token || view !== "alerts") return;
      api("GET", "/api/manage/notify").then(function (s) { paint(s, firstFill); firstFill = false; }).catch(function () {});
    }
    poll();
    if (alertTimer) clearInterval(alertTimer);
    alertTimer = setInterval(poll, 2000);

    function busy(btn, label, p, okText) {
      var old = btn.textContent; btn.disabled = true; btn.textContent = label;
      p.then(function () { if (okText) say(okText, true); }).catch(function (e) { say(e.message, false); })
        .then(function () { btn.disabled = false; btn.textContent = old; poll(); });
    }
    siteBtn.onclick = function () { busy(siteBtn, "Saving...", api("POST", "/api/manage/notify/site", { siteName: siteIn.value }), "Site name saved."); };
    tgAdd.onclick = function () {
      tgSyncState();
      if (tgBoxState.length >= 10) { say("Maximum 10 Telegram boxes.", false); return; }
      tgBoxState.push({ id: "y" + Math.random().toString(36).slice(2, 8), name: "Telegram box " + (tgBoxState.length + 1), chatId: "" });
      renderTgBoxes();
    };
    tgSave.onclick = function () {
      busy(tgSave, "Saving...", api("POST", "/api/manage/notify/telegram", { enabled: tgOn.checked, token: tgToken.value, boxes: tgSyncState() }).then(function () { tgToken.value = ""; firstFill = true; }), "Telegram saved.");
    };
    tgTest.onclick = function () {
      busy(tgTest, "Sending...", api("POST", "/api/manage/notify/telegram/test", { token: tgToken.value, chatId: tgChat.value }), "Test message sent. Look in your Telegram group.");
    };
    tgFind.onclick = function () {
      tgPicks.innerHTML = "";
      busy(tgFind, "Looking...", api("POST", "/api/manage/notify/telegram/find", { token: tgToken.value }).then(function (j) {
        if (!j.chats.length) { say("No group found yet. Add the bot to your group, write a message there, then click again.", false); return; }
        j.chats.forEach(function (ch) {
          tgPicks.appendChild(h("span", { class: "mg-pick", text: ch.title + "  (" + ch.id + ")", onclick: function () { tgFillPick(ch.id); } }));
        });
        say("Click your group below to fill the chat ID.", true);
      }));
    };
    waSave.onclick = function () {
      syncFromEls();
      busy(waSave, "Saving...", api("POST", "/api/manage/notify/whatsapp", { enabled: waOn.checked, boxes: boxState }).then(function () { firstFill = true; }), "WhatsApp saved. If a QR code appears, scan it with your phone.");
    };
    waTest.onclick = function () { busy(waTest, "Sending...", api("POST", "/api/manage/notify/whatsapp/test", {}), "Test message sent. Look in your WhatsApp group."); };
    waAdd.onclick = function () {
      syncFromEls();
      if (boxState.length >= 10) { say("Maximum 10 group boxes.", false); return; }
      boxState.push({ id: "x" + Math.random().toString(36).slice(2, 8), name: "Group box " + (boxState.length + 1), links: "" });
      renderBoxes();
    };
    waUnlink.onclick = function () {
      if (!confirm("Unlink WhatsApp from Pariscope? You will need to scan a new QR code to use it again.")) return;
      busy(waUnlink, "Unlinking...", api("POST", "/api/manage/notify/whatsapp/unlink", {}).then(function () { firstFill = true; }), "WhatsApp unlinked.");
    };
  }

  function rowFor(c, n) {
    var tr = h("tr");
    if (!n.alerts) n.alerts = { wa: true, tg: true };
    function tgChips() {
      var bl = (alertsInfo && alertsInfo.telegram && alertsInfo.telegram.boxes) ? alertsInfo.telegram.boxes : [];
      if (!bl.length) return [chip("tg", "Telegram")];
      var cbs = [];
      function push() {
        var ids = cbs.filter(function (x) { return x.cb.checked; }).map(function (x) { return x.id; });
        n.alerts.tgBoxes = ids; n.alerts.tg = ids.length > 0;
        api("POST", "/api/manage/notify/link", { catId: c.id, uid: n.uid, tgBoxes: ids, tg: ids.length > 0 }).catch(function (e) { render(e.message, false); });
      }
      return bl.map(function (b) {
        var cb = h("input", { type: "checkbox" });
        cb.checked = n.alerts.tg !== false && (!Array.isArray(n.alerts.tgBoxes) || n.alerts.tgBoxes.indexOf(b.id) >= 0);
        cbs.push({ cb: cb, id: b.id });
        cb.onchange = push;
        return h("label", { class: "mg-chip", title: "Send this link's alerts to Telegram box: " + b.name }, [cb, "TG: " + (b.name || "Group") + (b.chatId ? "" : " (set chat ID in Alerts)")]);
      });
    }
    function waChips() {
      var bl = (alertsInfo && alertsInfo.whatsapp && alertsInfo.whatsapp.boxes && alertsInfo.whatsapp.boxes.length) ? alertsInfo.whatsapp.boxes : null;
      if (!bl) return [chip("wa", "WhatsApp")];
      var cbs = [];
      function push() {
        var ids = cbs.filter(function (x) { return x.cb.checked; }).map(function (x) { return x.id; });
        n.alerts.boxes = ids; n.alerts.wa = ids.length > 0;
        api("POST", "/api/manage/notify/link", { catId: c.id, uid: n.uid, boxes: ids, wa: ids.length > 0 }).catch(function (e) { render(e.message, false); });
      }
      return bl.map(function (b) {
        var cb = h("input", { type: "checkbox" });
        cb.checked = n.alerts.wa !== false && (!Array.isArray(n.alerts.boxes) || n.alerts.boxes.indexOf(b.id) >= 0);
        cbs.push({ cb: cb, id: b.id });
        cb.onchange = push;
        return h("label", { class: "mg-chip", title: "Send this link's alerts to WhatsApp box: " + b.name }, [cb, b.name || "Group"]);
      });
    }
    function chip(key, label) {
      var cb = h("input", { type: "checkbox" });
      cb.checked = n.alerts[key] !== false;
      cb.onchange = function () {
        var body = { catId: c.id, uid: n.uid }; body[key] = cb.checked;
        n.alerts[key] = cb.checked;
        api("POST", "/api/manage/notify/link", body).catch(function (e) { cb.checked = !cb.checked; n.alerts[key] = cb.checked; render(e.message, false); });
      };
      return h("label", { class: "mg-chip", title: label + " alert for this link" }, [cb, label]);
    }
    function show() {
      tr.innerHTML = "";
      var si = stInfo(liveStatus(c, n));
      var st = h("span", { class: "mg-st " + si[0], text: "\u25CF " + si[1] });
      liveEls.push({ el: st, c: c, n: n });
      tr.appendChild(h("td", {}, [st]));
      tr.appendChild(h("td", { text: n.name }));
      tr.appendChild(h("td", { class: "ip", text: n.ip }));
      tr.appendChild(h("td", { style: "white-space:normal" }, waChips().concat(tgChips())));
      tr.appendChild(h("td", { style: "text-align:right;white-space:nowrap" }, [
        h("button", { class: "mg-b", text: "Edit", onclick: edit }), " ",
        h("button", { class: "mg-b dng", text: "Delete", onclick: del })
      ]));
    }
    function edit() {
      var a = h("input", { class: "mg-in", value: n.name, style: "width:100%" });
      var b = h("input", { class: "mg-in", value: n.ip, style: "width:100%" });
      function save() {
        api("PUT", "/api/manage/category/" + c.id + "/node/" + n.uid, { name: a.value, ip: b.value })
          .then(function () { return done("Link updated.", false); }).catch(fail);
      }
      a.onkeydown = b.onkeydown = function (e) {
        if (e.key === "Enter") save();
        else if (e.key === "Escape") { e.stopPropagation(); show(); }
      };
      tr.innerHTML = "";
      tr.appendChild(h("td", { class: "mg-sub", text: "Editing" }));
      tr.appendChild(h("td", {}, [a]));
      tr.appendChild(h("td", {}, [b]));
      tr.appendChild(h("td", { class: "mg-sub", text: "" }));
      tr.appendChild(h("td", { style: "text-align:right;white-space:nowrap" }, [
        h("button", { class: "mg-b pri", text: "Save", onclick: save }), " ",
        h("button", { class: "mg-b", text: "Cancel", onclick: show })
      ]));
      a.focus();
    }
    function del() {
      if (!confirm("Delete \"" + n.name + "\" (" + n.ip + ") from " + c.name + "?")) return;
      api("DELETE", "/api/manage/category/" + c.id + "/node/" + n.uid)
        .then(function () { return done("Link deleted.", false); }).catch(fail);
    }
    show();
    return tr;
  }

  function emptyHint() {
    var el = document.getElementById("mg-hint");
    var empty = false;
    try { empty = !!(globalData && globalData.categories && globalData.categories.length === 0); } catch (e) {}
    var b = document.querySelector(".welcome-banner");
    if (empty && !el && b && b.parentNode) {
      el = h("div", { id: "mg-hint", class: "mg-hint", text: "No categories yet. Click MANAGE (top right), add your first category, then add your links to it." });
      b.parentNode.insertBefore(el, b.nextSibling);
    } else if (!empty && el && el.parentNode) {
      el.parentNode.removeChild(el);
    }
  }
  setInterval(emptyHint, 2000);

  var banner = document.querySelector(".welcome-banner");
  if (banner && !document.getElementById("mg-open")) {
    banner.appendChild(h("button", { id: "mg-open", class: "mg-btn", text: "\u2699 Manage", onclick: openPanel }));
  }
})();
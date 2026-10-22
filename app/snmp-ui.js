/* Pariscope SNMP add-on - Advanced mode UI. Loaded by one <script> tag in index.html. */
(function () {
  "use strict";
  if (window.__snmpUiLoaded) return;
  window.__snmpUiLoaded = true;
  var BASE = "/api/manage/snmp", TOK = null, memAdv = false;
  var esc = function (s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); };
  function adv() { try { return localStorage.getItem("pariscope.adv") === "1"; } catch (e) { return memAdv; } }
  function setAdv(v) { memAdv = v; try { localStorage.setItem("pariscope.adv", v ? "1" : "0"); } catch (e) {} }

  try {
    var of = window.fetch;
    if (of) window.fetch = function (u, o) {
      try { var hd = o && o.headers, t = hd && (hd["x-manage-token"] || hd["X-Manage-Token"] || (typeof hd.get === "function" && hd.get("x-manage-token"))); if (t) TOK = t; } catch (e) {}
      var pr = of.apply(this, arguments); try { var us = String((u && u.url) ? u.url : u); if (us.indexOf("/api/status") >= 0) { pr.then(function (rs) { try { rs.clone().json().then(function (jj) { if (jj && jj.snmpDevices) { pubDevs = jj.snmpDevices; pubAt = Date.now(); pubErr = ""; } }).catch(function () {}); } catch (e2) {} }).catch(function () {}); } } catch (e3) {} return pr;
    };
  } catch (e) {}

  var css = [
    ".sn-ov{position:fixed;inset:0;background:rgba(2,4,10,.82);backdrop-filter:blur(6px);z-index:6000;display:flex;align-items:center;justify-content:center;padding:16px;box-sizing:border-box;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#f8fafc}",
    ".sn-box{width:100%;max-width:760px;max-height:94vh;overflow:auto;background:#0b1220;border:1px solid rgba(251,191,36,.35);border-radius:16px;padding:22px;box-shadow:0 20px 60px rgba(0,0,0,.7);box-sizing:border-box}",
    ".sn-box.full{max-width:1200px;height:94vh}",
    ".sn-box h3,.sn-box h2{margin:0;font-weight:800}.sn-box h3{font-size:18px}.sn-box h2{font-size:22px}",
    ".sn-box h4{margin:16px 0 6px;font-size:13px;color:#fbbf24;text-transform:uppercase;letter-spacing:.8px}",
    ".sn-sub{color:#94a3b8;font-size:12px;font-weight:600;margin-top:3px}",
    ".sn-box label{display:block;font-size:11px;font-weight:800;color:#94a3b8;margin-top:10px;text-transform:uppercase;letter-spacing:.5px}",
    ".sn-box input:not([type=checkbox]),.sn-box select{display:block;width:100%;margin-top:4px;background:rgba(0,0,0,.45);border:1px solid rgba(255,255,255,.16);color:#f8fafc;padding:9px 11px;border-radius:9px;font-size:13px;outline:none;box-sizing:border-box}",
    ".sn-box input:focus,.sn-box select:focus{border-color:#fbbf24}.sn-box select option{background:#0b1220}",
    ".sn-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:0 12px}",
    ".sn-chk{display:inline-flex!important;align-items:center;gap:6px;margin:8px 16px 0 0!important;text-transform:none!important;font-size:13px!important;color:#e2e8f0!important;cursor:pointer}",
    ".sn-chk input{width:16px;height:16px;accent-color:#fbbf24;margin:0!important;display:inline-block!important}",
    ".sn-btns{display:flex;gap:8px;flex-wrap:wrap;margin-top:16px;align-items:center}",
    ".sn-b{background:rgba(30,41,59,.9);color:#e2e8f0;border:1px solid rgba(255,255,255,.18);padding:9px 16px;border-radius:10px;cursor:pointer;font-weight:800;font-size:12px}",
    ".sn-b:hover{border-color:rgba(255,255,255,.45)}.sn-b:disabled{opacity:.5;cursor:wait}",
    ".sn-b.pri{background:linear-gradient(135deg,#fcd34d,#b8860b);color:#1a1200;border-color:transparent}",
    ".sn-b.dng{background:rgba(153,27,27,.55);border-color:#f43f5e;color:#fff}",
    ".sn-msg{font-size:12px;font-weight:700;min-height:16px;margin-top:10px;line-height:1.5}.sn-msg.ok{color:#34d399}.sn-msg.bad{color:#fb7185}.sn-msg.wait{color:#fbbf24}",
    ".sn-top{display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap;align-items:flex-start}",
    ".sn-pill{display:inline-block;padding:3px 10px;border-radius:99px;font-size:11px;font-weight:800;margin-left:8px;vertical-align:middle}",
    ".sn-pill.up{background:rgba(52,211,153,.15);color:#34d399;border:1px solid #34d399}.sn-pill.dn{background:rgba(251,113,133,.15);color:#fb7185;border:1px solid #fb7185}.sn-pill.na{background:rgba(148,163,184,.15);color:#94a3b8;border:1px solid #64748b}",
    ".sn-cards{display:grid;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));gap:10px;margin-top:14px}",
    ".sn-card{background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.1);border-radius:12px;padding:12px 14px}",
    ".sn-card .l{font-size:10px;font-weight:800;color:#94a3b8;letter-spacing:.8px;text-transform:uppercase}.sn-card .v{font-size:26px;font-weight:800;margin-top:2px}.sn-card .s{font-size:11px;color:#94a3b8;margin-top:2px}",
    ".sn-bar{height:5px;border-radius:4px;background:rgba(255,255,255,.1);margin-top:6px;overflow:hidden}.sn-bar i{display:block;height:100%;background:#34d399}",
    ".sn-tabs{display:flex;gap:8px;margin-top:16px;flex-wrap:wrap}",
    ".sn-tab{padding:8px 16px;border-radius:10px;border:1px solid rgba(255,255,255,.16);background:rgba(30,41,59,.7);color:#cbd5e1;font-weight:800;font-size:12px;cursor:pointer}.sn-tab.on{background:linear-gradient(135deg,#fcd34d,#b8860b);color:#1a1200;border-color:transparent}",
    ".sn-tool{display:flex;gap:12px;align-items:center;flex-wrap:wrap;margin-top:12px}.sn-tool input[type=text]{width:260px!important;margin:0!important}",
    ".sn-tw{margin-top:10px;overflow:auto;border:1px solid rgba(255,255,255,.09);border-radius:10px;max-height:52vh}",
    ".sn-t{width:100%;border-collapse:collapse;font-size:12.5px}.sn-t th{position:sticky;top:0;background:#111a2e;text-align:left;padding:8px 10px;font-size:10.5px;color:#fbbf24;text-transform:uppercase;letter-spacing:.6px}",
    ".sn-t td{padding:7px 10px;border-top:1px solid rgba(255,255,255,.06);white-space:nowrap}.sn-t td.m{font-family:monospace}.sn-t .a{color:#94a3b8;font-size:11px}",
    ".sn-st{font-weight:800;font-size:11px}.sn-st.up{color:#34d399}.sn-st.dn{color:#fb7185}.sn-st.off{color:#64748b}.sn-st.o{color:#fbbf24}",
    ".sn-empty{padding:26px;text-align:center;color:#94a3b8;font-size:13px;line-height:1.6}",
    ".sn-bar2{display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin:10px 0;padding:10px 12px;border:1px dashed rgba(251,191,36,.45);border-radius:12px;background:rgba(251,191,36,.05)}",
    ".sn-bar2 b{font-size:11px;letter-spacing:.8px;color:#fbbf24;text-transform:uppercase}.sn-bar2 .sn-b{padding:6px 12px}.sn-bar2 .hint{font-size:11px;color:#94a3b8}"
  ].join("\n");
  var st = document.createElement("style"); st.textContent = css; document.head.appendChild(st);

  function modal(html, cls) {
    var ov = document.createElement("div"); ov.className = "sn-ov";
    ov.innerHTML = '<div class="sn-box ' + (cls || "") + '">' + html + "</div>";
    document.body.appendChild(ov);
    var m = { ov: ov, el: ov.firstChild, close: function () { if (ov.parentNode) ov.parentNode.removeChild(ov); if (m.onclose) { var f = m.onclose; m.onclose = null; f(); } } };
    ov.__close = m.close;
    m.F = function (n) { return m.el.querySelector('[data-f="' + n + '"]'); };
    return m;
  }
  document.addEventListener("keydown", function (e) {
    if (e.key !== "Escape") return;
    var all = document.querySelectorAll(".sn-ov"); if (all.length) all[all.length - 1].__close();
  });

  function raw(method, p, body) {
    var h = { "Content-Type": "application/json" }; if (TOK) h["x-manage-token"] = TOK;
    return fetch(p, { method: method, headers: h, body: body ? JSON.stringify(body) : undefined }).then(function (r) {
      return r.json().catch(function () { return {}; }).then(function (j) {
        if (r.status === 401) { TOK = null; var e = new Error("login"); e.login = true; throw e; }
        if (!r.ok) throw new Error(j.error || ("Error " + r.status));
        return j;
      });
    });
  }
  function ensure() {
    if (TOK) return Promise.resolve();
    return new Promise(function (res, rej) {
      var m = modal('<h3>Log in to continue</h3><div class="sn-sub">Use your Pariscope Manage username and password.</div><label>Username<input data-f="u" autocomplete="username"></label><label>Password<input data-f="p" type="password" autocomplete="current-password"></label><div class="sn-msg bad" data-f="m"></div><div class="sn-btns"><button class="sn-b pri" data-f="go">Log in</button><button class="sn-b" data-f="x">Cancel</button></div>');
      m.el.style.maxWidth = "420px";
      var go = function () {
        m.F("m").textContent = "";
        raw("POST", "/api/manage/login", { username: m.F("u").value, password: m.F("p").value })
          .then(function (j) { TOK = j.token; m.onclose = null; m.close(); res(); })
          .catch(function (e) { m.F("m").textContent = e.message; });
      };
      m.F("go").onclick = go; m.F("p").onkeydown = function (e) { if (e.key === "Enter") go(); };
      m.F("x").onclick = function () { m.close(); rej(new Error("cancelled")); };
      m.onclose = function () { rej(new Error("cancelled")); };
      setTimeout(function () { m.F("u").focus(); }, 0);
    });
  }
  function call(method, p, body) {
    return ensure().then(function () { return raw(method, p, body); }).catch(function (e) {
      if (e && e.login) return ensure().then(function () { return raw(method, p, body); });
      throw e;
    });
  }

  function fmtRate(b) { if (b == null) return "-"; if (b < 1e3) return Math.round(b) + " bps"; if (b < 1e6) return (b / 1e3).toFixed(1) + " Kbps"; if (b < 1e9) return (b / 1e6).toFixed(2) + " Mbps"; return (b / 1e9).toFixed(2) + " Gbps"; }
  function fmtBytes(b) { if (b == null) return "-"; var u = ["B", "KB", "MB", "GB", "TB", "PB"], i = 0; while (b >= 1024 && i < u.length - 1) { b /= 1024; i++; } return b.toFixed(i ? 1 : 0) + " " + u[i]; }
  function fmtUp(s) { if (s == null) return "-"; var d = Math.floor(s / 86400), h = Math.floor(s % 86400 / 3600), m = Math.floor(s % 3600 / 60); return (d ? d + "d " : "") + h + "h " + m + "m"; }
  function fmtSpeed(b) { return b ? fmtRate(b).replace(" bps", " bps").replace("bps", "") + "bps" : "-"; }
  function spark(h, key, color) {
    var v = (h || []).map(function (x) { return x[key]; }).filter(function (x) { return x != null; });
    if (v.length < 2) return "";
    var w = 150, hh = 26, pts = v.map(function (y, i) { return (i * w / (v.length - 1)).toFixed(1) + "," + (hh - Math.min(100, y) / 100 * hh).toFixed(1); }).join(" ");
    return '<svg width="' + w + '" height="' + hh + '" style="margin-top:6px"><polyline fill="none" stroke="' + color + '" stroke-width="1.5" points="' + pts + '"/></svg>';
  }

  /* ---------- Add / edit form ---------- */
  function openForm(dev, presetHost, onSaved) {
    var isEdit = !!dev;
    dev = dev || { version: "v2c", port: 161, pollSec: 60, timeoutSec: 5, metrics: { cpu: true, mem: true, disk: false }, v3: {} };
    var v3 = dev.v3 || {};
    var polls = [[30, "Every 30 seconds"], [60, "Every 1 minute"], [120, "Every 2 minutes"], [300, "Every 5 minutes"], [600, "Every 10 minutes"]];
    if (!polls.some(function (p) { return p[0] === dev.pollSec; })) polls.push([dev.pollSec, "Every " + dev.pollSec + " seconds"]);
    var keepHint = isEdit ? "(leave empty to keep the saved one)" : "";
    var m = modal(
      '<h3>' + (isEdit ? "Edit SNMP device" : "Add SNMP device") + '</h3><div class="sn-sub">SNMP lets Pariscope read interfaces, traffic, CPU, memory and more from a server, router or switch. Pariscope tests the connection before saving.</div>' +
      '<h4>Device</h4><div class="sn-grid"><label>Display name<input data-f="name" placeholder="e.g. Main MikroTik" value="' + esc(dev.name || "") + '"></label>' +
      '<label>Hostname / IP address<input data-f="host" placeholder="e.g. 192.168.1.1" value="' + esc(dev.host || presetHost || "") + '"></label>' +
      '<label>SNMP port<input data-f="port" type="number" value="' + esc(dev.port) + '"></label>' +
      '<label>SNMP version<select data-f="version"><option value="v1">v1</option><option value="v2c">v2c</option><option value="v3">v3</option></select></label></div>' +
      '<div data-f="g12"><label>Community string<input data-f="comm" placeholder="' + (isEdit ? "(unchanged)" : "e.g. public") + '" autocomplete="off"></label></div>' +
      '<div data-f="g3"><div class="sn-grid"><label>Username<input data-f="user" value="' + esc(v3.user || "") + '" autocomplete="off"></label>' +
      '<label>Context (optional)<input data-f="ctx" value="' + esc(v3.context || "") + '"></label>' +
      '<label>Security level<select data-f="level"><option value="authPriv">Authentication + encryption</option><option value="authNoPriv">Authentication only</option><option value="noAuthNoPriv">No authentication</option></select></label></div>' +
      '<div class="sn-grid" data-f="gauth"><label>Authentication protocol<select data-f="authp"><option>sha</option><option>md5</option><option>sha224</option><option>sha256</option><option>sha384</option><option>sha512</option></select></label>' +
      '<label>Authentication password ' + keepHint + '<input data-f="authk" type="password" autocomplete="new-password"></label></div>' +
      '<div class="sn-grid" data-f="gpriv"><label>Encryption protocol<select data-f="privp"><option>aes</option><option>des</option><option>aes256b</option><option>aes256r</option></select></label>' +
      '<label>Encryption password ' + keepHint + '<input data-f="privk" type="password" autocomplete="new-password"></label></div></div>' +
      '<h4>Polling &amp; what to collect</h4><div class="sn-grid"><label>Polling interval<select data-f="poll">' + polls.map(function (p) { return '<option value="' + p[0] + '">' + p[1] + "</option>"; }).join("") + '</select></label>' +
      '<label>Timeout (seconds)<input data-f="timeout" type="number" min="1" max="30" value="' + esc(dev.timeoutSec) + '"></label></div>' +
      '<div><label class="sn-chk"><input type="checkbox" data-f="m_cpu"> CPU</label><label class="sn-chk"><input type="checkbox" data-f="m_mem"> Memory</label><label class="sn-chk"><input type="checkbox" data-f="m_disk"> Disk</label></div>' +
      '<div class="sn-sub">Interfaces, PPPoE users and VLANs are always available on the device page (double-click the IP).</div>' +
      (isEdit ? "" : '<div data-f="glink" style="display:none"><label class="sn-chk"><input type="checkbox" data-f="addlink" checked> Also show this IP on the main dashboard (ping check) in:</label><select data-f="cat"></select></div>') +
      '<div class="sn-msg" data-f="msg"></div><div class="sn-btns"><button class="sn-b" data-f="test">Test connection</button><button class="sn-b pri" data-f="save">' + (isEdit ? "Save changes" : "Add device") + '</button><button class="sn-b" data-f="cancel">Cancel</button></div>');
    var F = m.F;
    F("version").value = dev.version; F("level").value = v3.level || "authPriv"; F("authp").value = v3.authProto || "sha"; F("privp").value = v3.privProto || "aes";
    F("poll").value = String(dev.pollSec);
    F("m_cpu").checked = !!dev.metrics.cpu; F("m_mem").checked = !!dev.metrics.mem; F("m_disk").checked = !!dev.metrics.disk;
    function vis() {
      var v = F("version").value, lv = F("level").value;
      F("g12").style.display = v === "v3" ? "none" : ""; F("g3").style.display = v === "v3" ? "" : "none";
      F("gauth").style.display = lv === "noAuthNoPriv" ? "none" : ""; F("gpriv").style.display = lv === "authPriv" ? "" : "none";
    }
    F("version").onchange = vis; F("level").onchange = vis; vis();
    if (!isEdit) {
      call("GET", "/api/manage/data").then(function (j) {
        var cs = (j && j.categories) || []; if (!cs.length) return;
        F("cat").innerHTML = cs.map(function (c) { return '<option value="' + esc(c.id) + '">' + esc(c.name) + "</option>"; }).join("");
        F("glink").style.display = "";
      }).catch(function () {});
    }
    function msg(t, c) { var e = F("msg"); e.className = "sn-msg " + (c || ""); e.textContent = t; }
    function payload() {
      var v = F("version").value;
      var p = { id: dev.id, name: F("name").value, host: F("host").value, port: F("port").value, version: v, pollSec: F("poll").value, timeoutSec: F("timeout").value, metrics: { cpu: F("m_cpu").checked, mem: F("m_mem").checked, disk: F("m_disk").checked } };
      if (v === "v3") p.v3 = { user: F("user").value, context: F("ctx").value, level: F("level").value, authProto: F("authp").value, authKey: F("authk").value, privProto: F("privp").value, privKey: F("privk").value };
      else p.community = F("comm").value;
      return p;
    }
    function busy(b) { F("test").disabled = b; F("save").disabled = b; }
    F("test").onclick = function () {
      busy(true); msg("Testing SNMP connection... (up to " + (F("timeout").value || 5) + " s)", "wait");
      call("POST", BASE + "/test", payload()).then(function (j) { msg("\u2714 Connected. Device: " + (j.sys.name || "-") + " | " + (j.sys.descr || "").slice(0, 90) + " | up " + fmtUp(j.sys.uptimeSec), "ok"); busy(false); })
        .catch(function (e) { msg("\u26A0 " + e.message, "bad"); busy(false); });
    };
    F("save").onclick = function () {
      var p = payload(); busy(true); msg("Testing the SNMP connection before saving...", "wait");
      call(isEdit ? "PUT" : "POST", BASE + "/devices" + (isEdit ? "/" + dev.id : ""), p).then(function (j) {
        var tail = "";
        var chain = Promise.resolve();
        if (!isEdit && F("addlink") && F("addlink").checked && F("cat").value) {
          if (/^\d{1,3}(\.\d{1,3}){3}$/.test(p.host.trim())) chain = call("POST", "/api/manage/category/" + encodeURIComponent(F("cat").value) + "/node", { name: p.name, ip: p.host.trim() }).then(function () { tail = " Also added to the dashboard."; }).catch(function (e) { tail = " (Dashboard link not added: " + e.message + ")"; });
          else tail = " (Dashboard link needs an IPv4 address, so it was skipped.)";
        }
        return chain.then(function () {
          msg("\u2714 Saved. Connected to " + (j.sys.name || p.host) + "." + tail, "ok");
          if (onSaved) onSaved();
          setTimeout(function () { m.close(); }, 1400);
        });
      }).catch(function (e) { msg("\u26A0 " + e.message, "bad"); busy(false); });
    };
    F("cancel").onclick = function () { m.close(); };
    setTimeout(function () { F(isEdit ? "name" : (presetHost ? "name" : "name")).focus(); }, 0);
  }

  /* ---------- Device list ---------- */
  function openList() {
    var m = modal('<div class="sn-top"><div><h3>SNMP devices</h3><div class="sn-sub">Tip: double-click any IP address on the dashboard to open its SNMP page.</div></div><div class="sn-btns" style="margin:0"><button class="sn-b pri" data-f="add">+ Add SNMP device</button><button class="sn-b" data-f="x">Close</button></div></div><div class="sn-tw" data-f="tbl" style="max-height:60vh"></div>');
    function paint() {
      call("GET", BASE + "/devices").then(function (j) {
        var l = j.devices || [];
        if (!l.length) { m.F("tbl").innerHTML = '<div class="sn-empty">No SNMP devices yet. Press <b>+ Add SNMP device</b>.</div>'; return; }
        m.F("tbl").innerHTML = '<table class="sn-t"><tr><th>Status</th><th>Name</th><th>Address</th><th>Ver</th><th>CPU</th><th>Memory</th><th></th></tr>' + l.map(function (d) {
          var r = d.rt || {}, s = r.ok === true ? '<span class="sn-st up">ONLINE</span>' : r.ok === false ? '<span class="sn-st dn" title="' + esc(r.err) + '">NO REPLY</span>' : '<span class="sn-st off">WAITING</span>';
          return "<tr><td>" + s + "</td><td><b>" + esc(d.name) + '</b></td><td class="m">' + esc(d.host) + ":" + d.port + "</td><td>" + esc(d.version) + "</td><td>" + (r.cpu != null ? r.cpu + "%" : "-") + "</td><td>" + (r.mem ? r.mem.pct + "%" : "-") + '</td><td><button class="sn-b" data-o="' + d.id + '">Open</button> <button class="sn-b" data-e="' + d.id + '">Edit</button> <button class="sn-b dng" data-d="' + d.id + '">Delete</button></td></tr>';
        }).join("") + "</table>";
        m.F("tbl").onclick = function (e) {
          var b = e.target.closest("button"); if (!b) return;
          var id = b.getAttribute("data-o") || b.getAttribute("data-e") || b.getAttribute("data-d");
          var d = l.filter(function (x) { return x.id === id; })[0]; if (!d) return;
          if (b.hasAttribute("data-o")) { m.close(); openDevice(d); }
          else if (b.hasAttribute("data-e")) openForm(d, "", paint);
          else if (confirm("Delete SNMP device \"" + d.name + "\"? (Its dashboard ping link, if any, is not removed.)")) call("DELETE", BASE + "/devices/" + id).then(paint).catch(function (er) { alert(er.message); });
        };
      }).catch(function (e) { if (e.message !== "cancelled") m.F("tbl").innerHTML = '<div class="sn-empty">' + esc(e.message) + "</div>"; else m.close(); });
    }
    m.F("add").onclick = function () { openForm(null, "", paint); }; m.F("x").onclick = function () { m.close(); };
    paint();
  }

  /* ---------- Device page ---------- */
  function openDevice(d, ro) {
    var tab = "if", last = null, dead = false, tm = null, filter = "", onlyUp = false;
    var m = modal('<div class="sn-top"><div><h2 data-f="title"></h2><div class="sn-sub" data-f="sub"></div></div><div class="sn-btns" style="margin:0"><button class="sn-b" data-f="edit">Edit</button><button class="sn-b dng" data-f="del">Delete</button><button class="sn-b pri" data-f="close">Close</button></div></div>' +
      '<div class="sn-cards" data-f="cards"></div><div class="sn-tabs" data-f="tabs"></div>' +
      '<div class="sn-tool"><input type="text" data-f="q" placeholder="Search..."><label class="sn-chk" style="margin:0!important"><input type="checkbox" data-f="up"> Only show UP</label><span class="sn-sub" data-f="stamp"></span></div>' +
      '<div class="sn-msg bad" data-f="err"></div><div class="sn-tw" data-f="tbl"></div>', "full");
    var F = m.F;
    F("title").innerHTML = esc(d.name) + ' <span class="sn-pill na" data-f="pill">CONNECTING</span>';
    F("sub").textContent = d.host + ":" + d.port + "  |  SNMP " + d.version;
    m.onclose = function () { dead = true; clearTimeout(tm); };
    F("close").onclick = m.close; if (ro) { F("edit").style.display = "none"; F("del").style.display = "none"; }
    F("edit").onclick = function () { m.close(); openForm(d, "", function () { call("GET", BASE + "/devices").then(function (j) { var n = (j.devices || []).filter(function (x) { return x.id === d.id; })[0]; if (n) openDevice(n); }); }); };
    F("del").onclick = function () { if (confirm("Delete SNMP device \"" + d.name + "\"?")) call("DELETE", BASE + "/devices/" + d.id).then(function () { m.close(); }).catch(function (e) { alert(e.message); }); };
    F("q").oninput = function () { filter = this.value.toLowerCase(); paintTable(); };
    F("up").onchange = function () { onlyUp = this.checked; paintTable(); };
    F("tabs").onclick = function (e) { var b = e.target.closest("[data-t]"); if (!b) return; tab = b.getAttribute("data-t"); paint(); };

    function card(l, v, s, pct, extra) {
      return '<div class="sn-card"><div class="l">' + l + '</div><div class="v">' + v + '</div><div class="s">' + (s || "") + "</div>" + (pct != null ? '<div class="sn-bar"><i style="width:' + Math.min(100, pct) + "%;background:" + (pct > 85 ? "#fb7185" : pct > 65 ? "#fbbf24" : "#34d399") + '"></i></div>' : "") + (extra || "") + "</div>";
    }
    function stCell(i) {
      if (i.admin === 2) return '<span class="sn-st off">DISABLED</span>';
      return i.oper === 1 ? '<span class="sn-st up">UP</span>' : i.oper === 2 ? '<span class="sn-st dn">DOWN</span>' : '<span class="sn-st o">' + (i.oper === 5 ? "DORMANT" : "UNKNOWN") + "</span>";
    }
    function paint() {
      if (!last) return;
      var r = last.rt || {}, ifs = last.interfaces || [];
      var pill = F("pill"); pill.className = "sn-pill " + (r.ok ? "up" : "dn"); pill.textContent = r.ok ? "ONLINE" : "NO REPLY";
      F("sub").textContent = d.host + ":" + d.port + "  |  SNMP " + d.version + "  |  " + (last.sys.descr || "").slice(0, 110) + "  |  up " + fmtUp(last.sys.uptimeSec);
      var norm = ifs.filter(function (i) { return i.kind !== "pppoe"; }), pp = ifs.filter(function (i) { return i.kind === "pppoe"; }), vl = ifs.filter(function (i) { return i.kind === "vlan"; });
      var up = norm.filter(function (i) { return i.oper === 1; }).length, down = norm.filter(function (i) { return i.oper !== 1 && i.admin !== 2; }).length;
      var cards = "";
      cards += d.metrics.cpu ? card("CPU load", r.cpu != null ? r.cpu + "%" : "n/a", r.cpu == null ? "Device does not report CPU" : "", r.cpu, spark(r.hist, "cpu", "#fbbf24")) : "";
      cards += d.metrics.mem ? card("Memory", r.mem ? r.mem.pct + "%" : "n/a", r.mem ? fmtBytes(r.mem.used) + " of " + fmtBytes(r.mem.total) : "Device does not report memory", r.mem ? r.mem.pct : null, spark(r.hist, "mem", "#38bdf8")) : "";
      (r.disks || []).slice(0, 3).forEach(function (k) { cards += card("Disk: " + esc(k.name).slice(0, 18), k.pct + "%", fmtBytes(k.used) + " of " + fmtBytes(k.total), k.pct); });
      cards += card("Interfaces", up + ' <span style="font-size:14px;color:#94a3b8">up</span>', down + " down, " + norm.length + " total");
      cards += card("PPPoE users", String(pp.length), "online now");
      F("cards").innerHTML = cards;
      F("tabs").innerHTML = [["if", "Interfaces (" + norm.length + ")"], ["pp", "PPPoE users (" + pp.length + ")"], ["vl", "VLANs (" + Math.max(vl.length, (last.vlanNames || []).length) + ")"]].map(function (t) { return '<button class="sn-tab' + (tab === t[0] ? " on" : "") + '" data-t="' + t[0] + '">' + t[1] + "</button>"; }).join("");
      F("stamp").textContent = "Updated " + new Date().toLocaleTimeString() + " - refreshes every 5 s";
      paintTable();
    }
    function paintTable() {
      if (!last) return;
      var ifs = last.interfaces || [], html = "", rows;
      var match = function (i) { return !filter || (i.name + " " + i.alias).toLowerCase().indexOf(filter) >= 0; };
      var upOk = function (i) { return !onlyUp || i.oper === 1; };
      if (tab === "if") {
        rows = ifs.filter(function (i) { return i.kind !== "pppoe" && match(i) && upOk(i); });
        html = rows.length ? '<table class="sn-t"><tr><th>Status</th><th>Interface</th><th>Speed</th><th>In</th><th>Out</th><th>Errors in/out</th><th>Total in</th><th>Total out</th></tr>' + rows.map(function (i) {
          return "<tr><td>" + stCell(i) + "</td><td><b>" + esc(i.name) + "</b>" + (i.alias ? '<div class="a">' + esc(i.alias) + "</div>" : "") + '</td><td class="m">' + fmtSpeed(i.speed) + '</td><td class="m">' + fmtRate(i.inBps) + '</td><td class="m">' + fmtRate(i.outBps) + '</td><td class="m">' + i.inErr + " / " + i.outErr + '</td><td class="m">' + fmtBytes(i.inBytes) + '</td><td class="m">' + fmtBytes(i.outBytes) + "</td></tr>";
        }).join("") + "</table>" : '<div class="sn-empty">No interfaces match.</div>';
      } else if (tab === "pp") {
        rows = ifs.filter(function (i) { return i.kind === "pppoe" && match(i); });
        html = rows.length ? '<table class="sn-t"><tr><th>Status</th><th>User</th><th>Download (to user)</th><th>Upload (from user)</th><th>Total downloaded</th><th>Total uploaded</th></tr>' + rows.map(function (i) {
          var u = i.name.replace(/^<?pppoe-/i, "").replace(/>$/, "");
          return "<tr><td>" + stCell(i) + "</td><td><b>" + esc(u) + '</b></td><td class="m">' + fmtRate(i.outBps) + '</td><td class="m">' + fmtRate(i.inBps) + '</td><td class="m">' + fmtBytes(i.outBytes) + '</td><td class="m">' + fmtBytes(i.inBytes) + "</td></tr>";
        }).join("") + "</table>" : '<div class="sn-empty">No PPPoE sessions found.<br>On MikroTik, each connected PPPoE user appears here as a dynamic interface named &lt;pppoe-username&gt;. Other brands may not expose PPPoE users over SNMP.</div>';
      } else {
        rows = ifs.filter(function (i) { return i.kind === "vlan" && match(i) && upOk(i); });
        html = rows.length ? '<table class="sn-t"><tr><th>Status</th><th>VLAN interface</th><th>In</th><th>Out</th><th>Total in</th><th>Total out</th></tr>' + rows.map(function (i) {
          return "<tr><td>" + stCell(i) + "</td><td><b>" + esc(i.name) + '</b></td><td class="m">' + fmtRate(i.inBps) + '</td><td class="m">' + fmtRate(i.outBps) + '</td><td class="m">' + fmtBytes(i.inBytes) + '</td><td class="m">' + fmtBytes(i.outBytes) + "</td></tr>";
        }).join("") + "</table>" : "";
        var vn = (last.vlanNames || []).filter(function (v) { return !filter || (v.id + " " + v.name).toLowerCase().indexOf(filter) >= 0; });
        if (vn.length) html += '<table class="sn-t" style="margin-top:12px"><tr><th>VLAN ID</th><th>Name (from the switch VLAN table)</th></tr>' + vn.map(function (v) { return '<tr><td class="m">' + v.id + "</td><td>" + esc(v.name) + "</td></tr>"; }).join("") + "</table>";
        if (!html) html = '<div class="sn-empty">No VLANs found on this device (or it does not expose them over SNMP).</div>';
      }
      F("tbl").innerHTML = html;
    }
    function load() {
      if (dead || !document.body.contains(m.ov)) { dead = true; return; }
      (ro ? pubLive(d.id) : call("GET", BASE + "/devices/" + d.id + "/live")).then(function (j) { last = j; F("err").textContent = ""; paint(); })
        .catch(function (e) { if (e.message === "cancelled") { m.close(); return; } F("err").textContent = "\u26A0 " + e.message; var p = F("pill"); if (p) { p.className = "sn-pill dn"; p.textContent = "NO REPLY"; } })
        .then(function () { if (!dead) tm = setTimeout(load, 5000); });
    }
    load();
  }

  /* ---------- Double-click on any IP ---------- */
  function openByIp(ip) {
    call("GET", BASE + "/devices").then(function (j) {
      var d = (j.devices || []).filter(function (x) { return snSame(x.host, ip); })[0];
      if (d) return openDevice(d);
      var m = modal('<h3>No SNMP set up for ' + esc(ip) + '</h3><div class="sn-sub">Add SNMP to see its interfaces, traffic, PPPoE users and VLANs.</div><div class="sn-btns"><button class="sn-b pri" data-f="go">Set up SNMP</button><button class="sn-b" data-f="x">Not now</button></div>');
      m.el.style.maxWidth = "440px";
      m.F("go").onclick = function () { m.close(); openForm(null, ip); }; m.F("x").onclick = m.close;
    }).catch(function () {});
  }
  document.addEventListener("dblclick", function (e) {
    if (!adv()) return;
    var el = e.target && e.target.closest ? e.target.closest(".ip") : null; if (!el) return;
    var ip = (el.textContent || "").trim();
    if (!/^\d{1,3}(\.\d{1,3}){3}$/.test(ip)) return;
    e.preventDefault(); openByIp(ip);
  });

  /* ---------- Advanced-mode bar inside the Manage panel ---------- */
  function inject() {
    var box = document.querySelector(".mg-box"); if (!box || box.querySelector("#sn-bar")) return;
    var anchor = box.querySelector(".mg-cats"); if (!anchor) return;
    var bar = document.createElement("div"); bar.id = "sn-bar"; bar.className = "sn-bar2";
    function draw() {
      var on = adv();
      bar.innerHTML = "<b>Advanced</b>" + '<button class="sn-b" data-a="tg">Advanced mode: ' + (on ? "ON" : "OFF") + "</button>" +
        (on ? '<button class="sn-b pri" data-a="add">+ Add SNMP device</button><button class="sn-b" data-a="list">SNMP devices <span data-a="n"></span></button><span class="hint">Double-click any IP on the dashboard to open its SNMP page.</span>' : '<span class="hint">Optional. Turn on to monitor servers and routers with SNMP (interfaces, traffic, PPPoE, VLANs).</span>');
      if (on) call("GET", BASE + "/devices").then(function (j) { var n = bar.querySelector('[data-a="n"]'); if (n) n.textContent = "(" + (j.devices || []).length + ")"; }).catch(function () {});
    }
    bar.onclick = function (e) {
      var b = e.target.closest("button"); if (!b) return; var a = b.getAttribute("data-a");
      if (a === "tg") { setAdv(!adv()); draw(); } else if (a === "add") openForm(null, "", draw); else if (a === "list") openList();
    };
    draw(); anchor.parentNode.insertBefore(bar, anchor);
  }
  var deb = null;
  var snCache = null, snAt = 0;
  function snList(cb) {
    if (snCache && Date.now() - snAt < 4000) return cb(snCache);
    call("GET", BASE + "/devices").then(function (j) { snCache = j.devices || []; snAt = Date.now(); cb(snCache); }).catch(function () {});
  }
  function refreshRows() {
    snCache = null;
    var o = document.querySelectorAll(".sn-rowbtn"); for (var i = 0; i < o.length; i++) o[i].parentNode.removeChild(o[i]);
    injectRows();
  }
  function injectRows() {
    if (!adv()) return;
    var box = document.querySelector(".mg-box"); if (!box) return;
    var todo = [], cells = box.querySelectorAll("td.ip");
    for (var i = 0; i < cells.length; i++) { var tr = cells[i].parentNode; if (tr && !tr.querySelector(".sn-rowbtn")) todo.push(cells[i]); }
    if (!todo.length) return;
    snList(function (list) {
      todo.forEach(function (td) {
        var tr = td.parentNode; if (!tr || tr.querySelector(".sn-rowbtn")) return;
        var ip = (td.textContent || "").trim(); if (!/^\d{1,3}(\.\d{1,3}){3}$/.test(ip)) return;
        var first = tr.querySelector("button"); if (!first) return;
        var has = list.filter(function (x) { return snSame(x.host, ip); })[0];
        var b = document.createElement("button"); b.className = "sn-b sn-rowbtn"; b.style.cssText = "padding:5px 10px;margin-right:6px";
        b.textContent = has ? "SNMP \u2714" : "+ SNMP";
        b.title = has ? "Open the SNMP page" : "Add SNMP monitoring for this IP";
        b.onclick = function (e) { e.preventDefault(); e.stopPropagation(); if (has) openDevice(has); else openForm(null, ip, refreshRows); };
        first.parentNode.insertBefore(b, first);
      });
    });
  }
  function injectAdd() {
    if (!adv()) return;
    var box = document.querySelector(".mg-box"); if (!box || box.querySelector(".sn-addbtn")) return;
    var btns = box.querySelectorAll("button"), add = null;
    for (var i = 0; i < btns.length; i++) { if (/^\+\s*Add link$/i.test((btns[i].textContent || "").trim())) { add = btns[i]; break; } }
    if (!add) return;
    var b = document.createElement("button"); b.className = "sn-b pri sn-addbtn"; b.type = "button"; b.style.cssText = "margin-left:8px;padding:9px 14px";
    b.textContent = "+ Add with SNMP"; b.title = "Add this server with SNMP monitoring (interfaces, bandwidth, PPPoE users, VLANs)";
    b.onclick = function (e) {
      e.preventDefault(); e.stopPropagation();
      var bx = document.querySelector(".mg-box"); if (!bx) return;
      var nIn = bx.querySelector('input[placeholder^="Link name"]'), iIn = bx.querySelector('input[placeholder^="IP address"]');
      var nm = nIn ? nIn.value.trim() : "", ip = iIn ? iIn.value.trim() : "";
      openForm(null, ip, refreshRows);
      var all = document.querySelectorAll(".sn-ov"), top = all[all.length - 1], nf = top && top.querySelector('[data-f="name"]');
      if (nf && nm) nf.value = nm;
    };
    add.parentNode.insertBefore(b, add.nextSibling);
  }
  var st2 = document.createElement("style"); st2.textContent = ".sn-ov{z-index:2147483000!important}"; document.head.appendChild(st2);
  var hostCache = null, hostAt = 0, hostBusy = false;
  function snHosts(cb) {
    if (hostCache && Date.now() - hostAt < 10000) return cb(hostCache);
    if (hostBusy) return;
    hostBusy = true;
    fetch("/api/snmp-hosts", { cache: "no-store" }).then(function (r) { return r.json(); }).then(function (j) { hostCache = (j && j.hosts) || []; hostAt = Date.now(); hostBusy = false; cb(hostCache); }).catch(function () { hostBusy = false; });
  }
  var pubDevs = null, pubAt = 0, pubBusy = false;
  var pubErr = "";
  function pubRefresh() {
    if (pubBusy) return;
    pubBusy = true;
    var x = new XMLHttpRequest();
    x.open("GET", "/api/snmp-view/devices?t=" + Date.now(), true);
    x.onreadystatechange = function () {
      if (x.readyState !== 4) return;
      pubBusy = false;
      try {
        if (x.status !== 200) { pubErr = "HTTP " + x.status; return; }
        var j = JSON.parse(x.responseText);
        pubDevs = (j && j.devices) || []; pubAt = Date.now(); pubErr = "";
        injectDetail();
      } catch (e) { pubErr = String(e && e.message || e); }
    };
    x.send();
  }
  function pubRefreshOld() {
    if (pubBusy) return;
    pubBusy = true;
    fetch("/api/snmp-view/devices", { cache: "no-store" }).then(function (r) { return r.json(); }).then(function (j) { pubDevs = (j && j.devices) || []; pubAt = Date.now(); pubBusy = false; injectDetail(); }).catch(function () { pubBusy = false; });
  }
  function pubLive(id) {
    return fetch("/api/snmp-view/" + encodeURIComponent(id) + "/live", { cache: "no-store" }).then(function (r) {
      return r.json().catch(function () { return {}; }).then(function (j) { if (!r.ok) throw new Error(j.error || ("Error " + r.status)); return j; });
    });
  }
  function snSame(a, b) {
  function n(s) {
    s = String(s == null ? "" : s).trim().toLowerCase();
    s = s.replace(/^[a-z]+:\/\//, "").replace(/\/.*$/, "").replace(/:\d+$/, "");
    return s.replace(/\b0+(\d)/g, "$1");
  }
  return n(a) === n(b);
}
function snIpOf(row) {
    var re = /^\s*(\d{1,3}(?:\.\d{1,3}){3})\s*[\u00B7\u2022|]/, best = "";
    var all = document.querySelectorAll("div,span,p,small,h2,h3,h4");
    for (var i = 0; i < all.length; i++) {
      var e = all[i];
      if (!e.offsetParent || e.children.length > 3) continue;
      var t = e.textContent || "";
      if (t.length > 90) continue;
      var m = t.match(re);
      if (m) best = m[1];
    }
    return best || snIpOfOld(row);
  }
  function snIpOfOld(row) {
    var re = /\b\d{1,3}(?:\.\d{1,3}){3}\b/, el = row;
    for (var k = 0; k < 8 && el; k++) {
      var sib = el.previousElementSibling;
      while (sib) { var m = (sib.textContent || "").match(re); if (m) return m[0]; sib = sib.previousElementSibling; }
      el = el.parentNode;
    }
    return "";
  }
  function snTry(ip) {
    var x = new XMLHttpRequest();
    x.open("GET", "/api/snmp-view/devices?t=" + Date.now(), true);
    x.onreadystatechange = function () {
      if (x.readyState !== 4) return;
      if (x.status !== 200) { alert("Could not load SNMP list: HTTP " + x.status); return; }
      var j; try { j = JSON.parse(x.responseText); } catch (er) { alert("Bad reply from server: " + er.message); return; }
      var list = (j && j.devices) || [];
      var d = list.filter(function (q) { return snSame(q.host, ip); })[0];
      if (!d) { alert("SNMP is not added for " + ip + ".\nSNMP hosts known: " + (list.map(function (q) { return q.host; }).join(", ") || "none")); return; }
      pubDevs = list; pubAt = Date.now();
      openDevice(d, true);
    };
    x.send();
  }
  function injectDetail() {
    var btns = document.querySelectorAll("button"), one = null;
    for (var i = 0; i < btns.length; i++) { if ((btns[i].textContent || "").trim() === "1 Day" && !btns[i].classList.contains("sn-b")) { one = btns[i]; break; } }
    if (!one || !one.parentNode) return;
    var row = one.parentNode, ip = "", el = row;
    ip = snIpOf(row);
    if (!ip) return;
    if (!pubDevs || Date.now() - pubAt > 15000) pubRefresh();
    var dev = pubDevs ? pubDevs.filter(function (x) { return snSame(x.host, ip); })[0] : null;
    var st = dev ? "on" : (pubDevs ? "off" : "wait");
    var cur = row.querySelector(".sn-detailbtn");
    if (cur && cur.getAttribute("data-ip") === ip && cur.getAttribute("data-st") === st) return;
    if (cur) cur.parentNode.removeChild(cur);
    var b = document.createElement("button"); b.type = "button"; b.setAttribute("data-ip", ip); b.setAttribute("data-st", st);
    b.className = "sn-b sn-detailbtn" + (dev ? " pri" : "");
    b.style.cssText = "margin-left:10px;padding:6px 14px;font-size:11px" + (dev ? "" : ";opacity:.5;cursor:not-allowed");
    if (dev) { b.textContent = "View Detailed Mode"; b.title = "Interfaces, status, PPPoE users and VLANs for " + ip; b.onclick = function (e) { e.preventDefault(); e.stopPropagation(); openDevice(dev, true); }; }
    else { b.textContent = "\uD83D\uDD12 View Detailed Mode"; b.title = pubDevs ? "Locked: SNMP is not added for this link. In MANAGE press + SNMP on its row to unlock." : ("Checking SNMP... " + pubErr); b.onclick = function (e) { e.preventDefault(); e.stopPropagation(); snTry(ip); }; }
    row.appendChild(b);
  }
  function injectDetailV4() {
    var btns = document.querySelectorAll("button"), one = null;
    for (var i = 0; i < btns.length; i++) { if ((btns[i].textContent || "").trim() === "1 Day" && !btns[i].classList.contains("sn-b")) { one = btns[i]; break; } }
    if (!one || !one.parentNode) return;
    var row = one.parentNode, ip = "", el = row;
    ip = snIpOf(row);
    if (!ip) return;
    if (!pubDevs || Date.now() - pubAt > 10000) pubRefresh();
    var dev = pubDevs ? pubDevs.filter(function (x) { return snSame(x.host, ip); })[0] : null;
    var st = dev ? "on" : "off";
    var cur = row.querySelector(".sn-detailbtn");
    if (cur && cur.getAttribute("data-ip") === ip && cur.getAttribute("data-st") === st) return;
    if (cur) cur.parentNode.removeChild(cur);
    var b = document.createElement("button"); b.type = "button"; b.setAttribute("data-ip", ip); b.setAttribute("data-st", st);
    b.className = "sn-b sn-detailbtn" + (dev ? " pri" : "");
    b.style.cssText = "margin-left:10px;padding:6px 14px;font-size:11px" + (dev ? "" : ";opacity:.5;cursor:not-allowed");
    if (dev) { b.textContent = "View Detailed Mode"; b.title = "Interfaces, status, PPPoE users and VLANs for " + ip; b.onclick = function (e) { e.preventDefault(); e.stopPropagation(); openDevice(dev, true); }; }
    else { b.textContent = "\uD83D\uDD12 View Detailed Mode"; b.title = pubDevs ? "Locked: SNMP is not added for this link. In MANAGE press + SNMP on its row to unlock." : "Checking SNMP..."; b.onclick = function (e) { e.preventDefault(); e.stopPropagation(); snTry(ip); }; }
    row.appendChild(b);
  }
  function injectDetailV3() {
    var btns = document.querySelectorAll("button"), one = null;
    for (var i = 0; i < btns.length; i++) { if ((btns[i].textContent || "").trim() === "1 Day" && !btns[i].classList.contains("sn-b")) { one = btns[i]; break; } }
    if (!one || !one.parentNode) return;
    var row = one.parentNode, ip = "", el = row;
    ip = snIpOf(row);
    var cur = row.querySelector(".sn-detailbtn");
    if (!ip) { if (cur) cur.parentNode.removeChild(cur); return; }
    if (!pubDevs) { pubRefresh(); return; }
    if (Date.now() - pubAt > 10000) pubRefresh();
    var dev = pubDevs.filter(function (x) { return snSame(x.host, ip); })[0];
    if (!dev) { if (cur) cur.parentNode.removeChild(cur); return; }
    if (cur && cur.getAttribute("data-ip") === ip) return;
    if (cur) cur.parentNode.removeChild(cur);
    var b = document.createElement("button"); b.type = "button"; b.className = "sn-b pri sn-detailbtn"; b.setAttribute("data-ip", ip);
    b.style.cssText = "margin-left:10px;padding:6px 14px;font-size:11px";
    b.textContent = "Detailed view (SNMP)"; b.title = "Interfaces, bandwidth, PPPoE users and VLANs for " + ip;
    b.onclick = function (e) { e.preventDefault(); e.stopPropagation(); openDevice(dev, true); };
    row.appendChild(b);
  }
  function injectDetailV2() {
    var btns = document.querySelectorAll("button"), one = null;
    for (var i = 0; i < btns.length; i++) { if ((btns[i].textContent || "").trim() === "1 Day" && !btns[i].classList.contains("sn-b")) { one = btns[i]; break; } }
    if (!one || !one.parentNode) return;
    var row = one.parentNode, ip = "", el = row;
    ip = snIpOf(row);
    var cur = row.querySelector(".sn-detailbtn");
    if (!ip) { if (cur) cur.parentNode.removeChild(cur); return; }
    if (cur && cur.getAttribute("data-ip") === ip) return;
    snHosts(function (hosts) {
      var c2 = row.querySelector(".sn-detailbtn");
      if (hosts.indexOf(ip) < 0) { if (c2) c2.parentNode.removeChild(c2); return; }
      if (c2 && c2.getAttribute("data-ip") === ip) return;
      if (c2) c2.parentNode.removeChild(c2);
      var b = document.createElement("button"); b.type = "button"; b.className = "sn-b pri sn-detailbtn"; b.setAttribute("data-ip", ip);
      b.style.cssText = "margin-left:10px;padding:6px 14px;font-size:11px";
      b.textContent = "Detailed view (SNMP)"; b.title = "Interfaces, bandwidth, PPPoE users and VLANs for " + ip;
      b.onclick = function (e) { e.preventDefault(); e.stopPropagation(); openByIp(ip); };
      row.appendChild(b);
    });
  }
  function injectDetailOld() {
    if (!adv()) return;
    var btns = document.querySelectorAll("button"), one = null;
    for (var i = 0; i < btns.length; i++) { if ((btns[i].textContent || "").trim() === "1 Day" && !btns[i].classList.contains("sn-b")) { one = btns[i]; break; } }
    if (!one || !one.parentNode) return;
    var row = one.parentNode;
    if (row.querySelector(".sn-detailbtn")) return;
    var ip = "", el = row;
    ip = snIpOf(row);
    if (!ip) return;
    var b = document.createElement("button"); b.type = "button"; b.className = "sn-b pri sn-detailbtn";
    b.style.cssText = "margin-left:10px;padding:6px 14px;font-size:11px";
    b.textContent = "Detailed view (SNMP)"; b.title = "Interfaces, bandwidth, PPPoE users and VLANs for " + ip;
    b.onclick = function (e) { e.preventDefault(); e.stopPropagation(); openByIp(ip); };
    row.appendChild(b);
  }
  new MutationObserver(function () { clearTimeout(deb); deb = setTimeout(function () { inject(); injectRows(); injectAdd(); injectDetail(); }, 80); }).observe(document.body, { childList: true, subtree: true });
})();
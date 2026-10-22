/* Pariscope "Customize Your Own" - super-admin dashboard designer (browser part). Fails safe. */
(function () {
  "use strict";
  try {
    if (window.__czLoaded) return;
    window.__czLoaded = true;

    var BLOCKS = [
      ["header-bar", ".header-bar", "Header bar"],
      ["logo-area", ".logo-area", "Logo and name"],
      ["head-right", ".head-right", "Header right side"],
      ["head-meta", ".head-meta", "Clock"],
      ["lic-chip", "#lic-chip", "Licence badge"],
      ["stats-capsule", "#stats-capsule", "Totals capsule"],
      ["welcome-banner", ".welcome-banner", "Welcome banner"],
      ["welcome-text", ".welcome-text", "Welcome text"],
      ["insights", ".insights", "Stats row"],
      ["kpi-grid", ".kpi-grid", "Stat cards"],
      ["kpi-health", ".kpi.health", "Network health"],
      ["kpi-tot", ".kpi.k-tot", "Total links card"],
      ["kpi-on", ".kpi.k-on", "Online card"],
      ["kpi-off", ".kpi.k-off", "Offline card"],
      ["kpi-flap", ".kpi.k-flap", "Flapping card"],
      ["feed-card", ".feed-card", "Live event feed"],
      ["toolbar", ".toolbar", "Search and filters"],
      ["filter-controls", "#filter-controls", "Category buttons"],
      ["critical", "#critical-container", "Critical area"],
      ["dashboard", "#dashboard-container", "Links area"],
      ["foot", ".foot", "Footer"],
      ["voice", "#voice-toggle", "Voice alerts button"],
      ["mg-open", "#mg-open", "Manage button"]
    ];
    var NODRAG = { voice: 1 };
    var KEEP = ".logo-area,#mg-open";
    var EXCL = '.cz-ui,script,style,.logo-area,#mg-open,#live-clock,#live-age,#lic-chip,[id^="cnt-"],[id^="kpi-"],#health-pct,#health-label,#feed-list,#critical-container,#dashboard-container,#voice-toggle,#view-toggle,#filter-controls,#mg-hint';

    var LAY = null, editing = false, token = null, layer = null, bars = {}, drag = null, tbar = null, trayKey = "", ORIG = {};
    var DEF = {};
    BLOCKS.forEach(function (b) { DEF[b[0]] = { sel: b[1], label: b[2] }; });

    function q(s) { return document.querySelector(s); }
    function tagAll() { BLOCKS.forEach(function (b) { var e = q(b[1]); if (e && e.getAttribute("data-cz-id") !== b[0]) e.setAttribute("data-cz-id", b[0]); }); }
    function byId(id) { tagAll(); return DEF[id] ? q('[data-cz-id="' + id + '"]') : null; }
    function parentId(e) { var p = e.parentElement; if (p === document.body) return "body"; if (p && p.getAttribute("data-cz-id")) return p.getAttribute("data-cz-id"); return "*"; }
    function nextBlock(e) { for (var n = e.nextElementSibling; n; n = n.nextElementSibling) { if (n.getAttribute("data-cz-id")) return n.getAttribute("data-cz-id"); } return null; }
    function canHide(e) { return !e.matches(KEEP); } function rescue(e) { var logo = q(".logo-area"), mg = q("#mg-open"), hr = byId("head-right"); if (mg && e.contains(mg)) { if (hr && !e.contains(hr)) hr.appendChild(mg); else document.body.insertBefore(mg, document.body.firstChild); } if (logo && e.contains(logo)) document.body.insertBefore(logo, document.body.firstChild); }

    function snapshot() {
      tagAll();
      var place = {}, order = [];
      [].slice.call(document.querySelectorAll("[data-cz-id]")).forEach(function (e) {
        var id = e.getAttribute("data-cz-id");
        order.push(id);
        place[id] = { p: parentId(e), n: nextBlock(e) };
      });
      return { place: place, order: order };
    }

    function applyMoves(st) {
      if (!st || !st.order || !st.place) return;
      tagAll();
      for (var i = st.order.length - 1; i >= 0; i--) {
        var id = st.order[i], inf = st.place[id], e = byId(id);
        if (!e || !inf || inf.p === "*") continue;
        var par = inf.p === "body" ? document.body : byId(inf.p);
        if (!par || par === e || e.contains(par)) continue;
        var ref = inf.n ? byId(inf.n) : null;
        if (ref && ref !== e && ref.parentElement === par) { if (e.nextElementSibling !== ref) par.insertBefore(e, ref); }
        else if (e.parentElement !== par || nextBlock(e) !== null) par.appendChild(e);
      }
    }

    function applyHidden(st, force) {
      if (!st) return;
      if (!force && !q("#mg-open")) return;
      var hid = {};
      (st.hidden || []).forEach(function (id) { hid[id] = 1; });
      BLOCKS.forEach(function (b) {
        var e = byId(b[0]);
        if (!e) return;
        if (hid[b[0]] && canHide(e)) { rescue(e); e.setAttribute("data-cz-hide", "1"); } else e.removeAttribute("data-cz-hide");
      });
    }

    function textEntries() {
      tagAll();
      var out = [], cnt = {}, w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null), n;
      while ((n = w.nextNode())) {
        var v = n.nodeValue;
        if (!v || !v.trim()) continue;
        var pe = n.parentElement;
        if (!pe || pe.closest(EXCL)) continue;
        var b = pe.closest("[data-cz-id]");
        if (!b) continue;
        var id = b.getAttribute("data-cz-id");
        cnt[id] = cnt[id] || 0;
        out.push({ node: n, key: id + ":" + cnt[id] });
        cnt[id]++;
      }
      return out;
    }
    function origOf(en) {
      if (en.node.__czo === undefined) en.node.__czo = en.node.nodeValue;
      if (!(en.key in ORIG)) ORIG[en.key] = en.node.__czo;
      return ORIG[en.key];
    }
    function okText(o, v) {
      if (!v || v.length > 200) return false;
      if (/pariscope/i.test(o) && !/pariscope/i.test(v)) return false;
      return true;
    }
    function setText(en, v) {
      var o = origOf(en), m = /^(\s*)([\s\S]*?)(\s*)$/.exec(o);
      if (v !== undefined && okText(o, v)) {
        var nv = m[1] + v + m[3];
        if (en.node.nodeValue !== nv) en.node.nodeValue = nv;
        en.node.__cze = true;
      } else if (en.node.__cze) { en.node.nodeValue = o; en.node.__cze = false; }
    }
    function applyTexts(st) {
      if (!st) return;
      textEntries().forEach(function (en) { setText(en, (st.texts || {})[en.key]); });
    }
    function applyAll(force) { if (!LAY) return; applyMoves(LAY); applyTexts(LAY); applyHidden(LAY, force); }

    function css() {
      if (q("#cz-style")) return;
      var s = document.createElement("style");
      s.id = "cz-style";
      s.textContent =
        "body:not(.cz-edit) [data-cz-hide]{display:none!important}" +
        "body.cz-edit [data-cz-hide]{opacity:.3}" +
        "body.cz-dragging{user-select:none!important;cursor:grabbing!important}" +
        ".cz-ui{font-family:Segoe UI,Roboto,sans-serif;box-sizing:border-box}" +
        "#cz-layer{position:fixed;left:0;top:0;width:0;height:0;z-index:2147483000;pointer-events:none}" +
        ".cz-box{position:fixed;border:1px dashed rgba(245,196,81,.55);pointer-events:none;border-radius:6px}" +
        ".cz-box.hot{border:2px solid #f5c451;background:rgba(245,196,81,.07)}" +
        ".cz-box.off{border-color:rgba(239,68,68,.7)}" +
        ".cz-bar{position:absolute;top:2px;display:flex;gap:2px;pointer-events:auto}" +
        ".cz-bar button{width:22px;height:22px;padding:0;border:0;border-radius:6px;cursor:pointer;font-size:13px;line-height:22px;color:#1a1200;background:#f5c451}" +
        ".cz-bar button.x{background:#ef4444;color:#fff}.cz-bar button.r{background:#22c55e;color:#04210f}" +
        ".cz-bar button.m{cursor:grab}" +
        ".cz-ind{position:fixed;z-index:2147483600;background:#f5c451;border-radius:3px;pointer-events:none;box-shadow:0 0 8px #f5c451}" +
        "#cz-tb{position:fixed;left:50%;bottom:14px;transform:translateX(-50%);z-index:2147483500;max-width:96vw;padding:10px 14px;border-radius:14px;background:#0b1220;border:1px solid rgba(245,196,81,.5);color:#f8fafc;font-size:13px;box-shadow:0 8px 30px rgba(0,0,0,.6);text-align:center}" +
        "#cz-tb button{margin:4px 3px 0;padding:8px 14px;border-radius:9px;border:0;font-weight:800;cursor:pointer}" +
        "#cz-tb .pri{background:linear-gradient(135deg,#ffdf8a,#f5c451);color:#1a1200}#cz-tb .gh{background:#1e293b;color:#f8fafc}" +
        "#cz-tray{margin-top:6px;font-size:12px;color:#94a3b8}#cz-tray button{padding:3px 9px;font-weight:600;background:#1e293b;color:#f8fafc}" +
        ".cz-ov{position:fixed;inset:0;z-index:2147483640;background:rgba(0,0,0,.65);display:flex;align-items:center;justify-content:center}" +
        ".cz-md{width:92%;max-width:400px;padding:22px;border-radius:16px;background:#0b1220;border:1px solid rgba(245,196,81,.4);color:#f8fafc}" +
        ".cz-md h3{margin:0 0 6px;font-size:18px}.cz-md p{margin:0 0 12px;color:#94a3b8;font-size:13px}" +
        ".cz-md input,.cz-md textarea{width:100%;margin:0 0 10px;padding:10px 12px;border-radius:10px;border:1px solid rgba(255,255,255,.18);background:rgba(0,0,0,.35);color:#fff;font-size:14px;font-family:inherit}" +
        ".cz-md .msg{min-height:18px;color:#fb7185;font-weight:700;font-size:13px;margin-bottom:8px}" +
        ".cz-md button{margin-right:6px;padding:9px 16px;border-radius:9px;border:0;font-weight:800;cursor:pointer;background:#1e293b;color:#f8fafc}" +
        ".cz-md button.pri{background:linear-gradient(135deg,#ffdf8a,#f5c451);color:#1a1200}" +
        ".cz-toast{position:fixed;left:50%;top:18px;transform:translateX(-50%);z-index:2147483647;padding:10px 16px;border-radius:10px;background:#ef4444;color:#fff;font-weight:700;font-size:13px}";
      document.head.appendChild(s);
    }

    function mk(tag, cls, txt) { var e = document.createElement(tag); if (cls) e.className = cls; if (txt != null) e.textContent = txt; return e; }
    function toast(m, good) { var t = mk("div", "cz-ui cz-toast", m); if (good) t.style.background = "#22c55e"; document.body.appendChild(t); setTimeout(function () { if (t.parentNode) t.parentNode.removeChild(t); }, 2600); }
    function post(url, body) {
      var h = { "Content-Type": "application/json" };
      if (token) h["x-cz-token"] = token;
      return fetch(url, { method: "POST", headers: h, body: JSON.stringify(body || {}) }).then(function (r) {
        return r.json().catch(function () { return {}; }).then(function (j) { if (!r.ok) { var e = new Error(j.error || ("Error " + r.status)); e.status = r.status; throw e; } return j; });
      });
    }
    function modal(title, sub, nodes, buttons) {
      var ov = mk("div", "cz-ui cz-ov"), md = mk("div", "cz-md");
      md.appendChild(mk("h3", "", title));
      if (sub) md.appendChild(mk("p", "", sub));
      nodes.forEach(function (n) { md.appendChild(n); });
      var row = mk("div");
      buttons.forEach(function (b) { var x = mk("button", b[2] || "", b[0]); x.type = "button"; x.onclick = function () { b[1](close); }; row.appendChild(x); });
      md.appendChild(row);
      ov.appendChild(md);
      ov.addEventListener("keydown", function (e) { e.stopPropagation(); });
      document.body.appendChild(ov);
      function close() { if (ov.parentNode) ov.parentNode.removeChild(ov); }
      return close;
    }

    function openLogin() {
      var u = mk("input"), p = mk("input"), m = mk("div", "msg");
      u.placeholder = "Super admin user name"; u.autocomplete = "off";
      p.type = "password"; p.placeholder = "Password";
      function go(close) {
        m.textContent = "Checking...";
        post("/api/customize/login", { username: u.value, password: p.value }).then(function (j) {
          token = j.token; close();
          try { document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true })); } catch (e) {}
          startEdit();
        }).catch(function (e) { m.textContent = e.message; });
      }
      var closeFn = modal("Customize Your Own", "Super admin login", [u, p, m], [["Log in", go, "pri"], ["Cancel", function (c) { c(); }]]);
      u.onkeydown = p.onkeydown = function (e) { if (e.key === "Enter") go(closeFn); };
      setTimeout(function () { u.focus(); }, 50);
    }

    function injectBtn() {
      var box = q(".mg-ov .mg-box");
      if (!box || box.querySelector("#cz-open") || box.textContent.indexOf("Admin login required") < 0) return;
      var row = mk("div"), b = mk("button", "mg-b", "\u2728 Customize Your Own");
      row.style.cssText = "margin-top:12px;border-top:1px solid rgba(255,255,255,.12);padding-top:12px;text-align:center";
      b.id = "cz-open"; b.type = "button"; b.style.width = "100%";
      b.onclick = openLogin;
      row.appendChild(b); box.appendChild(row);
    }

    function startEdit() {
      if (editing) return;
      editing = true;
      css();
      if (!LAY) LAY = { v: 1, place: {}, order: [], hidden: [], texts: {} };
      applyAll(true);
      document.body.classList.add("cz-edit");
      layer = mk("div", "cz-ui"); layer.id = "cz-layer";
      document.body.appendChild(layer);
      buildToolbar();
      document.addEventListener("click", onClick, true);
      requestAnimationFrame(frame);
    }

    function buildToolbar() {
      tbar = mk("div", "cz-ui"); tbar.id = "cz-tb";
      tbar.appendChild(mk("div", "", "Design mode: drag with \u2725, hide with \u2715, click any text to edit it."));
      var row = mk("div");
      [["Save design", save, "pri"], ["Reset to original", reset, "gh"], ["Cancel", function () { location.reload(); }, "gh"]].forEach(function (b) {
        var x = mk("button", b[2], b[0]); x.type = "button"; x.onclick = b[1]; row.appendChild(x);
      });
      tbar.appendChild(row);
      var tray = mk("div"); tray.id = "cz-tray"; tbar.appendChild(tray);
      document.body.appendChild(tbar);
    }
    function updateTray() {
      var ids = [].slice.call(document.querySelectorAll("[data-cz-hide]")).map(function (e) { return e.getAttribute("data-cz-id"); });
      var key = ids.join(",");
      if (key === trayKey) return;
      trayKey = key;
      var tray = q("#cz-tray"); if (!tray) return;
      tray.textContent = "";
      if (!ids.length) return;
      tray.appendChild(document.createTextNode("Hidden items: "));
      ids.forEach(function (id) {
        var b = mk("button", "", DEF[id].label + " \u21ba"); b.type = "button";
        b.onclick = function () { var e = byId(id); if (e) e.removeAttribute("data-cz-hide"); };
        tray.appendChild(b);
      });
    }

    function mkBar(id) {
      var box = mk("div", "cz-box"), bar = mk("div", "cz-bar"), m, x;
      box.style.zIndex = "1";
      if (!NODRAG[id]) {
        m = mk("button", "m", "\u2725"); m.type = "button"; m.title = "Drag: " + DEF[id].label; m.style.touchAction = "none";
        m.addEventListener("pointerdown", function (ev) { startDrag(ev, id, m); });
        bar.appendChild(m);
      }
      x = mk("button", "x", "\u2715"); x.type = "button";
      x.onclick = function () {
        var e = byId(id); if (!e) return;
        if (e.hasAttribute("data-cz-hide")) { e.removeAttribute("data-cz-hide"); return; }
        if (!canHide(e)) { toast("The logo, the name and the Manage button can be moved but not removed."); return; } rescue(e);
        e.setAttribute("data-cz-hide", "1");
      };
      bar.appendChild(x);
      box.addEventListener("mouseenter", function () { box.classList.add("hot"); });
      bar.addEventListener("mouseenter", function () { box.classList.add("hot"); });
      bar.addEventListener("mouseleave", function () { box.classList.remove("hot"); });
      box.appendChild(bar); layer.appendChild(box);
      return { box: box, bar: bar, x: x };
    }

    function frame() {
      if (!editing) return;
      tagAll();
      BLOCKS.forEach(function (b) {
        var id = b[0], e = q('[data-cz-id="' + id + '"]'), o = bars[id];
        if (!e) { if (o) o.box.style.display = "none"; return; }
        var r = e.getBoundingClientRect();
        var vis = r.width > 4 && r.height > 4 && r.bottom > 0 && r.top < window.innerHeight;
        if (!vis) { if (o) o.box.style.display = "none"; return; }
        if (!o) o = bars[id] = mkBar(id);
        var depth = 0; for (var a = e.parentElement; a; a = a.parentElement) { if (a.getAttribute && a.getAttribute("data-cz-id")) depth++; }
        var s = o.box.style;
        s.display = "block"; s.left = r.left + "px"; s.top = r.top + "px"; s.width = r.width + "px"; s.height = r.height + "px"; s.zIndex = String(depth + 1);
        var lx = 4 + depth * 48; if (r.left + lx + 50 > window.innerWidth) lx = Math.max(0, window.innerWidth - r.left - 50); o.bar.style.left = lx + "px"; o.bar.style.top = r.top >= 28 ? "-24px" : "2px";
        var hid = e.hasAttribute("data-cz-hide");
        o.box.classList.toggle("off", hid);
        var want = hid ? "\u21ba" : "\u2715";
        if (o.x.textContent !== want) { o.x.textContent = want; o.x.className = hid ? "r" : "x"; }
        if (!hid && !canHide(e)) o.x.style.display = "none"; else o.x.style.display = "";
      });
      updateTray();
      if (drag) {
        if (drag.y < 60) window.scrollBy(0, -14); else if (drag.y > window.innerHeight - 60) window.scrollBy(0, 14);
      }
      requestAnimationFrame(frame);
    }

    function findTarget(x, y) {
      var els = document.elementsFromPoint(x, y);
      for (var i = 0; i < els.length; i++) {
        var e = els[i];
        if (e.closest(".cz-ui")) continue;
        if (drag.el.contains(e)) return null;
        var b = e.closest("[data-cz-id]");
        while (b) {
          if (b !== drag.el && !drag.el.contains(b)) {
            var pp = b.parentElement;
            if (pp && (pp === document.body || pp.getAttribute("data-cz-id"))) return b;
          }
          b = b.parentElement ? b.parentElement.closest("[data-cz-id]") : null;
        }
        return null;
      }
      return null;
    }

    function startDrag(ev, id, handle) {
      var e = byId(id);
      if (!e || ev.button > 0) return;
      ev.preventDefault();
      drag = { el: e, id: id, x: ev.clientX, y: ev.clientY, drop: null, ind: mk("div", "cz-ui cz-ind") };
      document.body.appendChild(drag.ind);
      document.body.classList.add("cz-dragging");
      try { handle.setPointerCapture(ev.pointerId); } catch (x) {}
      function move(m) {
        drag.x = m.clientX; drag.y = m.clientY;
        var t = findTarget(m.clientX, m.clientY);
        if (!t) { drag.drop = null; drag.ind.style.display = "none"; return; }
        var r = t.getBoundingClientRect(), pcs = getComputedStyle(t.parentElement), tcs = getComputedStyle(t);
        var cx = r.left + r.width / 2, cy = r.top + r.height / 2, horiz;
        if (pcs.display.indexOf("grid") >= 0) horiz = Math.abs((m.clientX - cx) / r.width) > Math.abs((m.clientY - cy) / r.height);
        else horiz = (pcs.display.indexOf("flex") >= 0 && pcs.flexDirection.indexOf("row") === 0) || tcs.display.indexOf("inline") === 0;
        var after = horiz ? m.clientX > cx : m.clientY > cy, s = drag.ind.style;
        s.display = "block";
        if (horiz) { s.left = (after ? r.right : r.left) - 2 + "px"; s.top = r.top + "px"; s.width = "4px"; s.height = r.height + "px"; }
        else { s.left = r.left + "px"; s.top = (after ? r.bottom : r.top) - 2 + "px"; s.width = r.width + "px"; s.height = "4px"; }
        drag.drop = { t: t, after: after };
      }
      function end(u) {
        handle.removeEventListener("pointermove", move);
        handle.removeEventListener("pointerup", end);
        handle.removeEventListener("pointercancel", end);
        var d = drag; drag = null;
        document.body.classList.remove("cz-dragging");
        if (d.ind.parentNode) d.ind.parentNode.removeChild(d.ind);
        if (u && u.type === "pointerup" && d.drop) {
          var par = d.drop.t.parentElement;
          try { par.insertBefore(d.el, d.drop.after ? d.drop.t.nextSibling : d.drop.t); } catch (er) { toast("Could not move here."); }
        }
      }
      handle.addEventListener("pointermove", move);
      handle.addEventListener("pointerup", end);
      handle.addEventListener("pointercancel", end);
    }

    function onClick(ev) {
      if (!editing || ev.target.closest(".cz-ui")) return;
      ev.preventDefault(); ev.stopImmediatePropagation();
      var n = null;
      try { var r = document.caretRangeFromPoint(ev.clientX, ev.clientY); if (r) n = r.startContainer; } catch (e) {}
      if (!n || n.nodeType !== 3) return;
      var hit = textEntries().filter(function (en) { return en.node === n; })[0];
      if (hit) editText(hit);
    }

    function editText(en) {
      var o = origOf(en), ta = mk("textarea"), m = mk("div", "msg");
      ta.rows = 3; ta.value = en.node.nodeValue.trim();
      var keep = /pariscope/i.test(o);
      modal("Edit text", keep ? "This text must keep the word Pariscope." : "Change this text.", [ta, m], [
        ["Save", function (close) {
          var v = ta.value.trim();
          if (!okText(o, v)) { m.textContent = keep && v ? "The word Pariscope must stay in this text." : "Text cannot be empty."; return; }
          LAY.texts = LAY.texts || {};
          if (v === o.trim()) delete LAY.texts[en.key]; else LAY.texts[en.key] = v;
          setText(en, LAY.texts[en.key]); close();
        }, "pri"],
        ["Original", function (close) { delete (LAY.texts || {})[en.key]; setText(en, undefined); close(); }],
        ["Cancel", function (close) { close(); }]
      ]);
      setTimeout(function () { ta.focus(); }, 50);
    }

    function save() {
      var s = snapshot(), hidden = [];
      [].slice.call(document.querySelectorAll("[data-cz-hide]")).forEach(function (e) { hidden.push(e.getAttribute("data-cz-id")); });
      var layout = { v: 1, place: s.place, order: s.order, hidden: hidden, texts: LAY.texts || {} };
      post("/api/customize/save", { layout: layout }).then(function () {
        toast("Design saved. Everyone will see it now.", true);
        setTimeout(function () { location.reload(); }, 900);
      }).catch(function (e) { toast(e.message || "Save failed."); });
    }
    function reset() {
      if (!window.confirm("Go back to the original design for everyone?")) return;
      post("/api/customize/reset", {}).then(function () { location.reload(); }).catch(function (e) { toast(e.message || "Reset failed."); });
    }

    css();
    fetch("/api/customize/layout", { cache: "no-store" }).then(function (r) { return r.json(); }).then(function (j) {
      LAY = j && j.v === 1 ? j : null;
      if (!LAY) return;
      var t = 0;
      applyAll(false);
      var iv = setInterval(function () {
        if (editing) { clearInterval(iv); return; }
        t++; applyAll(t >= 12);
        if (t >= 20) clearInterval(iv);
      }, 700);
    }).catch(function () {});
    new MutationObserver(injectBtn).observe(document.body, { childList: true, subtree: true });
  } catch (err) { try { console.error("[customize-ui] disabled: " + err.message); } catch (e) {} }
})();

/* Pariscope simple view for the Manage panel. Look and layout only: hides and regroups, never deletes or rewrites. */
(function () {
  "use strict";
  var KEY = "pariscope_simple_view";
  function getOn() { try { return localStorage.getItem(KEY) !== "off"; } catch (e) { return true; } }
  function setOn(v) { try { localStorage.setItem(KEY, v ? "on" : "off"); } catch (e) {} }
  var on = getOn();
  var root = document.documentElement;

  var css = [
    ".mgs-bar{display:flex;justify-content:flex-end;gap:8px;margin:0 0 10px}",
    ".mgs-chips{display:contents}",
    ".mgs-chipbtn,.mgs-togbtn{display:none}",
    "html.mgs-on .mg-box{max-width:880px;padding:28px 30px;border-radius:20px;line-height:1.5}",
    "html.mgs-on .mg-box,html.mgs-on .mg-box *{text-shadow:none!important}",
    "html.mgs-on .mg-row{gap:12px;margin:16px 0}",
    "html.mgs-on .mg-in{padding:11px 14px;border-radius:12px;font-size:14px}",
    "html.mgs-on .mg-b{padding:10px 16px;border-radius:12px;font-size:13px;font-weight:600}",
    "html.mgs-on .mg-b.pri{background:linear-gradient(135deg,var(--gold,#f5c451),var(--gold-deep,#b8860b));color:#1a1204;border-color:transparent}",
    "html.mgs-on .sn-addbtn{background:transparent!important;color:var(--gold,#f5c451)!important;border:1px solid var(--gold,#f5c451)!important;box-shadow:none!important}",
    "html.mgs-on .mg-card{border-radius:16px;padding:18px 20px;background:rgba(255,255,255,.035)}",
    "html.mgs-on .mg-list{max-height:48vh;border-radius:14px}",
    "html.mgs-on .mg-tbl td{padding:12px 14px}",
    "html.mgs-on .mg-tbl tr:hover td{background:rgba(255,255,255,.035)}",
    "html.mgs-on .mg-sec{margin-top:22px;padding-top:16px}",
    "html.mgs-on .mg-help{font-size:13px}",
    "html.mgs-on .mgs-chipbtn,html.mgs-on .mgs-togbtn{display:inline-block;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.16);color:#e2e8f0;border-radius:999px;padding:6px 14px;font-size:12px;font-weight:600;cursor:pointer;margin:6px 0}",
    "html.mgs-on .mgs-chipbtn:hover,html.mgs-on .mgs-togbtn:hover{border-color:var(--gold,#f5c451)}",
    "html.mgs-on .mgs-chips{display:none;margin-top:8px}",
    "html.mgs-on .mgs-chips.open{display:flex;flex-wrap:wrap;gap:6px}",
    "html.mgs-on .mgs-gs:not(.open) > :not(.mgs-head){display:none}",
    "html.mgs-on .mgs-head{cursor:pointer;user-select:none}",
    "html.mgs-on .mgs-head::after{content:' \\25B8';color:#94a3b8}",
    "html.mgs-on .mgs-gs.open .mgs-head::after{content:' \\25BE'}",
    "html.mgs-on:not(.mgs-adv-open) #sn-bar{display:none!important}",
    "html.mgs-on:not(.mgs-more-open) .mgs-more{display:none!important}"
  ].join("\n");
  var st = document.createElement("style");
  st.id = "mgs-style";
  st.textContent = css;
  document.head.appendChild(st);

  function refreshBtns() {
    var a = document.querySelectorAll(".mgs-advbtn"), m = document.querySelectorAll(".mgs-morebtn"), i;
    var ao = root.classList.contains("mgs-adv-open"), mo = root.classList.contains("mgs-more-open");
    for (i = 0; i < a.length; i++) a[i].textContent = "\u2699 Advanced tools (SNMP)" + (ao ? " \u25BE" : " \u25B8");
    for (i = 0; i < m.length; i++) m[i].textContent = "More options (alerts, add many links)" + (mo ? " \u25BE" : " \u25B8");
  }

  function apply() {
    root.classList.toggle("mgs-on", on);
    var bs = document.querySelectorAll(".mgs-sw");
    for (var i = 0; i < bs.length; i++) bs[i].textContent = on ? "Classic view" : "Simple view";
  }

  function addBar(box) {
    if (box.querySelector(".mgs-bar") || !box.querySelector(".mg-tab")) return;
    var bar = document.createElement("div");
    bar.className = "mgs-bar";
    var b = document.createElement("button");
    b.type = "button";
    b.className = "mg-b mgs-sw";
    b.title = "Switch between the simple layout and the original layout";
    b.onclick = function (e) { e.preventDefault(); e.stopPropagation(); on = !on; setOn(on); apply(); };
    bar.appendChild(b);
    box.insertBefore(bar, box.firstChild);
    apply();
  }

  function tidyRows(box) {
    var rows = box.querySelectorAll(".mg-tbl tr");
    for (var i = 0; i < rows.length; i++) {
      var tr = rows[i];
      if (tr.getAttribute("data-mgs")) continue;
      var chips = tr.querySelectorAll(".mg-chip");
      if (!chips.length) continue;
      tr.setAttribute("data-mgs", "1");
      var holder = chips[0].parentNode;
      var wrap = document.createElement("div");
      wrap.className = "mgs-chips";
      holder.insertBefore(wrap, chips[0]);
      for (var j = 0; j < chips.length; j++) { if (chips[j].parentNode === holder) wrap.appendChild(chips[j]); }
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "mgs-chipbtn";
      var label = function (w, bt) {
        return function () {
          var n = w.querySelectorAll("input:checked").length;
          bt.textContent = "\uD83D\uDD14 Notifications" + (n ? " (" + n + " on)" : " (off)");
        };
      }(wrap, btn);
      label();
      btn.onclick = function (w) { return function (e) { e.preventDefault(); e.stopPropagation(); w.classList.toggle("open"); }; }(wrap);
      wrap.addEventListener("change", label);
      holder.insertBefore(btn, wrap);
    }
  }

  function tidyGS(box) {
    var bs = box.querySelectorAll("b");
    for (var i = 0; i < bs.length; i++) {
      var b = bs[i];
      if (!/^\s*GETTING STARTED/i.test(b.textContent || "")) continue;
      if (b.getAttribute("data-mgs")) return;
      var c = b.parentNode;
      if (c && c.children.length < 2 && c.parentNode && c.parentNode !== box) c = c.parentNode;
      if (!c || c === box || (c.textContent || "").length > 900) return;
      b.setAttribute("data-mgs", "1");
      var head = b;
      while (head.parentNode !== c) head = head.parentNode;
      head.classList.add("mgs-head");
      c.classList.add("mgs-gs");
      head.addEventListener("click", function (cc) { return function () { cc.classList.toggle("open"); }; }(c));
      return;
    }
  }

  function tidyAdv() {
    var bar = document.getElementById("sn-bar");
    if (!bar || !bar.parentNode) return;
    var p = bar.parentNode;
    if (p.querySelector(".mgs-advbtn")) return;
    var b = document.createElement("button");
    b.type = "button";
    b.className = "mgs-togbtn mgs-advbtn";
    b.onclick = function (e) { e.preventDefault(); e.stopPropagation(); root.classList.toggle("mgs-adv-open"); refreshBtns(); };
    p.insertBefore(b, bar);
    refreshBtns();
  }

  function topAside(el, add) {
    while (el.parentNode && el.parentNode !== document.body && !el.parentNode.contains(add)) el = el.parentNode;
    return el;
  }

  function tidyAdd(box) {
    var btns = box.querySelectorAll("button"), add = null, i;
    for (i = 0; i < btns.length; i++) { if (/^\+\s*Add link$/i.test((btns[i].textContent || "").trim())) { add = btns[i]; break; } }
    if (!add || !add.parentNode) return;
    if (add.getAttribute("data-mgs")) return;
    var items = [];
    function take(el) { if (el && el !== add && !el.contains(add) && items.indexOf(el) < 0) items.push(el); }
    var chips = box.querySelectorAll(".mg-chip");
    for (i = 0; i < chips.length; i++) {
      if (chips[i].closest(".mg-tbl")) continue;
      take(topAside(chips[i], add));
    }
    var all = box.querySelectorAll("div,span,p,small,details,label");
    for (i = 0; i < all.length; i++) {
      var e = all[i], t = e.textContent || "";
      if (e.closest(".mg-tbl") || e.contains(add) || e.querySelector(".mgs-togbtn")) continue;
      if ((/^\s*Send this link/i.test(t) && t.length < 60) || /Add many links/i.test(t) && t.length < 400) take(topAside(e, add));
    }
    if (!items.length) return;
    add.setAttribute("data-mgs", "1");
    var first = items[0];
    for (i = 0; i < items.length; i++) { items[i].classList.add("mgs-more"); if (items[i].compareDocumentPosition(first) & 2) first = items[i]; }
    var b = document.createElement("button");
    b.type = "button";
    b.className = "mgs-togbtn mgs-morebtn";
    b.onclick = function (e2) { e2.preventDefault(); e2.stopPropagation(); root.classList.toggle("mgs-more-open"); refreshBtns(); };
    first.parentNode.insertBefore(b, first);
    refreshBtns();
  }

  var timer = null;
  function run() {
    var boxes = document.querySelectorAll(".mg-box");
    for (var i = 0; i < boxes.length; i++) {
      try { addBar(boxes[i]); tidyRows(boxes[i]); tidyGS(boxes[i]); tidyAdd(boxes[i]); } catch (e) {}
    }
    try { tidyAdv(); } catch (e2) {}
  }
  new MutationObserver(function () { clearTimeout(timer); timer = setTimeout(run, 60); }).observe(root, { childList: true, subtree: true });
  apply();
  run();
})();

/* ===== Sidebar menu: sidebar buttons click the original buttons; nothing is deleted or rewritten ===== */
(function () {
  "use strict";
  var root = document.documentElement;
  var css = [
    ".mgs-side{display:none}",
    "html.mgs-on .mgs-hide{display:none!important}",
    "html.mgs-on .mg-box.mgs-grid .mgs-bar{display:none!important}",
    "html.mgs-on .mg-box.mgs-grid .mgs-advbtn{display:none!important}",
    "html.mgs-on .mg-box.mgs-grid{display:grid;grid-template-columns:250px minmax(0,1fr);column-gap:30px;row-gap:0;align-items:start;max-width:1140px}",
    "html.mgs-on .mg-box.mgs-grid > *{grid-column:2;min-width:0}",
    "html.mgs-on .mg-box.mgs-grid > .mgs-full{grid-column:1/-1}",
    "html.mgs-on .mg-box.mgs-pf::before{grid-column:1/-1;grid-row:1}",
    "html.mgs-on .mg-box.mgs-grid > .mgs-side{display:flex;flex-direction:column;gap:3px;grid-column:1;grid-row:var(--mgs-r,1) / span 60;position:sticky;top:0;align-self:start;max-height:calc(92vh - 70px);overflow:auto;padding:16px 14px;border:1px solid rgba(255,255,255,.1);border-radius:20px;background:linear-gradient(180deg,rgba(22,30,52,.96),rgba(9,14,28,.96));box-shadow:0 12px 34px rgba(0,0,0,.45)}",
    ".mgs-brand{display:flex;align-items:center;gap:10px;padding:2px 6px 12px}",
    ".mgs-logo{width:36px;height:36px;border-radius:11px;background:linear-gradient(135deg,var(--gold,#f5c451),var(--gold-deep,#b8860b));color:#1a1204;font-weight:900;font-size:18px;display:flex;align-items:center;justify-content:center;flex:none}",
    ".mgs-bt{font-size:14px;font-weight:800;letter-spacing:.08em;color:#f8fafc;line-height:1.1}",
    ".mgs-bs{font-size:11px;color:#94a3b8;font-weight:600;margin-top:2px}",
    ".mgs-lbl{font-size:10px;letter-spacing:.14em;font-weight:700;color:#64748b;margin:14px 8px 4px;text-transform:uppercase}",
    ".mgs-sp{flex:1;min-height:14px}",
    ".mgs-side .mgs-nav{display:flex;align-items:center;justify-content:space-between;gap:8px;width:100%;text-align:left;background:transparent!important;border:1px solid transparent!important;color:#cbd5e1!important;padding:10px 12px;border-radius:12px;font-size:13px;font-weight:600;cursor:pointer;line-height:1.35;box-shadow:none!important}",
    ".mgs-side .mgs-nav:hover{background:rgba(255,255,255,.07)!important}",
    ".mgs-side .mgs-nav.act{background:linear-gradient(135deg,var(--gold,#f5c451),var(--gold-deep,#b8860b))!important;color:#1a1204!important;box-shadow:0 6px 18px rgba(245,196,81,.25)!important}",
    ".mgs-side .mgs-nav.add{border:1px dashed rgba(245,196,81,.5)!important;color:var(--gold,#f5c451)!important}",
    ".mgs-side .mgs-nav.out{color:#fda4af!important}",
    ".mgs-side .mgs-nav.out:hover{background:rgba(244,63,94,.16)!important}",
    ".mgs-badge{font-size:11px;font-weight:800;padding:1px 8px;border-radius:999px;background:rgba(255,255,255,.1);flex:none}",
    ".mgs-nav.act .mgs-badge{background:rgba(0,0,0,.18)}",
    ".mgs-user{display:flex;align-items:center;gap:10px;padding:10px;border-radius:14px;background:rgba(255,255,255,.05);margin-top:8px}",
    ".mgs-av{width:34px;height:34px;border-radius:50%;background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#fff;font-weight:800;display:flex;align-items:center;justify-content:center;flex:none}",
    ".mgs-un{font-size:13px;font-weight:700;color:#f8fafc;line-height:1.1}",
    ".mgs-us{font-size:11px;color:#34d399;font-weight:600;margin-top:2px}",
    "@media (max-width:760px){html.mgs-on .mg-box.mgs-grid{display:block}html.mgs-on .mg-box.mgs-grid > .mgs-side{position:static;max-height:none;margin-bottom:14px}}"
  ].join("\n");
  var st = document.createElement("style");
  st.id = "mgs-side-style";
  st.textContent = css;
  document.head.appendChild(st);

  function findTab(box, re) {
    var t = box.querySelectorAll(".mg-tab");
    for (var i = 0; i < t.length; i++) { if (re.test(t[i].textContent || "")) return t[i]; }
    return null;
  }
  function findBtn(box, re) {
    var b = box.querySelectorAll("button");
    for (var i = 0; i < b.length; i++) {
      var x = b[i];
      if (x.closest(".mgs-side") || x.closest("#sn-bar") || x.classList.contains("mg-cat") || x.classList.contains("mgs-togbtn") || x.classList.contains("mgs-chipbtn") || x.classList.contains("mgs-sw")) continue;
      if (re.test((x.textContent || "").trim())) return x;
    }
    return null;
  }
  function hide(el, box) {
    if (!el) return;
    el.classList.add("mgs-hide");
    var p = el.parentNode;
    for (var d = 0; d < 3 && p && p !== box && p !== document.body; d++) {
      var ok = true, k = p.children;
      for (var i = 0; i < k.length; i++) { if (!k[i].classList.contains("mgs-hide")) { ok = false; break; } }
      if (!ok) break;
      p.classList.add("mgs-hide");
      p = p.parentNode;
    }
  }
  function nav(label, act, fn, cls, badge) {
    var b = document.createElement("button");
    b.type = "button";
    b.className = "mgs-nav" + (act ? " act" : "") + (cls ? " " + cls : "");
    var s = document.createElement("span"); s.textContent = label; b.appendChild(s);
    if (badge) { var g = document.createElement("span"); g.className = "mgs-badge"; g.textContent = badge; b.appendChild(g); }
    b.onclick = function (e) { e.preventDefault(); e.stopPropagation(); fn(); };
    return b;
  }
  function lbl(t) { var d = document.createElement("div"); d.className = "mgs-lbl"; d.textContent = t; return d; }
  function catInfo(b) {
    var c = b.querySelector(".mg-count"), ct = c ? (c.textContent || "").trim() : "", t = (b.textContent || "").trim();
    if (ct) t = t.replace(ct, "").trim();
    return { name: t, count: ct, add: b.classList.contains("add"), on: b.classList.contains("on") };
  }
  function pickCat(box, idx) {
    var c = box.querySelectorAll(".mg-cat");
    if (c[idx]) { c[idx].click(); return; }
    var t = findTab(box, /My links/i); if (t) t.click();
    setTimeout(function () { var c2 = box.querySelectorAll(".mg-cat"); if (c2[idx]) c2[idx].click(); }, 300);
  }
  function snmpIcon(t) { return /Add SNMP/i.test(t) ? "\u2795  " : (/devices/i.test(t) ? "\uD83D\uDCE1  " : "\uD83E\uDDF0  "); }

  function tidySide(box) {
    var tL = findTab(box, /My links/i), tA = findTab(box, /Alerts/i);
    if (!tL && !tA) return;
    var acc = findBtn(box, /^Accounts/i), dash = findBtn(box, /^Dashboard is/i), out = findBtn(box, /Close and log out/i);
    var catEls = box.querySelectorAll(".mg-cat"), snb = document.getElementById("sn-bar"), sbtn = snb ? snb.querySelectorAll("button") : [];
    box.classList.add("mgs-grid");
    var full = 0, i, kids = box.children;
    for (i = 0; i < kids.length; i++) {
      var kt = kids[i].textContent || "";
      if (!kids[i].classList.contains("mgs-side") && /PREMIUM ADMIN CONSOLE/i.test(kt) && kt.length < 80) kids[i].classList.add("mgs-full");
      if (kids[i].classList.contains("mgs-full")) full++;
    }
    try {
      var cs = getComputedStyle(box, "::before"), c = cs.content;
      if (c && c !== "none" && c !== "normal" && cs.position !== "absolute" && cs.position !== "fixed") { box.classList.add("mgs-pf"); full++; }
    } catch (e) {}
    box.style.setProperty("--mgs-r", String(full + 1));
    hide(tL, box); hide(tA, box); hide(acc, box); hide(dash, box); hide(out, box);
    for (i = 0; i < catEls.length; i++) hide(catEls[i], box);
    if (snb) hide(snb, box);

    if (catEls.length) { var arr = []; for (i = 0; i < catEls.length; i++) arr.push(catInfo(catEls[i])); box._mgsCats = arr; }
    var cats = box._mgsCats || [];
    var sl = []; for (i = 0; i < sbtn.length; i++) sl.push((sbtn[i].textContent || "").trim());
    var sig = [tL && tL.classList.contains("on"), tA && tA.classList.contains("on"), acc ? acc.textContent : "", dash ? dash.textContent : "", out ? 1 : 0, JSON.stringify(cats), sl.join("~")].join("|");
    var side = null;
    for (i = 0; i < kids.length; i++) { if (kids[i].classList.contains("mgs-side")) { side = kids[i]; break; } }
    if (side && side.getAttribute("data-sig") === sig) return;
    if (!side) { side = document.createElement("div"); side.className = "mgs-side"; box.insertBefore(side, box.firstChild); }
    side.setAttribute("data-sig", sig);
    side.textContent = "";

    var br = document.createElement("div"); br.className = "mgs-brand";
    var lg = document.createElement("div"); lg.className = "mgs-logo"; lg.textContent = "P";
    var bx = document.createElement("div");
    var bt = document.createElement("div"); bt.className = "mgs-bt"; bt.textContent = "PARISCOPE";
    var bs = document.createElement("div"); bs.className = "mgs-bs"; bs.textContent = "Admin console";
    bx.appendChild(bt); bx.appendChild(bs); br.appendChild(lg); br.appendChild(bx); side.appendChild(br);

    side.appendChild(lbl("Main menu"));
    if (tL) side.appendChild(nav("\uD83D\uDCCB  My links", tL.classList.contains("on"), function () { var x = findTab(box, /My links/i); if (x) x.click(); }));
    if (tA) side.appendChild(nav("\uD83D\uDD14  Alerts", tA.classList.contains("on"), function () { var x = findTab(box, /Alerts/i); if (x) x.click(); }));

    if (cats.length) {
      side.appendChild(lbl("Categories"));
      cats.forEach(function (ci, idx) {
        side.appendChild(nav(ci.add ? "+  New category" : "\uD83D\uDCC1  " + ci.name, ci.on && !ci.add, function () { pickCat(box, idx); }, ci.add ? "add" : "", ci.add ? "" : ci.count));
      });
    }
    if (sl.length) {
      side.appendChild(lbl("SNMP"));
      sl.forEach(function (t, idx) {
        side.appendChild(nav(snmpIcon(t) + t.replace(/^\+\s*/, ""), false, function () { var s2 = document.getElementById("sn-bar"), b2 = s2 ? s2.querySelectorAll("button") : []; if (b2[idx]) b2[idx].click(); }));
      });
    }
    side.appendChild(lbl("Graphical Mode"));
    side.appendChild(nav("\uD83D\uDDFA  Edit Graphical Mode", false, function () { if (window.PariscopeMap && typeof window.PariscopeMap.open === "function") window.PariscopeMap.open(true); else alert("Graphical Mode editor is not installed yet."); }));
    if (acc || dash) side.appendChild(lbl("Account"));
    if (acc) side.appendChild(nav("\uD83D\uDC64  Accounts & password", false, function () { var x = findBtn(box, /^Accounts/i); if (x) x.click(); }));
    if (dash) side.appendChild(nav(((dash.textContent || "").indexOf("PUBLIC") >= 0 ? "\uD83D\uDD13  " : "\uD83D\uDD12  ") + (dash.textContent || "").trim(), false, function () { var x = findBtn(box, /^Dashboard is/i); if (x) x.click(); }));

    var sp = document.createElement("div"); sp.className = "mgs-sp"; side.appendChild(sp);
    var us = document.createElement("div"); us.className = "mgs-user";
    var av = document.createElement("div"); av.className = "mgs-av"; av.textContent = "A";
    var ux = document.createElement("div");
    var un = document.createElement("div"); un.className = "mgs-un"; un.textContent = "Administrator";
    var uu = document.createElement("div"); uu.className = "mgs-us"; uu.textContent = "\u25CF Signed in";
    ux.appendChild(un); ux.appendChild(uu); us.appendChild(av); us.appendChild(ux); side.appendChild(us);
    var sw = nav("Classic view", false, function () { var x = box.querySelector(".mgs-bar .mgs-sw"); if (x) x.click(); });
    sw.classList.add("mgs-sw");
    side.appendChild(sw);
    if (out) side.appendChild(nav("\u23FB  Close and log out", false, function () { var x = findBtn(box, /Close and log out/i); if (x) x.click(); }, "out"));
    var sws = document.querySelectorAll(".mgs-sw");
    for (i = 0; i < sws.length; i++) { var sp2 = sws[i].querySelector("span"); (sp2 || sws[i]).textContent = root.classList.contains("mgs-on") ? "Classic view" : "Simple view"; }
  }

  var timer = null;
  function run() {
    var boxes = document.querySelectorAll(".mg-box");
    for (var i = 0; i < boxes.length; i++) { try { tidySide(boxes[i]); } catch (e) {} }
  }
  new MutationObserver(function () { clearTimeout(timer); timer = setTimeout(run, 120); }).observe(root, { childList: true, subtree: true });
  run();
})();

/* ===== PAGES v1 ===== one section at a time. Nothing is deleted or rewritten; other sections are only display:none. */
(function () {
  "use strict";
  var root = document.documentElement, page = "links";
  root.setAttribute("data-mgpage", "links");
  var P = 'html.mgs-on[data-mgpage="';
  var css = [
    ".mgs-pg{display:flex;flex-direction:column;gap:3px}",
    ".mgs-ptitle{display:none}",
    P + 'add"] .mgs-ptitle,' + P + 'many"] .mgs-ptitle,' + P + 'cset"] .mgs-ptitle{display:block;font-size:20px;font-weight:800;color:#f8fafc;margin:0 0 10px}',
    P + 'add"] .mgs-ptitle::before{content:"\\2795  Add a link"}',
    P + 'many"] .mgs-ptitle::before{content:"\\1F4E5  Add many links at once"}',
    P + 'cset"] .mgs-ptitle::before{content:"\\2699  Category settings"}',
    P + 'links"] [data-mgp="add"],' + P + 'links"] [data-mgp="many"],' + P + 'links"] [data-mgp="cset"]{display:none!important}',
    P + 'add"] [data-mgp="list"],' + P + 'add"] [data-mgp="many"],' + P + 'add"] [data-mgp="cset"]{display:none!important}',
    P + 'many"] [data-mgp="list"],' + P + 'many"] [data-mgp="add"],' + P + 'many"] [data-mgp="cset"]{display:none!important}',
    P + 'cset"] [data-mgp="list"],' + P + 'cset"] [data-mgp="add"],' + P + 'cset"] [data-mgp="many"]{display:none!important}'
  ].join("\n");
  var st = document.createElement("style");
  st.id = "mgs-pages-style";
  st.textContent = css;
  document.head.appendChild(st);

  function tab(box, re) {
    var t = box.querySelectorAll(".mg-tab");
    for (var i = 0; i < t.length; i++) { if (re.test(t[i].textContent || "")) return t[i]; }
    return null;
  }
  function flags(el) {
    var t = el.textContent || "";
    var d = el.tagName === "DETAILS" ? el : el.querySelector("details");
    return {
      list: !!((el.matches && el.matches(".mg-tbl,.mg-list")) || el.querySelector(".mg-tbl,.mg-list")),
      many: !!(d && /Add many links/i.test(d.textContent || "")),
      add: /Add a link to|Send this link/i.test(t),
      cset: /All ON/.test(t) && /All OFF/.test(t)
    };
  }
  function cnt(f) { return (f.list ? 1 : 0) + (f.many ? 1 : 0) + (f.add ? 1 : 0) + (f.cset ? 1 : 0); }
  function mark(el, d) {
    if (!el || el.nodeType !== 1 || el.classList.contains("mgs-ptitle")) return;
    var f = flags(el);
    if (cnt(f) > 1 && el.children.length && d < 6) {
      el.removeAttribute("data-mgp");
      for (var i = 0; i < el.children.length; i++) mark(el.children[i], d + 1);
      return;
    }
    var k = f.many ? "many" : (f.cset ? "cset" : (f.add ? "add" : "list"));
    if (el.getAttribute("data-mgp") !== k) el.setAttribute("data-mgp", k);
    if (k === "many" && el.tagName === "DETAILS" && !el.open && root.getAttribute("data-mgpage") === "many") el.open = true;
  }
  function tagAll(box) {
    var cards = box.querySelectorAll(".mg-card");
    for (var i = 0; i < cards.length; i++) {
      var c = cards[i];
      if (!(c.querySelector(".mg-tbl") || /Add a link to/i.test(c.textContent || ""))) continue;
      if (!(c.firstElementChild && c.firstElementChild.classList.contains("mgs-ptitle"))) {
        var t = document.createElement("div"); t.className = "mgs-ptitle"; c.insertBefore(t, c.firstChild);
      }
      for (var j = 0; j < c.children.length; j++) mark(c.children[j], 0);
    }
  }
  function nav(label, act, fn) {
    var b = document.createElement("button");
    b.type = "button";
    b.className = "mgs-nav" + (act ? " act" : "");
    var s = document.createElement("span"); s.textContent = label; b.appendChild(s);
    b.onclick = function (e) { e.preventDefault(); e.stopPropagation(); fn(); };
    return b;
  }
  function sidePages(eff) {
    var side = document.querySelector(".mg-box > .mgs-side");
    if (!side) return;
    var i, sw = side.querySelectorAll(".mgs-nav");
    for (i = 0; i < sw.length; i++) {
      var tx = sw[i].textContent || "";
      if (/My links/i.test(tx)) sw[i].classList.toggle("act", eff === "links");
      else if (/Alerts/i.test(tx)) sw[i].classList.toggle("act", eff === "alerts");
    }
    var wrap = null, k = side.children;
    for (i = 0; i < k.length; i++) { if (k[i].classList.contains("mgs-pg")) wrap = k[i]; }
    if (wrap && wrap.getAttribute("data-sig") === eff) return;
    if (!wrap) {
      wrap = document.createElement("div"); wrap.className = "mgs-pg";
      var ref = null, labs = side.querySelectorAll(".mgs-lbl");
      for (i = 0; i < labs.length; i++) { if (/Categories|SNMP|Account/i.test(labs[i].textContent || "")) { ref = labs[i]; break; } }
      if (!ref) ref = side.querySelector(".mgs-sp");
      side.insertBefore(wrap, ref || null);
    }
    wrap.setAttribute("data-sig", eff);
    wrap.textContent = "";
    var l = document.createElement("div"); l.className = "mgs-lbl"; l.textContent = "Link tools"; wrap.appendChild(l);
    wrap.appendChild(nav("\u2795  Add a link", eff === "add", function () { openPage("add"); }));
    wrap.appendChild(nav("\uD83D\uDCE5  Add many links", eff === "many", function () { openPage("many"); }));
    wrap.appendChild(nav("\u2699  Category settings", eff === "cset", function () { openPage("cset"); }));
  }
  function setPage(p) { page = p; root.setAttribute("data-mgpage", p); }
  function clickSettings(box) {
    var bs = box.querySelectorAll("button");
    for (var i = 0; i < bs.length; i++) {
      var x = bs[i], tx = (x.textContent || "").trim();
      if (x.closest(".mgs-side")) continue;
      if (/Category settings/i.test(tx) && !/Hide/i.test(tx)) { x.click(); return true; }
    }
    return false;
  }
  function openPage(p) {
    var box = document.querySelector(".mg-box"); if (!box) return;
    var t = tab(box, /My links/i);
    if (t && !t.classList.contains("on")) t.click();
    setPage(p); run();
    if (p === "cset" && !document.querySelector('[data-mgp="cset"]')) {
      clickSettings(box);
      setTimeout(function () { if (page === "cset" && !document.querySelector('[data-mgp="cset"]')) { var b2 = document.querySelector(".mg-box"); if (b2) clickSettings(b2); } }, 450);
    }
  }
  document.addEventListener("click", function (e) {
    var n = e.target && e.target.closest ? e.target.closest(".mgs-side .mgs-nav") : null;
    if (!n) return;
    if (/My links/i.test(n.textContent || "") || n.classList.contains("add") || n.querySelector(".mgs-badge")) setPage("links");
  }, true);

  function run() {
    var boxes = document.querySelectorAll(".mg-box");
    if (!boxes.length) return;
    var tA = tab(boxes[0], /Alerts/i), alertsOn = !!(tA && tA.classList.contains("on"));
    var eff = alertsOn ? "alerts" : (page === "alerts" ? "links" : page);
    if (root.getAttribute("data-mgpage") !== eff) root.setAttribute("data-mgpage", eff);
    for (var i = 0; i < boxes.length; i++) { try { tagAll(boxes[i]); } catch (e) {} }
    try { sidePages(eff); } catch (e2) {}
  }
  var timer = null;
  new MutationObserver(function () { clearTimeout(timer); timer = setTimeout(run, 150); }).observe(root, { childList: true, subtree: true });
  run();
})();

/* ===== mgs-friendly-v1: everything for a category on one page (additive, nothing above is changed) ===== */
(function () {
  "use strict";
  var root = document.documentElement;
  var P = 'html.mgs-on[data-mgpage="links"] .mg-box ';
  var css = [
    "html.mgs-on .mgs-morebtn{display:none!important}",
    "html.mgs-on .mgs-pg{display:none!important}",
    P + '[data-mgp="add"],' + P + '[data-mgp="many"],' + P + '[data-mgp="cset"]{display:block!important}',
    P + '[data-mgp="cset"]{display:flex!important}',
    P + '[data-mgp="add"]{border:1px solid rgba(245,196,81,.4);border-radius:16px;padding:18px 20px;margin-top:20px;background:rgba(245,196,81,.06)}',
    P + '[data-mgp="add"] .mg-in{font-size:15px;padding:13px 16px}',
    P + '[data-mgp="many"]{margin-top:16px}',
    "html.mgs-on .mg-box [data-mgx]{width:100%;margin-top:18px;padding:14px 18px;font-size:14px}"
  ].join("\n");
  var st = document.createElement("style");
  st.id = "mgs-friendly-style";
  st.textContent = css;
  document.head.appendChild(st);

  function tidy(box) {
    var i, cards = box.querySelectorAll(".mg-card"), card = null;
    for (i = 0; i < cards.length; i++) { if (cards[i].querySelector(".mg-tbl")) card = cards[i]; }
    var ds = box.querySelectorAll("details.mg-det");
    for (i = 0; i < ds.length; i++) {
      if (!ds[i].getAttribute("data-mgo")) { ds[i].setAttribute("data-mgo", "1"); ds[i].open = true; }
    }
    if (!card || !card.parentNode) return;
    var nx = card.nextElementSibling;
    if (nx && nx.hasAttribute("data-mgx")) return;
    if (!box.querySelector(".mg-cat.add")) return;
    var b = document.createElement("button");
    b.type = "button";
    b.className = "mg-b pri";
    b.setAttribute("data-mgx", "1");
    b.textContent = "+ Add another category";
    b.onclick = function (e) {
      e.preventDefault(); e.stopPropagation();
      var s = box.querySelector(".mg-cat.add");
      if (s) s.click();
    };
    card.parentNode.insertBefore(b, card.nextSibling);
  }
  var timer = null;
  function run() {
    root.classList.add("mgs-more-open");
    var boxes = document.querySelectorAll(".mg-box");
    for (var i = 0; i < boxes.length; i++) { try { tidy(boxes[i]); } catch (e) {} }
  }
  new MutationObserver(function () { clearTimeout(timer); timer = setTimeout(run, 200); }).observe(root, { childList: true, subtree: true });
  run();
})();
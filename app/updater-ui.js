(function () {
  "use strict";
  var H = { "X-Pariscope-Update": "1" }, st = null, badge = null, modal = null, auto = false, busy = false;
  function el(t, css, txt) { var e = document.createElement(t); if (css) e.style.cssText = css; if (txt != null) e.textContent = txt; return e; }
  function api(method, url) {
    var o = { method: method, cache: "no-store" }; if (method === "POST") o.headers = H;
    return fetch(url, o).then(function (r) {
      return r.json().catch(function () { return {}; }).then(function (j) { if (!r.ok) throw new Error(j.error || ("HTTP " + r.status)); return j; });
    });
  }
  function closeModal() { if (modal && modal.parentNode) modal.parentNode.removeChild(modal); modal = null; }
  function openModal() {
    if (modal || !st) return;
    modal = el("div", "position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,.6);z-index:2147483600;display:flex;align-items:center;justify-content:center;font-family:Segoe UI,Arial,sans-serif");
    var box = el("div", "background:#10151c;color:#e8eef5;border:1px solid #2b3a4d;border-radius:14px;padding:24px;width:440px;max-width:92vw;box-shadow:0 20px 60px rgba(0,0,0,.6)");
    box.appendChild(el("div", "font-size:18px;font-weight:700;margin-bottom:6px", "Pariscope update available"));
    box.appendChild(el("div", "font-size:13px;opacity:.8;margin-bottom:12px", "Your version " + st.current + " - new version " + st.latest));
    if (st.notes) box.appendChild(el("div", "font-size:13px;line-height:1.5;margin-bottom:12px;white-space:pre-wrap", st.notes));
    if (st.readme) { var a = el("a", "color:#6cb6ff;font-size:12px;display:inline-block;margin-bottom:14px", "What is new (readme)"); a.href = st.readme; a.target = "_blank"; a.rel = "noopener"; box.appendChild(a); }
    var msg = el("div", "font-size:12px;min-height:16px;margin-bottom:10px;opacity:.9", "");
    var bar = el("div", "height:6px;background:#1c2633;border-radius:4px;overflow:hidden;margin-bottom:14px;display:none");
    var fill = el("div", "height:100%;width:0;background:#2f81f7"); bar.appendChild(fill);
    var row = el("div", "display:flex;gap:10px;justify-content:flex-end");
    var later = el("button", "padding:9px 16px;border-radius:8px;border:1px solid #2b3a4d;background:transparent;color:#e8eef5;cursor:pointer", "Later");
    var now = el("button", "padding:9px 18px;border-radius:8px;border:0;background:#2f81f7;color:#fff;font-weight:600;cursor:pointer", "Update now");
    later.onclick = function () { if (busy) return; api("POST", "/api/update/later").catch(function () {}).then(function () { closeModal(); poll(); }); };
    now.onclick = function () {
      if (busy) return;
      busy = true; now.disabled = true; later.disabled = true; bar.style.display = "block"; msg.textContent = "Downloading...";
      api("POST", "/api/update/install").then(function () {
        var t = setInterval(function () {
          api("GET", "/api/update/progress").then(function (p) {
            fill.style.width = (p.pct || 0) + "%";
            msg.textContent = p.error ? ("Update failed: " + p.error) : (p.stage || "");
            if (p.error) { clearInterval(t); busy = false; now.disabled = false; later.disabled = false; now.textContent = "Try again"; showWeb(); }
            else if (p.done) { clearInterval(t); fill.style.width = "100%"; msg.textContent = "Downloaded and checked (SHA-256 verified). The installer has started. If Windows asks for permission, click Yes. Pariscope will close and open again by itself in about a minute. If nothing happens, open this file by hand: " + (p.file || "Pariscope-Update in your Downloads folder"); busy = false; later.disabled = false; now.disabled = false; now.textContent = "Close"; now.onclick = closeModal; }
          }).catch(function () {});
        }, 800);
      }).catch(function (e) { busy = false; now.disabled = false; later.disabled = false; msg.textContent = "Update failed: " + e.message; showWeb(); });
    };
    var web = el("a", "padding:9px 14px;border-radius:8px;border:1px solid #2b3a4d;color:#e8eef5;text-decoration:none;font-size:13px;display:none;cursor:pointer", "Download in browser"); web.target = "_blank"; web.rel = "noopener"; var lk = el("input", "display:none;width:100%;box-sizing:border-box;margin-bottom:10px;padding:7px 9px;border-radius:6px;border:1px solid #2b3a4d;background:#0b1118;color:#e8eef5;font-size:12px"); lk.readOnly = true; lk.onclick = function () { lk.select(); }; function showWeb() { if (st && st.url) { web.href = st.url; web.style.display = ""; lk.value = st.url; lk.style.display = "block"; } } row.appendChild(later); row.appendChild(web); row.appendChild(now);
    box.appendChild(msg); box.appendChild(bar); box.appendChild(lk); box.appendChild(row); modal.appendChild(box); document.body.appendChild(modal);
  }
  function showBadge() {
    if (badge) { badge.textContent = "Update available: v" + st.latest; return; }
    badge = el("button", "position:fixed;right:16px;bottom:16px;z-index:2147483500;padding:10px 16px;border-radius:999px;border:0;background:#2f81f7;color:#fff;font:600 13px Segoe UI,Arial,sans-serif;cursor:pointer;box-shadow:0 6px 20px rgba(0,0,0,.4)", "Update available: v" + st.latest);
    badge.onclick = openModal; document.body.appendChild(badge);
  }
  function hideBadge() { if (badge && badge.parentNode) badge.parentNode.removeChild(badge); badge = null; }
  function poll() {
    api("GET", "/api/update/status").then(function (s) {
      st = s;
      if (!s.local || !s.available) { hideBadge(); if (!busy) closeModal(); return; }
      showBadge();
      if (s.popup && !auto) { auto = true; openModal(); }
      if (!s.popup) auto = false;
    }).catch(function () {});
  }
  /* ===== Manage panel: Check for updates button ===== */
  var chk = false, toastEl = null, toastT = null;
  var upSt = document.createElement("style");
  upSt.textContent = "html.mgs-on .mg-tabs [data-upd]{display:none!important}";
  document.head.appendChild(upSt);
  function toast(text, ok) {
    if (toastEl && toastEl.parentNode) toastEl.parentNode.removeChild(toastEl);
    clearTimeout(toastT);
    toastEl = el("div", "position:fixed;top:18px;left:50%;transform:translateX(-50%);z-index:2147483646;max-width:92vw;padding:12px 18px;border-radius:12px;font:600 13px Segoe UI,Arial,sans-serif;color:#fff;box-shadow:0 10px 30px rgba(0,0,0,.5);background:" + (ok === false ? "#b42318" : (ok === true ? "#067647" : "#1d4ed8")), text);
    document.body.appendChild(toastEl);
    toastT = setTimeout(function () { if (toastEl && toastEl.parentNode) toastEl.parentNode.removeChild(toastEl); toastEl = null; }, 7000);
  }
  function checkNow() {
    if (chk) return;
    chk = true; toast("Checking for updates...");
    api("POST", "/api/update/check").then(function (r) {
      return api("GET", "/api/update/status").then(function (s) {
        st = s;
        if (r.error) { toast("Could not check for updates: " + r.error, false); return; }
        if (s.local && s.available) { toast("New version v" + s.latest + " is available (you have v" + s.current + ").", true); showBadge(); openModal(); }
        else toast("You are on the latest version (v" + s.current + ").", true);
      });
    }).catch(function (e) { toast("Could not check for updates: " + e.message, false); }).then(function () { chk = false; });
  }
  function addUpdBtns() {
    var boxes = document.querySelectorAll(".mg-box");
    for (var i = 0; i < boxes.length; i++) {
      var box = boxes[i], side = null, k = box.children, j;
      for (j = 0; j < k.length; j++) { if (k[j].classList && k[j].classList.contains("mgs-side")) side = k[j]; }
      if (side && !side.querySelector("[data-upd]")) {
        var b = document.createElement("button");
        b.type = "button"; b.className = "mgs-nav"; b.setAttribute("data-upd", "1");
        var sp = document.createElement("span"); sp.textContent = "\uD83D\uDD04  Check for updates"; b.appendChild(sp);
        b.onclick = function (e) { e.preventDefault(); e.stopPropagation(); checkNow(); };
        side.insertBefore(b, side.querySelector(".mgs-sp"));
      }
      var tabs = box.querySelector(".mg-tabs");
      if (tabs && !tabs.querySelector("[data-upd]")) {
        var c = document.createElement("button");
        c.type = "button"; c.className = "mg-b"; c.setAttribute("data-upd", "1");
        c.textContent = "\uD83D\uDD04 Check for updates";
        c.onclick = function (e) { e.preventDefault(); e.stopPropagation(); checkNow(); };
        tabs.insertBefore(c, tabs.querySelector(".mg-grow"));
      }
    }
  }
  var upT = null;
  new MutationObserver(function () { clearTimeout(upT); upT = setTimeout(function () { try { addUpdBtns(); } catch (e) {} }, 200); }).observe(document.documentElement, { childList: true, subtree: true });
  setTimeout(poll, 4000); setInterval(poll, 60000);
})();
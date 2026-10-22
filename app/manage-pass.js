/* Pariscope: "Accounts & password" panel inside Manage (my account, users and roles, dashboard access). Fails safe. */
(function () {
  "use strict";
  var BTN_ID = "psc-pw-btn", OV_ID = "psc-pw-ov", CHIP_ID = "psc-lock-btn", STY_ID = "psc-pw-style", queued = false;
  var TOK = "", curLocked = null, curRole = "";
  try { var __of = window.fetch; if (__of) window.fetch = function (u, o) { try { var h = o && o.headers, t = h && (h["x-manage-token"] || h["X-Manage-Token"] || (typeof h.get === "function" && h.get("x-manage-token"))); if (t) TOK = t; } catch (e) {} return __of.apply(this, arguments); }; } catch (e) {}
  function chipSet(c) {
    if (!c) return;
    if (curLocked === null) { c.textContent = "Dashboard access: click to choose (public or locked)"; return; }
    c.textContent = curLocked ? "Dashboard is LOCKED - click to make it PUBLIC" : "Dashboard is PUBLIC - click to LOCK it";
    c.style.borderColor = curLocked ? "rgba(251,113,133,.6)" : "rgba(52,211,153,.6)";
    c.style.color = curLocked ? "#fb7185" : "#34d399";
  }
  function chipRefresh() {
    var c = document.getElementById(CHIP_ID); if (!c || !TOK) return;
    fetch("/api/manage/lock-state", { headers: { "x-manage-token": TOK } }).then(function (r) { return r.json(); }).then(function (j) { if (j && j.ok) { curLocked = j.locked === true; curRole = j.role; chipSet(c); } }).catch(function () {});
  }
  function chipClick() {
    if (curRole && curRole !== "admin") { window.alert("Only the admin can lock or open the dashboard."); return; }
    var want = curLocked === null ? true : !curLocked;
    if (!window.confirm(want ? "Lock the dashboard? Nobody can see any link status without a login." : "Make the dashboard PUBLIC? Anyone can see it without a login.")) return;
    var done = function (j) { if (j && j.ok) { curLocked = j.locked === true; chipSet(document.getElementById(CHIP_ID)); } else window.alert((j && j.error) || "Could not change it."); };
    if (TOK) {
      fetch("/api/manage/lock-toggle", { method: "POST", headers: { "Content-Type": "application/json", "x-manage-token": TOK }, body: JSON.stringify({ locked: want }) }).then(function (r) { return r.json(); }).then(done).catch(function () { done(null); });
    } else {
      var pw = window.prompt("Admin password:"); if (pw == null) return;
      api("/lock", { adminPassword: pw, locked: want }).then(function (y) { done(y.j); });
    }
  }
  setInterval(chipRefresh, 5000);
  function mk(tag, cls, text) { var n = document.createElement(tag); if (cls) n.className = cls; if (text != null) n.textContent = text; return n; }
  function api(path, body) {
    return fetch("/api/manage" + path, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })
      .then(function (r) { return r.json().catch(function () { return {}; }).then(function (j) { return { ok: r.ok && j.ok, j: j }; }); })
      .catch(function () { return { ok: false, j: { error: "Request failed. Please try again." } }; });
  }

  var CSS = [
    ".pw-ov{position:fixed;top:0;left:0;right:0;bottom:0;z-index:2147483000;background:rgba(3,6,14,.72);-webkit-backdrop-filter:blur(6px);backdrop-filter:blur(6px);display:flex;align-items:center;justify-content:center;padding:16px;animation:pwFade .18s ease-out}",
    ".pw-ov.out{animation:pwFadeOut .16s ease-in forwards}",
    ".pw-box{width:100%;max-width:470px;max-height:92vh;overflow:auto;background:linear-gradient(180deg,#0f1729,#0a101d);border:1px solid rgba(245,196,81,.35);border-radius:18px;color:#f8fafc;font:14px/1.45 'Segoe UI',Roboto,sans-serif;box-shadow:0 24px 70px rgba(0,0,0,.65),0 0 40px rgba(245,196,81,.08);animation:pwPop .24s cubic-bezier(.2,.9,.3,1.15)}",
    ".pw-ov.out .pw-box{animation:pwPopOut .16s ease-in forwards}",
    "@keyframes pwFade{from{opacity:0}to{opacity:1}}",
    "@keyframes pwFadeOut{to{opacity:0}}",
    "@keyframes pwPop{from{opacity:0;transform:translateY(16px) scale(.96)}to{opacity:1;transform:none}}",
    "@keyframes pwPopOut{to{opacity:0;transform:translateY(8px) scale(.97)}}",
    "@keyframes pwIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}",
    ".pw-head{display:flex;align-items:center;justify-content:space-between;padding:18px 20px 0}",
    ".pw-title{font-size:19px;font-weight:800;letter-spacing:.2px}",
    ".pw-sub{font-size:12px;color:#94a3b8;margin-top:2px}",
    ".pw-x{width:32px;height:32px;border-radius:10px;border:1px solid rgba(255,255,255,.15);background:transparent;color:#cbd5e1;font-size:15px;cursor:pointer}",
    ".pw-x:hover{background:rgba(255,255,255,.08)}",
    ".pw-tabs{display:flex;gap:8px;padding:14px 20px 0}",
    ".pw-tab{flex:1;padding:10px;border-radius:11px;border:1px solid rgba(255,255,255,.14);background:transparent;color:#94a3b8;font:700 13px 'Segoe UI',Roboto,sans-serif;cursor:pointer;transition:all .15s}",
    ".pw-tab:hover{color:#f8fafc}",
    ".pw-tab.on{color:#1a1200;background:linear-gradient(135deg,#ffdf8a,#f5c451);border-color:transparent}",
    ".pw-body{padding:16px 20px 20px}",
    ".pw-pane{animation:pwIn .2s ease-out}",
    ".pw-lb{display:block;font-size:11px;font-weight:700;letter-spacing:.6px;color:#94a3b8;margin:0 0 5px}",
    ".pw-in{width:100%;box-sizing:border-box;padding:11px 12px;margin:0 0 12px;border-radius:10px;border:1px solid rgba(255,255,255,.16);background:rgba(0,0,0,.4);color:#f8fafc;font:14px 'Segoe UI',Roboto,sans-serif;outline:none;transition:border-color .15s,box-shadow .15s}",
    ".pw-in:focus{border-color:#f5c451;box-shadow:0 0 0 3px rgba(245,196,81,.15)}",
    ".pw-pass{position:relative}.pw-pass .pw-in{padding-right:56px}",
    ".pw-eye{position:absolute;right:6px;top:5px;height:30px;padding:0 9px;border:0;border-radius:8px;background:rgba(255,255,255,.08);color:#cbd5e1;font:700 11px 'Segoe UI',Roboto,sans-serif;cursor:pointer}",
    ".pw-hint{font-size:12px;color:#94a3b8;margin:-6px 0 12px}",
    ".pw-note{font-size:13px;color:#cbd5e1;margin:0 0 14px}",
    ".pw-msg{min-height:20px;font-size:13px;font-weight:700;margin:2px 0 10px}",
    ".pw-btn{padding:10px 16px;border:0;border-radius:10px;cursor:pointer;font:800 13px 'Segoe UI',Roboto,sans-serif;color:#1a1200;background:linear-gradient(135deg,#ffdf8a,#f5c451);transition:transform .1s,filter .15s}",
    ".pw-btn:hover{filter:brightness(1.06)}.pw-btn:active{transform:scale(.97)}",
    ".pw-btn.full{width:100%}",
    ".pw-ghost{padding:8px 12px;border-radius:9px;cursor:pointer;font:700 12px 'Segoe UI',Roboto,sans-serif;color:#f8fafc;background:transparent;border:1px solid rgba(255,255,255,.2)}",
    ".pw-ghost:hover{background:rgba(255,255,255,.07)}",
    ".pw-ghost.red{border-color:rgba(251,113,133,.5);color:#fb7185}",
    ".pw-ghost.redon{background:#ef4444;border-color:#ef4444;color:#fff}",
    ".pw-card{padding:12px;border:1px solid rgba(255,255,255,.12);border-radius:12px;background:rgba(255,255,255,.03);margin:0 0 10px}",
    ".pw-row{display:flex;align-items:center;gap:8px;flex-wrap:wrap}",
    ".pw-grow{flex:1;min-width:90px;font-weight:800}",
    ".pw-badge{font-size:11px;font-weight:800;padding:3px 9px;border-radius:99px}",
    ".pw-b-read{background:rgba(56,189,248,.15);color:#38bdf8}",
    ".pw-b-write{background:rgba(52,211,153,.15);color:#34d399}",
    ".pw-sel{padding:6px 8px;border-radius:8px;background:#0b1220;color:#f8fafc;border:1px solid rgba(255,255,255,.2);font:600 12px 'Segoe UI',Roboto,sans-serif}",
    ".pw-roles{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin:0 0 12px}",
    ".pw-role{text-align:left;padding:10px;border-radius:12px;border:1px solid rgba(255,255,255,.16);background:transparent;color:#f8fafc;cursor:pointer;font-family:'Segoe UI',Roboto,sans-serif;transition:all .15s}",
    ".pw-role.on{border-color:#f5c451;background:rgba(245,196,81,.1)}",
    ".pw-role b{display:block;font-size:13px}.pw-role span{font-size:11px;color:#94a3b8}",
    ".pw-sep{border-top:1px solid rgba(255,255,255,.12);margin:16px 0}",
    ".pw-h{font-size:14px;font-weight:800;margin:0 0 8px}",
    ".pw-lock{display:flex;align-items:center;gap:10px;justify-content:space-between;flex-wrap:wrap}"
  ].join("");

  function addStyle() {
    if (document.getElementById(STY_ID)) return;
    var s = document.createElement("style"); s.id = STY_ID; s.textContent = CSS; document.head.appendChild(s);
  }

  function openDialog() {
    if (document.getElementById(OV_ID)) return;
    addStyle();
    var ov = mk("div", "pw-ov"); ov.id = OV_ID;
    var box = mk("div", "pw-box"); ov.appendChild(box);
    var closing = false;
    function close() {
      if (closing) return; closing = true;
      document.removeEventListener("keydown", onKey, true);
      ov.className = "pw-ov out";
      setTimeout(function () { if (ov.parentNode) ov.parentNode.removeChild(ov); }, 170);
    }
    function onKey(e) { if (e.key === "Escape") { e.stopPropagation(); close(); } }
    function button(t, cls, fn) { var b = mk("button", cls, t); b.type = "button"; b.onclick = fn; return b; }
    function msgBox(parent) {
      var m = mk("div", "pw-msg"); parent.appendChild(m);
      return function (t, ok) { m.style.color = ok ? "#34d399" : "#fb7185"; m.textContent = t; };
    }
    function field(parent, label, type, ph, hint) {
      parent.appendChild(mk("label", "pw-lb", label));
      var i = mk("input", "pw-in"); i.type = type || "text"; i.autocomplete = "off"; if (ph) i.placeholder = ph;
      if (type === "password") {
        var w = mk("div", "pw-pass"); w.appendChild(i);
        var eye = mk("button", "pw-eye", "Show"); eye.type = "button"; eye.tabIndex = -1;
        eye.onclick = function () { var show = i.type === "password"; i.type = show ? "text" : "password"; eye.textContent = show ? "Hide" : "Show"; };
        w.appendChild(eye); parent.appendChild(w);
      } else parent.appendChild(i);
      if (hint) parent.appendChild(mk("div", "pw-hint", hint));
      return i;
    }
    function onEnter(inputs, fn) { inputs.forEach(function (i) { i.addEventListener("keydown", function (e) { if (e.key === "Enter") fn(); }); }); }

    var head = mk("div", "pw-head");
    var ht = mk("div"); ht.appendChild(mk("div", "pw-title", "Accounts & password")); ht.appendChild(mk("div", "pw-sub", "Manage your own login and who else can use Pariscope"));
    head.appendChild(ht); head.appendChild(button("\u2715", "pw-x", close));
    box.appendChild(head);
    var tabs = mk("div", "pw-tabs"), t1 = button("My account", "pw-tab on", function () { show(1); }), t2 = button("Users & access", "pw-tab", function () { show(2); });
    tabs.appendChild(t1); tabs.appendChild(t2); box.appendChild(tabs);
    var body = mk("div", "pw-body"), p1 = mk("div", "pw-pane"), p2 = mk("div", "pw-pane");
    p2.style.display = "none"; body.appendChild(p1); body.appendChild(p2); box.appendChild(body);
    function show(n) {
      p1.style.display = n === 1 ? "" : "none"; p2.style.display = n === 2 ? "" : "none";
      t1.className = "pw-tab" + (n === 1 ? " on" : ""); t2.className = "pw-tab" + (n === 2 ? " on" : "");
    }

    /* ---------- Tab 1: my account ---------- */
    p1.appendChild(mk("div", "pw-note", "Change your own user name and password. Type your current login to confirm it is you."));
    var cu = field(p1, "CURRENT USER NAME", "text", "Your current user name");
    var cp = field(p1, "CURRENT PASSWORD", "password", "Your current password");
    p1.appendChild(mk("div", "pw-sep"));
    var nu = field(p1, "NEW USER NAME (admin only)", "text", "Leave empty to keep the same name", "3 to 32 letters, numbers, . _ -   Only the admin can change the user name.");
    var np = field(p1, "NEW PASSWORD", "password", "At least 4 characters", "To keep the same password, type it again here.");
    var rp = field(p1, "CONFIRM NEW PASSWORD", "password", "Type the new password again");
    var say1 = msgBox(p1);
    function saveAccount() {
      var user = cu.value.trim(), newName = nu.value.trim();
      if (!user || !cp.value) return say1("Enter your current user name and password.", false);
      if (np.value.trim().length < 4) return say1("New password must be at least 4 characters.", false);
      if (np.value !== rp.value) return say1("The two new passwords do not match.", false);
      var wantsName = newName && newName.toLowerCase() !== user.toLowerCase();
      if (wantsName && curRole && curRole !== "admin") return say1("Only the admin can change the user name. Clear that box to change just the password.", false);
      say1("Saving...", true);
      function viaPassword() {
        return api("/password", { username: user, currentPassword: cp.value, newPassword: np.value });
      }
      var first = (curRole && curRole !== "admin") ? viaPassword() : api("/admin/change", { username: user, currentPassword: cp.value, newUsername: newName || user, newPassword: np.value });
      first.then(function (x) {
        if (!x.ok && !wantsName && !(curRole && curRole !== "admin") && x.j && /admin user name/i.test(String(x.j.error || ""))) return viaPassword();
        return x;
      }).then(function (x) {
        if (x.ok) {
          say1("Saved. Use the new login the next time you sign in.", true);
          cp.value = np.value = rp.value = ""; nu.value = "";
        } else say1((x.j && x.j.error) || "Could not save. Please try again.", false);
      });
    }
    p1.appendChild(button("Save my login", "pw-btn full", saveAccount));
    onEnter([cu, cp, nu, np, rp], saveAccount);

    /* ---------- Tab 2: users and access ---------- */
    var gate = mk("div"), area = mk("div"); area.style.display = "none";
    p2.appendChild(gate); p2.appendChild(area);
    gate.appendChild(mk("div", "pw-note", "Only the admin can create logins. Enter the admin password to continue."));
    var ap = field(gate, "ADMIN PASSWORD", "password", "Admin password");
    var say2 = msgBox(gate);
    var unlockBtn = button("Unlock", "pw-btn full", function () { if (!ap.value) return say2("Enter the admin password.", false); load(); });
    gate.appendChild(unlockBtn);
    onEnter([ap], function () { if (ap.value) load(); });

    var lockCard = mk("div", "pw-card"), lockRow = mk("div", "pw-lock"), lockTxt = mk("div"), lockBtn = button("", "pw-ghost", function () {});
    lockRow.appendChild(lockTxt); lockRow.appendChild(lockBtn); lockCard.appendChild(lockRow);
    var say3 = msgBox(area);
    area.appendChild(mk("div", "pw-h", "Dashboard access"));
    area.appendChild(lockCard);
    function lockState(l) {
      lockTxt.textContent = "";
      var b = mk("div", "", l ? "LOCKED" : "PUBLIC"); b.style.cssText = "font-weight:800;color:" + (l ? "#fb7185" : "#34d399");
      lockTxt.appendChild(b); lockTxt.appendChild(mk("div", "pw-sub", l ? "Only people with a login can open the dashboard." : "Anyone who can reach this computer can open the dashboard."));
      lockBtn.textContent = l ? "Make PUBLIC" : "Lock it";
      lockBtn.onclick = function () {
        if (!window.confirm(l ? "Open the dashboard to everyone?" : "Lock the dashboard? Visitors will need a login.")) return;
        api("/lock", { adminPassword: ap.value, locked: !l }).then(function (y) { if (y.ok) lockState(y.j.locked); say3(y.ok ? "Done." : ((y.j && y.j.error) || "Failed."), y.ok); });
      };
    }
    area.appendChild(mk("div", "pw-sep"));
    area.appendChild(mk("div", "pw-h", "People with a login"));
    var list = mk("div"); area.appendChild(list);
    area.appendChild(mk("div", "pw-sep"));
    area.appendChild(mk("div", "pw-h", "Add a new user"));
    var nn = field(area, "USER NAME", "text", "3 to 32 letters, numbers, . _ -");
    var npw = field(area, "PASSWORD", "password", "At least 4 characters");
    area.appendChild(mk("label", "pw-lb", "WHAT CAN THIS USER DO?"));
    var newRole = "read", roleWrap = mk("div", "pw-roles"), rb = {};
    [["read", "Read only", "Can look at everything. Cannot change anything."], ["write", "Write", "Can add and edit links. Cannot delete anything."]].forEach(function (o) {
      var b = mk("button", "pw-role" + (o[0] === newRole ? " on" : "")); b.type = "button";
      b.appendChild(mk("b", "", o[1])); b.appendChild(mk("span", "", o[2]));
      b.onclick = function () { newRole = o[0]; Object.keys(rb).forEach(function (k) { rb[k].className = "pw-role" + (k === newRole ? " on" : ""); }); };
      rb[o[0]] = b; roleWrap.appendChild(b);
    });
    area.appendChild(roleWrap);
    var say4 = msgBox(area);
    function addUser() {
      if (!nn.value.trim() || !npw.value) return say4("Enter a user name and a password.", false);
      say4("Adding...", true);
      api("/users/add", { adminPassword: ap.value, username: nn.value, password: npw.value, role: newRole }).then(function (y) {
        if (y.ok) { say4("User added.", true); nn.value = npw.value = ""; load(true); } else say4((y.j && y.j.error) || "Could not add the user.", false);
      });
    }
    area.appendChild(button("Add user", "pw-btn full", addUser));
    onEnter([nn, npw], addUser);

    function userRow(name, role) {
      var card = mk("div", "pw-card"), row = mk("div", "pw-row");
      row.appendChild(mk("div", "pw-grow", name));
      var badge = mk("span", "pw-badge " + (role === "read" ? "pw-b-read" : "pw-b-write"), role === "read" ? "Read only" : "Write");
      row.appendChild(badge);
      var rs = mk("select", "pw-sel");
      [["read", "Read only"], ["write", "Write"]].forEach(function (o) { var op = mk("option", "", o[1]); op.value = o[0]; rs.appendChild(op); });
      rs.value = role;
      rs.onchange = function () {
        api("/users/role", { adminPassword: ap.value, username: name, role: rs.value }).then(function (y) {
          if (y.ok) { badge.className = "pw-badge " + (rs.value === "read" ? "pw-b-read" : "pw-b-write"); badge.textContent = rs.value === "read" ? "Read only" : "Write"; say3(name + " is now " + (rs.value === "read" ? "read only." : "write access."), true); }
          else { say3((y.j && y.j.error) || "Failed.", false); rs.value = role; }
        });
      };
      row.appendChild(rs);
      card.appendChild(row);
      var act = mk("div", "pw-row"); act.style.marginTop = "10px";
      var resetBox = mk("div"); resetBox.style.display = "none"; resetBox.style.marginTop = "10px";
      var rpw = field(resetBox, "NEW PASSWORD FOR " + name.toUpperCase(), "password", "At least 4 characters");
      var rrow = mk("div", "pw-row");
      function doReset() {
        if (rpw.value.trim().length < 4) return say3("Password must be at least 4 characters.", false);
        api("/users/reset", { adminPassword: ap.value, username: name, password: rpw.value }).then(function (y) {
          if (y.ok) { say3("Password reset for " + name + ".", true); rpw.value = ""; resetBox.style.display = "none"; } else say3((y.j && y.j.error) || "Failed.", false);
        });
      }
      rrow.appendChild(button("Save password", "pw-btn", doReset));
      rrow.appendChild(button("Cancel", "pw-ghost", function () { resetBox.style.display = "none"; rpw.value = ""; }));
      resetBox.appendChild(rrow); onEnter([rpw], doReset);
      act.appendChild(button("Reset password", "pw-ghost", function () { resetBox.style.display = resetBox.style.display === "none" ? "" : "none"; if (resetBox.style.display === "") rpw.focus(); }));
      var del = button("Delete", "pw-ghost red", function () {
        if (del.className.indexOf("redon") < 0) {
          del.className = "pw-ghost redon"; del.textContent = "Click again to delete";
          setTimeout(function () { if (del.parentNode) { del.className = "pw-ghost red"; del.textContent = "Delete"; } }, 3000);
          return;
        }
        api("/users/delete", { adminPassword: ap.value, username: name }).then(function (y) { if (y.ok) { say3("Deleted " + name + ".", true); load(true); } else say3((y.j && y.j.error) || "Failed.", false); });
      });
      act.appendChild(del);
      card.appendChild(act); card.appendChild(resetBox);
      return card;
    }
    function load(keep) {
      if (!keep) say2("Checking...", true);
      api("/users/list", { adminPassword: ap.value }).then(function (x) {
        if (!x.ok) { say2((x.j && x.j.error) || "Could not unlock.", false); gate.style.display = ""; area.style.display = "none"; return; }
        say2("", true); gate.style.display = "none"; area.style.display = "";
        lockState(x.j.locked === true);
        list.textContent = "";
        var users = x.j.users || [];
        if (!users.length) list.appendChild(mk("div", "pw-hint", "No extra users yet. Add one below."));
        users.forEach(function (name) { list.appendChild(userRow(name, (x.j.roles && x.j.roles[name]) === "read" ? "read" : "write")); });
        if (x.j.admin && !cu.value) cu.value = x.j.admin;
      });
    }

    document.body.appendChild(ov);
    ov.addEventListener("mousedown", function (e) { if (e.target === ov) close(); });
    document.addEventListener("keydown", onKey, true);
    setTimeout(function () { try { cu.focus(); } catch (e) {} }, 60);
  }

  function inject() {
    queued = false;
    try {
      if (document.getElementById(BTN_ID)) return;
      var els = document.querySelectorAll(".mg-sub, div, p, span");
      for (var i = 0; i < els.length; i++) {
        if (els[i].children.length === 0 && (els[i].textContent || "").indexOf("Everything you change here") === 0) {
          var b = document.createElement("button"); b.textContent = "Accounts & password";
          b.style.cssText = "margin-top:8px;padding:6px 12px;border-radius:9px;border:1px solid rgba(245,196,81,.45);background:rgba(245,196,81,.12);color:#f5c451;font:700 12px 'Segoe UI',Roboto,sans-serif;cursor:pointer";
          b.id = BTN_ID; b.type = "button"; b.onclick = openDialog;
          els[i].insertAdjacentElement("afterend", b);
          var c = document.createElement("button"); c.textContent = "Dashboard access: checking...";
          c.style.cssText = "margin:8px 0 0 8px;padding:6px 12px;border-radius:9px;border:1px solid rgba(245,196,81,.45);background:rgba(245,196,81,.12);color:#f5c451;font:700 12px 'Segoe UI',Roboto,sans-serif;cursor:pointer";
          c.id = CHIP_ID; c.type = "button"; c.onclick = chipClick;
          b.insertAdjacentElement("afterend", c); chipRefresh();
          return;
        }
      }
    } catch (e) { /* never break the dashboard */ }
  }
  function queue() { if (!queued) { queued = true; setTimeout(inject, 250); } }
  try { new MutationObserver(queue).observe(document.documentElement, { childList: true, subtree: true }); queue(); } catch (e) { /* ignore */ }
})();

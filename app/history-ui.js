(function () {
  "use strict";
  var RANGES = [["1d", "1 Day"], ["3d", "3 Days"], ["7d", "1 Week"], ["30d", "1 Month"], ["365d", "1 Year"]];
  var C = { up: "#34d399", down: "#f43f5e", flap: "#ec4899", none: "#475569" };
  var IPV4 = /^\d{1,3}(\.\d{1,3}){3}$/;
  var cur = { ip: "", name: "", range: "1d" };
  var overlay = null, body = null, titleEl = null, subEl = null, btns = {}, timer = null, seq = 0;

  function h(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  }
  function dur(ms) {
    if (!ms || ms < 1000) return "0s";
    var s = Math.floor(ms / 1000), d = Math.floor(s / 86400); s %= 86400;
    var hr = Math.floor(s / 3600); s %= 3600;
    var m = Math.floor(s / 60); s %= 60;
    var o = [];
    if (d) o.push(d + "d");
    if (hr) o.push(hr + "h");
    if (m && o.length < 2) o.push(m + "m");
    if (!o.length) o.push(s + "s");
    return o.slice(0, 2).join(" ");
  }
  function pct(v) { return v == null ? "n/a" : v.toFixed(2) + "%"; }
  function fmt(ms, range) {
    var d = new Date(ms);
    if (range === "365d") return d.toLocaleDateString([], { month: "short", year: "numeric" });
    if (range === "30d") return d.toLocaleDateString([], { month: "short", day: "numeric" });
    return d.toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
  }
  function css() {
    if (document.getElementById("hx-style")) return;
    var s = h("style"); s.id = "hx-style";
    s.textContent = [
      ".category-block .card,#critical-container .card{cursor:pointer}",
      "#hx-overlay{position:fixed;left:0;top:0;right:0;bottom:0;background:rgba(2,6,15,.78);z-index:99999;display:none;align-items:center;justify-content:center;padding:14px}",
      "#hx-overlay.on{display:flex}",
      ".hx-box{background:#0b1220;border:1px solid #1e2a44;border-radius:16px;width:min(940px,100%);max-height:92vh;overflow:auto;color:#e2e8f0;font-family:inherit;box-shadow:0 20px 60px rgba(0,0,0,.6)}",
      ".hx-head{display:flex;justify-content:space-between;align-items:flex-start;padding:16px 20px 6px}",
      ".hx-title{font-size:20px;font-weight:800}.hx-sub{font-size:13px;color:#94a3b8;margin-top:2px}",
      ".hx-x{background:#16213a;border:1px solid #26365c;color:#e2e8f0;border-radius:10px;width:34px;height:34px;cursor:pointer;font-size:15px}",
      ".hx-ranges{display:flex;gap:8px;flex-wrap:wrap;padding:8px 20px}",
      ".hx-r{background:#111a2e;border:1px solid #26365c;color:#cbd5e1;border-radius:999px;padding:7px 16px;cursor:pointer;font-size:13px;font-weight:700}",
      ".hx-r.on{background:#2563eb;border-color:#3b82f6;color:#fff}",
      ".hx-body{padding:6px 20px 20px}",
      ".hx-msg{padding:40px 10px;text-align:center;color:#94a3b8;font-size:14px}",
      ".hx-now{font-size:13px;color:#cbd5e1;margin:6px 0 12px}",
      ".hx-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:10px;margin-bottom:14px}",
      ".hx-card{background:#111a2e;border:1px solid #1e2a44;border-radius:12px;padding:10px 12px}",
      ".hx-card .l{font-size:11px;text-transform:uppercase;letter-spacing:.05em;color:#94a3b8}",
      ".hx-card .v{font-size:20px;font-weight:800;margin-top:3px}",
      ".hx-svg{width:100%;height:auto;display:block}",
      ".hx-strip{display:flex;height:12px;border-radius:6px;overflow:hidden;margin:4px 0 8px;background:#111a2e}",
      ".hx-strip span{flex:1}",
      ".hx-legend{display:flex;gap:16px;flex-wrap:wrap;font-size:12px;color:#94a3b8;margin-bottom:14px}",
      ".hx-legend i{display:inline-block;width:10px;height:10px;border-radius:3px;margin-right:5px;vertical-align:-1px}",
      ".hx-h{font-size:13px;font-weight:800;color:#cbd5e1;margin:10px 0 6px}",
      ".hx-ev{display:flex;justify-content:space-between;font-size:13px;padding:6px 10px;border-bottom:1px solid #16213a}",
      ".hx-foot{font-size:12px;color:#64748b;margin-top:10px}"
    ].join("\n");
    document.head.appendChild(s);
  }
  function mark() { for (var k in btns) btns[k].className = "hx-r" + (k === cur.range ? " on" : ""); }
  function build() {
    if (overlay) return;
    css();
    overlay = h("div"); overlay.id = "hx-overlay";
    var box = h("div", "hx-box");
    var head = h("div", "hx-head");
    var tw = h("div");
    titleEl = h("div", "hx-title"); subEl = h("div", "hx-sub");
    tw.appendChild(titleEl); tw.appendChild(subEl);
    var x = h("button", "hx-x", "\u2715"); x.onclick = close;
    head.appendChild(tw); head.appendChild(x);
    var bar = h("div", "hx-ranges");
    RANGES.forEach(function (r) {
      var b = h("button", "hx-r", r[1]);
      b.onclick = function () { cur.range = r[0]; mark(); load(false); };
      btns[r[0]] = b; bar.appendChild(b);
    });
    body = h("div", "hx-body");
    box.appendChild(head); box.appendChild(bar); box.appendChild(body);
    overlay.appendChild(box);
    overlay.addEventListener("click", function (e) { if (e.target === overlay) close(); });
    document.body.appendChild(overlay);
    document.addEventListener("keydown", function (e) { if (e.key === "Escape") close(); });
  }
  function open(ip, name) {
    build();
    cur.ip = ip; cur.name = name || ip;
    titleEl.textContent = cur.name; subEl.textContent = ip;
    mark();
    overlay.classList.add("on");
    load(false);
    clearInterval(timer);
    timer = setInterval(function () { load(true); }, 60000);
  }
  function close() {
    if (!overlay) return;
    overlay.classList.remove("on");
    clearInterval(timer); timer = null; seq++;
  }
  function load(silent) {
    var my = ++seq;
    if (!silent) { body.textContent = ""; body.appendChild(h("div", "hx-msg", "Loading history...")); }
    fetch("/api/history?ip=" + encodeURIComponent(cur.ip) + "&range=" + cur.range, { cache: "no-store" })
      .then(function (r) { if (!r.ok) throw new Error("HTTP " + r.status); return r.json(); })
      .then(function (j) { if (my === seq) render(j); })
      .catch(function (e) {
        if (my === seq && !silent) { body.textContent = ""; body.appendChild(h("div", "hx-msg", "Could not load history (" + e.message + ").")); }
      });
  }
  function statCard(label, value, color) {
    var c = h("div", "hx-card");
    c.appendChild(h("div", "l", label));
    var v = h("div", "v", value);
    if (color) v.style.color = color;
    c.appendChild(v);
    return c;
  }
  function chart(j) {
    var NS = "http://www.w3.org/2000/svg", W = 800, H = 200;
    var svg = document.createElementNS(NS, "svg");
    svg.setAttribute("viewBox", "0 0 " + W + " " + (H + 22));
    svg.setAttribute("class", "hx-svg");
    function el(name, attrs) {
      var e = document.createElementNS(NS, name);
      for (var k in attrs) e.setAttribute(k, attrs[k]);
      return e;
    }
    svg.appendChild(el("rect", { x: 0, y: 0, width: W, height: H, fill: "#0f172a", rx: 6 }));
    var n = j.buckets.length, bw = W / n;
    var order = [[0, C.up], [2, C.flap], [1, C.down], [3, C.none]];
    j.buckets.forEach(function (b, i) {
      var sum = b[0] + b[1] + b[2] + b[3];
      var den = Math.max(j.bucketMs, sum), y = H;
      var t0 = j.from + i * j.bucketMs;
      var tip = fmt(t0, j.range) + "  |  Up " + dur(b[0]) + "  Down " + dur(b[1]) + "  Flapping " + dur(b[2]) + (b[3] ? "  No data " + dur(b[3]) : "");
      order.forEach(function (o) {
        var v = b[o[0]];
        if (v <= 0) return;
        var hh = v / den * H;
        if (hh < 2 && (o[0] === 1 || o[0] === 2)) hh = 2;
        y -= hh;
        var r = el("rect", { x: i * bw + 1, y: y, width: Math.max(bw - 2, 1), height: hh, fill: o[1] });
        var t = document.createElementNS(NS, "title"); t.textContent = tip; r.appendChild(t);
        svg.appendChild(r);
      });
    });
    for (var k = 0; k <= 4; k++) {
      var x = k * W / 4;
      var tx = el("text", { x: x, y: H + 16, "font-size": 11, fill: "#94a3b8", "text-anchor": k === 0 ? "start" : (k === 4 ? "end" : "middle") });
      tx.textContent = fmt(j.from + (j.to - j.from) * k / 4, j.range);
      svg.appendChild(tx);
    }
    return svg;
  }
  function render(j) {
    body.textContent = "";
    if (j.name) { titleEl.textContent = j.name; subEl.textContent = j.ip + (j.cat ? "  \u00b7  " + j.cat : ""); }
    if (j.none) {
      body.appendChild(h("div", "hx-msg", "No history recorded for this link yet. Recording starts when the history feature is installed - check again in a few minutes."));
      return;
    }
    var names = { 0: ["UP", C.up], 1: ["DOWN", C.down], 2: ["FLAPPING", C.flap], 3: ["NO DATA", C.none] };
    if (j.current != null) {
      var now = h("div", "hx-now");
      now.textContent = "Now: " + names[j.current][0] + " for " + dur(Date.now() - j.since);
      now.style.color = names[j.current][1];
      body.appendChild(now);
    }
    var T = j.totals, g = h("div", "hx-grid");
    g.appendChild(statCard("Uptime", pct(j.uptime), j.uptime == null ? "" : (j.uptime >= 99 ? C.up : (j.uptime >= 95 ? "#fbbf24" : C.down))));
    g.appendChild(statCard("Total UP", dur(T.up), C.up));
    g.appendChild(statCard("Total DOWN", dur(T.down), C.down));
    g.appendChild(statCard("Total FLAPPING", dur(T.flap), C.flap));
    g.appendChild(statCard("Outages", String(j.outages), ""));
    g.appendChild(statCard("Longest outage", dur(j.longestOutage), ""));
    g.appendChild(statCard("Average outage", dur(j.avgOutage), ""));
    g.appendChild(statCard("Flap episodes", String(j.flapEpisodes), C.flap));
    if (T.nodata > 0) g.appendChild(statCard("No data", dur(T.nodata), "#94a3b8"));
    body.appendChild(g);

    body.appendChild(chart(j));
    var strip = h("div", "hx-strip");
    j.buckets.forEach(function (b) {
      var s = h("span");
      s.style.background = b[1] > 0 ? C.down : (b[2] > 0 ? C.flap : (b[0] > 0 ? C.up : C.none));
      strip.appendChild(s);
    });
    body.appendChild(strip);
    var lg = h("div", "hx-legend");
    [["UP", C.up], ["FLAPPING", C.flap], ["DOWN", C.down], ["NO DATA", C.none]].forEach(function (x) {
      var s = h("span"); var i = h("i"); i.style.background = x[1];
      s.appendChild(i); s.appendChild(document.createTextNode(x[0])); lg.appendChild(s);
    });
    body.appendChild(lg);

    body.appendChild(h("div", "hx-h", "Latest status changes"));
    if (!j.events.length) body.appendChild(h("div", "hx-msg", "No status changes in this period."));
    j.events.forEach(function (ev) {
      var r = h("div", "hx-ev");
      r.appendChild(h("span", "", new Date(ev.t).toLocaleString()));
      var s = h("span", "", ev.s === 0 ? "Back UP" : (ev.s === 1 ? "Went DOWN" : (ev.s === 2 ? "FLAPPING" : "No data (Pariscope was off)")));
      s.style.color = names[ev.s][1]; s.style.fontWeight = "700";
      r.appendChild(s); body.appendChild(r);
    });
    if (j.trackingSince) body.appendChild(h("div", "hx-foot", "History recorded since " + new Date(j.trackingSince).toLocaleString() + ". Auto-refreshes every minute."));
  }

  document.addEventListener("dblclick", function (e) {
    var t = e.target;
    if (!t || !t.closest) return;
    if (t.closest("#hx-overlay")) return;
    var card = t.closest(".card");
    if (!card) return;
    var ipEl = card.querySelector(".ip");
    if (!ipEl) return;
    var ip = (ipEl.textContent || "").trim();
    if (!IPV4.test(ip)) return;
    var nm = card.querySelector(".node-name");
    try { window.getSelection().removeAllRanges(); } catch (x) {}
    open(ip, nm ? (nm.textContent || "").trim() : ip);
  });
})();
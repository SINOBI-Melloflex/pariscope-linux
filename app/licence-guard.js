/* Pariscope: if the licence stops being valid while the dashboard is open, go to the licence page. */
(function () {
  var f = window.fetch;
  if (!f) return;
  window.fetch = function () {
    return f.apply(this, arguments).then(function (r) {
      try {
        if (r.status === 403 && new URL(r.url, location.href).pathname.indexOf("/api/") === 0) {
          r.clone().json().then(function (j) {
            if (j && j.error === "licence_required") location.href = "/licence";
          }).catch(function () {});
        }
      } catch (e) {}
      return r;
    });
  };
})();
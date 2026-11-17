/* Membaca data realtime dari Firebase Realtime Database dan mengirimnya ke Dashboard.
   Memakai REST streaming milik Firebase (EventSource), jadi tidak perlu library tambahan.
   Bila streaming gagal, otomatis beralih ke polling tiap 1 detik dan mencoba streaming lagi. */
(function () {
  var cfg = window.VX_FIREBASE;
  if (!cfg || !cfg.databaseURL) return;
  var base = String(cfg.databaseURL).replace(/\/+$/, "");
  var path = String(cfg.path || "vortexhydro/live").replace(/^\/+|\/+$/g, "");
  var url = base + "/" + path + ".json" + (cfg.authToken ? "?auth=" + encodeURIComponent(cfg.authToken) : "");
  var data = {}, es = null, pollTimer = null, retryTimer = null, connected = false, first = true;

  function status(msg, lv) { if (window.VXDash) window.VXDash.status(msg, lv); }
  function push() { if (window.VXDash) window.VXDash.ingest(data, first); first = false; }

  function setAt(p, val) {
    var parts = p.split("/").filter(Boolean), o = data, i;
    for (i = 0; i < parts.length - 1; i++) {
      if (typeof o[parts[i]] !== "object" || o[parts[i]] === null) o[parts[i]] = {};
      o = o[parts[i]];
    }
    if (val === null) delete o[parts[parts.length - 1]]; else o[parts[parts.length - 1]] = val;
  }
  function onPut(e) {
    try {
      var m = JSON.parse(e.data);
      if (m.path === "/") data = (m.data && typeof m.data === "object") ? m.data : {};
      else setAt(m.path, m.data);
      if (!connected) { connected = true; status("Firebase terhubung (" + path + ")", "o"); }
      push();
    } catch (err) {}
  }
  function onPatch(e) {
    try {
      var m = JSON.parse(e.data);
      Object.keys(m.data || {}).forEach(function (k) { setAt(m.path.replace(/\/$/, "") + "/" + k, m.data[k]); });
      push();
    } catch (err) {}
  }

  function explain(code) {
    if (code === 401 || code === 403) return "Firebase menolak akses (rules). Pastikan .read di database.rules.json bernilai true";
    if (code === 404) return "Alamat database tidak ditemukan. Periksa databaseURL di database/firebase-config.js";
    return "Firebase tidak bisa dihubungi (kode " + code + ")";
  }
  function poll() {
    fetch(url, { cache: "no-store" }).then(function (r) {
      if (!r.ok) { status(explain(r.status), "w"); return null; }
      return r.json();
    }).then(function (j) {
      if (j === null || j === undefined) return;
      data = typeof j === "object" ? j : {};
      if (!connected) { connected = true; status("Firebase terhubung (polling, " + path + ")", "o"); }
      push();
    }).catch(function () { status("Firebase tidak bisa dihubungi. Cek koneksi internet dan databaseURL", "w"); });
  }
  function startPolling() { if (!pollTimer) { poll(); pollTimer = setInterval(poll, 1000); } }
  function stopPolling() { if (pollTimer) { clearInterval(pollTimer); pollTimer = null; } }

  function stream() {
    if (!window.EventSource) { startPolling(); return; }
    try { es = new EventSource(url); } catch (e) { startPolling(); return; }
    es.addEventListener("put", function (e) { stopPolling(); onPut(e); });
    es.addEventListener("patch", function (e) { stopPolling(); onPatch(e); });
    es.addEventListener("cancel", function () { status("Firebase menutup aliran data (akses dicabut oleh rules)", "w"); });
    es.addEventListener("auth_revoked", function () { status("Token Firebase kedaluwarsa", "w"); });
    es.onerror = function () {
      if (es) { es.close(); es = null; }
      connected = false; first = true;
      startPolling();
      clearTimeout(retryTimer);
      retryTimer = setTimeout(function () { if (!es) stream(); }, 15000);
    };
  }
  stream();
})();

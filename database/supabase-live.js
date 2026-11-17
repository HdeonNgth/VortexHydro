/* Membaca data realtime dari Supabase (tabel live_telemetry) dan mengirimnya ke Dashboard.
   Cara kerja: ambil nilai awal lewat REST, lalu berlangganan perubahan lewat Supabase Realtime.
   Bila Realtime putus, otomatis beralih ke polling tiap 1 detik sampai tersambung lagi. */
(function () {
  var cfg = window.VX_SUPABASE;
  if (!cfg || !cfg.url || !cfg.anonKey) return;
  var base = String(cfg.url).replace(/\/+$/, "");
  var table = cfg.table || "live_telemetry";
  var restUrl = base + "/rest/v1/" + table + "?select=*&id=eq.live";
  var headers = { apikey: cfg.anonKey, Authorization: "Bearer " + cfg.anonKey };
  var connected = false, first = true, pollTimer = null, rtOk = false, client = null, lastRtAt = 0;

  function status(msg, lv) { if (window.VXDash) window.VXDash.status(msg, lv); }

  /* Nama kolom database (snake_case) -> nama yang dipahami Dashboard */
  function push(row) {
    if (!row || !window.VXDash) return;
    window.VXDash.ingest({
      debit: row.debit,
      vbat: row.vbat,
      rpmShaft: row.rpm_shaft,
      rpmGen: row.rpm_gen,
      ts: row.ts
    }, first);
    first = false;
  }

  function explain(code) {
    if (code === 401 || code === 403) return "Supabase menolak akses. Periksa anonKey dan policy baca di tabel " + table;
    if (code === 404) return "Tabel " + table + " tidak ditemukan. Periksa url dan nama tabel di database/supabase-config.js";
    return "Supabase tidak bisa dihubungi (kode " + code + ")";
  }

  function poll() {
    fetch(restUrl, { headers: headers, cache: "no-store" }).then(function (r) {
      if (!r.ok) { status(explain(r.status), "w"); return null; }
      return r.json();
    }).then(function (j) {
      if (!j || !j.length) return;
      if (!connected) { connected = true; status("Supabase terhubung (" + table + ")", "o"); }
      push(j[0]);
    }).catch(function () { status("Supabase tidak bisa dihubungi. Cek koneksi internet dan url", "w"); });
  }
  /* Polling berjalan sebagai jaring pengaman. Dilewati hanya bila Realtime benar-benar baru mengirim
     data (<2,5 detik lalu). Jadi kalau koneksi mati diam-diam, polling langsung mengambil alih. */
  function startPolling() {
    if (pollTimer) return;
    poll();
    pollTimer = setInterval(function () { if (!(rtOk && Date.now() - lastRtAt < 2500)) poll(); }, 1000);
  }

  function subscribe() {
    if (!window.supabase || !window.supabase.createClient) return;
    try {
      client = window.supabase.createClient(base, cfg.anonKey, { realtime: { params: { eventsPerSecond: 10 } } });
      client.channel("vx-live")
        .on("postgres_changes", { event: "*", schema: "public", table: table }, function (p) {
          if (p && p.new) {
            lastRtAt = Date.now();
            if (!connected) { connected = true; status("Supabase Realtime terhubung (" + table + ")", "o"); }
            push(p.new);
          }
        })
        .subscribe(function (s) {
          rtOk = (s === "SUBSCRIBED");
          if (rtOk) status("Supabase Realtime terhubung (" + table + ")", "o");
          else if (s === "CHANNEL_ERROR" || s === "TIMED_OUT" || s === "CLOSED")
            status("Realtime terputus, memakai polling 1 detik", "w");
        });
    } catch (e) { rtOk = false; }
  }

  /* Muat pustaka supabase-js dari CDN. Jika gagal dimuat, polling tetap membuat Dashboard berjalan. */
  startPolling();
  var s = document.createElement("script");
  s.src = "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2";
  s.async = true;
  s.onload = subscribe;
  s.onerror = function () { status("Pustaka Realtime gagal dimuat, memakai polling 1 detik", "w"); };
  document.head.appendChild(s);
})();

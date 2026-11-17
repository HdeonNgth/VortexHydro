/* Pengaturan koneksi website ke Supabase Realtime.
   Kunci "publishable" di bawah memang boleh tampil di kode publik: lewat aturan RLS di database,
   kunci ini hanya bisa MEMBACA tabel live_telemetry. Menulis butuh "kunci simulator" yang
   TIDAK disimpan di repo (hanya diketik di simulasi 3D). Lihat database/README-supabase.md.
   Kosongkan url untuk kembali ke Firebase atau simulasi prototipe. */
window.VX_SUPABASE = window.VX_SUPABASE || {
  url: "https://gzzwjmcedymcdazckgbc.supabase.co",
  anonKey: "sb_publishable_7jdLcpH7rK8GX1uxN8dSxw_9utM-GG9",
  table: "live_telemetry"
};

/* Ambang Dashboard disesuaikan dengan skala simulasi 3D (rasio pulley 1:4, poros maks 80 RPM,
   debit maks 0,4 L/s). Tanpa ini Dashboard akan salah menuduh "sabuk slip" dan "bocor". */
window.VX_LIMITS = Object.assign({ ratio: 4, rpmRef: 80, qRef: 0.4, leakFrac: 0.5 }, window.VX_LIMITS || {});

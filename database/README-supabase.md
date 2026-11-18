# Simulasi 3D ke Website lewat Supabase Realtime

```
Simulasi 3D ──(tiap 0,25 detik, butuh kunci)──▶ Supabase (tabel live_telemetry) ──(Realtime)──▶ Dashboard website
```

Ini jalur alternatif dari Firebase (lihat `README.md` di folder ini). Bila `database/supabase-config.js` terisi, Dashboard memakai Supabase. Kosongkan `url`-nya untuk kembali ke Firebase atau simulasi prototipe.

## Yang sudah disiapkan

| Bagian | Isi |
|---|---|
| Project Supabase | `vortex-hydro`, region Singapore, URL `https://gzzwjmcedymcdazckgbc.supabase.co` |
| Tabel `public.live_telemetry` | Satu baris (`id = 'live'`) berisi pembacaan terbaru. Realtime aktif. |
| Fungsi `public.push_telemetry(...)` | Satu-satunya jalan menulis. Memeriksa kunci simulator dan rentang nilai, lalu mengisi `ts` dari jam server. |
| RLS | Semua orang boleh **membaca**. Tidak ada policy tulis, jadi tulis langsung ke tabel ditolak. |
| Kunci simulator | Tersimpan di `private.sim_secret` (tidak terekspos API). **Tidak ada di repo.** |

## Kolom data

| Kolom | Arti | Satuan |
|---|---|---|
| `debit` | Debit air | L/s |
| `vbat` | Tegangan baterai | Volt |
| `rpm_shaft` | Putaran poros utama | RPM |
| `rpm_gen` | Putaran generator | RPM |
| `ts` | Waktu pembaruan terakhir | ms sejak 1970 (diisi server) |

Simulasi 3D menampilkan satuan dan format yang sama dengan Dashboard (debit L/s 2 desimal, putaran RPM bulat, tegangan V 2 desimal), jadi angka di kedua tempat identik. Pada slider 75%: 0,30 L/s, 60 RPM, 240 RPM. Setara 18,0 L/min dan 3.600 RPH, yang tetap tampil kecil sebagai keterangan di layar LCD 3D.

## Cara pakai

1. Buka `database/simulator/3d_cad_preview_vortex_hydro_pembangkit_kincir_air_bess_ecoflow_delta_2.html` di browser.
2. Klik **Kontrol**, cari blok **Kirim ke Website (Supabase)**, isi **kunci simulator**, klik **Mulai Kirim**.
   Status berubah menjadi `TERKIRIM · n`. Kunci disimpan hanya di browser itu (localStorage).
3. Buka website, masuk admin, buka Dashboard. Status berubah menjadi `LIVE · SUPABASE`.
   Geser slider pompa di simulasi dan angka di Dashboard ikut bergerak.

Bila simulasi dihentikan, Dashboard menjadi OFFLINE setelah 10 detik tanpa data baru.

## Pengunjung online (live counting)

Header Dashboard punya pil **Online: N** yang menghitung berapa orang sedang membuka website saat ini.

- Memakai Supabase Realtime Presence (kanal `vx-online`), tanpa tabel dan tanpa menyimpan riwayat.
- Tiap browser memakai ID acak (`vx_vid` di localStorage), tanpa nama atau data pribadi. Dua tab di browser yang sama dihitung satu orang.
- Angka naik saat orang membuka website dan turun otomatis saat tab ditutup (butuh beberapa detik).
- Yang dihitung semua pengunjung website, dipisah per peran: `Online: 5 (3 tamu · 1 admin · 1 belum masuk)`. "Belum masuk" adalah orang yang masih di halaman pilih peran. Saat seseorang login atau logout, hitungannya ikut berubah. Bila satu browser punya beberapa tab, peran tertinggi yang dipakai (admin lebih dulu dari tamu). Admin yang sedang membuka Dashboard ikut terhitung. Pilnya sendiri hanya terlihat di halaman Dashboard.
- Batas paket gratis Supabase: sekitar 200 koneksi Realtime bersamaan. Lewat itu, pengunjung baru tidak ikut terhitung, tetapi website tetap jalan. Matikan fitur ini dengan `presence: false` di `supabase-config.js`.

## Ambang Dashboard

`supabase-config.js` mengatur `window.VX_LIMITS` agar sesuai skala simulasi: rasio pulley 4, debit acuan 0,4 L/s menghasilkan 80 RPM di poros. Tanpa ini Dashboard memakai ambang prototipe (rasio 2,2) dan menuduh sabuk slip. Ubah nilainya bila model simulasi berubah.

## Keamanan

- `anonKey` (publishable) di `supabase-config.js` aman dipublikasikan karena hanya bisa membaca.
- Jangan commit kunci simulator. Bila bocor, buat yang baru lewat SQL Editor Supabase:
  ```sql
  update private.sim_secret set secret = 'vx_' || encode(extensions.gen_random_bytes(18), 'hex') where id = 1;
  select secret from private.sim_secret;
  ```
- Rentang nilai yang diterima: debit 0 sampai 100, vbat 0 sampai 60, rpm_shaft 0 sampai 5000, rpm_gen 0 sampai 20000. Ubah di fungsi `push_telemetry` bila skala berubah.

## Jika tidak berjalan

| Gejala | Penyebab dan solusi |
|---|---|
| Status simulasi `KUNCI SALAH` | Kunci tidak sama dengan isi `private.sim_secret`. |
| Status simulasi `OFFLINE` | Browser tidak bisa menjangkau Supabase. Cek internet. |
| Dashboard tetap OFFLINE · MENUNGGU DATA | Simulasi belum menekan Mulai Kirim, atau `url` di `supabase-config.js` kosong. |
| Dashboard menampilkan "sabuk slip" atau "bocor" | `VX_LIMITS` belum sesuai skala simulasi. |
| Sesekali putus lalu nyambung lagi | Sudah ditangani: pengirim memakai timer Web Worker (tidak diperlambat saat tab di latar belakang), tiap permintaan dibatasi 3 detik, dan melanjutkan otomatis setelah halaman di-refresh. Dashboard memakai polling cadangan bila Realtime diam lebih dari 2,5 detik, dan baru menyatakan OFFLINE setelah 15 detik tanpa data. |
| Log berisi "Realtime terputus, memakai polling" | Normal bila WebSocket diblokir jaringan. Dashboard tetap jalan lewat polling 1 detik. |
| Project Supabase gratis berhenti sendiri | Paket gratis menjeda project yang tidak aktif seminggu. Buka dashboard Supabase lalu **Restore**. |

## Energi, efisiensi, dan laporan

Tab **Energi** di Dashboard menampilkan total energi, efisiensi sistem, grafik tumpang-tindih (daya PLN ke pompa vs daya generator), rata-rata dan puncak per 5 jam, serta laporan Excel tiap 10 jam operasi.

**Alur data.** Simulator 3D memanggil `push_telemetry` tiap 0,25 detik dengan tambahan `p_in_w` (daya PLN ke pompa, W), `p_out_w` (daya generator, W), `p_soc` dan `p_op_s` (jam operasi simulasi, detik). Server menghitung energi (Wh = W × detik operasi ÷ 3600), sehingga hasil tetap benar walau waktu simulasi dipercepat dan tidak bergantung pada browser yang membuka Dashboard.

**Tabel dan fungsi** (lihat `database/supabase-energy.sql`, aman dijalankan ulang):
- `live_telemetry`: kolom baru `pln_in_w`, `gen_out_w`, `bess_soc`, `op_s`, `e_in_wh`, `e_out_wh`.
- `telemetry_log`: satu baris per menit operasi (energi dan puncak daya). Dapat dibaca publik, hanya fungsi berkunci yang bisa menulis.
- `report_windows(p_hours, p_limit)`: rata-rata, puncak, dan efisiensi per jendela (bawaan 5 jam).
- `reset_telemetry(p_key)`: tombol **Mulai Uji Baru** di simulator, menolkan total dan riwayat. Butuh kunci simulator.

**Laporan Excel.** Dibuat di browser (`assets/js/dash-report.js`) dari `telemetry_log`: lembar Ringkasan (KPI, tabel 5 jam, 4 grafik), Grafik (4 grafik per menit), dan Data Menit. Rumus tetap hidup. Blok 10 jam diunduh otomatis saat Dashboard terbuka (admin) dan jam operasi melewati batas blok; blok lama dan laporan sementara bisa diunduh manual.

**Catatan.**
- Prototipe fisik belum punya wattmeter. Daya PLN ke pompa dihitung oleh model di simulator (dipengaruhi debit, kavitasi, tegangan, keausan), jadi bukan pengukuran. Ganti `protoPhysics.pumpInputW` dengan data wattmeter asli bila tersedia.
- Data masuk per menit operasi, sehingga batas jendela 5 dan 10 jam bergeser maksimal satu menit.
- Kunci simulator tidak ada di repo; ketik di panel Kontrol simulator.

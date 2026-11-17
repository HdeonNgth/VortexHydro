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

1. Buka `database/simulator/3d_cad_preview_pembangkit_kincir_air_generator_lutfi.html` di browser.
2. Klik **Kontrol**, cari blok **Kirim ke Website (Supabase)**, isi **kunci simulator**, klik **Mulai Kirim**.
   Status berubah menjadi `TERKIRIM · n`. Kunci disimpan hanya di browser itu (localStorage).
3. Buka website, masuk admin, buka Dashboard. Status berubah menjadi `LIVE · SUPABASE`.
   Geser slider pompa di simulasi dan angka di Dashboard ikut bergerak.

Bila simulasi dihentikan, Dashboard menjadi OFFLINE setelah 10 detik tanpa data baru.

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
| Log berisi "Realtime terputus, memakai polling" | Normal bila WebSocket diblokir jaringan. Dashboard tetap jalan lewat polling 1 detik. |
| Project Supabase gratis berhenti sendiri | Paket gratis menjeda project yang tidak aktif seminggu. Buka dashboard Supabase lalu **Restore**. |

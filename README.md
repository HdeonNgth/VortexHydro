# Vortex Hydro

Website satu halaman untuk proyek pembangkit listrik mikro-hidro berbasis pusaran air, dengan backend Express dan SQLite untuk login serta data Dashboard.

## Situs online

Buka [Vortex Hydro](https://hdeonngth.github.io/VortexHydro/) untuk melihat situs di GitHub Pages. Karena GitHub Pages tidak menjalankan backend, situs online otomatis memakai mode demo: Tamu masuk langsung, sedangkan Admin perlu memasukkan kata sandi demo `vortex-demo` untuk membuka Dashboard simulasi. Pemeriksaan kata sandi berjalan di browser dan dapat dilewati; jangan gunakan untuk melindungi data atau kata sandi asli. Data sensor dan riwayat kunjungan tidak realtime.

Untuk login dan Dashboard realtime yang aman, deploy backend Node.js pada layanan hosting terpisah dan atur `assets/js/api-config.js` ke URL API yang diizinkan.

## Menjalankan backend

Persyaratan: Node.js 20 atau lebih baru.

1. Pasang dependensi dengan `npm install` (di PowerShell yang memblokir skrip npm, gunakan `npm.cmd install`).
2. Salin `.env.example` menjadi `.env`.
3. Isi `API_KEY` dengan nilai acak minimal 32 karakter. Contoh pembuatannya:
   `node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"`
4. Isi `ADMIN_USERNAME` dan `ADMIN_PASSWORD` (12–128 karakter), lalu jalankan `npm run seed:admin`. Akun admin hanya dibuat lewat skrip ini.
5. Atur `CORS_ORIGINS` ke origin frontend yang tepat. Untuk deployment, gunakan HTTPS dan sajikan API pada origin yang sama atau site yang sama agar cookie `SameSite=Lax` dapat dikirim.
6. Jalankan `npm start` (atau `npm.cmd start` di PowerShell yang memblokir skrip), lalu buka URL server yang ditampilkan.

Jangan commit `.env` atau menaruh `API_KEY` di file frontend. Untuk layanan hosting yang mengharuskan bind ke semua interface, atur `HOST=0.0.0.0`. `NODE_ENV=production` mengaktifkan cookie `Secure`.

## Cara masuk

Pada backend Node.js, pilih **Masuk sebagai Tamu** untuk langsung membuka halaman publik; tamu tidak diminta mengisi nama dan tidak dapat membuka Dashboard. **Masuk sebagai Admin** memeriksa akun yang dibuat lewat skrip seed. Identitas akun tidak ditampilkan di navbar; tombol Keluar tetap tersedia untuk mengakhiri sesi.

Di GitHub Pages, tombol Admin hanya simulasi: kolom username tidak ditampilkan dan kata sandi demo `vortex-demo` diperlukan. Pemeriksaan dilakukan di browser sehingga tidak memberi keamanan nyata. Gunakan hanya untuk demo dan jangan masukkan kata sandi asli.

## API sensor

ESP32 mengirim objek JSON berisi `debit`, `head`, `rpm`, `volt`, `amp`, `daya`, `eff`, dan `temp` ke `POST /api/ingest`, dengan header `X-API-Key`. Batas nilai divalidasi server. Pada backend Node, data realtime Dashboard dan riwayat kunjungan hanya tersedia bagi sesi admin; tanpa sensor aktif, Dashboard admin memberi label `OFFLINE / DATA SIMULASI`. Dashboard GitHub Pages hanya simulasi lokal di browser.

Jalankan pengujian backend dengan `npm test` (atau `npm.cmd test`). Database SQLite berada di `server/data/` dan tidak dilacak Git.

## Struktur

- `index.html` — markup halaman dan rute.
- `assets/css/site.css` — gaya situs.
- `assets/js/` — skrip yang dipisah menurut fitur.
- `server/` — backend, middleware sesi, endpoint, dan pengujian.
- `.env.example` — contoh konfigurasi backend tanpa secret.
- `assets/i18n.js` — bahasa Indonesia dan Inggris.
- `assets/images/` dan `assets/team/` — aset situs yang digunakan langsung.
- `docs/README.md` — catatan struktur dan deployment situs.

CSS dan skrip dipisahkan tanpa menambahkan build step; urutan pemuatan skrip dipertahankan.

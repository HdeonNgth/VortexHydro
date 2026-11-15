# Backend dan hosting Vortex Hydro

Folder ini mengumpulkan backend Node.js, contoh konfigurasi, dependensi, tes, dan panduan hosting untuk pengembangan berikutnya. Backend belum di-host dan belum terhubung ke situs GitHub Pages; situs publik saat ini tetap menggunakan mode demo.

## Isi folder

- `server/` — API Express, sesi, SQLite, middleware, seed admin, dan tes.
- `package.json` dan `package-lock.json` — perintah dan dependensi backend.
- `.env.example` — contoh konfigurasi tanpa rahasia.

## Menjalankan backend lokal

Persyaratan: Node.js 20 atau lebih baru. Jalankan perintah dari folder `Upcoming`:

```powershell
cd Upcoming
npm.cmd install
if (-not (Test-Path .env)) { Copy-Item .env.example .env }
```

Isi `.env` dengan nilai rahasia milik Anda:

- `API_KEY`: nilai acak minimal 32 karakter.
- `ADMIN_USERNAME`: 3–32 karakter; huruf, angka, titik, garis bawah, atau tanda hubung.
- `ADMIN_PASSWORD`: 12–128 karakter.
- `CORS_ORIGINS`: origin frontend yang diizinkan.

Buat atau perbarui akun admin, jalankan tes, lalu mulai server:

```powershell
npm.cmd run seed:admin
npm.cmd test
npm.cmd start
```

Database lokal disimpan di `server/data/`. Jangan hapus atau unggah database dan `.env` ke GitHub. Akun admin dibuat melalui `seed-admin.js`; kata sandi disimpan sebagai hash bcrypt.

## Persiapan hosting

Pilih layanan yang mendukung proses Node.js jangka panjang, variabel lingkungan rahasia, HTTPS, dan penyimpanan persisten untuk SQLite. Belum ada penyedia hosting yang dikonfigurasi.

1. Deploy isi `Upcoming` sebagai aplikasi Node.js dan gunakan perintah start `npm start`.
2. Atur `API_KEY`, `ADMIN_USERNAME`, `ADMIN_PASSWORD`, `CORS_ORIGINS`, dan `NODE_ENV=production` pada pengaturan rahasia penyedia hosting. Jangan menaruh nilainya di kode, HTML, atau JavaScript.
3. Atur `HOST=0.0.0.0` bila penyedia mewajibkan bind ke semua interface; gunakan `PORT` yang diberikan penyedia.
4. Pasang disk/volume persisten dan set `DB_PATH` ke lokasi file SQLite pada volume tersebut. Penyimpanan sementara dapat menghapus data database saat aplikasi dimulai ulang.
5. Gunakan HTTPS. Cookie sesi bertanda `HttpOnly`, `SameSite=Lax`, dan `Secure` di production. Sajikan frontend dan API pada origin/site yang sama atau konfigurasi strategi cookie/CORS yang sesuai untuk deployment lintas-origin.
6. Setelah API memiliki URL publik, atur `window.VX_API_BASE` di `../assets/js/api-config.js`, izinkan origin frontend di `CORS_ORIGINS`, dan nonaktifkan pemilihan mode demo GitHub Pages sebelum mengaktifkan backend. Jangan lakukan langkah ini sebelum API benar-benar siap.
7. Uji login Tamu/Admin, logout, otorisasi endpoint, koneksi sensor, dan penyimpanan database setelah deploy.

GitHub Pages hanya menyajikan file statis dan tidak menjalankan backend. Karena itu login admin `vortex-demo` di situs publik adalah demo frontend yang dapat dilewati, bukan pengamanan server. Backend di folder ini menyediakan login dan otorisasi server sungguhan saat di-host.

## Fitur backend

- `POST /api/auth/guest`, `POST /api/auth/admin`, `POST /api/auth/logout`, `GET /api/auth/me`
- `POST /api/track`
- Endpoint admin `GET /api/visits`, `GET /api/stream/visits`, `GET /api/latest`, `GET /api/stream/sensor`, dan `GET /api/history`
- `POST /api/ingest` untuk data ESP32 dengan header `X-API-Key`

Detail arsitektur website statis tetap ada di [`../docs/README.md`](../docs/README.md).

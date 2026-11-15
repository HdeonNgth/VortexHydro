# Dokumentasi Vortex Hydro

## Struktur proyek

```text
index.html              Markup dan rute aplikasi satu halaman
assets/css/site.css     Gaya situs, dipisahkan dari markup
assets/js/              Skrip per fitur, tetap dimuat berurutan
assets/i18n.js          Terjemahan antarmuka Indonesia/Inggris
assets/team/            Foto tim yang dioptimalkan untuk website
assets/images/          Gambar dokumentasi dan logo software
server/                 API Express, sesi, SQLite, dan pengujian
docs/                   Dokumentasi proyek
```

Beranda, Tentang, Teknologi, Dokumentasi, Struktur Tim, FAQ, dan Dashboard tetap menjadi rute dalam satu aplikasi halaman. CSS dan JavaScript kini berada di file terpisah; skrip dipanggil pada posisi dan urutan semula agar perilaku halaman tidak berubah. FAQ tetap tersedia melalui tautan di bagian footer, bukan di bilah navigasi atas. Tombol bahasa mengganti teks situs antara Bahasa Indonesia dan English serta mengingat pilihan di browser.

## Akses situs dan backend

Situs statis dipublikasikan melalui [GitHub Pages](https://hdeonngth.github.io/VortexHydro/). GitHub Pages tidak menjalankan backend Express, sehingga login, pencatatan kunjungan, dan Dashboard realtime memerlukan backend yang di-host terpisah. Atur `window.VX_API_BASE` di `assets/js/api-config.js` ke URL backend publik; nilai tersebut bukan secret. Backend harus mengizinkan origin frontend melalui `CORS_ORIGINS`.

Cookie sesi memakai `SameSite=Lax`, sehingga gunakan HTTPS dan sajikan frontend/API pada origin yang sama atau site yang sama (misalnya melalui reverse proxy atau subdomain satu domain). Jika backend tidak terhubung, halaman login menampilkan status kegagalan dan Dashboard admin tidak menampilkan data realtime.

Akun admin dibuat dengan `npm run seed:admin` setelah mengisi `ADMIN_USERNAME` dan `ADMIN_PASSWORD` pada `.env`. Simpan `API_KEY` hanya di konfigurasi backend/ESP32; jangan menaruhnya di HTML atau JavaScript publik. Perangkat mengirim pembacaan sensor ke `POST /api/ingest` menggunakan header `X-API-Key`. Akses riwayat kunjungan, pembacaan sensor, dan SSE dibatasi oleh sesi admin di server.

Panduan setup ada pada `README.md` di root repositori.

Foto tim yang digunakan situs berada di `assets/team/`; gambar dokumentasi dan logo software berada di `assets/images/`. Data anggota serta pemetaan foto berada di `assets/js/team.js`. Folder bahan sumber foto dan referensi desain lokal tidak diperlukan untuk menjalankan situs dan tidak disertakan dalam distribusi publik.

FAQ tetap dapat dicari dari pencarian situs saat footer tersembunyi di Dashboard. Navigasi dashboard berubah menjadi sidebar hanya saat masuk atau keluar dari Dashboard. Animasi menghormati pilihan "matikan animasi" dan preferensi reduced motion perangkat.

## Estimasi performa

Pengukuran sebelumnya menggunakan Chromium tanpa cache, dua kali per ukuran layar: laptop 1366×768 dengan jaringan 20 Mbps/latensi 35 ms rata-rata **0,50 detik**; ponsel simulasi 390×844 dengan jaringan 4G 1,6 Mbps/latensi 150 ms rata-rata **3,37 detik** sampai event `load`. Ini perkiraan simulasi, bukan hasil dari perangkat fisik atau server produksi. Foto tim baru diminta setelah rute Struktur Tim dibuka.

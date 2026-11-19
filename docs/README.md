# Dokumentasi Vortex Hydro

## Struktur proyek

```text
index.html              Markup dan rute aplikasi satu halaman
assets/css/site.css     Gaya situs, dipisahkan dari markup
assets/js/              Skrip per fitur, tetap dimuat berurutan
assets/i18n.js          Terjemahan antarmuka Indonesia/Inggris
assets/team/            Foto tim yang dioptimalkan untuk website
assets/images/          Gambar dokumentasi dan logo software
Upcoming/               Backend Node.js, konfigurasi contoh, tes, dan panduan hosting
docs/                   Dokumentasi proyek
```

Beranda, Tentang (sudah termasuk cara kerja), Dokumentasi, Struktur Tim, FAQ, dan Dashboard tetap menjadi rute dalam satu aplikasi halaman. CSS dan JavaScript kini berada di file terpisah; skrip dipanggil pada posisi dan urutan semula agar perilaku halaman tidak berubah. FAQ tetap tersedia melalui tautan di bagian footer, bukan di bilah navigasi atas. Tombol bahasa mengganti teks situs antara Bahasa Indonesia dan English serta mengingat pilihan di browser.

## Akses situs dan backend

Situs statis dipublikasikan melalui [GitHub Pages](https://hdeonngth.github.io/VortexHydro/). GitHub Pages tidak menjalankan backend Express. Situs publik saat ini memakai mode demo frontend; backend belum di-host atau dihubungkan. Semua kode server, contoh konfigurasi, dan panduan hosting berada di [`../Upcoming/README.md`](../Upcoming/README.md).

Panduan setup backend ada pada `Upcoming/README.md`.

Foto tim yang digunakan situs berada di `assets/team/`; gambar dokumentasi dan logo software berada di `assets/images/`. Data anggota serta pemetaan foto berada di `assets/js/team.js`. Folder bahan sumber foto dan referensi desain lokal tidak diperlukan untuk menjalankan situs dan tidak disertakan dalam distribusi publik.

FAQ tetap dapat dicari dari pencarian situs saat footer tersembunyi di Dashboard. Navigasi dashboard berubah menjadi sidebar hanya saat masuk atau keluar dari Dashboard. Animasi menghormati pilihan "matikan animasi" dan preferensi reduced motion perangkat.

## Estimasi performa

Pengukuran sebelumnya menggunakan Chromium tanpa cache, dua kali per ukuran layar: laptop 1366×768 dengan jaringan 20 Mbps/latensi 35 ms rata-rata **0,50 detik**; ponsel simulasi 390×844 dengan jaringan 4G 1,6 Mbps/latensi 150 ms rata-rata **3,37 detik** sampai event `load`. Ini perkiraan simulasi, bukan hasil dari perangkat fisik atau server produksi. Foto tim baru diminta setelah rute Struktur Tim dibuka.

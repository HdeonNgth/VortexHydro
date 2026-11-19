# Vortex Hydro

Website satu halaman untuk proyek pembangkit listrik mikro-hidro berbasis pusaran air.

## Situs online

Buka [Vortex Hydro](https://hdeonngth.github.io/VortexHydro/) untuk melihat versi statis situs di GitHub Pages.

Kode backend dan panduan hosting untuk pengembangan berikutnya dikumpulkan di [`Upcoming/`](Upcoming/). Backend belum di-host atau dihubungkan ke situs publik.

## Akses demo

Di GitHub Pages, Tamu masuk tanpa kata sandi. Admin demo memakai kata sandi `pakcikiniv2` dan hanya membuka Dashboard simulasi. Pemeriksaan dilakukan di browser sehingga dapat dilewati; jangan gunakan untuk melindungi data atau kata sandi asli. Data sensor dan riwayat kunjungan tidak realtime.

## Struktur

- `index.html` — markup halaman dan rute.
- `assets/css/site.css` — gaya situs.
- `assets/css/dashboard.css` — gaya khusus mode Dashboard (sidebar ikon, top bar, kartu, grafik).
- `assets/js/` — skrip yang dipisah menurut fitur.
- `Upcoming/` — backend Node.js, konfigurasi contoh, tes, dan persiapan hosting.
- `assets/i18n.js` — bahasa Indonesia dan Inggris.
- `assets/images/` dan `assets/team/` — aset situs yang digunakan langsung.
- `docs/README.md` — catatan struktur dan deployment situs.

CSS dan skrip dipisahkan tanpa menambahkan build step; urutan pemuatan skrip dipertahankan. Untuk setup backend, lihat [`Upcoming/README.md`](Upcoming/README.md).

## Data Dashboard

Dashboard memantau empat besaran prototipe: debit air (L/s), tegangan baterai (V), RPM poros utama, dan RPM generator. Penganalisis di `assets/js/navigation.js` mengubah angka itu menjadi peringatan berwarna (NORMAL, WASPADA, BAHAYA) dan mencatat perubahan kondisi di Log kejadian: pompa mati, turbin macet, dugaan kebocoran, sabuk slip, putaran berlebih, dan baterai rendah atau tinggi.

Saat ini Dashboard hanya memakai satu sumber data:

- **Simulasi prototipe**: mesin `assets/js/vx-engine.js` yang juga menggerakkan halaman Tentang. Angkanya dibuat di browser, jadi tidak ada database atau koneksi realtime. Fokus pengembangan sekarang ada di tampilan (UI).

Jalur database realtime (Firebase dan Supabase), pengirim data dari simulasi 3D, dan halaman Energi serta Laporan Excel sudah dihapus dari kode. Semuanya masih ada di riwayat Git bila dibutuhkan lagi.

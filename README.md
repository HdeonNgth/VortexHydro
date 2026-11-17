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
- `assets/js/` — skrip yang dipisah menurut fitur.
- `Upcoming/` — backend Node.js, konfigurasi contoh, tes, dan persiapan hosting.
- `assets/i18n.js` — bahasa Indonesia dan Inggris.
- `assets/images/` dan `assets/team/` — aset situs yang digunakan langsung.
- `docs/README.md` — catatan struktur dan deployment situs.

CSS dan skrip dipisahkan tanpa menambahkan build step; urutan pemuatan skrip dipertahankan. Untuk setup backend, lihat [`Upcoming/README.md`](Upcoming/README.md).

## Data Dashboard dan simulasi prototipe

Dashboard admin memakai mesin simulasi bersama `assets/js/vx-engine.js` (`window.VXSim`), yang juga menggerakkan halaman Teknologi. Pompa, debit, head, dan gangguan (kebocoran, turbin macet, panas berlebih) yang diatur di salah satu halaman langsung tampil di yang lain. Penganalisis di `navigation.js` mencatat perubahan kondisi di Log kejadian dengan level NORMAL, WASPADA, dan BAHAYA. Ambang ada di `LIM` dan bisa diganti lewat `window.VX_LIMITS`. Saat sensor asli terhubung (`POST /api/ingest` atau `vxDashboard.push`), Dashboard memakai data sensor dengan aturan peringatan yang sama.

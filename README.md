# Vortex Hydro

Website statis satu halaman untuk proyek pembangkit listrik mikro-hidro berbasis pusaran air.

## Menjalankan lokal

Jalankan server dari folder proyek:

```powershell
python -m http.server 8000
```

Buka [http://localhost:8000/html.html](http://localhost:8000/html.html). Situs memakai rute hash seperti `#teknologi`, `#struktur-tim`, `#faq`, dan `#dashboard`.

## Struktur

- `html.html` — markup halaman dan rute.
- `assets/css/site.css` — gaya situs.
- `assets/js/` — skrip yang dipisah menurut fitur.
- `assets/i18n.js` — bahasa Indonesia dan Inggris.
- `assets/images/` dan `assets/team/` — aset situs yang digunakan langsung.
- `docs/README.md` — catatan proyek dan informasi pengujian.

CSS dan skrip dipisahkan tanpa menambahkan build step; urutan pemuatan skrip dipertahankan.

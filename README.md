# Vortex Hydro

Website proyek kelas pembangkit listrik mikro-hidro berbasis pusaran air (*gravitational water vortex micro-hydro simulator*), Fakultas Vokasi, Universitas Negeri Malang.

## Situs Online

Buka **[Vortex Hydro](https://hdeonngth.github.io/VortexHydro/)** di GitHub Pages.

## Fitur Utama

- **Visual-First Continuous Scroll:** Hero visual prototipe turbin dengan gelombang aliran air, angka spesifikasi nyata, dan perpindahan seksi mulus tanpa jeda transisi.
- **Simulasi Interaktif Arus Air:** Pengunjung dapat menggeser debit air (`Q`), tinggi jatuh (`H`), dan efisiensi (`η`) untuk melihat animasi arus air, putaran kincir 6 sudu, nyala LED, serta perhitungan daya listrik secara langsung.
- **Cara Kerja Interaktif (Geser):** Enam langkah sirkulasi air (Air Masuk, Turbin, Generator, Air Jatuh ke Ember, Pompa Bawah, Pipa Kembali ke Awal) yang bisa digeser, diklik, atau dinavigasi dengan keyboard. FAQ ada di bagian bawah halaman yang sama (`#faq` langsung menuju ke sana).
- **Diagram Penampang 8 Titik:** Blueprint interaktif prototipe dengan penjelasan detail tiap komponen.
- **Dokumentasi & Struktur Tim Ringkas:** Tahapan uji laboratorium, daftar peralatan, dan filter divisi tim.
- **Dashboard Admin Simulasi:** Pemantauan telemetri simulasi (`debit`, `vbat`, `rpmShaft`, `rpmGen`) dengan grafik 60 detik dan indikator (kata sandi demo: `pakcikiniv2`).
- **Vortex Hydro AI Assistant:** Widget chat bertenaga Gemini melalui Supabase Edge Function `chat-with-ai`.
- **Dwi-Bahasa (ID/EN), Mode Terang/Gelap, & Pencarian Cepat (`Ctrl+K`).**

## Struktur Folder (Ringkas & Terkonsolidasi)

```text
index.html                  Halaman utama (continuous scroll + mode Dashboard Admin)
assets/
  styles.css                Seluruh sistem desain, layout responsif, Dashboard & AI widget
  app.js                    Navigasi scroll-spy, simulasi arus air, diagram 8 titik, tim & pencarian
  dashboard.js              Mesin simulasi fisika (VXSim), autentikasi demo & telemetri Dashboard
  ai-assistant.js           Integrasi chat Vortex Hydro AI (Supabase Edge Function)
  i18n.js                   Kamus & pengalih bahasa Indonesia / Inggris
  images/                   Render hero turbin, foto dokumentasi & logo software
  team/                     Foto profil anggota tim
supabase/                   Edge Function `chat-with-ai` dan migrasi tabel percakapan
docs/                       Dokumentasi proyek dan panduan konfigurasi AI Assistant
Upcoming/                   Backend Node.js opsional untuk pengembangan lanjutan
```

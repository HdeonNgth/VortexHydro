# Vortex Hydro

Website proyek kelas pembangkit listrik mikro-hidro berbasis pusaran air (*gravitational water vortex micro-hydro simulator*), Fakultas Vokasi, Universitas Negeri Malang.

## Situs Online

Buka **[Vortex Hydro](https://hdeonngth.github.io/VortexHydro/)** di GitHub Pages.

## Fitur Utama

- **Hero Interaktif 3D & Gelombang Air:** Animasi saluran air U-channel, benturan dua bola yang memicu riak air natural, dan kemunculan tipografi sinematik.
- **Simulasi Interaktif Arus Air & Cara Kerja 6 Langkah:** Pengunjung dapat menggeser debit air (`Q`), tinggi jatuh (`H`), dan efisiensi (`η`), melihat blueprint 8 titik, serta menjelajahi galeri percobaan prototipe dan FAQ.
- **Voxxy AI Assistant + Pet Interaktif:** Asisten AI bertenaga Google Gemini melalui Supabase Edge Function (`backend/ai-chat/chat-with-ai`), lengkap dengan maskot pet interaktif yang dapat disentuh.
- **Dashboard Admin & Laporan Harian 24 Jam:** Pemantauan telemetri simulasi (`VXSim`) & kesiapan integrasi sensor ESP32, monitor percakapan AI, moderasi otomatis 24 jam, dan pembersihan log.
- **4 Pilihan Palet Warna, Mode Terang/Gelap, Dwi-Bahasa (ID/EN), & Pencarian Cepat (`Ctrl+K`).**

## Struktur Folder (2 Kategori Utama: `frontend/` & `backend/`)

```text
ProjectMekfluWeb/
├── index.html                      Entry redirect otomatis ke frontend/ (untuk GitHub Pages)
├── frontend/                       KATEGORI 1 — Seluruh kode tampilan (Client / Browser)
│   ├── index.html                  Halaman utama Vortex Hydro + Dashboard Admin
│   ├── admin/ai-monitor/           Halaman standalone Admin AI Monitor
│   ├── styles/main.css             Sistem desain, palet warna, animasi, Voxxy & Dashboard
│   ├── js/                         Skrip UI (app, hero-liquid, fluid-bg, dashboard, ai-assistant, i18n, lib/)
│   └── media/                      Foto komponen, dokumentasi, software (images/) & profil tim (team/)
│
├── backend/                        KATEGORI 2 — Seluruh kode server, AI, database & IoT
│   ├── ai-chat/                    Edge Functions AI (chat-with-ai & admin-ai-monitor)
│   ├── database/                   SQLite lokal (sqlite.js, seed-admin.js) & migrasi PostgreSQL (migrations/)
│   ├── esp-iot/                    Jalur khusus ESP32 (esp.routes.js, esp.validator.js, contoh firmware .ino)
│   ├── api/                        Server Express utama (server.js, app.js, middleware/, routes/)
│   └── tests/                      Pengujian otomatis backend (api.test.js)
│
└── docs/                           Dokumentasi & Diagram Alur Belajar
    ├── backend-architecture.md     Diagram alur lengkap (Frontend, Backend, AI, Database & ESP32)
    ├── ai-assistant.md             Panduan konfigurasi AI Assistant
    └── README.md                   Ringkasan teknis proyek
```

## Dokumen Belajar & Arsitektur

- **[Diagram Alur Backend, AI, Database & ESP32](docs/backend-architecture.md)**
- **[Panduan Menjalankan Backend & Server Lokal](backend/README.md)**
- **[Panduan Koneksi Hardware ESP32](backend/esp-iot/README.md)**

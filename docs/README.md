# Dokumentasi Vortex Hydro

## Arsitektur 2 Kategori (`frontend/` & `backend/`)

```text
index.html                      Redirect ringan ke frontend/ agar GitHub Pages tetap langsung terbuka
frontend/                       Kode client-side (HTML, CSS, JS, dan media)
  ├── index.html                Aplikasi satu halaman (Beranda, Cara Kerja, Dokumentasi, Tentang Kami, Dashboard)
  ├── admin/ai-monitor/         Halaman standalone Admin AI Monitor
  ├── styles/main.css           Gaya global, 4 palet warna, mode gelap, animasi & komponen
  ├── js/                       Skrip fitur (app, hero-liquid, fluid-bg, dashboard, ai-assistant, i18n, lib/three.min.js)
  └── media/                    Aset foto komponen, dokumentasi, logo (images/) & foto anggota tim (team/)
backend/                        Kode server-side (AI Chat, Database, ESP32 IoT, API Express & Tests)
  ├── ai-chat/                  Supabase Edge Functions (chat-with-ai & admin-ai-monitor)
  ├── database/                 SQLite lokal + migrasi SQL Supabase PostgreSQL (termasuk tabel ESP32)
  ├── esp-iot/                  Endpoint khusus ESP32 (/api/esp/*), validator sensor & contoh sketch Arduino
  ├── api/                      Server Node.js Express, autentikasi sesi & analitik kunjungan
  └── tests/                    Tes otomatis backend (node --test)
docs/                           Dokumentasi belajar & diagram alur arsitektur
```

## Dokumen Terkait
- **[Diagram Alur Backend, AI, Database & ESP32](backend-architecture.md)** — Penjelasan lengkap menggunakan diagram Mermaid untuk belajar alur kerja sistem.
- **[Panduan Backend & Server Lokal](../backend/README.md)** — Cara install, seed admin, jalankan tes, dan deploy backend.
- **[Panduan Jalur ESP32](../backend/esp-iot/README.md)** — Format JSON, header `X-API-Key`, daftar endpoint, dan contoh kode ESP32.
- **[Panduan Konfigurasi AI Assistant](ai-assistant.md)** — Detail konfigurasi Edge Function & rahasia Gemini API.

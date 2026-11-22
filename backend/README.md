# Backend Vortex Hydro (`backend/`)

Folder ini menghimpun seluruh logika sisi server Vortex Hydro yang dipisahkan secara rapi berdasarkan tanggung jawabnya agar mudah dipelajari dan dikembangkan.

## Struktur Folder Backend

```text
backend/
├── ai-chat/                    # Modul AI Chat (Supabase Edge Functions)
│   ├── chat-with-ai/index.ts   # Voxxy AI: sesi anonim HMAC, Gemini API, simpan percakapan
│   └── admin-ai-monitor/       # Monitor Admin: verifikasi JWT, laporan 24 jam, moderasi & cleanup
│
├── database/                   # Modul Database (SQLite Lokal + Supabase PostgreSQL)
│   ├── sqlite.js               # Koneksi & inisialisasi tabel SQLite lokal
│   ├── seed-admin.js           # Pembuat akun admin awal (bcrypt)
│   └── migrations/             # Skema SQL Supabase (001–003 AI Chat, 004 ESP32 Telemetry)
│
├── esp-iot/                    # Modul Jalur Khusus ESP32 / Sensor IoT
│   ├── README.md               # Panduan koneksi ESP32 & contoh JSON
│   ├── esp.validator.js        # Validasi X-API-Key & batas rentang sensor fisika
│   ├── esp.routes.js           # Endpoint /api/esp/ingest, /heartbeat, /devices, /latest, /history, /stream
│   └── firmware-example/       # Contoh kode Arduino/ESP32 siap pakai (.ino)
│
├── api/                        # Server Express Utama & Autentikasi
│   ├── server.js               # Entry point HTTP server Node.js
│   ├── app.js                  # Konfigurasi Express, Helmet, CORS, rate limit & mount semua rute
│   ├── middleware/             # Sesi cookie HttpOnly & guard akses admin
│   └── routes/                 # Rute autentikasi (/api/auth/*) & kunjungan (/api/track, /visits)
│
├── tests/
│   └── api.test.js             # Pengujian otomatis Auth, Kunjungan & seluruh jalur ESP32
├── package.json
└── .env.example
```

> Untuk melihat **diagram alur lengkap** (Frontend ↔ Backend ↔ AI ↔ Database ↔ ESP32), baca [`../docs/backend-architecture.md`](../docs/backend-architecture.md).

---

## Menjalankan Backend Lokal (Node.js + ESP32)

Persyaratan: **Node.js 20+**. Jalankan dari folder `backend/`:

```powershell
cd backend
npm.cmd install
if (-not (Test-Path .env)) { Copy-Item .env.example .env }
```

Isi `backend/.env` dengan nilai rahasia milik Anda:
- `ESP_API_KEY` (atau `API_KEY`): kunci acak minimal 32 karakter (dipakai juga di sketch ESP32).
- `ADMIN_USERNAME` & `ADMIN_PASSWORD` (minimal 12 karakter).
- `CORS_ORIGINS`: origin frontend yang diizinkan.

Lalu buat akun admin, jalankan tes otomatis, dan nyalakan server:

```powershell
npm.cmd run seed:admin
npm.cmd test
npm.cmd start
```

Server akan melayani:
- **Frontend Website:** `http://127.0.0.1:3000/`
- **Jalur ESP32 Ingest:** `POST http://127.0.0.1:3000/api/esp/ingest`
- **Jalur ESP32 Heartbeat:** `POST http://127.0.0.1:3000/api/esp/heartbeat`
- **Live Stream Dashboard Admin:** `GET http://127.0.0.1:3000/api/esp/stream`

---

## Modul AI Chat di Supabase (`backend/ai-chat/`)

Kedua fungsi di `backend/ai-chat/` berjalan sebagai **Supabase Edge Functions** (Deno/TypeScript):
- `chat-with-ai` — menangani percakapan **Voxxy AI** dengan token sesi anonim HMAC dan memanggil Google Gemini API di sisi server.
- `admin-ai-monitor` — memverifikasi JWT Administrator Supabase, menyediakan statistik, daftar percakapan, pemindaian keamanan **Laporan Harian 24 Jam**, dan pembersihan log.

Skema tabel cloud-nya tersimpan rapi di `backend/database/migrations/001` sampai `004`.

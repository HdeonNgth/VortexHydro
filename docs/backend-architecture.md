# Arsitektur & Diagram Alur Backend Vortex Hydro

Dokumen ini disusun khusus agar mudah dibaca dan dipelajari: bagaimana **Frontend**, **Backend**, **AI Chat (Voxxy)**, **Database**, dan **Perangkat ESP32** saling berkomunikasi dari ujung ke ujung.

---

## 1. Gambaran Besar Sistem (Frontend vs Backend)

Seluruh proyek dibagi menjadi **2 kategori besar**:
- **`frontend/`** — Yang berjalan di browser pengguna (HTML, CSS, JS, animasi 3D/cairan, gambar, & UI Dashboard).
- **`backend/`** — Yang berjalan di server/cloud untuk keamanan, kecerdasan AI, penyimpanan database, dan penerimaan data sensor ESP32.

```mermaid
flowchart LR
    subgraph FE["FRONTEND (Browser Pengguna)"]
        UI["Website Utama<br/>frontend/index.html"]
        VOXXY_UI["Widget Voxxy AI<br/>js/ai-assistant.js"]
        ADM_UI["Dashboard & Monitor Admin<br/>js/dashboard.js"]
    end

    subgraph BE["BACKEND (backend/)"]
        subgraph AI_MOD["1. backend/ai-chat/ (Supabase Edge Functions)"]
            CHAT_FN["chat-with-ai/index.ts<br/>Chat Voxxy & Sesi Anonim"]
            MON_FN["admin-ai-monitor/index.ts<br/>Laporan 24 Jam & Moderasi"]
        end

        subgraph API_MOD["2. backend/api/ & esp-iot/ (Node.js Express)"]
            AUTH_API["api/routes/auth.js<br/>Login & Cookie Sesi"]
            ESP_API["esp-iot/esp.routes.js<br/>Jalur Khusus ESP32 + SSE"]
        end

        subgraph DB_MOD["3. backend/database/"]
            PG[("Supabase PostgreSQL<br/>(Cloud: AI, Audit, ESP32)")]
            SQLITE[("SQLite Lokal<br/>(database/data/vortex.sqlite)")]
        end
    end

    GEMINI["Google Gemini API<br/>(Model AI)"]
    ESP["Hardware ESP32<br/>(Sensor Debit, RPM, Volt, Amp, Suhu)"]

    VOXXY_UI -- "HTTPS + X-Session-Token" --> CHAT_FN
    ADM_UI -- "HTTPS + Supabase JWT" --> MON_FN
    ADM_UI -- "Cookie HttpOnly + SSE" --> AUTH_API
    ADM_UI -- "Live Stream GET /api/esp/stream" --> ESP_API

    CHAT_FN -- "API Key Rahasia (Server-Side)" --> GEMINI
    CHAT_FN <--> PG
    MON_FN <--> PG

    ESP -- "POST /api/esp/ingest & /heartbeat<br/>(Header: X-API-Key)" --> ESP_API
    ESP_API <--> SQLITE
    AUTH_API <--> SQLITE
    ESP_API -. "Opsional Cloud Sync<br/>(Migration 004)" .-> PG
```

---

## 2. Alur AI Chat (Voxxy) — Dari Pesan Masuk hingga Jawaban AI

> **Prinsip Keamanan:** `GEMINI_API_KEY` **tidak pernah** ditaruh di folder `frontend/`. Frontend hanya mengirim pesan ke `backend/ai-chat/chat-with-ai/index.ts`, lalu backend-lah yang berbicara ke Google Gemini dan menyimpan percakapan ke PostgreSQL.

```mermaid
sequenceDiagram
    actor User as Pengunjung
    participant FE as frontend/js/ai-assistant.js
    participant FN as backend/ai-chat/chat-with-ai
    participant DB as Supabase PostgreSQL
    participant AI as Google Gemini API

    Note over User,FE: Setiap refresh browser, sesi chat baru dibuat agar tidak menumpuk
    User->>FE: Ketik pertanyaan ke Voxxy
    FE->>FN: POST action="init_session"
    FN->>DB: Buat record di tabel anonymous_sessions (hash SHA-256)
    FN-->>FE: Kembalikan token HMAC (vxs1.id.secret.sig)

    FE->>FN: POST action="send" (message + X-Session-Token)
    FN->>FN: Verifikasi tanda tangan HMAC & Rate Limit (maks 20/menit)
    FN->>DB: Ambil 10 pesan terakhir dari tabel ai_messages
    FN->>DB: Simpan pesan pengguna (role = "user")
    FN->>AI: Kirim System Prompt Voxxy + Konteks Halaman + Riwayat + Pesan
    AI-->>FN: Kembalikan jawaban teks Voxxy
    FN->>DB: Simpan jawaban AI (role = "assistant")
    FN-->>FE: JSON { reply, conversationId }
    FE-->>User: Tampilkan balasan Voxxy & animasi ekspresi pet
```

---

## 3. Alur Dashboard Admin, Moderasi & Laporan Harian 24 Jam

```mermaid
sequenceDiagram
    actor Admin as Administrator
    participant Dash as frontend/js/dashboard.js
    participant Auth as Supabase Auth
    participant Mon as backend/ai-chat/admin-ai-monitor
    participant DB as Supabase PostgreSQL

    Admin->>Dash: Masuk menggunakan Email & Kata Sandi Admin
    Dash->>Auth: Login & minta Access Token (JWT)
    Auth-->>Dash: JWT valid
    Dash->>Mon: POST action="daily_report" (Authorization: Bearer JWT)
    Mon->>Auth: Verifikasi JWT di sisi server
    Mon->>DB: Cek tabel user_roles (harus role = "admin")
    Mon->>DB: Tarik pesan ai_messages dalam 24 jam terakhir
    Mon->>Mon: Pindai keamanan (Bahasa Tidak Pantas, Prompt Injection, Spam)
    Mon->>DB: Catat aktivitas admin ke admin_audit_logs
    Mon-->>Dash: Ringkasan 24 jam + daftar pesan terdeteksi + statistik
    Dash-->>Admin: Tampilkan di tab Laporan Harian & fitur Pembersihan Log
```

---

## 4. Alur Jalur Khusus ESP32 (Hardware IoT → Backend → Dashboard)

Jalur ini disiapkan di `backend/esp-iot/` agar papan **ESP32** di prototipe Vortex Hydro bisa langsung mengirim pembacaan sensor (debit air, head, RPM, tegangan, arus, daya, efisiensi, dan suhu) ke server secara real-time.

```mermaid
flowchart TD
    ESP["ESP32 di Prototipe<br/>(vortex_esp32_sender.ino)"]
    BEAT["POST /api/esp/heartbeat<br/>Header: X-API-Key<br/>(IP, RSSI, Uptime, Firmware)"]
    INGEST["POST /api/esp/ingest<br/>Header: X-API-Key<br/>(debit, head, rpm, volt, amp, daya, eff, temp)"]

    VAL["backend/esp-iot/esp.validator.js<br/>1. Cek X-API-Key (timingSafeEqual)<br/>2. Cek rentang nilai fisika sensor"]
    REJECT["Tolak 401 / 400<br/>Data tidak valid tidak masuk DB"]

    UPSERT["Update tabel esp_devices<br/>(last_seen_at, status online)"]
    INSERT["Simpan ke tabel readings<br/>(SQLite / PostgreSQL)"]
    SSE["Broadcast Server-Sent Events<br/>GET /api/esp/stream (khusus Admin)"]
    DASH["Dashboard Admin<br/>Grafik & Angka Bergerak Real-Time"]

    ESP -- "Setiap 15 detik" --> BEAT --> VAL
    ESP -- "Setiap 2 detik" --> INGEST --> VAL

    VAL -- "Tidak Valid" --> REJECT
    VAL -- "Valid" --> UPSERT
    UPSERT --> INSERT --> SSE --> DASH
```

---

## 5. Peta Tabel Database (`backend/database/`)

```mermaid
erDiagram
    anonymous_sessions ||--o{ ai_conversations : "memiliki"
    ai_conversations ||--o{ ai_messages : "berisi"
    users ||--o{ sessions : "login"
    esp_devices ||--o{ readings : "mengirim"

    anonymous_sessions {
        uuid id PK
        text token_hash
        timestamptz created_at
        timestamptz last_seen_at
    }
    ai_conversations {
        uuid id PK
        uuid session_id FK
        text title
        timestamptz updated_at
    }
    ai_messages {
        uuid id PK
        uuid conversation_id FK
        text role
        text content
        timestamptz created_at
    }
    esp_devices {
        text device_id PK
        text label
        text firmware_version
        text ip_address
        int rssi
        int last_seen_at
    }
    readings {
        int id PK
        text device_id FK
        int ts
        float debit
        float head
        float rpm
        float volt
        float amp
        float daya
        float eff
        float temp
    }
    users {
        int id PK
        text username UK
        text password_hash
        text role
    }
    sessions {
        text session_hash PK
        int user_id FK
        text role
        int expires_at
    }
```

---

## 6. Panduan Belajar Cepat (Mulai dari Mana?)

1. **Belajar Frontend UI:** Buka `frontend/index.html`, `frontend/styles/main.css`, dan `frontend/js/app.js`.
2. **Belajar Integrasi AI (Voxxy):** Bandingkan `frontend/js/ai-assistant.js` (pengirim) dengan `backend/ai-chat/chat-with-ai/index.ts` (penerima & pemanggil Gemini).
3. **Belajar Database:** Baca `backend/database/sqlite.js` untuk SQLite lokal dan `backend/database/migrations/` untuk PostgreSQL di Supabase.
4. **Belajar Jalur ESP32 IoT:** Baca `backend/esp-iot/README.md`, `backend/esp-iot/esp.routes.js`, dan `backend/esp-iot/firmware-example/vortex_esp32_sender.ino`.
5. **Belajar Menguji Backend Otomatis:** Jalankan `cd backend && npm test` untuk melihat bagaimana seluruh API (Auth, Kunjungan, dan ESP32) diuji otomatis.

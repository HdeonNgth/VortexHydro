# Jalur ESP32 / IoT Telemetry (`backend/esp-iot/`)

Folder ini disiapkan khusus agar tim **Electrical** dan **Software** bisa menghubungkan satu atau banyak perangkat **ESP32** ke website Vortex Hydro secara aman dan terstruktur.

## Isi Folder
- `esp.validator.js` — Memeriksa API key (tahan *timing attack*) dan memvalidasi rentang nilai sensor agar data rusak/ngaco tidak masuk ke database.
- `esp.routes.js` — Daftar endpoint khusus ESP32 & streaming real-time (SSE) ke Dashboard Admin.
- `firmware-example/vortex_esp32_sender.ino` — Contoh program Arduino/ESP32 siap pakai.

## Daftar Endpoint Jalur ESP32

| Method | Endpoint | Akses | Fungsi |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/esp/heartbeat` | `X-API-Key` | Lapor status perangkat ESP32 online, IP lokal, sinyal WiFi (`rssi`), & versi firmware. |
| `POST` | `/api/esp/ingest` | `X-API-Key` | Kirim data sensor (debit, head, rpm, volt, amp, daya, eff, temp). Otomatis simpan ke DB & siarkan real-time ke Dashboard. |
| `GET` | `/api/esp/devices` | Cookie Admin | Lihat daftar seluruh node ESP32 dan status `online: true/false` (timeout 60 detik). |
| `GET` | `/api/esp/latest` | Cookie Admin | Ambil data sensor terakhir (bisa filter `?deviceId=esp32-turbin-01`). |
| `GET` | `/api/esp/history` | Cookie Admin | Ambil grafik riwayat (`?interval=raw\|1m\|5m\|15m\|1h\|1d&deviceId=...`). |
| `GET` | `/api/esp/stream` | Cookie Admin | Jalur **Server-Sent Events (SSE)** agar grafik di Dashboard bergerak live tanpa refresh. |

> **Catatan Kompatibilitas:** Endpoint lama `/api/ingest`, `/api/latest`, `/api/history`, dan `/api/stream/sensor` tetap aktif sebagai alias otomatis.

## Contoh Format JSON yang Dikirim ESP32

```json
{
  "deviceId": "esp32-turbin-01",
  "debit": 48.5,
  "head": 1.2,
  "rpm": 156.0,
  "volt": 12.4,
  "amp": 0.85,
  "daya": 10.54,
  "eff": 28.4,
  "temp": 27.2,
  "rssi": -58
}
```

## Uji Coba Cepat dari Terminal (Simulasi ESP32)

```powershell
curl.exe -X POST http://127.0.0.1:3000/api/esp/ingest `
  -H "Content-Type: application/json" `
  -H "X-API-Key: ISI_API_KEY_DARI_ENV" `
  -d "{\"deviceId\":\"esp32-turbin-01\",\"debit\":48.5,\"head\":1.2,\"rpm\":156,\"volt\":12.4,\"amp\":0.85,\"daya\":10.54,\"eff\":28.4,\"temp\":27.2,\"rssi\":-58}"
```

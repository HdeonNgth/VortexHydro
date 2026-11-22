/*
 * Vortex Hydro — Contoh Firmware Pengirim Telemetri ESP32
 * -------------------------------------------------------
 * Jalur API:
 *   - POST /api/esp/heartbeat  (lapor status online & kekuatan sinyal WiFi)
 *   - POST /api/esp/ingest     (kirim data sensor ke backend -> database -> Dashboard Admin)
 *
 * Keamanan:
 *   - Wajib sertakan header `X-API-Key` yang sama dengan `API_KEY` di `backend/.env`
 */

#include <WiFi.h>
#include <HTTPClient.h>

// 1. Konfigurasi WiFi & Server Backend
const char* WIFI_SSID   = "NAMA_WIFI_LAB";
const char* WIFI_PASS   = "PASSWORD_WIFI_LAB";
const char* SERVER_BASE = "http://192.168.1.100:3000"; // Ganti ke IP/Domain backend Anda
const char* ESP_API_KEY = "ganti-dengan-api-key-minimal-32-karakter";

// 2. Identitas Perangkat ESP32
const char* DEVICE_ID   = "esp32-turbin-01";
const char* DEVICE_LBL  = "Node Sensor Utama Turbin Vortex";
const char* FW_VERSION  = "1.0.0";

unsigned long lastSendMs = 0;
unsigned long lastBeatMs = 0;
const unsigned long SEND_INTERVAL_MS = 2000;   // Kirim data sensor setiap 2 detik
const unsigned long BEAT_INTERVAL_MS = 15000;  // Kirim heartbeat setiap 15 detik

void sendPostJson(const String& path, const String& payload) {
  if (WiFi.status() != WL_CONNECTED) return;

  HTTPClient http;
  http.begin(String(SERVER_BASE) + path);
  http.addHeader("Content-Type", "application/json");
  http.addHeader("X-API-Key", ESP_API_KEY);

  int code = http.POST(payload);
  Serial.printf("[ESP32] POST %s -> HTTP %d\n", path.c_str(), code);
  http.end();
}

void sendHeartbeat() {
  String json = "{";
  json += "\"deviceId\":\"" + String(DEVICE_ID) + "\",";
  json += "\"label\":\"" + String(DEVICE_LBL) + "\",";
  json += "\"firmware\":\"" + String(FW_VERSION) + "\",";
  json += "\"ip\":\"" + WiFi.localIP().toString() + "\",";
  json += "\"rssi\":" + String(WiFi.RSSI()) + ",";
  json += "\"uptimeSec\":" + String(millis() / 1000);
  json += "}";
  sendPostJson("/api/esp/heartbeat", json);
}

void sendSensorReading() {
  // Ganti variabel berikut dengan hasil bacaan sensor asli (YF-S201, INA219, Hall RPM, DS18B20)
  float debit = 48.5;   // L/menit
  float head  = 1.20;   // meter
  float rpm   = 156.0;  // RPM poros turbin
  float volt  = 12.40;  // Volt DC
  float amp   = 0.85;   // Ampere DC
  float daya  = volt * amp;
  float eff   = 28.4;   // %
  float temp  = 27.2;   // °C

  String json = "{";
  json += "\"deviceId\":\"" + String(DEVICE_ID) + "\",";
  json += "\"debit\":" + String(debit, 2) + ",";
  json += "\"head\":" + String(head, 2) + ",";
  json += "\"rpm\":" + String(rpm, 1) + ",";
  json += "\"volt\":" + String(volt, 2) + ",";
  json += "\"amp\":" + String(amp, 2) + ",";
  json += "\"daya\":" + String(daya, 2) + ",";
  json += "\"eff\":" + String(eff, 1) + ",";
  json += "\"temp\":" + String(temp, 1) + ",";
  json += "\"rssi\":" + String(WiFi.RSSI());
  json += "}";

  sendPostJson("/api/esp/ingest", json);
}

void setup() {
  Serial.begin(115200);
  WiFi.begin(WIFI_SSID, WIFI_PASS);
  Serial.print("Menghubungkan ke WiFi");
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\nWiFi terhubung! IP: " + WiFi.localIP().toString());
  sendHeartbeat();
}

void loop() {
  unsigned long now = millis();
  if (now - lastBeatMs >= BEAT_INTERVAL_MS) {
    lastBeatMs = now;
    sendHeartbeat();
  }
  if (now - lastSendMs >= SEND_INTERVAL_MS) {
    lastSendMs = now;
    sendSensorReading();
  }
}

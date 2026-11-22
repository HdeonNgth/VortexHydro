const fs = require('node:fs');
const path = require('node:path');

function createSqliteConnection(filename) {
  // Prioritaskan modul bawaan Node.js (node:sqlite) agar tidak perlu kompilasi C++/node-gyp
  try {
    const { DatabaseSync } = require('node:sqlite');
    return new DatabaseSync(filename);
  } catch {
    const Database = require('better-sqlite3');
    return new Database(filename);
  }
}

function openDatabase(filename = process.env.DB_PATH || path.join(__dirname, 'data', 'vortex.sqlite')) {
  if (filename !== ':memory:') {
    fs.mkdirSync(path.dirname(path.resolve(filename)), { recursive: true });
  }
  const db = createSqliteConnection(filename);
  db.exec(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;
    PRAGMA busy_timeout = 5000;

    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY,
      username TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL CHECK (role = 'admin')
    );

    CREATE TABLE IF NOT EXISTS sessions (
      session_hash TEXT PRIMARY KEY,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      guest_name TEXT,
      role TEXT NOT NULL CHECK (role IN ('guest', 'admin')),
      created_at INTEGER NOT NULL,
      expires_at INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS sessions_expiry_idx ON sessions(expires_at);

    CREATE TABLE IF NOT EXISTS visits (
      id INTEGER PRIMARY KEY,
      ts INTEGER NOT NULL,
      visitor_name TEXT NOT NULL,
      role TEXT NOT NULL CHECK (role IN ('guest', 'admin')),
      page TEXT NOT NULL,
      device TEXT NOT NULL,
      session_id TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS visits_ts_idx ON visits(ts DESC);

    -- Daftar perangkat ESP32 / node sensor yang terdaftar
    CREATE TABLE IF NOT EXISTS esp_devices (
      device_id TEXT PRIMARY KEY,
      label TEXT NOT NULL DEFAULT 'ESP32 Vortex Node',
      firmware_version TEXT NOT NULL DEFAULT '1.0.0',
      ip_address TEXT,
      rssi INTEGER,
      uptime_sec INTEGER,
      last_seen_at INTEGER NOT NULL,
      created_at INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS esp_devices_seen_idx ON esp_devices(last_seen_at DESC);

    -- Data telemetri sensor dari ESP32
    CREATE TABLE IF NOT EXISTS readings (
      id INTEGER PRIMARY KEY,
      ts INTEGER NOT NULL,
      device_id TEXT NOT NULL DEFAULT 'esp32-main',
      debit REAL NOT NULL,
      head REAL NOT NULL,
      rpm REAL NOT NULL,
      volt REAL NOT NULL,
      amp REAL NOT NULL,
      daya REAL NOT NULL,
      eff REAL NOT NULL,
      temp REAL NOT NULL,
      rssi INTEGER
    );
    CREATE INDEX IF NOT EXISTS readings_ts_idx ON readings(ts DESC);
    CREATE INDEX IF NOT EXISTS readings_device_ts_idx ON readings(device_id, ts DESC);
  `);

  // Migrasi aman untuk database SQLite lama yang belum memiliki kolom device_id / rssi
  const cols = new Set(db.prepare('PRAGMA table_info(readings)').all().map(c => c.name));
  if (!cols.has('device_id')) {
    db.exec("ALTER TABLE readings ADD COLUMN device_id TEXT NOT NULL DEFAULT 'esp32-main'");
  }
  if (!cols.has('rssi')) {
    db.exec('ALTER TABLE readings ADD COLUMN rssi INTEGER');
  }

  return db;
}

module.exports = { openDatabase };

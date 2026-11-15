const fs = require('node:fs');
const path = require('node:path');
const Database = require('better-sqlite3');

function openDatabase(filename = process.env.DB_PATH || path.join(__dirname, 'data', 'vortex.sqlite')) {
  if (filename !== ':memory:') fs.mkdirSync(path.dirname(path.resolve(filename)), { recursive: true });
  const db = new Database(filename);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
  db.pragma('busy_timeout = 5000');
  db.exec(`
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
    CREATE TABLE IF NOT EXISTS readings (
      id INTEGER PRIMARY KEY,
      ts INTEGER NOT NULL,
      debit REAL NOT NULL,
      head REAL NOT NULL,
      rpm REAL NOT NULL,
      volt REAL NOT NULL,
      amp REAL NOT NULL,
      daya REAL NOT NULL,
      eff REAL NOT NULL,
      temp REAL NOT NULL
    );
    CREATE INDEX IF NOT EXISTS readings_ts_idx ON readings(ts DESC);
  `);
  return db;
}

module.exports = { openDatabase };

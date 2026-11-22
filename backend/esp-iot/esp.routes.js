const express = require('express');
const { requireAdmin } = require('../api/middleware/access');
const { openEventStream } = require('../api/routes/visits');
const { equalApiKey, sanitizeDeviceId, validReading, parseHeartbeat } = require('./esp.validator');

const HISTORY_INTERVALS = {
  raw: 0,
  '1m': 60000,
  '5m': 300000,
  '15m': 900000,
  '1h': 3600000,
  '1d': 86400000
};
const DEVICE_ONLINE_TTL_MS = 60 * 1000;

function upsertDevice(db, info, ts) {
  db.prepare(`
    INSERT INTO esp_devices (device_id, label, firmware_version, ip_address, rssi, uptime_sec, last_seen_at, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(device_id) DO UPDATE SET
      label = COALESCE(excluded.label, esp_devices.label),
      firmware_version = COALESCE(excluded.firmware_version, esp_devices.firmware_version),
      ip_address = COALESCE(excluded.ip_address, esp_devices.ip_address),
      rssi = COALESCE(excluded.rssi, esp_devices.rssi),
      uptime_sec = COALESCE(excluded.uptime_sec, esp_devices.uptime_sec),
      last_seen_at = excluded.last_seen_at
  `).run(
    info.deviceId,
    info.label || info.deviceId,
    info.firmware || '1.0.0',
    info.ip || null,
    info.rssi ?? null,
    info.uptimeSec ?? null,
    ts,
    ts
  );
}

function createEspRouter({ db, apiKey, broadcast }) {
  const router = express.Router();

  function requireEspKey(req, res, next) {
    if (!apiKey) return res.status(503).json({ error: 'Penerimaan sensor ESP32 belum dikonfigurasi.' });
    if (!equalApiKey(req.get('x-api-key'), apiKey)) return res.status(401).json({ error: 'API key ESP32 tidak valid.' });
    next();
  }

  // 1. Terima data telemetri dari ESP32 (POST /api/esp/ingest atau alias /api/ingest)
  function handleIngest(req, res) {
    if (!validReading(req.body)) {
      return res.status(400).json({ error: 'Data sensor tidak lengkap atau berada di luar rentang.' });
    }
    const ts = Date.now();
    const deviceId = sanitizeDeviceId(req.body.deviceId);
    const rssi = Number.isInteger(req.body.rssi) ? req.body.rssi : null;
    const ip = req.ip || null;

    upsertDevice(db, {
      deviceId,
      label: typeof req.body.label === 'string' ? req.body.label.trim().slice(0, 64) : undefined,
      firmware: typeof req.body.firmware === 'string' ? req.body.firmware.trim().slice(0, 32) : undefined,
      ip,
      rssi
    }, ts);

    const values = ['debit', 'head', 'rpm', 'volt', 'amp', 'daya', 'eff', 'temp'].map(key => req.body[key]);
    const result = db.prepare(`
      INSERT INTO readings (ts, device_id, debit, head, rpm, volt, amp, daya, eff, temp, rssi)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(ts, deviceId, ...values, rssi);

    const reading = {
      id: result.lastInsertRowid,
      ts,
      deviceId,
      debit: req.body.debit,
      head: req.body.head,
      rpm: req.body.rpm,
      volt: req.body.volt,
      amp: req.body.amp,
      daya: req.body.daya,
      eff: req.body.eff,
      temp: req.body.temp,
      rssi
    };
    broadcast.emit('sensor', 'reading', reading);
    res.status(201).json({ accepted: true, id: reading.id, deviceId, ts });
  }

  // 2. Heartbeat perangkat ESP32 agar status online tetap terpantau (POST /api/esp/heartbeat)
  function handleHeartbeat(req, res) {
    const parsed = parseHeartbeat(req.body);
    if (!parsed) return res.status(400).json({ error: 'Payload heartbeat ESP32 tidak valid.' });
    const ts = Date.now();
    upsertDevice(db, { ...parsed, ip: parsed.ip || req.ip || null }, ts);
    broadcast.emit('sensor', 'heartbeat', { ...parsed, ts, online: true });
    res.status(200).json({ ok: true, deviceId: parsed.deviceId, ts });
  }

  // 3. Daftar seluruh node ESP32 terdaftar + status online/offline (Admin)
  function handleDevices(req, res) {
    const now = Date.now();
    const rows = db.prepare(`
      SELECT device_id AS deviceId, label, firmware_version AS firmware,
             ip_address AS ip, rssi, uptime_sec AS uptimeSec,
             last_seen_at AS lastSeenAt, created_at AS createdAt
      FROM esp_devices
      ORDER BY last_seen_at DESC
    `).all().map(row => ({
      ...row,
      online: now - row.lastSeenAt <= DEVICE_ONLINE_TTL_MS
    }));
    res.set('Cache-Control', 'no-store');
    res.json({ devices: rows });
  }

  // 4. Pembacaan sensor terakhir (opsional filter ?deviceId=...) (Admin)
  function handleLatest(req, res) {
    const deviceId = req.query.deviceId ? sanitizeDeviceId(String(req.query.deviceId)) : null;
    if (req.query.deviceId && !deviceId) {
      return res.status(400).json({ error: 'Parameter deviceId tidak valid.' });
    }
    const row = deviceId
      ? db.prepare(`
          SELECT id, ts, device_id AS deviceId, debit, head, rpm, volt, amp, daya, eff, temp, rssi
          FROM readings WHERE device_id = ? ORDER BY ts DESC, id DESC LIMIT 1
        `).get(deviceId)
      : db.prepare(`
          SELECT id, ts, device_id AS deviceId, debit, head, rpm, volt, amp, daya, eff, temp, rssi
          FROM readings ORDER BY ts DESC, id DESC LIMIT 1
        `).get();
    res.set('Cache-Control', 'no-store');
    res.json({ online: !!row, reading: row || null });
  }

  // 5. Riwayat telemetri sensor (raw / 1m / 5m / 15m / 1h / 1d) (Admin)
  function handleHistory(req, res) {
    const now = Date.now();
    const from = req.query.from === undefined ? now - 24 * 60 * 60 * 1000 : Date.parse(req.query.from);
    const to = req.query.to === undefined ? now : Date.parse(req.query.to);
    const interval = req.query.interval === undefined ? 'raw' : String(req.query.interval);
    const deviceId = req.query.deviceId ? sanitizeDeviceId(String(req.query.deviceId)) : null;

    if (
      (req.query.deviceId && !deviceId) ||
      !Number.isFinite(from) ||
      !Number.isFinite(to) ||
      from > to ||
      to - from > 90 * 24 * 60 * 60 * 1000 ||
      !Object.prototype.hasOwnProperty.call(HISTORY_INTERVALS, interval)
    ) {
      return res.status(400).json({ error: 'Rentang tanggal, deviceId, atau interval riwayat tidak valid.' });
    }

    const bucketSize = HISTORY_INTERVALS[interval];
    let rows;
    if (!bucketSize) {
      rows = deviceId
        ? db.prepare(`
            SELECT id, ts, device_id AS deviceId, debit, head, rpm, volt, amp, daya, eff, temp, rssi
            FROM readings WHERE device_id = ? AND ts >= ? AND ts <= ? ORDER BY ts ASC LIMIT 5000
          `).all(deviceId, from, to)
        : db.prepare(`
            SELECT id, ts, device_id AS deviceId, debit, head, rpm, volt, amp, daya, eff, temp, rssi
            FROM readings WHERE ts >= ? AND ts <= ? ORDER BY ts ASC LIMIT 5000
          `).all(from, to);
    } else {
      rows = deviceId
        ? db.prepare(`
            SELECT CAST(ts / ? AS INTEGER) * ? AS ts, COUNT(*) AS count,
              AVG(debit) AS debit, AVG(head) AS head, AVG(rpm) AS rpm, AVG(volt) AS volt,
              AVG(amp) AS amp, AVG(daya) AS daya, AVG(eff) AS eff, AVG(temp) AS temp
            FROM readings WHERE device_id = ? AND ts >= ? AND ts <= ?
            GROUP BY CAST(ts / ? AS INTEGER) ORDER BY ts ASC LIMIT 5000
          `).all(bucketSize, bucketSize, deviceId, from, to, bucketSize)
        : db.prepare(`
            SELECT CAST(ts / ? AS INTEGER) * ? AS ts, COUNT(*) AS count,
              AVG(debit) AS debit, AVG(head) AS head, AVG(rpm) AS rpm, AVG(volt) AS volt,
              AVG(amp) AS amp, AVG(daya) AS daya, AVG(eff) AS eff, AVG(temp) AS temp
            FROM readings WHERE ts >= ? AND ts <= ?
            GROUP BY CAST(ts / ? AS INTEGER) ORDER BY ts ASC LIMIT 5000
          `).all(bucketSize, bucketSize, from, to, bucketSize);
    }

    res.set('Cache-Control', 'no-store');
    res.json({ interval, deviceId: deviceId || 'all', readings: rows });
  }

  // 6. Live stream SSE untuk Dashboard Admin (GET /api/esp/stream)
  function handleStream(req, res) {
    openEventStream(req, res, 'sensor', broadcast, db);
  }

  // Route utama khusus ESP32 (di-mount di /api/esp)
  router.post('/ingest', requireEspKey, handleIngest);
  router.post('/heartbeat', requireEspKey, handleHeartbeat);
  router.get('/devices', requireAdmin, handleDevices);
  router.get('/latest', requireAdmin, handleLatest);
  router.get('/history', requireAdmin, handleHistory);
  router.get('/stream', requireAdmin, handleStream);

  return {
    router,
    handlers: {
      requireEspKey,
      handleIngest,
      handleLatest,
      handleHistory,
      handleStream
    }
  };
}

module.exports = { createEspRouter };

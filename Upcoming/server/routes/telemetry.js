const express = require('express');
const { timingSafeEqual } = require('node:crypto');
const { requireAdmin, requireAuth } = require('../middleware/access');

const PAGES = new Set(['beranda', 'tentang', 'teknologi', 'dokumentasi', 'struktur-tim', 'faq', 'dashboard']);
const SENSOR_RANGES = {
  debit: [0, 1000],
  head: [0, 100],
  rpm: [0, 10000],
  volt: [0, 1000],
  amp: [0, 1000],
  daya: [0, 1000000],
  eff: [0, 100],
  temp: [-20, 150]
};
const HISTORY_INTERVALS = { raw: 0, '1m': 60000, '5m': 300000, '15m': 900000, '1h': 3600000, '1d': 86400000 };

function deviceType(userAgent) {
  if (/\bipad|tablet\b/i.test(userAgent)) return 'tablet';
  if (/\bmobile|android|iphone|ipod\b/i.test(userAgent)) return 'mobile';
  return userAgent ? 'desktop' : 'unknown';
}

function validReading(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return false;
  return Object.entries(SENSOR_RANGES).every(([key, range]) =>
    typeof body[key] === 'number' && Number.isFinite(body[key]) && body[key] >= range[0] && body[key] <= range[1]
  );
}

function equalApiKey(provided, expected) {
  if (typeof provided !== 'string' || typeof expected !== 'string') return false;
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

function createTelemetryRouter({ db, apiKey, broadcast }) {
  const router = express.Router();

  router.post('/track', requireAuth, (req, res) => {
    const page = typeof req.body?.page === 'string' ? req.body.page : '';
    if (!PAGES.has(page)) return res.status(400).json({ error: 'Halaman kunjungan tidak valid.' });
    const ts = Date.now();
    const visit = {
      id: db.prepare(`
        INSERT INTO visits (ts, visitor_name, role, page, device, session_id)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(ts, req.auth.displayName, req.auth.role, page, deviceType(req.get('user-agent') || ''), req.auth.sessionId).lastInsertRowid,
      ts,
      visitorName: req.auth.displayName,
      role: req.auth.role,
      page,
      device: deviceType(req.get('user-agent') || '')
    };
    broadcast.emit('visits', 'visit', visit);
    res.status(201).json({ recorded: true });
  });

  router.get('/visits', requireAdmin, (req, res) => {
    const limit = req.query.limit === undefined ? 50 : Number(req.query.limit);
    if (!Number.isInteger(limit) || limit < 1 || limit > 200) return res.status(400).json({ error: 'Limit harus bilangan 1–200.' });
    const rows = db.prepare(`
      SELECT id, ts, visitor_name AS visitorName, role, page, device
      FROM visits ORDER BY ts DESC, id DESC LIMIT ?
    `).all(limit);
    res.set('Cache-Control', 'no-store');
    res.json({ visits: rows });
  });

  router.get('/stream/visits', requireAdmin, (req, res) => {
    openEventStream(req, res, 'visits', broadcast, db);
  });

  router.post('/ingest', (req, res) => {
    if (!apiKey) return res.status(503).json({ error: 'Penerimaan sensor belum dikonfigurasi.' });
    if (!equalApiKey(req.get('x-api-key'), apiKey)) return res.status(401).json({ error: 'API key tidak valid.' });
    if (!validReading(req.body)) return res.status(400).json({ error: 'Data sensor tidak lengkap atau berada di luar rentang.' });
    const ts = Date.now();
    const values = ['debit', 'head', 'rpm', 'volt', 'amp', 'daya', 'eff', 'temp'].map(key => req.body[key]);
    const result = db.prepare(`
      INSERT INTO readings (ts, debit, head, rpm, volt, amp, daya, eff, temp)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(ts, ...values);
    const reading = { id: result.lastInsertRowid, ts, ...req.body };
    broadcast.emit('sensor', 'reading', reading);
    res.status(201).json({ accepted: true, id: reading.id, ts });
  });

  router.get('/latest', requireAdmin, (req, res) => {
    const row = db.prepare(`
      SELECT id, ts, debit, head, rpm, volt, amp, daya, eff, temp
      FROM readings ORDER BY ts DESC, id DESC LIMIT 1
    `).get();
    res.set('Cache-Control', 'no-store');
    res.json({ online: !!row, reading: row || null });
  });

  router.get('/stream/sensor', requireAdmin, (req, res) => {
    openEventStream(req, res, 'sensor', broadcast, db);
  });

  router.get('/history', requireAdmin, (req, res) => {
    const now = Date.now();
    const from = req.query.from === undefined ? now - 24 * 60 * 60 * 1000 : Date.parse(req.query.from);
    const to = req.query.to === undefined ? now : Date.parse(req.query.to);
    const interval = req.query.interval === undefined ? 'raw' : String(req.query.interval);
    if (!Number.isFinite(from) || !Number.isFinite(to) || from > to || to - from > 90 * 24 * 60 * 60 * 1000 || !Object.prototype.hasOwnProperty.call(HISTORY_INTERVALS, interval)) {
      return res.status(400).json({ error: 'Rentang tanggal atau interval riwayat tidak valid.' });
    }
    const bucketSize = HISTORY_INTERVALS[interval];
    let rows;
    if (!bucketSize) {
      rows = db.prepare(`
        SELECT id, ts, debit, head, rpm, volt, amp, daya, eff, temp
        FROM readings WHERE ts >= ? AND ts <= ? ORDER BY ts ASC LIMIT 5000
      `).all(from, to);
    } else {
      rows = db.prepare(`
        SELECT CAST(ts / ? AS INTEGER) * ? AS ts, COUNT(*) AS count,
          AVG(debit) AS debit, AVG(head) AS head, AVG(rpm) AS rpm, AVG(volt) AS volt,
          AVG(amp) AS amp, AVG(daya) AS daya, AVG(eff) AS eff, AVG(temp) AS temp
        FROM readings WHERE ts >= ? AND ts <= ? GROUP BY CAST(ts / ? AS INTEGER)
        ORDER BY ts ASC LIMIT 5000
      `).all(bucketSize, bucketSize, from, to, bucketSize);
    }
    res.set('Cache-Control', 'no-store');
    res.json({ interval, readings: rows });
  });

  return router;
}

function openEventStream(req, res, channel, broadcast, db) {
  res.status(200).set({
    'Content-Type': 'text/event-stream; charset=utf-8',
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no'
  });
  res.flushHeaders();
  res.write('event: ready\ndata: {}\n\n');
  const clients = broadcast.clients.get(channel);
  clients.add(res);
  const heartbeat = setInterval(() => {
    const session = db.prepare('SELECT 1 FROM sessions WHERE session_hash = ? AND expires_at > ?').get(req.auth.sessionId, Date.now());
    if (!session) {
      res.write('event: auth-expired\ndata: {}\n\n');
      res.end();
      clearInterval(heartbeat);
      clients.delete(res);
      return;
    }
    res.write(': keep-alive\n\n');
  }, 20000);
  req.on('close', () => {
    clearInterval(heartbeat);
    clients.delete(res);
  });
}

module.exports = { createTelemetryRouter, deviceType, validReading };

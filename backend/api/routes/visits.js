const express = require('express');
const { requireAdmin, requireAuth } = require('../middleware/access');

const PAGES = new Set(['beranda', 'tentang', 'teknologi', 'dokumentasi', 'struktur-tim', 'faq', 'dashboard']);

function deviceType(userAgent) {
  if (/\bipad|tablet\b/i.test(userAgent)) return 'tablet';
  if (/\bmobile|android|iphone|ipod\b/i.test(userAgent)) return 'mobile';
  return userAgent ? 'desktop' : 'unknown';
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

function createVisitsRouter({ db, broadcast }) {
  const router = express.Router();

  router.post('/track', requireAuth, (req, res) => {
    const page = typeof req.body?.page === 'string' ? req.body.page : '';
    if (!PAGES.has(page)) return res.status(400).json({ error: 'Halaman kunjungan tidak valid.' });
    const ts = Date.now();
    const device = deviceType(req.get('user-agent') || '');
    const visit = {
      id: db.prepare(`
        INSERT INTO visits (ts, visitor_name, role, page, device, session_id)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(ts, req.auth.displayName, req.auth.role, page, device, req.auth.sessionId).lastInsertRowid,
      ts,
      visitorName: req.auth.displayName,
      role: req.auth.role,
      page,
      device
    };
    broadcast.emit('visits', 'visit', visit);
    res.status(201).json({ recorded: true });
  });

  router.get('/visits', requireAdmin, (req, res) => {
    const limit = req.query.limit === undefined ? 50 : Number(req.query.limit);
    if (!Number.isInteger(limit) || limit < 1 || limit > 200) {
      return res.status(400).json({ error: 'Limit harus bilangan 1–200.' });
    }
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

  return router;
}

module.exports = { createVisitsRouter, deviceType, openEventStream };

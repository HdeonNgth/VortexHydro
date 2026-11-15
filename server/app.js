const path = require('node:path');
const express = require('express');
const rateLimit = require('express-rate-limit').rateLimit;
const helmet = require('helmet');
const { openDatabase } = require('./db');
const { createSessionMiddleware } = require('./middleware/session');
const { createAuthRouter } = require('./routes/auth');
const { createTelemetryRouter } = require('./routes/telemetry');

function createApp(options = {}) {
  const root = options.publicRoot || path.join(__dirname, '..');
  const db = options.db || openDatabase(options.dbPath);
  const secureCookies = options.secureCookies === true;
  const apiKey = options.apiKey === undefined ? process.env.API_KEY : options.apiKey;
  const allowedOrigins = new Set(options.allowedOrigins || (process.env.CORS_ORIGINS || 'http://localhost:3000,http://127.0.0.1:3000').split(',').map(value => value.trim()).filter(Boolean));
  const app = express();
  const clients = new Map([['visits', new Set()], ['sensor', new Set()]]);
  const broadcast = {
    clients,
    emit(channel, event, data) {
      const message = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
      for (const response of clients.get(channel)) {
        if (!response.destroyed) response.write(message);
      }
    }
  };

  app.disable('x-powered-by');
  if (process.env.TRUST_PROXY) app.set('trust proxy', process.env.TRUST_PROXY === 'true' ? 1 : process.env.TRUST_PROXY);
  app.use(helmet({ contentSecurityPolicy: false, crossOriginEmbedderPolicy: false }));
  app.use((req, res, next) => {
    const origin = req.get('origin');
    if (!origin) return next();
    if (origin === `${req.protocol}://${req.get('host')}`) return next();
    if (!allowedOrigins.has(origin)) return res.status(403).json({ error: 'Origin tidak diizinkan.' });
    res.set('Access-Control-Allow-Origin', origin);
    res.set('Vary', 'Origin');
    res.set('Access-Control-Allow-Credentials', 'true');
    res.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.set('Access-Control-Allow-Headers', 'Content-Type, X-API-Key');
    if (req.method === 'OPTIONS') return res.status(204).end();
    next();
  });
  app.use(express.json({ limit: '16kb', strict: true }));
  app.use((req, res, next) => {
    req.cookies = parseCookies(req.get('cookie') || '');
    next();
  });
  app.use('/api', createSessionMiddleware(db, { secureCookies }));

  const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 10,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    message: { error: 'Terlalu banyak percobaan masuk. Coba lagi dalam 15 menit.' }
  });
  app.use('/api/auth', createAuthRouter({ db, secureCookies, loginLimiter }));
  app.use('/api', createTelemetryRouter({ db, apiKey, broadcast }));

  app.get('/', (req, res) => res.sendFile(path.join(root, 'index.html')));
  app.get('/index.html', (req, res) => res.sendFile(path.join(root, 'index.html')));
  app.get('/html.html', (req, res) => res.sendFile(path.join(root, 'html.html')));
  app.use('/assets', express.static(path.join(root, 'assets'), { dotfiles: 'deny', maxAge: '1h' }));
  app.use('/docs', express.static(path.join(root, 'docs'), { dotfiles: 'deny', maxAge: '1h' }));
  app.use('/api', (req, res) => res.status(404).json({ error: 'Endpoint tidak ditemukan.' }));
  app.use((req, res) => res.status(404).type('text').send('Halaman tidak ditemukan.'));
  app.use((error, req, res, next) => {
    if (res.headersSent) return next(error);
    if (error.type === 'entity.parse.failed') return res.status(400).json({ error: 'JSON tidak valid.' });
    if (error.type === 'entity.too.large') return res.status(413).json({ error: 'Ukuran permintaan terlalu besar.' });
    console.error('Request gagal:', error.message);
    res.status(500).json({ error: 'Terjadi kesalahan pada server.' });
  });

  return { app, db };
}

function parseCookies(header) {
  const cookies = Object.create(null);
  for (const item of header.split(';')) {
    const separator = item.indexOf('=');
    if (separator < 0) continue;
    const key = item.slice(0, separator).trim();
    if (!key) continue;
    try {
      cookies[key] = decodeURIComponent(item.slice(separator + 1).trim());
    } catch {
      cookies[key] = '';
    }
  }
  return cookies;
}

module.exports = { createApp };

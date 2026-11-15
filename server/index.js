require('dotenv').config();
const { createApp } = require('./app');

if (!process.env.API_KEY || process.env.API_KEY.length < 32) {
  throw new Error('API_KEY wajib diisi dengan nilai acak minimal 32 karakter di .env.');
}

const port = Number(process.env.PORT || 3000);
const host = process.env.HOST || '127.0.0.1';
if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('PORT tidak valid.');

const { app, db } = createApp({ secureCookies: process.env.NODE_ENV === 'production' });
const server = app.listen(port, host, () => {
  console.log(`Vortex Hydro berjalan di http://${host}:${port}`);
});

function shutdown() {
  server.close(() => {
    db.close();
    process.exit(0);
  });
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

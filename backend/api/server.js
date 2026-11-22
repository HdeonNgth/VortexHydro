require('dotenv').config({ path: require('node:path').join(__dirname, '..', '.env') });
const { createApp } = require('./app');

const activeKey = process.env.ESP_API_KEY || process.env.API_KEY;
if (!activeKey || activeKey.length < 32) {
  throw new Error('ESP_API_KEY (atau API_KEY) wajib diisi dengan nilai acak minimal 32 karakter di backend/.env.');
}

const port = Number(process.env.PORT || 3000);
const host = process.env.HOST || '127.0.0.1';
if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('PORT tidak valid.');

const { app, db } = createApp({ secureCookies: process.env.NODE_ENV === 'production' });
const server = app.listen(port, host, () => {
  console.log(`Vortex Hydro Backend berjalan di http://${host}:${port}`);
  console.log(`  - Frontend : http://${host}:${port}/`);
  console.log(`  - ESP32    : POST http://${host}:${port}/api/esp/ingest`);
});

function shutdown() {
  server.close(() => {
    db.close();
    process.exit(0);
  });
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

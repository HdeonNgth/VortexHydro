require('dotenv').config({ path: require('node:path').join(__dirname, '..', '.env') });
const bcrypt = require('bcryptjs');
const { openDatabase } = require('./sqlite');

const username = process.env.ADMIN_USERNAME;
const password = process.env.ADMIN_PASSWORD;
if (!/^[A-Za-z0-9._-]{3,32}$/.test(username || '') || typeof password !== 'string' || password.length < 12 || password.length > 128) {
  throw new Error('Isi ADMIN_USERNAME (3–32 karakter) dan ADMIN_PASSWORD (12–128 karakter) di backend/.env.');
}

const db = openDatabase();
const passwordHash = bcrypt.hashSync(password, 12);
const existing = db.prepare('SELECT id FROM users WHERE username = ?').get(username);
if (existing) db.prepare('DELETE FROM sessions WHERE user_id = ?').run(existing.id);

db.prepare(`
  INSERT INTO users (username, password_hash, role) VALUES (?, ?, 'admin')
  ON CONFLICT(username) DO UPDATE SET password_hash = excluded.password_hash, role = 'admin'
`).run(username, passwordHash);

db.close();
console.log(`Akun admin "${username}" siap digunakan.`);

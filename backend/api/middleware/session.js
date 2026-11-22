const { createHash, randomBytes } = require('node:crypto');

const COOKIE_NAME = 'vx_session';
const SESSION_TTL_MS = 12 * 60 * 60 * 1000;

function hashToken(token) {
  return createHash('sha256').update(token).digest('hex');
}

function createSessionMiddleware(db, options = {}) {
  const secure = options.secureCookies === true;
  return function sessionMiddleware(req, res, next) {
    const token = req.cookies && req.cookies[COOKIE_NAME];
    if (!token || !/^[A-Za-z0-9_-]{40,60}$/.test(token)) return next();

    const sessionHash = hashToken(token);
    const now = Date.now();
    const row = db.prepare(`
      SELECT s.session_hash, s.role, s.guest_name, s.expires_at, u.username
      FROM sessions s LEFT JOIN users u ON u.id = s.user_id
      WHERE s.session_hash = ? AND s.expires_at > ?
    `).get(sessionHash, now);
    if (!row) {
      db.prepare('DELETE FROM sessions WHERE session_hash = ? OR expires_at <= ?').run(sessionHash, now);
      res.clearCookie(COOKIE_NAME, { httpOnly: true, sameSite: 'lax', secure, path: '/' });
      return next();
    }

    req.auth = {
      sessionId: row.session_hash,
      role: row.role,
      displayName: row.role === 'admin' ? row.username : row.guest_name
    };
    next();
  };
}

function createSession(db, res, identity, options = {}) {
  const token = randomBytes(32).toString('base64url');
  const sessionHash = hashToken(token);
  const now = Date.now();
  const expiresAt = now + SESSION_TTL_MS;
  db.prepare(`
    INSERT INTO sessions (session_hash, user_id, guest_name, role, created_at, expires_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(sessionHash, identity.userId || null, identity.guestName || null, identity.role, now, expiresAt);
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: options.secureCookies === true,
    path: '/',
    maxAge: SESSION_TTL_MS
  });
  return { role: identity.role, displayName: identity.displayName, expiresAt };
}

module.exports = { COOKIE_NAME, createSession, createSessionMiddleware, hashToken };

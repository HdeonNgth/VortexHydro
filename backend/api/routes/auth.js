const express = require('express');
const bcrypt = require('bcryptjs');
const { COOKIE_NAME, createSession } = require('../middleware/session');
const { requireAuth } = require('../middleware/access');

const DUMMY_HASH = bcrypt.hashSync('not-a-valid-vortex-password', 10);

function createAuthRouter({ db, secureCookies, loginLimiter }) {
  const router = express.Router();
  router.post('/guest', loginLimiter, (req, res) => {
    if (req.auth) db.prepare('DELETE FROM sessions WHERE session_hash = ?').run(req.auth.sessionId);
    const session = createSession(db, res, { role: 'guest', guestName: 'Tamu', displayName: 'Tamu' }, { secureCookies });
    res.status(201).json({ authenticated: true, ...session });
  });

  router.post('/admin', loginLimiter, async (req, res, next) => {
    const username = typeof req.body?.username === 'string' ? req.body.username.trim() : '';
    const password = typeof req.body?.password === 'string' ? req.body.password : '';
    if (!/^[A-Za-z0-9._-]{3,32}$/.test(username) || password.length < 1 || password.length > 128) {
      return res.status(400).json({ error: 'Username atau kata sandi tidak valid.' });
    }
    try {
      const user = db.prepare('SELECT id, username, password_hash FROM users WHERE username = ? AND role = ?').get(username, 'admin');
      const valid = await bcrypt.compare(password, user ? user.password_hash : DUMMY_HASH);
      if (!user || !valid) return res.status(401).json({ error: 'Username atau kata sandi salah.' });
      if (req.auth) db.prepare('DELETE FROM sessions WHERE session_hash = ?').run(req.auth.sessionId);
      const session = createSession(db, res, {
        role: 'admin',
        userId: user.id,
        displayName: user.username
      }, { secureCookies });
      res.status(201).json({ authenticated: true, ...session });
    } catch (error) {
      next(error);
    }
  });

  router.post('/logout', (req, res) => {
    if (req.auth) db.prepare('DELETE FROM sessions WHERE session_hash = ?').run(req.auth.sessionId);
    res.clearCookie(COOKIE_NAME, { httpOnly: true, sameSite: 'lax', secure: secureCookies, path: '/' });
    res.status(204).end();
  });

  router.get('/me', (req, res) => {
    res.set('Cache-Control', 'no-store');
    if (!req.auth) return res.json({ authenticated: false });
    res.json({ authenticated: true, role: req.auth.role, displayName: req.auth.displayName });
  });

  return router;
}

module.exports = { createAuthRouter };

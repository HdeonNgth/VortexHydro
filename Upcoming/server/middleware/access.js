function requireAuth(req, res, next) {
  if (!req.auth) return res.status(401).json({ error: 'Sesi login diperlukan.' });
  next();
}

function requireAdmin(req, res, next) {
  if (!req.auth) return res.status(401).json({ error: 'Sesi login diperlukan.' });
  if (req.auth.role !== 'admin') return res.status(403).json({ error: 'Akses khusus admin.' });
  next();
}

module.exports = { requireAdmin, requireAuth };

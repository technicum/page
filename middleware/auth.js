function requireAuth(req, res, next) {
  if (req.session && req.session.user) return next()
  req.flash('error', 'Please login to continue.')
  res.redirect('/login')
}

function redirectIfAuth(req, res, next) {
  if (req.session && req.session.user) return res.redirect('/dashboard')
  next()
}

function requireAdmin(req, res, next) {
  if (req.session && req.session.user && req.session.user.is_admin) return next()
  res.status(403).send('<h1>403 — Forbidden</h1><p>Admin access required.</p>')
}

module.exports = { requireAuth, redirectIfAuth, requireAdmin }

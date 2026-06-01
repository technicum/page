function requireAuth(req, res, next) {
  if (req.session && req.session.user) return next()
  req.flash('error', 'Please login to continue.')
  res.redirect('/login')
}

function redirectIfAuth(req, res, next) {
  if (req.session && req.session.user) return res.redirect('/dashboard')
  next()
}

module.exports = { requireAuth, redirectIfAuth }

const bcrypt   = require('bcrypt')
const crypto   = require('crypto')
const { db }   = require('../config/db')
const { sendMail } = require('../config/mailer')

// PHP's password_hash() produces $2y$ prefixed bcrypt hashes.
// Node's bcrypt uses $2b$ — algorithmically identical, just needs the prefix swapped.
function normalizeHash(hash) {
  if (hash && hash.startsWith('$2y$')) {
    return hash.replace('$2y$', '$2b$')
  }
  return hash
}

exports.showRegister = (req, res) => {
  res.render('auth/register.njk', { title: 'Create Account' })
}

exports.register = async (req, res) => {
  const { name, email, password } = req.body
  const errors = []

  if (!name)                                 errors.push('Name is required.')
  if (!email || !/\S+@\S+\.\S+/.test(email)) errors.push('Valid email required.')
  if (!password || password.length < 6)      errors.push('Password must be at least 6 characters.')

  if (errors.length) {
    return res.render('auth/register.njk', { errors, old: { name, email } })
  }

  const exists = await db.first('SELECT id FROM ms_accounts WHERE email = ?', [email])
  if (exists) {
    return res.render('auth/register.njk', { errors: ['Email already registered.'], old: { name, email } })
  }

  // Hash with $2b$ (Node bcrypt standard)
  const hash = await bcrypt.hash(password, 10)
  const id   = await db.lastId(
    'INSERT INTO ms_accounts (name, email, password, plan) VALUES (?, ?, ?, ?)',
    [name, email, hash, 'free']
  )

  const user = await db.first('SELECT * FROM ms_accounts WHERE id = ?', [id])
  res.clearCookie('pagezaper_session', { domain: '.pagezaper.com', path: '/' })
  req.session.user = user
  res.redirect('/dashboard/wizard')
}

exports.showLogin = (req, res) => {
  res.render('auth/login.njk', { title: 'Sign In' })
}

exports.login = async (req, res) => {
  const { email, password } = req.body

  const user = await db.first('SELECT * FROM ms_accounts WHERE email = ?', [email])
  if (!user) {
    return res.render('auth/login.njk', { errors: ['Invalid email or password.'], old: { email } })
  }

  if (user.is_suspended) {
    return res.render('auth/login.njk', { errors: ['Your account has been suspended. Please contact support.'], old: { email } })
  }

  // Normalise $2y$ → $2b$ so PHP-created passwords verify correctly
  const hashToCheck = normalizeHash(user.password)
  const valid = await bcrypt.compare(password, hashToCheck)

  if (!valid) {
    return res.render('auth/login.njk', { errors: ['Invalid email or password.'], old: { email } })
  }

  // If the stored hash was PHP-style, re-hash with Node bcrypt and update DB
  // so future logins are always fast and native
  if (user.password.startsWith('$2y$')) {
    const newHash = await bcrypt.hash(password, 10)
    await db.execute('UPDATE ms_accounts SET password = ? WHERE id = ?', [newHash, user.id])
    user.password = newHash
  }

  // Clear stale cross-subdomain cookie left over from a previous deployment
  // that briefly set domain: '.pagezaper.com'. Harmless if no such cookie exists.
  res.clearCookie('pagezaper_session', { domain: '.pagezaper.com', path: '/' })

  req.session.user = user

  const siteCount = await db.first('SELECT COUNT(*) as cnt FROM ms_sites WHERE account_id = ?', [user.id])
  res.redirect(siteCount.cnt === 0 ? '/dashboard/wizard' : '/dashboard')
}

exports.logout = (req, res) => {
  req.session.destroy()
  res.redirect('/')
}

// ── Forgot password ───────────────────────────────────────────────────────────
exports.showForgotPassword = (req, res) => {
  res.render('auth/forgot-password.njk', { title: 'Reset Password' })
}

exports.sendResetLink = async (req, res) => {
  const { email } = req.body

  // Always show success to prevent email enumeration
  const ok = () => res.render('auth/forgot-password.njk', {
    title: 'Reset Password',
    sent: true
  })

  const user = await db.first('SELECT id, name FROM ms_accounts WHERE email = ?', [email])
  if (!user) return ok()

  const token   = crypto.randomBytes(32).toString('hex')
  const expires = new Date(Date.now() + 60 * 60 * 1000) // 1 hour

  await db.execute(
    'UPDATE ms_accounts SET reset_token = ?, reset_expires = ? WHERE id = ?',
    [token, expires, user.id]
  )

  const appUrl  = process.env.APP_URL || 'https://pagezaper.com'
  const link    = `${appUrl}/reset-password/${token}`

  await sendMail({
    to:      email,
    subject: 'Reset your PageZaper password',
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;">
        <h2 style="margin-bottom:8px;">Reset your password</h2>
        <p style="color:#555;margin-bottom:24px;">Hi ${user.name}, click the button below to set a new password. This link expires in 1 hour.</p>
        <a href="${link}" style="display:inline-block;background:#111;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;">Reset Password</a>
        <p style="color:#999;font-size:12px;margin-top:24px;">If you didn't request this, you can safely ignore this email.</p>
      </div>
    `
  }).catch(() => {}) // silent fail — don't reveal SMTP errors to user

  ok()
}

// ── Reset password ────────────────────────────────────────────────────────────
exports.showResetPassword = async (req, res) => {
  const { token } = req.params
  const user = await db.first(
    'SELECT id FROM ms_accounts WHERE reset_token = ? AND reset_expires > NOW()',
    [token]
  )
  if (!user) {
    return res.render('auth/forgot-password.njk', {
      title: 'Reset Password',
      errors: ['This reset link is invalid or has expired. Please request a new one.']
    })
  }
  res.render('auth/reset-password.njk', { title: 'Set New Password', token })
}

exports.resetPassword = async (req, res) => {
  const { token }    = req.params
  const { password } = req.body

  const user = await db.first(
    'SELECT id FROM ms_accounts WHERE reset_token = ? AND reset_expires > NOW()',
    [token]
  )
  if (!user) {
    return res.render('auth/reset-password.njk', {
      title: 'Set New Password', token,
      errors: ['This reset link has expired. Please request a new one.']
    })
  }

  if (!password || password.length < 6) {
    return res.render('auth/reset-password.njk', {
      title: 'Set New Password', token,
      errors: ['Password must be at least 6 characters.']
    })
  }

  const hash = await bcrypt.hash(password, 10)
  await db.execute(
    'UPDATE ms_accounts SET password = ?, reset_token = NULL, reset_expires = NULL WHERE id = ?',
    [hash, user.id]
  )

  res.render('auth/login.njk', {
    title: 'Sign In',
    success: 'Password updated! You can now sign in.'
  })
}

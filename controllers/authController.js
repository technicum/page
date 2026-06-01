const bcrypt = require('bcrypt')
const { db } = require('../config/db')

exports.showRegister = (req, res) => {
  res.render('auth/register.njk', { title: 'Create Account' })
}

exports.register = async (req, res) => {
  const { name, email, password } = req.body
  const errors = []

  if (!name)                                errors.push('Name is required.')
  if (!email || !/\S+@\S+\.\S+/.test(email)) errors.push('Valid email required.')
  if (!password || password.length < 6)     errors.push('Password must be at least 6 characters.')

  if (errors.length) {
    return res.render('auth/register.njk', { errors, old: { name, email } })
  }

  const exists = await db.first('SELECT id FROM ms_accounts WHERE email = ?', [email])
  if (exists) {
    return res.render('auth/register.njk', { errors: ['Email already registered.'], old: { name, email } })
  }

  const hash = await bcrypt.hash(password, 10)
  const id   = await db.lastId(
    "INSERT INTO ms_accounts (name, email, password, plan) VALUES (?, ?, ?, 'free')",
    [name, email, hash]
  )

  const user = await db.first('SELECT * FROM ms_accounts WHERE id = ?', [id])
  req.session.user = user
  res.redirect('/dashboard/wizard')
}

exports.showLogin = (req, res) => {
  res.render('auth/login.njk', { title: 'Sign In' })
}

exports.login = async (req, res) => {
  const { email, password } = req.body

  const user = await db.first('SELECT * FROM ms_accounts WHERE email = ?', [email])
  if (!user || !(await bcrypt.compare(password, user.password))) {
    return res.render('auth/login.njk', { errors: ['Invalid email or password.'], old: { email } })
  }

  req.session.user = user

  const siteCount = await db.first('SELECT COUNT(*) as cnt FROM ms_pages WHERE account_id = ?', [user.id])
  res.redirect(siteCount.cnt === 0 ? '/dashboard/wizard' : '/dashboard')
}

exports.logout = (req, res) => {
  req.session.destroy()
  res.redirect('/')
}

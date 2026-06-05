require('dotenv').config()

const express      = require('express')
const session      = require('express-session')
const nunjucks     = require('nunjucks')
const cookieParser = require('cookie-parser')
const flash        = require('connect-flash')
const path         = require('path')

const app  = express()
const PORT = process.env.PORT || 3000

// Trust proxy — REQUIRED for req.hostname to work correctly behind
// nginx / Apache / Hostinger / cPanel reverse proxies.
// Without this, subdomains (gla.pagezaper.com) return 403 because
// req.hostname resolves to 'localhost' instead of the real host.
app.set('trust proxy', true)

// ── /debug — mounted FIRST, before anything that can crash ───────────────────
// Visit /debug in your browser to diagnose startup problems.
// Remove this route once everything is working.
app.get('/debug', async (req, res) => {
  let dbStatus = 'not tested'
  let dbError  = null
  let tables   = []
  let missing  = []
  let serverTime = null

  try {
    const mysql = require('mysql2/promise')
    const conn  = await mysql.createConnection({
      host:     process.env.DB_HOST,
      user:     process.env.DB_USER,
      password: process.env.DB_PASS,
      database: process.env.DB_NAME
    })
    dbStatus = 'connected'
    const [tr] = await conn.execute('SELECT NOW() as t')
    serverTime = tr[0].t
    const [rows] = await conn.execute('SHOW TABLES')
    tables = rows.map(r => Object.values(r)[0])
    for (const t of ['ms_accounts', 'ms_pages']) {
      if (!tables.includes(t)) missing.push(t)
    }
    await conn.end()
  } catch (e) {
    dbStatus = 'failed'
    dbError  = { code: e.code, message: e.message }
  }

  const row = (label, value, ok) => {
    const cls = ok === true ? 'ok' : ok === false ? 'err' : 'neutral'
    return `<tr><td>${label}</td><td class="${cls}">${value}</td></tr>`
  }

  res.send(`<!DOCTYPE html><html><head><title>Debug</title>
  <style>
    body{font-family:monospace;padding:32px;background:#f8f7f4;color:#1a1a18;max-width:700px;}
    h1{font-size:20px;margin-bottom:6px;} .sub{color:#6b6b66;font-size:13px;margin-bottom:28px;}
    h2{font-size:13px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:#6b6b66;margin:24px 0 8px;}
    table{width:100%;border-collapse:collapse;background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.08);}
    td{padding:10px 14px;border-bottom:1px solid #f0ede6;font-size:13px;}td:last-child{border-bottom:none;}
    td:first-child{color:#6b6b66;width:220px;white-space:nowrap;}
    .ok{color:#16a34a;font-weight:600;} .err{color:#dc2626;font-weight:600;} .warn{color:#d97706;font-weight:600;}
    .neutral{color:#1a1a18;}
    .note{margin-top:24px;font-size:12px;color:#b0afa8;padding:12px;background:#fff;border-radius:8px;}
  </style></head><body>
  <h1>🔧 PageZapper Debug</h1>
  <div class="sub">Check this page to diagnose connection issues.</div>

  <h2>Environment (.env)</h2>
  <table>
    ${row('APP_NAME',    process.env.APP_NAME    || '⚠ not set', !!process.env.APP_NAME)}
    ${row('BASE_DOMAIN', process.env.BASE_DOMAIN || '⚠ not set', !!process.env.BASE_DOMAIN)}
    ${row('PORT',        process.env.PORT        || '3000 (default)', true)}
    ${row('NODE_ENV',    process.env.NODE_ENV    || '(not set)', null)}
    ${row('DB_HOST',     process.env.DB_HOST     || '⚠ not set', !!process.env.DB_HOST)}
    ${row('DB_USER',     process.env.DB_USER     || '⚠ not set', !!process.env.DB_USER)}
    ${row('DB_NAME',     process.env.DB_NAME     || '⚠ not set', !!process.env.DB_NAME)}
    ${row('DB_PASS',     process.env.DB_PASS     ? `✓ set (${process.env.DB_PASS.length} chars)` : '⚠ not set', !!process.env.DB_PASS)}
    ${row('SESSION_SECRET', process.env.SESSION_SECRET ? '✓ set' : '⚠ not set', !!process.env.SESSION_SECRET)}
    ${row('ANTHROPIC_API_KEY', process.env.ANTHROPIC_API_KEY ? '✓ set (AI enabled)' : '✗ not set (AI disabled)', null)}
  </table>

  <h2>Database</h2>
  <table>
    ${row('Status', dbStatus === 'connected' ? '✅ Connected' : '❌ ' + dbStatus, dbStatus === 'connected')}
    ${dbError ? row('Error code',    dbError.code,    false) : ''}
    ${dbError ? row('Error message', dbError.message, false) : ''}
    ${dbError && dbError.code === 'ER_ACCESS_DENIED_ERROR' ? row('Hint', '→ Wrong DB_USER or DB_PASS in .env', false) : ''}
    ${dbError && dbError.code === 'ER_BAD_DB_ERROR'        ? row('Hint', '→ Wrong DB_NAME — database does not exist', false) : ''}
    ${dbError && dbError.code === 'ECONNREFUSED'            ? row('Hint', '→ DB_HOST unreachable — check DB_HOST value', false) : ''}
    ${dbError && dbError.code === 'ENOTFOUND'               ? row('Hint', '→ DB_HOST hostname cannot be resolved', false) : ''}
    ${serverTime ? row('Server time', serverTime, null) : ''}
    ${row('Tables found', tables.length ? tables.join(', ') : '(none — run schema.sql)', tables.length > 0)}
    ${missing.length ? row('Missing tables', '⚠ ' + missing.join(', ') + ' — run schema.sql in phpMyAdmin', false) : ''}
    ${!missing.length && dbStatus === 'connected' ? row('Schema', '✅ All required tables present', true) : ''}
  </table>

  <h2>Node.js</h2>
  <table>
    ${row('Version', process.version, null)}
    ${row('Uptime',  Math.round(process.uptime()) + 's', null)}
    ${row('Memory',  Math.round(process.memoryUsage().rss / 1024 / 1024) + ' MB RSS', null)}
  </table>

  <div class="note">⚠️ Delete or password-protect this route before going public — it exposes your config.</div>
  </body></html>`)
})

// ── Session store — fall back to memory store if DB is not ready ──────────────
let sessionStore
try {
  const MySQLStore = require('express-mysql-session')(session)
  const { pool }   = require('./config/db')
  sessionStore = new MySQLStore({ expiration: 86400000, createDatabaseTable: true }, pool)
  console.log('Session store: MySQL')
} catch (e) {
  console.warn('Session store: falling back to memory store —', e.message)
  sessionStore = undefined // express-session uses memory store by default
}

// Session
app.use(session({
  key:               'pagezaper_session',
  secret:            process.env.SESSION_SECRET || 'changeme',
  store:             sessionStore,
  resave:            false,
  saveUninitialized: false,
  cookie:            { maxAge: 86400000, httpOnly: true }
}))

// Middleware
app.use(cookieParser())
app.use(express.urlencoded({ extended: true }))
app.use(express.json())
app.use(flash())

// Static files
app.use(express.static(path.join(__dirname, 'public')))
app.use('/themes', express.static(path.join(__dirname, 'themes')))
// Per-site media uploads
app.use('/media', express.static(path.join(__dirname, 'public/media')))

// Nunjucks
const env = nunjucks.configure(path.join(__dirname, 'views'), {
  autoescape: true,
  express:    app,
  noCache:    process.env.NODE_ENV !== 'production'
})

// Add custom Nunjucks filters
env.addFilter('min', function(arr) {
  return Math.min(...arr)
})
env.addFilter('max', function(arr) {
  return Math.max(...arr)
})
env.addFilter('tojson', function(obj) {
  return JSON.stringify(obj)
})

// Global template vars
app.use((req, res, next) => {
  res.locals.user          = req.session.user || null
  res.locals.flash_success = req.flash('success')
  res.locals.flash_errors  = req.flash('errors')
  res.locals.app_name      = process.env.APP_NAME    || 'PageZaper'
  res.locals.app_url       = process.env.APP_URL     || 'https://pagezaper.com'
  res.locals.base_domain   = process.env.BASE_DOMAIN || 'pagezaper.com'
  next()
})

// Subdomain/custom domain detection
const subdomainMw = require('./middleware/subdomain')
app.use(subdomainMw)

// Routes
const routes = require('./routes/web')
app.use('/', routes)

// 404
app.use((req, res) => {
  try { res.status(404).render('404.njk', { title: '404 Not Found' }) }
  catch(e) { res.status(404).send('<h1>404 Not Found</h1>') }
})

// Error handler
app.use((err, req, res, next) => {
  console.error('[500]', err.message)
  console.error(err.stack)
  try { res.status(500).render('500.njk', { title: 'Server Error', error: err.message }) }
  catch(e) { res.status(500).send('<h1>500 — ' + err.message + '</h1>') }
})

app.listen(PORT, () => {
  console.log(`PageZapper running on port ${PORT}`)
})

module.exports = app
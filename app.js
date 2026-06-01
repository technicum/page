require('dotenv').config()

const express        = require('express')
const session        = require('express-session')
const MySQLStore     = require('express-mysql-session')(session)
const nunjucks       = require('nunjucks')
const cookieParser   = require('cookie-parser')
const flash          = require('connect-flash')
const path           = require('path')
const { pool }       = require('./config/db')
const subdomainMw    = require('./middleware/subdomain')
const routes         = require('./routes/web')

const app  = express()
const PORT = process.env.PORT || 3000

// Session store in MySQL
const sessionStore = new MySQLStore({
  expiration:          86400000,
  createDatabaseTable: true
}, pool)

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

// Nunjucks templating for dashboard/auth views
const env = nunjucks.configure(path.join(__dirname, 'views'), {
  autoescape: true,
  express:    app,
  noCache:    process.env.NODE_ENV !== 'production'
})

// Global template vars
app.use((req, res, next) => {
  res.locals.user        = req.session.user || null
  res.locals.flash_success = req.flash('success')
  res.locals.flash_errors  = req.flash('errors')
  res.locals.app_name    = process.env.APP_NAME  || 'PageZaper'
  res.locals.app_url     = process.env.APP_URL   || 'https://pagezaper.com'
  res.locals.base_domain = process.env.BASE_DOMAIN || 'pagezaper.com'
  next()
})

// Subdomain/custom domain detection — must come before routes
app.use(subdomainMw)

// Routes
app.use('/', routes)

// 404
app.use((req, res) => {
  res.status(404).render('404.njk', { title: '404 Not Found' })
})

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack)
  res.status(500).render('500.njk', { title: 'Server Error', error: err.message })
})

app.listen(PORT, () => {
  console.log(`PageZaper running on port ${PORT}`)
})

module.exports = app

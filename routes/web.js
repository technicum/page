const express     = require('express')
const router      = express.Router()
const home        = require('../controllers/homeController')
const auth        = require('../controllers/authController')
const dash        = require('../controllers/dashController')
const site        = require('../controllers/siteController')
const blog        = require('../controllers/blogController')
const media       = require('../controllers/mediaController')
const form        = require('../controllers/formController')
const chat        = require('../controllers/chatController')
const { requireAuth, redirectIfAuth, requireAdmin } = require('../middleware/auth')
const admin   = require('../controllers/adminController')
const review  = require('../controllers/reviewController')
const booking = require('../controllers/bookingController')
const multer = require('multer')
const os     = require('os')
const themeUpload = multer({ dest: os.tmpdir() })
const { db } = require('../config/db')

// ── Debug route (REMOVE IN PRODUCTION) ───────────────────────────────────────
router.get('/debug', async (req, res) => {
  const health  = await db.healthCheck()
  const env     = {
    APP_NAME:    process.env.APP_NAME    || '(not set)',
    APP_URL:     process.env.APP_URL     || '(not set)',
    BASE_DOMAIN: process.env.BASE_DOMAIN || '(not set)',
    PORT:        process.env.PORT        || '(not set)',
    NODE_ENV:    process.env.NODE_ENV    || '(not set)',
    DB_HOST:     process.env.DB_HOST     || '(not set)',
    DB_USER:     process.env.DB_USER     || '(not set)',
    DB_NAME:     process.env.DB_NAME     || '(not set)',
    DB_PASS:     process.env.DB_PASS     ? `✓ set (${process.env.DB_PASS.length} chars)` : '✗ not set',
    SESSION_SECRET: process.env.SESSION_SECRET ? '✓ set' : '✗ not set',
    ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY ? '✓ set' : '✗ not set (AI disabled)'
  }

  const color = (ok) => ok ? '#16a34a' : '#dc2626'
  const icon  = (ok) => ok ? '✅' : '❌'

  res.send(`<!DOCTYPE html><html><head><title>PageZapper Debug</title>
  <style>body{font-family:monospace;padding:32px;background:#f8f7f4;color:#1a1a18;}
  h1{font-size:20px;margin-bottom:24px;}h2{font-size:14px;margin:20px 0 8px;color:#6b6b66;}
  table{border-collapse:collapse;width:100%;max-width:600px;background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,0.08);}
  td{padding:10px 14px;border-bottom:1px solid #f0ede6;font-size:13px;}
  td:first-child{color:#6b6b66;width:200px;}
  .ok{color:#16a34a;font-weight:600;}.err{color:#dc2626;font-weight:600;}
  .warn{color:#d97706;font-weight:600;}
  .badge{display:inline-block;padding:3px 10px;border-radius:20px;font-size:12px;}
  </style></head><body>
  <h1>🔧 PageZapper Debug</h1>

  <h2>Environment</h2>
  <table>${Object.entries(env).map(([k,v])=>`<tr><td>${k}</td><td>${v}</td></tr>`).join('')}</table>

  <h2>Database</h2>
  <table>
    <tr><td>Connection</td><td class="${health.connected?'ok':'err'}">${icon(health.connected)} ${health.connected ? 'Connected' : 'FAILED — ' + (health.error ? health.error.code + ': ' + health.error.message : 'unknown')}</td></tr>
    ${health.connected ? `<tr><td>Server time</td><td>${health.serverTime}</td></tr>` : ''}
    <tr><td>Tables found</td><td>${health.tables.length ? health.tables.join(', ') : '(none)'}</td></tr>
    ${health.missing.length ? `<tr><td>Missing tables</td><td class="warn">⚠️ ${health.missing.join(', ')} — run schema.sql in phpMyAdmin</td></tr>` : ''}
    ${health.missing.length === 0 && health.connected ? `<tr><td>Schema</td><td class="ok">✅ All required tables present</td></tr>` : ''}
  </table>

  <h2>Node</h2>
  <table>
    <tr><td>Node version</td><td>${process.version}</td></tr>
    <tr><td>Uptime</td><td>${Math.round(process.uptime())}s</td></tr>
    <tr><td>Memory</td><td>${Math.round(process.memoryUsage().rss/1024/1024)}MB RSS</td></tr>
  </table>

  <p style="margin-top:24px;font-size:12px;color:#b0afa8;">⚠️ Remove or protect this route before going public.</p>
  </body></html>`)
})

// Public
router.get('/',           home.index)
router.get('/search',     home.search)
router.get('/sitemap.xml', home.sitemap)
router.get('/api/detect-city',      home.detectCity)
router.get('/api/reverse-geocode',  home.reverseGeocode)
router.get('/api/nearby',           home.nearby)
router.get('/api/location-suggest', home.locationSuggest)

// Reviews — public
router.get ('/review/:subdomain',       review.showForm)
router.post('/review/:subdomain',       review.submit)
router.get ('/api/reviews/:subdomain',  review.apiReviews)

// PWA owner check — called cross-origin from mini-site subdomains
router.get('/api/check-owner/:subdomain', async (req, res) => {
  // Allow requests from subdomains of our base domain
  const origin     = req.headers.origin || ''
  const baseDomain = process.env.BASE_DOMAIN || 'pagezaper.com'
  const isSubOrigin = origin === `https://${baseDomain}` ||
                      origin.endsWith(`.${baseDomain}`)
  if (isSubOrigin) {
    res.set('Access-Control-Allow-Origin', origin)
    res.set('Access-Control-Allow-Credentials', 'true')
    res.set('Vary', 'Origin')
  }
  const user = req.session && req.session.user
  if (!user) return res.json({ is_owner: false })
  try {
    const site = await db.first('SELECT account_id FROM ms_sites WHERE subdomain = ?', [req.params.subdomain])
    return res.json({ is_owner: !!(site && Number(user.id) === Number(site.account_id)) })
  } catch(e) {
    return res.json({ is_owner: false })
  }
})

// Reviews — dashboard
router.get ('/dashboard/site/reviews',        requireAuth, review.siteReviews)
router.post('/dashboard/site/reviews/delete', requireAuth, review.deleteReview)

// Auth
router.get ('/register', redirectIfAuth, auth.showRegister)
router.post('/register', redirectIfAuth, auth.register)
router.get ('/login',    redirectIfAuth, auth.showLogin)
router.post('/login',    redirectIfAuth, auth.login)
router.get ('/logout',   auth.logout)
router.get ('/forgot-password',         redirectIfAuth, auth.showForgotPassword)
router.post('/forgot-password',         redirectIfAuth, auth.sendResetLink)
router.get ('/reset-password/:token',   auth.showResetPassword)
router.post('/reset-password/:token',   auth.resetPassword)

// Template preview (public)
router.get('/template-preview',       site.templatePreview)
router.get('/template-preview-frame', site.templatePreviewFrame)

// Dashboard
router.get ('/dashboard',          requireAuth, dash.index)
router.get ('/dashboard/wizard',   requireAuth, dash.wizard)
router.get ('/dashboard/settings', requireAuth, dash.settings)
router.post('/dashboard/settings', requireAuth, dash.updateSettings)

// Site
router.post('/dashboard/site/create',        requireAuth, site.store)
router.get ('/dashboard/site/templates',     requireAuth, dash.templates)
router.post('/dashboard/site/set-template',  requireAuth, site.setTemplate)
router.get ('/dashboard/site/builder',          requireAuth, dash.builder)
router.get ('/dashboard/site/biolink-builder', requireAuth, dash.biolinkBuilder)
router.post('/dashboard/site/biolink-preview',  requireAuth, site.biolinkPreview)
router.post('/dashboard/site/biolink-save',    requireAuth, site.biolinkSave)
router.post('/dashboard/site/builder-save',    requireAuth, site.builderSave)
router.post('/dashboard/site/builder-preview', requireAuth, site.builderPreview)
router.post('/dashboard/site/delete',          requireAuth, site.delete)
router.post('/dashboard/site/update-info',     requireAuth, site.updateInfo)
router.post('/dashboard/site/create-staff',   requireAuth, site.createStaffSite)
router.post('/dashboard/site/toggle-publish', requireAuth, site.togglePublish)
router.post('/dashboard/site/update-seo',    requireAuth, site.updateSeo)

// Blog
router.get ('/dashboard/blog/:siteId',                    requireAuth, blog.index)
router.get ('/dashboard/blog/:siteId/new',                requireAuth, blog.newForm)
router.post('/dashboard/blog/:siteId/new',                requireAuth, blog.create)
router.get ('/dashboard/blog/:siteId/edit/:postId',       requireAuth, blog.editForm)
router.post('/dashboard/blog/:siteId/edit/:postId',       requireAuth, blog.update)
router.post('/dashboard/blog/:siteId/delete/:postId',     requireAuth, blog.destroy)

// Media library
router.get ('/dashboard/media/:siteId/library',      requireAuth, media.library)
router.get ('/dashboard/media/:siteId',              requireAuth, media.list)
router.post('/dashboard/media/:siteId/upload',       requireAuth, media.upload)
router.delete('/dashboard/media/:siteId/:filename',  requireAuth, media.destroy)

// AI
router.post('/dashboard/ai-suggest',  requireAuth, site.aiSuggest)
router.post('/dashboard/ai-generate', requireAuth, site.aiGenerate)

// Forms — account-level (HubSpot-style)
router.get ('/dashboard/forms',                                      requireAuth, form.allForms)
router.get ('/dashboard/forms/new',                                  requireAuth, form.newForm)
router.post('/dashboard/forms/new',                                  requireAuth, form.create)
router.get ('/dashboard/forms/edit/:formId',                         requireAuth, form.editForm)
router.post('/dashboard/forms/edit/:formId',                         requireAuth, form.update)
router.post('/dashboard/forms/delete/:formId',                       requireAuth, form.destroy)
router.get ('/dashboard/forms/entries/:formId',                      requireAuth, form.entries)
router.get ('/dashboard/forms/entries/:formId/export',               requireAuth, form.exportCsv)
router.delete('/dashboard/forms/entries/:formId/delete/:entryId',    requireAuth, form.deleteEntry)

// Legacy per-site form routes (redirect to account-level)
router.get ('/dashboard/forms/:siteId',                              requireAuth, form.index)
router.get ('/dashboard/forms/:siteId/new',                         requireAuth, form.newForm)
router.get ('/dashboard/forms/:siteId/edit/:formId',                requireAuth, (req,res) => res.redirect(`/dashboard/forms/edit/${req.params.formId}`))
router.get ('/dashboard/forms/:siteId/entries/:formId',             requireAuth, (req,res) => res.redirect(`/dashboard/forms/entries/${req.params.formId}`))
router.get ('/dashboard/forms/:siteId/entries/:formId/export',      requireAuth, (req,res) => res.redirect(`/dashboard/forms/entries/${req.params.formId}/export`))

// Forms API — account-level (for builder form_select dropdown)
router.get('/dashboard/api/forms',         requireAuth, form.apiList)
router.get('/dashboard/api/forms/:siteId', requireAuth, form.apiList)

// Public form view & submission (no auth)
router.get ('/f/:formId', form.publicView)
router.post('/f/:formId', form.formUpload, form.submit)

// ── Booking ───────────────────────────────────────────────────────────────────
router.get ('/dashboard/booking', requireAuth, async (req, res) => {
  try {
    const site = await db.first('SELECT id FROM ms_sites WHERE account_id = ? ORDER BY id ASC LIMIT 1', [req.session.user.id])
    if (!site) return res.redirect('/dashboard/wizard')
    res.redirect(`/dashboard/booking/${site.id}`)
  } catch (err) {
    console.error('booking redirect', err)
    res.redirect('/dashboard')
  }
})
router.get ('/dashboard/booking/:siteId',                       requireAuth, booking.dashboard)
router.get ('/dashboard/booking/:siteId/events',                requireAuth, booking.events)
router.post('/dashboard/booking/:siteId/events/save',           requireAuth, booking.saveEvent)
router.post('/dashboard/booking/:siteId/events/delete',         requireAuth, booking.deleteEvent)
router.get ('/dashboard/booking/:siteId/availability',          requireAuth, booking.availability)
router.post('/dashboard/booking/:siteId/availability/save',     requireAuth, booking.saveAvailability)
router.get ('/dashboard/booking/:siteId/list',                  requireAuth, booking.bookingList)
router.post('/dashboard/booking/:siteId/cancel',                requireAuth, booking.cancelBooking)

// Booking public API (no auth)
router.get ('/api/booking/:subdomain/events',                   booking.apiEvents)
router.get ('/api/booking/:subdomain/slots/:eventId/:date',     booking.apiSlots)
router.post('/api/booking/:subdomain/create',                   booking.apiCreate)

// ── Admin panel ───────────────────────────────────────────────────────────────
router.get ('/admin',                   requireAuth, requireAdmin, admin.index)
router.get ('/admin/themes',            requireAuth, requireAdmin, admin.themes)
router.post('/admin/themes/upload',     requireAuth, requireAdmin, themeUpload.single('theme_zip'), admin.uploadTheme)
router.post('/admin/themes/delete',     requireAuth, requireAdmin, admin.deleteTheme)
router.get ('/admin/users',                  requireAuth, requireAdmin, admin.users)
router.post('/admin/users/toggle-admin',     requireAuth, requireAdmin, admin.toggleAdmin)
router.post('/admin/users/toggle-suspend',   requireAuth, requireAdmin, admin.toggleSuspend)
router.post('/admin/users/login-as',         requireAuth, requireAdmin, admin.loginAsUser)
router.post('/admin/users/change-password',  requireAuth, requireAdmin, admin.changePassword)
router.get ('/admin/stop-impersonation',     requireAuth, admin.stopImpersonation)
router.get ('/admin/categories',             requireAuth, requireAdmin, admin.categories)
router.post('/admin/categories/create',      requireAuth, requireAdmin, admin.createCategory)
router.post('/admin/categories/update',      requireAuth, requireAdmin, admin.updateCategory)
router.post('/admin/categories/delete',      requireAuth, requireAdmin, admin.deleteCategory)

router.get ('/admin/aliases',                requireAuth, requireAdmin, admin.aliases)
router.post('/admin/aliases/create',         requireAuth, requireAdmin, admin.createAlias)
router.post('/admin/aliases/update',         requireAuth, requireAdmin, admin.updateAlias)
router.post('/admin/aliases/delete',         requireAuth, requireAdmin, admin.deleteAlias)

// ── Chat — public API (no auth) ───────────────────────────────────────────────
router.get ('/api/chat/settings/:siteId', chat.widgetSettings)
router.post('/api/chat/session',          chat.startSession)
router.post('/api/chat/message',          chat.visitorSend)
router.get ('/api/chat/poll',             chat.visitorPoll)

// ── Chat — dashboard (auth required) ─────────────────────────────────────────
router.get ('/dashboard/chat',                        requireAuth, chat.inbox)
router.get ('/dashboard/chat/poll',                   requireAuth, chat.inboxPoll)
router.get ('/dashboard/chat/settings',               requireAuth, chat.settings)
router.post('/dashboard/chat/settings',               requireAuth, chat.saveSettings)
router.get ('/dashboard/chat/:sessionId',             requireAuth, chat.conversation)
router.get ('/dashboard/chat/:sessionId/poll',        requireAuth, chat.conversationPoll)
router.post('/dashboard/chat/:sessionId/send',        requireAuth, chat.vendorSend)
router.post('/dashboard/chat/:sessionId/status',      requireAuth, chat.setStatus)

// ── Alias landing pages (must be before /:city) ───────────────────────────────
router.get('/:city/:alias', home.aliasPage)

// ── City landing pages (catch-all — must be LAST) ─────────────────────────────
router.get('/:city', home.cityPage)

module.exports = router

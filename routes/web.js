const express     = require('express')
const router      = express.Router()
const home        = require('../controllers/homeController')
const auth        = require('../controllers/authController')
const dash        = require('../controllers/dashController')
const site        = require('../controllers/siteController')
const blog        = require('../controllers/blogController')
const media       = require('../controllers/mediaController')
const form        = require('../controllers/formController')
const { requireAuth, redirectIfAuth } = require('../middleware/auth')
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
router.get('/',       home.index)
router.get('/search', home.search)

// Auth
router.get ('/register', redirectIfAuth, auth.showRegister)
router.post('/register', redirectIfAuth, auth.register)
router.get ('/login',    redirectIfAuth, auth.showLogin)
router.post('/login',    redirectIfAuth, auth.login)
router.get ('/logout',   auth.logout)

// Template preview (public)
router.get('/template-preview', site.templatePreview)

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
router.post('/dashboard/site/biolink-save',    requireAuth, site.biolinkSave)
router.post('/dashboard/site/builder-save',    requireAuth, site.builderSave)
router.post('/dashboard/site/builder-preview', requireAuth, site.builderPreview)
router.post('/dashboard/site/delete',          requireAuth, site.delete)

// Blog
router.get ('/dashboard/blog/:siteId',                    requireAuth, blog.index)
router.get ('/dashboard/blog/:siteId/new',                requireAuth, blog.newForm)
router.post('/dashboard/blog/:siteId/new',                requireAuth, blog.create)
router.get ('/dashboard/blog/:siteId/edit/:postId',       requireAuth, blog.editForm)
router.post('/dashboard/blog/:siteId/edit/:postId',       requireAuth, blog.update)
router.post('/dashboard/blog/:siteId/delete/:postId',     requireAuth, blog.destroy)

// Media library
router.get ('/dashboard/media/:siteId',              requireAuth, media.list)
router.post('/dashboard/media/:siteId/upload',       requireAuth, media.upload)
router.delete('/dashboard/media/:siteId/:filename',  requireAuth, media.destroy)

// AI
router.post('/dashboard/ai-suggest',  requireAuth, site.aiSuggest)
router.post('/dashboard/ai-generate', requireAuth, site.aiGenerate)

// Forms (dashboard)
router.get ('/dashboard/forms/:siteId',                              requireAuth, form.index)
router.get ('/dashboard/forms/:siteId/new',                         requireAuth, form.newForm)
router.post('/dashboard/forms/:siteId/new',                         requireAuth, form.create)
router.get ('/dashboard/forms/:siteId/edit/:formId',                requireAuth, form.editForm)
router.post('/dashboard/forms/:siteId/edit/:formId',                requireAuth, form.update)
router.post('/dashboard/forms/:siteId/delete/:formId',              requireAuth, form.destroy)
router.get ('/dashboard/forms/:siteId/entries/:formId',             requireAuth, form.entries)
router.get ('/dashboard/forms/:siteId/entries/:formId/export',      requireAuth, form.exportCsv)
router.delete('/dashboard/forms/:siteId/entries/:formId/delete/:entryId', requireAuth, form.deleteEntry)

// Forms API (for builder dropdown)
router.get('/dashboard/api/forms/:siteId', requireAuth, form.apiList)

// Public form submission (no auth)
router.post('/f/:formId', form.submit)

module.exports = router

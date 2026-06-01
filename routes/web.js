const express     = require('express')
const router      = express.Router()
const home        = require('../controllers/homeController')
const auth        = require('../controllers/authController')
const dash        = require('../controllers/dashController')
const site        = require('../controllers/siteController')
const { requireAuth, redirectIfAuth } = require('../middleware/auth')

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
router.get ('/dashboard/site/builder',       requireAuth, dash.builder)
router.post('/dashboard/site/builder-save',  requireAuth, site.builderSave)
router.post('/dashboard/site/delete',        requireAuth, site.delete)

// AI
router.post('/dashboard/ai-suggest',  requireAuth, site.aiSuggest)
router.post('/dashboard/ai-generate', requireAuth, site.aiGenerate)

module.exports = router

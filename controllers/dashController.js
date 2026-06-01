const { db }          = require('../config/db')
const themeManager    = require('../config/themeManager')

exports.index = async (req, res) => {
  const user  = req.session.user
  const sites = await db.query('SELECT * FROM ms_pages WHERE account_id = ? ORDER BY created_at DESC', [user.id])
  res.render('dashboard/index.njk', { title: 'Dashboard', user, sites })
}

exports.wizard = (req, res) => {
  res.render('dashboard/wizard.njk', { title: 'Create your site', user: req.session.user })
}

exports.templates = async (req, res) => {
  const user    = req.session.user
  const siteId  = parseInt(req.query.id) || 0
  const fromNew = !!req.query.new

  const site = await db.first('SELECT * FROM ms_pages WHERE id = ? AND account_id = ?', [siteId, user.id])
  if (!site) return res.redirect('/dashboard')

  const settings  = JSON.parse(site.settings || '{}')
  const allThemes = themeManager.loadAll()

  res.render('dashboard/templates.njk', { title: 'Choose Template', user, site, settings, allThemes, fromNew })
}

exports.builder = async (req, res) => {
  const user   = req.session.user
  const siteId = parseInt(req.query.id) || 0

  const site = await db.first('SELECT * FROM ms_pages WHERE id = ? AND account_id = ?', [siteId, user.id])
  if (!site) return res.redirect('/dashboard')

  const settings     = JSON.parse(site.settings || '{}')
  const themeSlug    = settings.template_id || site.template_id || 'minimal'
  const themeData    = themeManager.loadTheme(themeSlug) || themeManager.loadTheme('minimal')
  const themeSections = themeData ? themeData.sections : []
  const themeColors   = themeData ? (themeData.settings && themeData.settings.colors) || [] : []
  // Multi-page: theme declares pages array; single-page themes have none
  const themePages    = themeData && Array.isArray(themeData.pages) ? themeData.pages : null

  // Build allPagesData: { home: { sections: [] }, about: { sections: [] }, ... }
  // Migrate legacy settings.sections → settings.pages.home.sections if needed
  let allPagesData = null
  if (themePages) {
    if (settings.pages) {
      allPagesData = settings.pages
    } else {
      // Migrate: put existing sections under 'home'
      allPagesData = {}
      themePages.forEach(p => {
        allPagesData[p.id] = { sections: p.id === 'home' ? (settings.sections || []) : [] }
      })
    }
  }

  res.render('dashboard/builder.njk', {
    title: 'Builder',
    user,
    site,
    settings,
    themeSections,
    themeColors,
    themeSlug,
    themePages,
    allPagesData,
    baseDomain: process.env.BASE_DOMAIN || 'pagezapper.com'
  })
}

exports.settings = async (req, res) => {
  const user = req.session.user
  res.render('dashboard/settings.njk', { title: 'Settings', user })
}

exports.updateSettings = async (req, res) => {
  const user = req.session.user
  const { name } = req.body

  if (name) {
    await db.execute('UPDATE ms_accounts SET name = ? WHERE id = ?', [name, user.id])
    const updated = await db.first('SELECT * FROM ms_accounts WHERE id = ?', [user.id])
    req.session.user = updated
  }

  req.flash('success', 'Settings updated.')
  res.redirect('/dashboard/settings')
}

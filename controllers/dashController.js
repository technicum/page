const { db }          = require('../config/db')
const themeManager    = require('../config/themeManager')
const { geocodeCity } = require('../config/geocode')

exports.index = async (req, res) => {
  const user       = req.session.user
  const rows       = await db.query('SELECT * FROM ms_sites WHERE account_id = ? ORDER BY id ASC', [user.id])
  const categories = await db.query('SELECT id, name, icon FROM ms_categories WHERE status = 1 ORDER BY sort_order ASC, name ASC')

  // Group: build siteRows where each main site has a .staffSites array
  const mainMap  = new Map()
  const children = []
  for (const s of rows) {
    if (!s.parent_site_id) {
      s.staffSites = []
      mainMap.set(s.id, s)
    } else {
      children.push(s)
    }
  }
  for (const c of children) {
    const parent = mainMap.get(c.parent_site_id)
    if (parent) parent.staffSites.push(c)
    else { c.staffSites = []; mainMap.set(c.id, c) } // orphan
  }
  const siteRows = [...mainMap.values()]

  const publishedCount = rows.filter(r => r.is_published).length
  const draftCount     = rows.length - publishedCount

  res.render('dashboard/index.njk', {
    title: 'Dashboard',
    user,
    sites:    rows,      // flat array — used for data island / openInfoModal
    siteRows,            // grouped array — used for table rendering
    categories: categories || [],
    publishedCount,
    draftCount,
    flash_success: req.flash('success')
  })
}

exports.wizard = async (req, res) => {
  const allThemes = themeManager.loadAll()
  // Send a simplified list: slug, name, for[], previewUrl, hasPreview
  const themes = Object.values(allThemes).map(t => ({
    slug:        t.slug,
    name:        t.name,
    for:         t.for || ['all'],
    previewUrl:  t.previewUrl,
    hasPreview:  t.hasPreview,
    description: t.description || '',
    categories:  t.categories  || ['other'],
    tags:        t.tags        || [],
    order:       t.order       || 99
  }))
  const categories = await db.query('SELECT id, name, icon FROM ms_categories WHERE status = 1 ORDER BY sort_order ASC, name ASC')
  res.render('dashboard/wizard.njk', { title: 'Create your site', user: req.session.user, themes, categories: categories || [] })
}

exports.templates = async (req, res) => {
  const user    = req.session.user
  const siteId  = parseInt(req.query.id) || 0
  const fromNew = !!req.query.new

  const site = await db.first('SELECT * FROM ms_sites WHERE id = ? AND account_id = ?', [siteId, user.id])
  if (!site) return res.redirect('/dashboard')

  const settings  = JSON.parse(site.settings || '{}')
  const allThemes = themeManager.loadAll()

  res.render('dashboard/templates.njk', { title: 'Choose Template', user, site, settings, allThemes, fromNew })
}

exports.builder = async (req, res) => {
  const user   = req.session.user
  const siteId = parseInt(req.query.id) || 0

  const site = await db.first('SELECT * FROM ms_sites WHERE id = ? AND account_id = ?', [siteId, user.id])
  if (!site) return res.redirect('/dashboard')

  const settings     = JSON.parse(site.settings || '{}')
  const themeSlug    = settings.template_id || site.template_id || 'minimal'
  const themeData    = themeManager.loadTheme(themeSlug) || themeManager.loadTheme('minimal')
  const themeOnlySections = themeData ? (themeData.sections || []) : []
  const globalSections    = themeManager.loadGlobalSections()
  // Merge global sections in, avoiding duplicates with theme sections
  const themeSecIds   = new Set(themeOnlySections.map(s => s.id))
  const themeSections = [
    ...themeOnlySections,
    ...globalSections.filter(s => !themeSecIds.has(s.id))
  ]
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

exports.biolinkBuilder = async (req, res) => {
  const user   = req.session.user
  const siteId = parseInt(req.query.id) || 0

  const site = await db.first('SELECT * FROM ms_sites WHERE id = ? AND account_id = ?', [siteId, user.id])
  if (!site) return res.redirect('/dashboard')

  const settings   = JSON.parse(site.settings || '{}')

  // Universal block model — blocks[] and appearance{} live directly in settings.
  // For brand-new sites (no blocks yet), seed from the theme's default_blocks and
  // immediately persist to DB so the live site URL shows content right away.
  const themeSlug  = (settings.template_id || site.template_id || 'biolink-creator').replace(/[^a-z0-9-]/g, '')
  const themeData  = themeManager.loadAll()[themeSlug] || {}
  const isNew      = !settings.blocks || !settings.blocks.length

  if (isNew && themeData.default_blocks && themeData.default_blocks.length) {
    settings.blocks     = themeData.default_blocks
    settings.appearance = settings.appearance && Object.keys(settings.appearance).length
                            ? settings.appearance
                            : (themeData.default_appearance || {})
    await db.execute('UPDATE ms_sites SET settings = ? WHERE id = ?',
      [JSON.stringify(settings), siteId])
  }

  const blocks     = settings.blocks     || []
  const appearance = settings.appearance || {}
  const seo        = settings.seo        || {}

  res.render('dashboard/biolink-builder.njk', {
    title: 'Bio Link Editor',
    user,
    site,
    settings,
    blocks,
    appearance,
    seo,
    baseDomain: process.env.BASE_DOMAIN || 'pagezapper.com'
  })
}

exports.settings = async (req, res) => {
  const user = req.session.user
  const site = await db.first('SELECT * FROM ms_sites WHERE account_id = ? LIMIT 1', [user.id])
  const categories = await db.query('SELECT id, name, icon FROM ms_categories WHERE status = 1 ORDER BY sort_order ASC, name ASC')
  res.render('dashboard/settings.njk', {
    title: 'Settings',
    user,
    site: site || null,
    categories: categories || [],
    flash_success: req.flash('success'),
    flash_errors:  req.flash('errors')
  })
}

exports.updateSettings = async (req, res) => {
  const user = req.session.user
  const { name, category_id } = req.body

  if (name) {
    await db.execute('UPDATE ms_accounts SET name = ? WHERE id = ?', [name, user.id])
    const updated = await db.first('SELECT * FROM ms_accounts WHERE id = ?', [user.id])
    req.session.user = updated
  }

  if (category_id !== undefined) {
    const catId = parseInt(category_id) || null
    await db.execute('UPDATE ms_sites SET category_id = ? WHERE account_id = ?', [catId, user.id])
  }

  // Re-geocode if city changed
  const { city: newCity } = req.body
  if (newCity) {
    const site = await db.first('SELECT id FROM ms_sites WHERE account_id = ? LIMIT 1', [user.id])
    if (site) {
      geocodeCity(newCity).then(geo => {
        if (geo) db.execute('UPDATE ms_sites SET lat=?, lng=?, state=? WHERE id=?', [geo.lat, geo.lng, geo.state, site.id])
      }).catch(() => {})
    }
  }

  req.flash('success', 'Settings updated.')
  res.redirect('/dashboard/settings')
}

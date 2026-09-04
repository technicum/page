const { db }          = require('../config/db')
const themeManager    = require('../config/themeManager')
const { geocodeCity } = require('../config/geocode')

// ── Dashboard home helpers ────────────────────────────────────────────────────
function timeAgo(date) {
  if (!date) return ''
  const diff = Math.floor((Date.now() - new Date(date).getTime()) / 1000)
  if (diff < 60)     return 'just now'
  if (diff < 3600)   return Math.floor(diff / 60) + 'm ago'
  if (diff < 86400)  return Math.floor(diff / 3600) + 'h ago'
  if (diff < 172800) return 'Yesterday'
  if (diff < 604800) return Math.floor(diff / 86400) + 'd ago'
  return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

const LEAD_SOURCE_META = {
  product: { badge: 'Lead',    icon: '🎯' },
  manual:  { badge: 'Lead',    icon: '🎯' },
  form:    { badge: 'Form',    icon: '📋' },
  booking: { badge: 'Booking', icon: '📅' },
  chat:    { badge: 'Chat',    icon: '💬' }
}

function leadSnippet(l) {
  if (l.notes) return l.notes.split('\n')[0].slice(0, 100)
  if (l.source === 'form')    return 'Submitted a contact form'
  if (l.source === 'booking') return 'Booked an appointment'
  if (l.source === 'chat')    return 'Started a chat conversation'
  return 'Added as a new lead'
}

// ── Dashboard home — account-wide overview stats ─────────────────────────────
exports.index = async (req, res) => {
  const user = req.session.user

  const [siteRow, leadRow, formRow, bookingRow, productRow, bookingSetupRow, firstSite, recentLeads] = await Promise.all([
    db.first('SELECT COUNT(*) AS c FROM ms_sites WHERE account_id = ?', [user.id]),
    db.first(
      `SELECT COUNT(*) AS c FROM ms_leads l
       JOIN ms_sites s ON l.site_id = s.id
       WHERE s.account_id = ?`, [user.id]
    ).catch(() => ({ c: 0 })),
    db.first('SELECT COUNT(*) AS c FROM ms_forms WHERE account_id = ?', [user.id]).catch(() => ({ c: 0 })),
    db.first(
      `SELECT COUNT(*) AS c FROM ms_bookings b
       JOIN ms_sites s ON b.site_id = s.id
       WHERE s.account_id = ? AND b.status = 'confirmed'`, [user.id]
    ).catch(() => ({ c: 0 })),
    db.first('SELECT COUNT(*) AS c FROM ms_products WHERE account_id = ?', [user.id]).catch(() => ({ c: 0 })),
    db.first(
      `SELECT COUNT(*) AS c FROM ms_booking_events be
       JOIN ms_sites s ON be.site_id = s.id
       WHERE s.account_id = ? AND be.is_active = 1`, [user.id]
    ).catch(() => ({ c: 0 })),
    db.first('SELECT title, subdomain FROM ms_sites WHERE account_id = ? ORDER BY id ASC LIMIT 1', [user.id]).catch(() => null),
    db.query(
      `SELECT l.name, l.source, l.notes, l.created_at, s.title AS site_title
       FROM ms_leads l
       JOIN ms_sites s ON l.site_id = s.id
       WHERE s.account_id = ?
       ORDER BY l.created_at DESC
       LIMIT 4`, [user.id]
    ).catch(() => [])
  ])

  const siteCount    = (siteRow    && siteRow.c)    || 0
  const leadCount    = (leadRow    && leadRow.c)    || 0
  const formCount    = (formRow    && formRow.c)    || 0
  const bookingCount = (bookingRow && bookingRow.c) || 0
  const productCount = (productRow && productRow.c) || 0
  const bookingSetUp = ((bookingSetupRow && bookingSetupRow.c) || 0) > 0

  const stepDone = {
    site:    siteCount    > 0,
    form:    formCount    > 0,
    product: productCount > 0,
    booking: bookingSetUp
  }
  // "Connect your leads" (Google Sheets sync) isn't built yet, so it's shown as a bonus
  // row but doesn't count toward the checklist total — otherwise it could never be 100%.
  const totalSteps     = Object.keys(stepDone).length
  const completedSteps = Object.values(stepDone).filter(Boolean).length

  const baseDomain = process.env.BASE_DOMAIN || 'pagezapper.com'
  const siteUrl    = firstSite ? `https://${firstSite.subdomain}.${baseDomain}` : null

  const activity = (recentLeads || []).map(l => {
    const meta = LEAD_SOURCE_META[l.source] || LEAD_SOURCE_META.manual
    return {
      icon:       meta.icon,
      badge:      meta.badge,
      badgeClass: meta.badge.toLowerCase(),
      name:       l.name || 'Someone',
      snippet:    leadSnippet(l),
      site_title: l.site_title,
      time:       timeAgo(l.created_at)
    }
  })

  res.render('dashboard/overview.njk', {
    title: 'Dashboard',
    user,
    activePage: 'dashboard',
    siteCount, leadCount, formCount, bookingCount, productCount,
    stepDone,
    completedSteps,
    totalSteps,
    siteUrl,
    firstSiteName: firstSite ? firstSite.title : null,
    activity,
    flash_success: req.flash('success')
  })
}

// ── Mini Site listing — every site the account has created ──────────────────
exports.miniSites = async (req, res) => {
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
    title: 'Mini Sites',
    user,
    activePage: 'minisites',
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
    slug:               t.slug,
    name:               t.name,
    for:                t.for || ['all'],
    previewUrl:         t.previewUrl,
    hasPreview:         t.hasPreview,
    description:        t.description || '',
    categories:         t.categories  || ['other'],
    tags:               t.tags        || [],
    order:              t.order       || 99,
    default_appearance: t.default_appearance || {}
  }))
  const categories = await db.query('SELECT id, name, icon, slug FROM ms_categories WHERE status = 1 ORDER BY sort_order ASC, name ASC')
  res.render('dashboard/wizard.njk', { title: 'Create your site', user: req.session.user, themes, categories: categories || [], baseDomain: process.env.BASE_DOMAIN || 'pagezapper.com' })
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

  // Named collections for the products_grid block picker
  let productCollections = []
  try {
    const colRows = await db.query(
      'SELECT name FROM ms_collections WHERE account_id = ? ORDER BY sort_order ASC, name ASC',
      [user.id]
    )
    productCollections = (colRows || []).map(r => r.name)
  } catch(e) { /* ms_collections table may not exist yet */ }

  // User's forms for the form block dropdown
  let userForms = []
  try {
    userForms = await db.query(
      'SELECT id, name FROM ms_forms WHERE account_id = ? ORDER BY name ASC',
      [user.id]
    ) || []
  } catch(e) { /* ignore */ }

  // Booking events for the booking block picker
  let userBookingEvents = []
  try {
    userBookingEvents = await db.query(
      'SELECT id, name, duration, event_type FROM ms_booking_events WHERE site_id = ? AND is_active = 1 ORDER BY created_at ASC',
      [siteId]
    ) || []
  } catch(e) { /* ignore */ }

  let siteAppsJson = '{}'
  try { siteAppsJson = JSON.stringify(JSON.parse(site.apps || '{}')) } catch(e) {}

  res.render('dashboard/biolink-builder.njk', {
    title: 'Bio Link Editor',
    user,
    site,
    settings,
    blocks,
    appearance,
    seo,
    productCollections,
    userForms,
    userBookingEvents,
    siteAppsJson,
    baseDomain: process.env.BASE_DOMAIN || 'pagezapper.com',
    serverIp:   process.env.SERVER_IP   || ''
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

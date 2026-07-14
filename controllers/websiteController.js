const { db } = require('../config/db')
const { v4: uuidv4 } = require('uuid')

/* ── helpers ────────────────────────────────────────────────────────────────── */
function slug(str) {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

function parseJSON(raw, fallback) {
  try { return JSON.parse(raw) } catch { return fallback }
}

function parseMeta(raw) {
  if (!raw) return {}
  if (typeof raw === 'object') return raw
  try { return JSON.parse(raw) } catch { return {} }
}

/* ═══════════════════════════════════════════════════════════════════════════════
   DASHBOARD — list all websites
   GET /dashboard/website
   ═══════════════════════════════════════════════════════════════════════════ */
exports.index = async (req, res) => {
  const user = req.session.user
  try {
    const websites = await db.query(
      'SELECT * FROM ms_websites WHERE account_id = ? ORDER BY created_at DESC',
      [user.id]
    )
    ;(websites || []).forEach(w => { w.settings = parseJSON(w.settings, {}) })
    res.render('dashboard/website-list.njk', {
      title: 'Website Builder', activePage: 'website', user, websites: websites || []
    })
  } catch(e) {
    console.error('[website.index]', e.message)
    res.render('dashboard/website-list.njk', {
      title: 'Website Builder', activePage: 'website', user, websites: [],
      error: 'Could not load websites. ' + e.message
    })
  }
}

/* ═══════════════════════════════════════════════════════════════════════════════
   CREATE website
   POST /dashboard/website/create
   ═══════════════════════════════════════════════════════════════════════════ */
exports.create = async (req, res) => {
  const user = req.session.user
  const { title } = req.body
  try {
    const base = slug(title || 'my-website')
    let sub = base, n = 1
    while (true) {
      const ex = await db.first('SELECT id FROM ms_websites WHERE subdomain = ?', [sub])
      if (!ex) break
      sub = base + '-' + (n++)
    }
    const settings = JSON.stringify({
      font: 'Inter', primary: '#6366f1', text: '#111827',
      bg: '#ffffff', logo: '', tagline: ''
    })
    const result = await db.execute(
      'INSERT INTO ms_websites (account_id, title, subdomain, settings) VALUES (?,?,?,?)',
      [user.id, title || 'My Website', sub, settings]
    )
    const websiteId = result.insertId

    // Create default Home page in ms_posts
    const homeSections = JSON.stringify([
      { id: uuidv4(), type: 'hero',     data: { headline: `Welcome to ${title || 'My Website'}`, subheadline: 'We deliver exceptional results', cta_label: 'Get Started', cta_url: '#contact', bg_color: '#6366f1', text_color: '#ffffff' } },
      { id: uuidv4(), type: 'about',    data: { heading: 'About Us', text: 'Tell your story here. What makes you unique?', image: '', layout: 'image_right' } },
      { id: uuidv4(), type: 'services', data: { heading: 'Our Services', items: [{ icon: '⚡', title: 'Service One', desc: 'Description' }, { icon: '🎯', title: 'Service Two', desc: 'Description' }, { icon: '💎', title: 'Service Three', desc: 'Description' }] } },
      { id: uuidv4(), type: 'contact',  data: { heading: 'Get in Touch', email: '', phone: '', address: '', show_form: true } }
    ])
    const homeMeta = JSON.stringify({ is_home: 1, seo_title: '', seo_desc: '' })

    try {
      await db.execute(
        `INSERT INTO ms_posts (account_id, website_id, post_type, title, slug, status, sections, meta)
         VALUES (?,?,?,?,?,?,?,?)`,
        [user.id, websiteId, 'page', 'Home', 'home', 'published', homeSections, homeMeta]
      )
    } catch(e) {
      console.error('[website.create] ms_posts insert failed:', e.message, '| columns:', e.sql || '')
      // Continue anyway — website was created, pages just won't load
    }

    res.redirect('/dashboard/website/' + websiteId + '/editor')
  } catch(e) {
    console.error('[website.create] failed:', e.message)
    res.redirect('/dashboard/website?error=' + encodeURIComponent(e.message))
  }
}

/* ═══════════════════════════════════════════════════════════════════════════════
   EDITOR — section builder for a website
   GET /dashboard/website/:id/editor
   ═══════════════════════════════════════════════════════════════════════════ */
exports.editor = async (req, res) => {
  const user = req.session.user
  const websiteId = parseInt(req.params.id)
  try {
    const website = await db.first(
      'SELECT * FROM ms_websites WHERE id = ? AND account_id = ?', [websiteId, user.id]
    )
    if (!website) return res.redirect('/dashboard/website')
    website.settings = parseJSON(website.settings, {})

    const pageId = parseInt(req.query.page) || null
    let pages = []
    try {
      pages = await db.query(
        `SELECT *, JSON_EXTRACT(meta,'$.is_home') AS is_home, JSON_EXTRACT(meta,'$.seo_title') AS seo_title, JSON_EXTRACT(meta,'$.seo_desc') AS seo_desc
         FROM ms_posts WHERE website_id = ? AND post_type = 'page' ORDER BY sort_order ASC, id ASC`,
        [websiteId]
      ) || []
    } catch(e) {
      console.error('[editor] ms_posts query failed — run unify_posts.sql migration:', e.message)
      pages = []
    }

    pages.forEach(p => {
      p.sections = parseJSON(p.sections, [])
      p.is_home   = p.is_home == 1 || p.is_home === '1' || p.is_home === true
      p.is_published = p.status === 'published' ? 1 : 0
    })

    let activeSitePage = pages.find(p => p.id === pageId) || pages.find(p => p.is_home) || pages[0] || null

    res.render('dashboard/website-editor.njk', {
      title: website.title + ' — Editor',
      activePage: 'website',
      user, website, pages, activeSitePage
    })
  } catch(e) {
    console.error('[editor] error:', e.message)
    res.redirect('/dashboard/website')
  }
}

/* ═══════════════════════════════════════════════════════════════════════════════
   SAVE sections for a page
   POST /dashboard/website/:id/page/:pageId/save
   ═══════════════════════════════════════════════════════════════════════════ */
exports.saveSections = async (req, res) => {
  const user = req.session.user
  const websiteId = parseInt(req.params.id)
  const pageId    = parseInt(req.params.pageId)
  const website = await db.first('SELECT id FROM ms_websites WHERE id=? AND account_id=?', [websiteId, user.id])
  if (!website) return res.json({ ok: false, error: 'Not found' })

  const sections = req.body.sections
  await db.execute(
    `UPDATE ms_posts SET sections=?, updated_at=NOW()
     WHERE id=? AND website_id=? AND post_type='page'`,
    [JSON.stringify(sections), pageId, websiteId]
  )
  res.json({ ok: true })
}

/* ═══════════════════════════════════════════════════════════════════════════════
   ADD PAGE
   POST /dashboard/website/:id/page/add
   ═══════════════════════════════════════════════════════════════════════════ */
exports.addPage = async (req, res) => {
  const user = req.session.user
  const websiteId = parseInt(req.params.id)
  const website = await db.first('SELECT id FROM ms_websites WHERE id=? AND account_id=?', [websiteId, user.id])
  if (!website) return res.json({ ok: false })
  const { title } = req.body
  const s = slug(title || 'page')
  const meta = JSON.stringify({ is_home: 0, seo_title: '', seo_desc: '' })
  const result = await db.execute(
    `INSERT INTO ms_posts (account_id, website_id, post_type, title, slug, status, sections, meta)
     VALUES (?,?,?,?,?,?,?,?)`,
    [user.id, websiteId, 'page', title || 'New Page', s, 'published', '[]', meta]
  )
  res.json({ ok: true, page: { id: result.insertId, title: title || 'New Page', slug: s, sections: [], is_home: 0, is_published: 1 } })
}

/* ═══════════════════════════════════════════════════════════════════════════════
   DELETE PAGE
   POST /dashboard/website/:id/page/:pageId/delete
   ═══════════════════════════════════════════════════════════════════════════ */
exports.deletePage = async (req, res) => {
  const user = req.session.user
  const websiteId = parseInt(req.params.id)
  const pageId    = parseInt(req.params.pageId)
  const website = await db.first('SELECT id FROM ms_websites WHERE id=? AND account_id=?', [websiteId, user.id])
  if (!website) return res.json({ ok: false })
  const page = await db.first(
    `SELECT meta FROM ms_posts WHERE id=? AND website_id=? AND post_type='page'`,
    [pageId, websiteId]
  )
  if (!page) return res.json({ ok: false, error: 'Page not found' })
  const m = parseMeta(page.meta)
  if (m.is_home) return res.json({ ok: false, error: 'Cannot delete home page' })
  await db.execute(`DELETE FROM ms_posts WHERE id=? AND website_id=? AND post_type='page'`, [pageId, websiteId])
  res.json({ ok: true })
}

/* ═══════════════════════════════════════════════════════════════════════════════
   RENAME PAGE
   POST /dashboard/website/:id/page/:pageId/rename
   ═══════════════════════════════════════════════════════════════════════════ */
exports.renamePage = async (req, res) => {
  const user = req.session.user
  const websiteId = parseInt(req.params.id)
  const pageId    = parseInt(req.params.pageId)
  const website = await db.first('SELECT id FROM ms_websites WHERE id=? AND account_id=?', [websiteId, user.id])
  if (!website) return res.json({ ok: false })
  const { title } = req.body
  const s = slug(title || 'page')
  await db.execute(
    `UPDATE ms_posts SET title=?, slug=? WHERE id=? AND website_id=? AND post_type='page'`,
    [title, s, pageId, websiteId]
  )
  res.json({ ok: true })
}

/* ═══════════════════════════════════════════════════════════════════════════════
   SAVE SETTINGS
   POST /dashboard/website/:id/settings
   ═══════════════════════════════════════════════════════════════════════════ */
exports.saveSettings = async (req, res) => {
  const user = req.session.user
  const websiteId = parseInt(req.params.id)
  const website = await db.first('SELECT * FROM ms_websites WHERE id=? AND account_id=?', [websiteId, user.id])
  if (!website) return res.json({ ok: false })
  const existing = parseJSON(website.settings, {})
  const updated = Object.assign(existing, {
    font:    req.body.font    || existing.font,
    primary: req.body.primary || existing.primary,
    text:    req.body.text    || existing.text,
    bg:      req.body.bg      || existing.bg,
    logo:    req.body.logo    !== undefined ? req.body.logo    : existing.logo,
    tagline: req.body.tagline !== undefined ? req.body.tagline : existing.tagline,
    theme:   req.body.theme   || existing.theme || 'default'
  })
  const newTitle = req.body.title || website.title
  await db.execute(
    'UPDATE ms_websites SET title=?, settings=?, updated_at=NOW() WHERE id=?',
    [newTitle, JSON.stringify(updated), websiteId]
  )
  res.json({ ok: true })
}

/* ═══════════════════════════════════════════════════════════════════════════════
   SAVE SEO for a page
   POST /dashboard/website/:id/page/:pageId/seo
   ═══════════════════════════════════════════════════════════════════════════ */
exports.saveSEO = async (req, res) => {
  const user = req.session.user
  const websiteId = parseInt(req.params.id)
  const pageId    = parseInt(req.params.pageId)
  const website = await db.first('SELECT id FROM ms_websites WHERE id=? AND account_id=?', [websiteId, user.id])
  if (!website) return res.json({ ok: false })

  // Update seo fields inside meta JSON
  const page = await db.first(
    `SELECT meta FROM ms_posts WHERE id=? AND website_id=? AND post_type='page'`,
    [pageId, websiteId]
  )
  if (!page) return res.json({ ok: false })
  const m = parseMeta(page.meta)
  m.seo_title = req.body.seo_title || ''
  m.seo_desc  = req.body.seo_desc  || ''
  await db.execute(
    `UPDATE ms_posts SET meta=? WHERE id=? AND website_id=? AND post_type='page'`,
    [JSON.stringify(m), pageId, websiteId]
  )
  res.json({ ok: true })
}

/* ═══════════════════════════════════════════════════════════════════════════════
   PUBLISH / UNPUBLISH
   POST /dashboard/website/:id/publish
   ═══════════════════════════════════════════════════════════════════════════ */
exports.publish = async (req, res) => {
  const user = req.session.user
  const websiteId = parseInt(req.params.id)
  const website = await db.first('SELECT * FROM ms_websites WHERE id=? AND account_id=?', [websiteId, user.id])
  if (!website) return res.json({ ok: false })
  const newState = website.is_published ? 0 : 1
  await db.execute('UPDATE ms_websites SET is_published=? WHERE id=?', [newState, websiteId])
  res.json({ ok: true, published: !!newState })
}

/* ═══════════════════════════════════════════════════════════════════════════════
   DELETE WEBSITE
   POST /dashboard/website/:id/delete
   ═══════════════════════════════════════════════════════════════════════════ */
exports.destroy = async (req, res) => {
  const user = req.session.user
  const websiteId = parseInt(req.params.id)
  // Delete all pages from ms_posts first
  await db.execute(`DELETE FROM ms_posts WHERE website_id=? AND post_type='page'`, [websiteId])
  await db.execute('DELETE FROM ms_websites WHERE id=? AND account_id=?', [websiteId, user.id])
  res.redirect('/dashboard/website')
}

/* ═══════════════════════════════════════════════════════════════════════════════
   PUBLIC — render website
   GET /w/:subdomain
   GET /w/:subdomain/:pageSlug
   ═══════════════════════════════════════════════════════════════════════════ */
exports.publicSite = async (req, res) => {
  const { subdomain, pageSlug } = req.params
  const website = await db.first(
    'SELECT * FROM ms_websites WHERE subdomain = ? AND is_published = 1', [subdomain]
  )
  if (!website) return res.status(404).send('Website not found')
  website.settings = parseJSON(website.settings, {})

  const pages = await db.query(
    `SELECT *, JSON_EXTRACT(meta,'$.is_home') AS is_home, JSON_EXTRACT(meta,'$.seo_title') AS seo_title, JSON_EXTRACT(meta,'$.seo_desc') AS seo_desc
     FROM ms_posts WHERE website_id=? AND post_type='page' AND status='published' ORDER BY sort_order ASC, id ASC`,
    [website.id]
  )
  pages.forEach(p => {
    p.sections  = parseJSON(p.sections, [])
    p.is_home   = p.is_home == 1 || p.is_home === '1' || p.is_home === true
    p.is_published = 1
  })
  if (!pages.length) return res.status(404).send('No pages published')

  const current = pages.find(p => p.slug === pageSlug) ||
                  pages.find(p => p.is_home) ||
                  pages[0]

  res.render('website-public.njk', { website, pages, current })
}

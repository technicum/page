const { db }               = require('../config/db')
const themeManager         = require('../config/themeManager')
const { loadFormsForAccount } = require('../controllers/formController')

async function subdomainMiddleware(req, res, next) {
  // req.hostname respects trust proxy and reads the real host header
  // On Hostinger/cPanel, also check X-Forwarded-Host if hostname is still localhost
  let host = req.hostname
  if (!host || host === 'localhost' || host === '127.0.0.1') {
    host = req.headers['x-forwarded-host'] || req.headers['host'] || ''
    host = host.split(':')[0] // strip port
  }

  const baseDomain = process.env.BASE_DOMAIN
  if (!baseDomain) return next()

  const isSubdomain   = host !== baseDomain && host.endsWith('.' + baseDomain)
  const isCustom      = host !== baseDomain && !host.endsWith('.' + baseDomain)

  if (!isSubdomain && !isCustom) return next()

  if (isSubdomain) {
    const sub = host.replace('.' + baseDomain, '').toLowerCase()
    // Ignore 'www' subdomain — let it pass to the main app
    if (sub === 'www') return next()
    return serveSite(req, res, next, { subdomain: sub })
  }

  return serveSite(req, res, next, { customDomain: host })
}

async function serveSite(req, res, next, lookup) {
  try {
    // ── Find the site ──────────────────────────────────────────────────────────
    let site
    if (lookup.subdomain) {
      site = await db.first(
        `SELECT s.*, u.name as owner_name
         FROM ms_sites s
         JOIN ms_accounts u ON u.id = s.account_id
         WHERE s.subdomain = ?`,
        [lookup.subdomain]
      )
    } else {
      site = await db.first(
        `SELECT s.*, u.name as owner_name
         FROM ms_sites s
         JOIN ms_accounts u ON u.id = s.account_id
         WHERE s.custom_domain = ?`,
        [lookup.customDomain]
      )
    }

    if (!site) {
      return res.status(404).send(page404(lookup.subdomain || lookup.customDomain))
    }

    // Draft sites are not publicly accessible
    if (!site.is_published) {
      return res.status(200).send(pageDraft(site))
    }

    const settings  = JSON.parse(site.settings || '{}')
    // Mini Site pages always use the universal block renderer regardless of stored template_id
    const rawSlug   = settings.template_id || site.template_id || 'minimal'
    const isMiniSite = rawSlug.startsWith('biolink-') || site.category === 'minisite' || site.category === 'linktree'
    const slug      = isMiniSite ? 'biolink-creator' : rawSlug
    const rawPath   = req.path.replace(/^\/+|\/+$/g, '') || 'home'
    const pathParts = rawPath.split('/')
    const pageId    = pathParts[0] || 'home'
    const subPath   = pathParts[1] || null

    // ── If this site is itself a staff site (accessed by synthetic subdomain),
    //    redirect to the canonical parent/slug URL ────────────────────────────
    if (site.parent_site_id && site.path_slug) {
      const parent = await db.first('SELECT subdomain FROM ms_sites WHERE id = ?', [site.parent_site_id])
      if (parent) {
        const base = process.env.BASE_DOMAIN || 'pagezapper.com'
        return res.redirect(301, `https://${parent.subdomain}.${base}/${site.path_slug}`)
      }
    }

    // ── Pass API requests to main router ──────────────────────────────────────
    if (rawPath.startsWith('api/')) return next()

    // ── Pass review pages to main router ──────────────────────────────────────
    if (rawPath.startsWith('review/') || rawPath === 'review') return next()

    // ── Special routes: sitemap.xml ────────────────────────────────────────────
    if (rawPath === 'sitemap.xml') {
      return serveSitemap(req, res, site, settings)
    }

    // ── Special routes: robots.txt ─────────────────────────────────────────────
    if (rawPath === 'robots.txt') {
      const siteUrl = `https://${site.subdomain}.${process.env.BASE_DOMAIN || 'pagezapper.com'}`
      res.type('text/plain')
      return res.send(
        `User-agent: *\nAllow: /\n\nSitemap: ${siteUrl}/sitemap.xml\n`
      )
    }

    // ── PWA: manifest.json ─────────────────────────────────────────────────────
    if (rawPath === 'manifest.json') {
      const siteName   = site.title || site.subdomain
      const siteAvatar = (settings.profile && (settings.profile.avatar || settings.profile.logo)) ||
                         settings.logo || null
      // Chrome requires explicit 192x192 and 512x512 declarations to fire beforeinstallprompt
      const iconSrc = siteAvatar || `${process.env.APP_URL || 'https://pagezaper.com'}/favicon.ico`
      const iconType = siteAvatar ? 'image/png' : 'image/x-icon'
      const icons = [
        { src: iconSrc, sizes: '192x192', type: iconType, purpose: 'any maskable' },
        { src: iconSrc, sizes: '512x512', type: iconType, purpose: 'any maskable' }
      ]
      const manifest = {
        name:             siteName,
        short_name:       siteName.length > 12 ? siteName.substring(0, 12) : siteName,
        start_url:        '/',
        display:          'standalone',
        theme_color:      (settings.profile && settings.profile.accent) || '#2563eb',
        background_color: '#ffffff',
        icons
      }
      res.set('Content-Type', 'application/manifest+json')
      res.set('Cache-Control', 'public, max-age=3600')
      return res.json(manifest)
    }

    // ── PWA: service worker ────────────────────────────────────────────────────
    if (rawPath === 'sw.js') {
      res.set('Content-Type', 'application/javascript')
      res.set('Cache-Control', 'no-cache')
      return res.send(`// PageZaper PWA service worker
self.addEventListener('install',function(e){self.skipWaiting();});
self.addEventListener('activate',function(e){e.waitUntil(clients.claim());});
self.addEventListener('fetch',function(e){});`)
    }

    // ── Standalone booking pages ──────────────────────────────────────────────
    if (pageId === 'book') {
      // /book → all meetings; /book/123 → direct link to event 123
      return serveBookingPage(req, res, site, settings, 'meeting', subPath || null)
    }
    if (pageId === 'appointment') {
      return serveBookingPage(req, res, site, settings, 'appointment', subPath || null)
    }

    // ── Blog: post detail (/blog/my-post-slug) ─────────────────────────────────
    if (pageId === 'blog' && subPath) {
      const post = await db.first(
        `SELECT * FROM ms_posts WHERE site_id = ? AND slug = ? AND status = 'published'`,
        [site.id, subPath]
      )
      if (!post) return res.status(404).send('<h1>Post not found</h1>')
      const html = await themeManager.renderPost(slug, site, settings, post)
      return res.send(html)
    }

    // ── Blog: listing (/blog) ──────────────────────────────────────────────────
    if (pageId === 'blog') {
      const posts = await db.query(
        `SELECT id, title, slug, excerpt, created_at FROM ms_posts
         WHERE site_id = ? AND status = 'published'
         ORDER BY created_at DESC`,
        [site.id]
      )
      const html = await themeManager.renderBlog(slug, site, settings, posts)
      return res.send(html)
    }

    // ── Staff / employee bio link subpath (/staffslug) ────────────────────────
    // Checked BEFORE normal page render so staff slugs take priority over page IDs
    if (rawPath && rawPath !== 'home') {
      const staffSite = await db.first(
        `SELECT s.*, u.name as owner_name
         FROM ms_sites s
         JOIN ms_accounts u ON u.id = s.account_id
         WHERE s.parent_site_id = ? AND s.path_slug = ?`,
        [site.id, pageId]
      )
      if (staffSite) {
        const staffSettings  = JSON.parse(staffSite.settings || '{}')
        // Inject parent business name so the theme can show it as a company badge
        if (!staffSettings.profile) staffSettings.profile = {}
        if (!staffSettings.profile.company) staffSettings.profile.company = site.title
        if (!staffSettings.profile.company_url) {
          const base = process.env.BASE_DOMAIN || 'pagezapper.com'
          staffSettings.profile.company_url = `https://${site.subdomain}.${base}`
        }
        const staffRawSlug   = staffSettings.template_id || staffSite.template_id || 'biolink-creator'
        const staffThemeSlug = staffRawSlug.startsWith('biolink-') ? 'biolink-creator' : staffRawSlug
        let   staffForms     = {}
        try { staffForms = await loadFormsForAccount(staffSite.account_id) } catch(e) {}
        const html = await themeManager.render(staffThemeSlug, staffSite, staffSettings, 'home', staffForms)
        return res.send(html)
      }
    }

    // ── Normal page render ─────────────────────────────────────────────────────
    // If site is unpublished, only block from search but still serve
    let siteForms = {}
    try { siteForms = await loadFormsForAccount(site.account_id) } catch(e) { /* table may not exist yet */ }
    // Inject products so liquid templates can render products_grid blocks
    try {
      const siteProducts = await db.query(
        "SELECT id, type, name, description, price, compare_price, image_url, duration, in_stock, collection FROM ms_products WHERE account_id = ? AND status = 1 ORDER BY sort_order ASC, id ASC",
        [site.account_id]
      )
      // Parse collection JSON into a real array (_clist) for where_includes filter
      const parseCollections = (val) => {
        if (!val) return []
        try { const c = JSON.parse(val); return Array.isArray(c) ? c : (c ? [String(c)] : []) }
        catch(e) { return val.trim() ? [val.trim()] : [] }
      }
      ;(siteProducts || []).forEach(p => { p._clist = parseCollections(p.collection) })
      settings._products = siteProducts || []
    } catch(e) { settings._products = [] }
    let html = await themeManager.render(slug, site, settings, pageId, siteForms)

    // ── Inject chat widget ────────────────────────────────────────────────────
    const appUrl = process.env.APP_URL || 'https://pagezaper.com'
    const chatSnippet = `<script>window.PZ_CHAT_SITE_ID=${site.id};window.PZ_APP_URL="";<\/script><script src="${appUrl}/js/pz-chat.js" defer><\/script>`
    html = html.replace('</body>', chatSnippet + '</body>')

    // ── Inject owner edit bar ─────────────────────────────────────────────────
    const sessionUser = req.session && req.session.user
    const isOwner = sessionUser && Number(sessionUser.id) === Number(site.account_id)
    if (isOwner) {
      const isBiolink = slug.startsWith('biolink-')
      const editUrl   = isBiolink
        ? `${appUrl}/dashboard/site/biolink-builder?site=${site.id}`
        : `${appUrl}/dashboard/site/builder?site=${site.id}`
      const editBar = `<div id="pz-owner-bar" style="position:fixed;bottom:20px;right:20px;z-index:99999;display:flex;align-items:center;gap:8px;background:#1a1a18;border-radius:50px;padding:8px 16px 8px 12px;box-shadow:0 4px 20px rgba(0,0,0,0.25);font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <span style="font-size:13px;color:rgba(255,255,255,0.5);white-space:nowrap;">✏️</span>
  <a href="${editUrl}" style="font-size:13px;font-weight:600;color:#fff;text-decoration:none;white-space:nowrap;">Edit site</a>
</div>`
      html = html.replace('</body>', editBar + '</body>')
    }

    res.send(html)

  } catch (err) {
    console.error('[subdomain] Render error:', err.message)
    res.status(500).send(`<h1>Something went wrong</h1><pre style="font-size:12px;color:#666;">${err.message}</pre>`)
  }
}

// ── Sitemap XML ───────────────────────────────────────────────────────────────
async function serveSitemap(req, res, site, settings) {
  const base  = `https://${site.subdomain}.${process.env.BASE_DOMAIN || 'pagezapper.com'}`
  const today = new Date().toISOString().split('T')[0]

  const urls = [`<url><loc>${base}/</loc><lastmod>${today}</lastmod><priority>1.0</priority></url>`]

  // Add multi-page pages
  const themePages   = []
  const customPages  = settings.customPages || []
  ;[...themePages, ...customPages].forEach(p => {
    if (p.id !== 'home') {
      urls.push(`<url><loc>${base}/${p.id}</loc><lastmod>${today}</lastmod><priority>0.8</priority></url>`)
    }
  })

  // Add blog posts
  try {
    const posts = await db.query(
      `SELECT slug, updated_at FROM ms_posts WHERE site_id = ? AND status = 'published'`,
      [site.id]
    )
    posts.forEach(post => {
      const lastmod = post.updated_at ? post.updated_at.toISOString().split('T')[0] : today
      urls.push(`<url><loc>${base}/blog/${post.slug}</loc><lastmod>${lastmod}</lastmod><priority>0.7</priority></url>`)
    })
    if (posts.length) {
      urls.push(`<url><loc>${base}/blog</loc><lastmod>${today}</lastmod><priority>0.6</priority></url>`)
    }
  } catch(e) { /* ms_posts may not exist yet */ }

  res.type('application/xml')
  res.send(`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join('\n')}
</urlset>`)
}

// ── Standalone booking page ───────────────────────────────────────────────────
function serveBookingPage(req, res, site, settings, type, eventId) {
  type = type || 'meeting'
  eventId = eventId ? parseInt(eventId, 10) || null : null
  const sub      = site.subdomain
  const accent   = (settings.profile && settings.profile.accent) || '#2563eb'
  const siteName = (settings.profile && (settings.profile.name || settings.profile.title)) || site.title || sub
  const tagline  = (settings.profile && settings.profile.tagline) || ''
  const logo     = (settings.profile && settings.profile.avatar) || (settings.profile && settings.profile.logo) || ''

  const isAppt        = type === 'appointment'
  const pageTitle     = isAppt ? 'Book an Appointment'    : 'Schedule a Meeting'
  const pageSub       = isAppt ? 'Select the type of appointment you\'d like to schedule.' : 'Select the type of meeting you\'d like to schedule.'
  const step1Label    = isAppt ? 'Appointment type'       : 'Meeting type'
  const confirmBtn    = isAppt ? 'Confirm Appointment'    : 'Confirm Meeting'
  const successTitle  = isAppt ? 'Appointment Confirmed!' : 'Meeting Confirmed!'
  const successSub    = isAppt ? 'You\'re all set. See you soon.' : 'You\'re all set. A calendar invite will be sent to your email.'
  const newBookingLbl = isAppt ? 'Book another appointment' : 'Schedule another meeting'
  const notesLabel    = isAppt ? 'Reason for visit / Notes' : 'Agenda / Notes'
  const notesPh       = isAppt ? 'Briefly describe the reason for your visit...' : 'What would you like to discuss?'
  const typeParam     = type

  const logoHtml = logo
    ? `<img class="biz-logo-img" src="${logo}" alt="${siteName}">`
    : `<div class="biz-logo-init">${siteName.charAt(0).toUpperCase()}</div>`

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${pageTitle} — ${siteName}</title>
<style>
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
:root{--accent:${accent};--ink:#1a1a18;--ink-m:#6b6b66;--ink-f:#b0afa8;--white:#fff;--off:#f8f7f4;--border:rgba(26,26,24,0.09);--border-md:rgba(26,26,24,0.18);--r:10px;}
html,body{height:100%;margin:0;padding:0;}
body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;background:var(--off);color:var(--ink);}
a{color:inherit;text-decoration:none;}

/* ── Two-column layout ─────────────────── */
.page{display:flex;height:100vh;overflow:hidden;}

/* Left panel — scrolls independently */
.left-panel{width:260px;flex-shrink:0;background:var(--white);border-right:1px solid var(--border);display:flex;flex-direction:column;padding:28px 20px;overflow-y:auto;}
.biz-logo-img{width:52px;height:52px;border-radius:50%;object-fit:cover;margin-bottom:14px;}
.biz-logo-init{width:52px;height:52px;border-radius:50%;background:var(--accent);color:#fff;display:flex;align-items:center;justify-content:center;font-size:20px;font-weight:700;margin-bottom:14px;flex-shrink:0;}
.biz-name{font-size:16px;font-weight:700;color:var(--ink);margin-bottom:3px;}
.biz-tag{font-size:13px;color:var(--ink-m);}
.panel-divider{height:1px;background:var(--border);margin:22px 0;}
.panel-section-label{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:var(--ink-f);margin-bottom:12px;}
.panel-ev{display:flex;align-items:flex-start;gap:10px;margin-bottom:10px;}
.panel-ev-dot{width:10px;height:10px;border-radius:50%;background:var(--border-md);margin-top:3px;flex-shrink:0;transition:background .2s;}
.panel-ev-name{font-size:13px;font-weight:600;color:var(--ink-m);transition:color .2s;}
.panel-ev-meta{font-size:12px;color:var(--ink-f);margin-top:2px;}
.panel-datetime{margin-top:10px;}
.panel-date{font-size:13px;font-weight:600;color:var(--ink);margin-bottom:3px;display:flex;align-items:center;gap:7px;}
.panel-time{font-size:13px;color:var(--ink-m);display:flex;align-items:center;gap:7px;}
.panel-icon{font-size:13px;}
.panel-spacer{flex:1;}
.panel-back-link{display:inline-flex;align-items:center;gap:5px;font-size:12px;color:var(--ink-f);text-decoration:none;margin-bottom:12px;transition:color .15s;}
.panel-back-link:hover{color:var(--ink-m);}
.panel-footer{font-size:11px;color:var(--ink-f);}

/* Right panel — scrolls independently */
.right-panel{flex:1;display:flex;flex-direction:column;min-width:0;overflow-y:auto;}

/* Step bar */
.step-bar{display:flex;align-items:center;padding:20px 32px;background:var(--white);border-bottom:1px solid var(--border);gap:0;}
.step-item{display:flex;align-items:center;gap:8px;font-size:12px;font-weight:500;color:var(--ink-f);}
.step-item.active{color:var(--accent);}
.step-item.done{color:var(--ink-m);}
.step-num{width:22px;height:22px;border-radius:50%;border:1.5px solid var(--border-md);display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:600;flex-shrink:0;transition:all .2s;}
.step-item.active .step-num{background:var(--accent);border-color:var(--accent);color:#fff;}
.step-item.done .step-num{background:#dcfce7;border-color:#86efac;color:#16a34a;font-size:13px;}
.step-conn{flex:1;height:1px;background:var(--border);margin:0 10px;min-width:20px;transition:background .2s;}
.step-conn.done{background:#86efac;}

/* Step content */
.step-content{flex:1;padding:32px;}
.step{display:none;}.step.active{display:block;}
.step-title{font-size:20px;font-weight:700;margin-bottom:4px;}
.step-sub{font-size:14px;color:var(--ink-m);margin-bottom:24px;}

/* Back link */
.back-link{display:inline-flex;align-items:center;gap:6px;font-size:13px;color:var(--ink-m);margin-bottom:22px;cursor:pointer;}
.back-link:hover{color:var(--ink);}

/* Event cards */
.ev-list{display:flex;flex-direction:column;gap:10px;}
.ev-card{background:var(--white);border:1.5px solid var(--border);border-radius:var(--r);padding:16px 18px;cursor:pointer;transition:all .15s;display:flex;align-items:center;gap:14px;}
.ev-card:hover{border-color:var(--accent);box-shadow:0 2px 10px rgba(0,0,0,0.06);}
.ev-dot{width:12px;height:12px;border-radius:50%;flex-shrink:0;}
.ev-info{flex:1;}
.ev-name{font-size:15px;font-weight:600;margin-bottom:5px;}
.ev-meta{display:flex;align-items:center;gap:10px;flex-wrap:wrap;}
.ev-pill{display:inline-flex;align-items:center;gap:4px;padding:3px 9px;border-radius:20px;background:var(--off);border:1px solid var(--border);font-size:11px;font-weight:500;color:var(--ink-m);}
.ev-loc{font-size:12px;color:var(--ink-m);}
.ev-arr{font-size:18px;color:var(--ink-f);}

/* Calendar */
.cal-wrap{background:var(--white);border:1px solid var(--border);border-radius:var(--r);overflow:hidden;margin-bottom:22px;}
.cal-head{display:flex;align-items:center;justify-content:space-between;padding:14px 18px;border-bottom:1px solid var(--border);}
.cal-month{font-size:14px;font-weight:600;}
.cal-nav{background:none;border:1px solid var(--border);border-radius:7px;width:30px;height:30px;cursor:pointer;font-size:16px;display:flex;align-items:center;justify-content:center;color:var(--ink-m);}
.cal-nav:hover{background:var(--off);}
.cal-grid{display:grid;grid-template-columns:repeat(7,1fr);}
#calDays{display:contents;}
.cal-dh{font-size:10px;font-weight:700;color:var(--ink-f);text-align:center;padding:10px 0 6px;text-transform:uppercase;letter-spacing:.05em;}
.cal-day{text-align:center;padding:9px 4px;font-size:13px;color:var(--ink-f);cursor:default;}
.cal-day.avail{color:var(--ink);cursor:pointer;font-weight:500;}
.cal-day.avail:hover{background:color-mix(in srgb,var(--accent) 10%,#fff);border-radius:7px;}
.cal-day.selected{background:var(--accent);color:#fff;border-radius:7px;font-weight:700;}
.cal-day.today-mark{position:relative;}
.cal-day.today-mark::after{content:'';display:block;width:4px;height:4px;border-radius:50%;background:var(--accent);margin:2px auto 0;}

/* Slots */
.slots-section{margin-bottom:18px;}
.slots-section-label{font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:var(--ink-f);margin-bottom:9px;}
.slots-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(110px,1fr));gap:7px;}
.slot-btn{border:1.5px solid var(--border);background:var(--white);border-radius:8px;padding:9px 8px;font-size:13px;font-weight:500;cursor:pointer;transition:all .15s;text-align:center;color:var(--ink);}
.slot-btn:hover{border-color:var(--accent);color:var(--accent);}
.slot-btn.selected{background:var(--accent);border-color:var(--accent);color:#fff;}

/* Form */
.form-card{background:var(--white);border:1px solid var(--border);border-radius:var(--r);padding:22px;}
.form-section-label{font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:var(--ink-f);margin-bottom:14px;}
.form-group{margin-bottom:14px;}
.form-label{display:block;font-size:12px;font-weight:600;color:var(--ink-m);margin-bottom:5px;}
.form-input{width:100%;padding:10px 13px;border:1.5px solid var(--border-md);border-radius:8px;font-size:14px;font-family:inherit;color:var(--ink);background:var(--white);transition:border-color .15s;}
.form-input:focus{outline:none;border-color:var(--accent);}
.form-row{display:grid;grid-template-columns:1fr 1fr;gap:12px;}
.submit-btn{width:100%;padding:12px;background:var(--accent);color:#fff;border:none;border-radius:8px;font-size:15px;font-weight:600;cursor:pointer;margin-top:6px;transition:opacity .15s;}
.submit-btn:hover{opacity:.9;}
.submit-btn:disabled{opacity:.6;cursor:not-allowed;}
.err-msg{background:#fef2f2;border:1px solid #fecaca;border-radius:8px;padding:11px 15px;color:#dc2626;font-size:13px;margin-bottom:14px;}

/* Success */
.success-wrap{padding:48px 24px;text-align:center;}
.success-ring{width:68px;height:68px;border-radius:50%;background:#dcfce7;display:flex;align-items:center;justify-content:center;margin:0 auto 18px;font-size:30px;}
.success-title{font-size:22px;font-weight:700;margin-bottom:6px;}
.success-sub{font-size:14px;color:var(--ink-m);margin-bottom:28px;}
.confirm-card{background:var(--white);border:1px solid var(--border);border-radius:var(--r);text-align:left;max-width:360px;margin:0 auto 22px;overflow:hidden;}
.confirm-row{display:flex;align-items:center;gap:12px;padding:11px 16px;border-bottom:1px solid var(--border);font-size:13px;}
.confirm-row:last-child{border-bottom:none;}
.confirm-icon{font-size:14px;width:18px;text-align:center;flex-shrink:0;}
.confirm-label{color:var(--ink-m);width:68px;flex-shrink:0;}
.confirm-val{color:var(--ink);font-weight:500;}
.new-booking-btn{display:inline-block;padding:10px 22px;border:1.5px solid var(--border-md);border-radius:8px;font-size:13px;font-weight:500;cursor:pointer;background:var(--white);color:var(--ink-m);}
.new-booking-btn:hover{background:var(--off);color:var(--ink);}

/* Empty / loading */
.loading{padding:48px;text-align:center;color:var(--ink-m);font-size:14px;}
.empty{padding:48px;text-align:center;color:var(--ink-m);}

@media(max-width:720px){
  .page{flex-direction:column;height:auto;overflow:visible;}
  .left-panel{width:100%;flex-direction:row;align-items:center;flex-wrap:wrap;gap:10px;padding:14px 16px;border-right:none;border-bottom:1px solid var(--border);overflow:visible;}
  .right-panel{overflow-y:visible;}
  .biz-logo-img,.biz-logo-init{width:36px;height:36px;margin-bottom:0;font-size:14px;}
  .biz-name{font-size:13px;}
  .biz-tag{font-size:11px;}
  .panel-divider,.panel-section-label,.panel-spacer,.panel-footer,.panel-back-link{display:none;}
  .panel-ev,.panel-datetime{margin:0;}
  .panel-ev-name{font-size:12px;}
  .step-bar{padding:12px 16px;}
  .step-content{padding:16px;max-width:100%;}
  .step-item span{display:none;}
  .form-row{grid-template-columns:1fr;}
}
</style>
</head>
<body>
<div class="page">

  <!-- ── Left sidebar ── -->
  <div class="left-panel">
    ${logoHtml}
    <div class="biz-name">${siteName}</div>
    ${tagline ? `<div class="biz-tag">${tagline}</div>` : ''}
    <div class="panel-divider"></div>
    <div class="panel-section-label" id="panelLabel">Choose an appointment</div>
    <div class="panel-ev" id="panelEvWrap">
      <div class="panel-ev-dot" id="panelDot"></div>
      <div>
        <div class="panel-ev-name" id="panelEvName">—</div>
        <div class="panel-ev-meta" id="panelEvMeta"></div>
      </div>
    </div>
    <div class="panel-datetime" id="panelDatetime" style="display:none">
      <div class="panel-date"><span class="panel-icon">📅</span><span id="panelDate"></span></div>
      <div class="panel-time" style="margin-top:6px"><span class="panel-icon">⏰</span><span id="panelTime"></span></div>
    </div>
    <div class="panel-spacer"></div>
    <a class="panel-back-link" href="/">← Back to website</a>
    <div class="panel-footer">Powered by PageZaper</div>
  </div>

  <!-- ── Right panel ── -->
  <div class="right-panel">

    <!-- Step progress bar -->
    <div class="step-bar" id="stepBar">
      <div class="step-item active" id="si1"><div class="step-num" id="sn1">1</div><span>${step1Label}</span></div>
      <div class="step-conn" id="sc1"></div>
      <div class="step-item" id="si2"><div class="step-num" id="sn2">2</div><span>Date &amp; time</span></div>
      <div class="step-conn" id="sc2"></div>
      <div class="step-item" id="si3"><div class="step-num" id="sn3">3</div><span>Your details</span></div>
    </div>

    <div class="step-content">

      <!-- Step 1: Event type -->
      <div class="step active" id="s1">
        <div class="step-title">${pageTitle}</div>
        <div class="step-sub">${pageSub}</div>
        <div id="evList" class="ev-list"><div class="loading">Loading...</div></div>
      </div>

      <!-- Step 2: Calendar + slots -->
      <div class="step" id="s2">
        <div class="back-link" id="s2back" onclick="goStep(1)">← Back</div>
        <div class="cal-wrap">
          <div class="cal-head">
            <button class="cal-nav" onclick="calMo(-1)">‹</button>
            <div class="cal-month" id="calMonth"></div>
            <button class="cal-nav" onclick="calMo(1)">›</button>
          </div>
          <div class="cal-grid">
            <div class="cal-dh">Sun</div><div class="cal-dh">Mon</div><div class="cal-dh">Tue</div>
            <div class="cal-dh">Wed</div><div class="cal-dh">Thu</div><div class="cal-dh">Fri</div><div class="cal-dh">Sat</div>
            <div id="calDays"></div>
          </div>
        </div>
        <div id="slotsWrap" style="display:none;"></div>
      </div>

      <!-- Step 3: Details form -->
      <div class="step" id="s3">
        <div class="back-link" onclick="goStep(2)">← Back</div>
        <div id="formErr" class="err-msg" style="display:none;"></div>
        <div class="form-card">
          <div class="form-section-label">Contact details</div>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Full name *</label>
              <input class="form-input" id="fName" placeholder="Your full name" required>
            </div>
            <div class="form-group">
              <label class="form-label">Email *</label>
              <input class="form-input" id="fEmail" type="email" placeholder="you@example.com" required>
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">Phone number</label>
            <input class="form-input" id="fPhone" placeholder="+91 9999999999">
          </div>
          <div class="form-group">
            <label class="form-label">${notesLabel}</label>
            <textarea class="form-input" id="fNotes" rows="3" placeholder="${notesPh}" style="resize:vertical;"></textarea>
          </div>
          <button class="submit-btn" id="submitBtn" onclick="submitBooking()">${confirmBtn}</button>
        </div>
      </div>

      <!-- Step 4: Confirmation -->
      <div class="step" id="s4">
        <div class="success-wrap">
          <div class="success-ring">✅</div>
          <div class="success-title">${successTitle}</div>
          <div class="success-sub">${successSub}</div>
          <div class="confirm-card" id="confirmDetail"></div>
          <div class="new-booking-btn" onclick="goStep(1)">${newBookingLbl}</div>
        </div>
      </div>

    </div>
  </div>
</div>

<script>
window._PZ=${JSON.stringify({sub:sub,type:typeParam,btn:confirmBtn,eventId:eventId})};
</script>
<script>
(function(){
  var SUB=_PZ.sub, TYPE=_PZ.type, CONFIRM_BTN=_PZ.btn;
  var ev=null, selDate=null, selTime=null;
  var calYear=0, calMonth=0, evList=[];
  var MONTHS=['January','February','March','April','May','June','July','August','September','October','November','December'];
  var WD_SHORT=['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  var WD_LONG=['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];

  // ── Sidebar panel ─────────────────────────────────────────────────────────────
  function updatePanel(step){
    var label=document.getElementById('panelLabel');
    var dotEl=document.getElementById('panelDot');
    var nameEl=document.getElementById('panelEvName');
    var metaEl=document.getElementById('panelEvMeta');
    var dtWrap=document.getElementById('panelDatetime');
    var dateEl=document.getElementById('panelDate');
    var timeEl=document.getElementById('panelTime');
    if(step>=2 && ev){
      label.textContent='Your appointment';
      dotEl.style.background=ev.color||'var(--accent)';
      nameEl.style.color='var(--ink)';
      nameEl.textContent=ev.name;
      metaEl.textContent='⏱ '+ev.duration+' min'+(ev.location?' · 📍 '+ev.location:'');
    } else {
      label.textContent='Choose an appointment';
      dotEl.style.background='var(--border-md)';
      nameEl.style.color='var(--ink-f)';
      nameEl.textContent='—';
      metaEl.textContent='';
    }
    if(step>=3 && selDate && selTime){
      var d=new Date(selDate+'T00:00:00');
      dateEl.textContent=WD_LONG[d.getDay()]+', '+MONTHS[d.getMonth()]+' '+d.getDate();
      timeEl.textContent=fmtTime(selTime);
      dtWrap.style.display='';
    } else {
      dtWrap.style.display='none';
    }
  }

  function fmtTime(t){
    var parts=t.split(':'); var h=parseInt(parts[0]); var m=parts[1]||'00';
    return (h===0?12:h>12?h-12:h)+':'+m+' '+(h<12?'AM':'PM');
  }

  // ── Step progress bar ─────────────────────────────────────────────────────────
  function updateStepBar(n){
    for(var i=1;i<=3;i++){
      var si=document.getElementById('si'+i);
      var sn=document.getElementById('sn'+i);
      var sc=document.getElementById('sc'+i);
      if(!si) continue;
      if(i<n){
        si.className='step-item done';
        sn.innerHTML='✓';
        if(sc) sc.className='step-conn done';
      } else if(i===n){
        si.className='step-item active';
        sn.textContent=i;
        if(sc) sc.className='step-conn';
      } else {
        si.className='step-item';
        sn.textContent=i;
        if(sc) sc.className='step-conn';
      }
    }
    // Hide step bar on success screen
    document.getElementById('stepBar').style.display=n===4?'none':'';
  }

  // ── Step navigation ───────────────────────────────────────────────────────────
  window.goStep=function(n){
    document.querySelectorAll('.step').forEach(function(s){s.classList.remove('active')});
    document.getElementById('s'+n).classList.add('active');
    updateStepBar(n);
    updatePanel(n);
    window.scrollTo(0,0);
  }

  // ── Load events ──────────────────────────────────────────────────────────────
  var EV_ID=_PZ.eventId||null;
  var evFetchUrl=EV_ID?'/api/booking/'+SUB+'/events':'/api/booking/'+SUB+'/events?type='+TYPE;
  fetch(evFetchUrl).then(function(r){return r.json();}).then(function(evs){
    var el=document.getElementById('evList');
    if(!evs||!evs.length){
      el.innerHTML='<div class="empty">No appointment types available yet.</div>';return;
    }
    evList=evs;
    if(EV_ID){
      var idx=evs.findIndex(function(e){return e.id===EV_ID;});
      if(idx>=0){pickEv(idx);return;}
    }
    el.innerHTML=evs.map(function(e,i){
      var loc=e.location?'<span class="ev-loc">📍 '+e.location+'</span>':'';
      return '<div class="ev-card" onclick="pickEv('+i+')">'
        +'<div class="ev-dot" style="background:'+e.color+'"></div>'
        +'<div class="ev-info">'
          +'<div class="ev-name">'+e.name+'</div>'
          +'<div class="ev-meta">'
            +'<span class="ev-pill">⏱ '+e.duration+' min</span>'+loc
          +'</div>'
        +'</div>'
        +'<div class="ev-arr">›</div>'
      +'</div>';
    }).join('');
  }).catch(function(){
    document.getElementById('evList').innerHTML='<div class="empty">Could not load appointment types.</div>';
  });

  // ── Pick event type ───────────────────────────────────────────────────────────
  window.pickEv=function(i){
    ev=evList[i]; selDate=null; selTime=null;
    var now=new Date(); calYear=now.getFullYear(); calMonth=now.getMonth();
    renderCal();
    document.getElementById('slotsWrap').style.display='none';
    var s2back=document.getElementById('s2back');
    if(s2back) s2back.style.display=EV_ID?'none':'';
    goStep(2);
  }

  // ── Calendar ──────────────────────────────────────────────────────────────────
  function renderCal(){
    document.getElementById('calMonth').textContent=MONTHS[calMonth]+' '+calYear;
    var first=new Date(calYear,calMonth,1).getDay();
    var days=new Date(calYear,calMonth+1,0).getDate();
    var todayStr=new Date().toISOString().slice(0,10);
    var html='';
    for(var i=0;i<first;i++) html+='<div class="cal-day"></div>';
    for(var d=1;d<=days;d++){
      var ds=calYear+'-'+String(calMonth+1).padStart(2,'0')+'-'+String(d).padStart(2,'0');
      var isPast=ds<todayStr;
      var cls='cal-day'+(isPast?'':' avail')+(ds===todayStr?' today-mark':'')+(ds===selDate?' selected':'');
      html+='<div class="'+cls+'"'+(isPast?'':' data-ds="'+ds+'"')+'>'+d+'</div>';
    }
    document.getElementById('calDays').innerHTML=html;
  }

  window.calMo=function(dir){
    calMonth+=dir;
    if(calMonth>11){calMonth=0;calYear++;}
    if(calMonth<0){calMonth=11;calYear--;}
    renderCal();
  }

  window.pickDay=function(ds){
    selDate=ds; selTime=null; renderCal();
    var wrap=document.getElementById('slotsWrap');
    wrap.style.display='block';
    wrap.innerHTML='<div class="loading">Loading available times...</div>';
    fetch('/api/booking/'+SUB+'/slots/'+ev.id+'/'+ds)
      .then(function(r){return r.json();})
      .then(function(slots){
        if(!slots||!slots.length){
          wrap.innerHTML='<div style="color:var(--ink-m);font-size:13px;padding:8px 0;">No available slots on this day.</div>';return;
        }
        // Group AM / PM
        var am=slots.filter(function(s){return parseInt(s.time)<12;});
        var pm=slots.filter(function(s){return parseInt(s.time)>=12;});
        var html='';
        if(am.length){
          html+='<div class="slots-section"><div class="slots-section-label">Morning</div>'
            +'<div class="slots-grid">'+am.map(function(s){
              return '<div class="slot-btn'+(s.time===selTime?' selected':'')+'" data-time="'+s.time+'" data-label="'+s.label+'">'+s.label+'</div>';
            }).join('')+'</div></div>';
        }
        if(pm.length){
          html+='<div class="slots-section"><div class="slots-section-label">Afternoon</div>'
            +'<div class="slots-grid">'+pm.map(function(s){
              return '<div class="slot-btn'+(s.time===selTime?' selected':'')+'" data-time="'+s.time+'" data-label="'+s.label+'">'+s.label+'</div>';
            }).join('')+'</div></div>';
        }
        wrap.innerHTML=html;
      }).catch(function(){
        wrap.innerHTML='<div style="color:var(--ink-m);font-size:13px;">Could not load available slots.</div>';
      });
  }

  // ── Event delegation (avoids quote-escaping in inline onclick) ───────────────
  document.addEventListener('click', function(e){
    // Calendar day
    if(e.target.classList && e.target.classList.contains('avail')){
      var ds=e.target.getAttribute('data-ds');
      if(ds) pickDay(ds);
      return;
    }
    // Slot button
    var btn=e.target;
    if(btn.classList && btn.classList.contains('slot-btn')){
      var time=btn.getAttribute('data-time');
      var label=btn.getAttribute('data-label');
      if(!time) return;
      selTime=time;
      document.querySelectorAll('.slot-btn').forEach(function(b){b.classList.remove('selected');});
      btn.classList.add('selected');
      goStep(3);
    }
  });

  // ── Submit booking ─────────────────────────────────────────────────────────────
  window.submitBooking=function(){
    var name=document.getElementById('fName').value.trim();
    var email=document.getElementById('fEmail').value.trim();
    var phone=document.getElementById('fPhone').value.trim();
    var notes=document.getElementById('fNotes').value.trim();
    var errEl=document.getElementById('formErr');
    errEl.style.display='none';
    if(!name||!email){errEl.textContent='Please fill in your name and email.';errEl.style.display='block';return;}
    if(!/^[^@]+@[^@]+[.][^@]+$/.test(email)){errEl.textContent='Please enter a valid email.';errEl.style.display='block';return;}
    var btn=document.getElementById('submitBtn');
    btn.disabled=true; btn.textContent='Confirming...';
    fetch('/api/booking/'+SUB+'/create',{
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify({event_id:ev.id,booking_date:selDate,start_time:selTime,booker_name:name,booker_email:email,booker_phone:phone,notes:notes})
    }).then(function(r){return r.json();}).then(function(res){
      btn.disabled=false; btn.textContent=CONFIRM_BTN;
      if(!res.ok){errEl.textContent=res.error||'Something went wrong. Please try again.';errEl.style.display='block';return;}
      var d=new Date(selDate+'T00:00:00');
      var dateLabel=WD_LONG[d.getDay()]+', '+MONTHS[d.getMonth()]+' '+d.getDate()+', '+calYear;
      var timeLabel=fmtTime(selTime);
      document.getElementById('confirmDetail').innerHTML=
        '<div class="confirm-row"><span class="confirm-icon">🗓</span><span class="confirm-label">Date</span><span class="confirm-val">'+dateLabel+'</span></div>'
        +'<div class="confirm-row"><span class="confirm-icon">⏰</span><span class="confirm-label">Time</span><span class="confirm-val">'+timeLabel+' ('+ev.duration+' min)</span></div>'
        +'<div class="confirm-row"><span class="confirm-icon">📋</span><span class="confirm-label">Type</span><span class="confirm-val">'+ev.name+'</span></div>'
        +(ev.location?'<div class="confirm-row"><span class="confirm-icon">📍</span><span class="confirm-label">Where</span><span class="confirm-val">'+ev.location+'</span></div>':'')
        +'<div class="confirm-row"><span class="confirm-icon">👤</span><span class="confirm-label">Name</span><span class="confirm-val">'+name+'</span></div>'
        +'<div class="confirm-row"><span class="confirm-icon">✉️</span><span class="confirm-label">Email</span><span class="confirm-val">'+email+'</span></div>';
      goStep(4);
    }).catch(function(){
      btn.disabled=false; btn.textContent=CONFIRM_BTN;
      errEl.textContent='Network error. Please try again.'; errEl.style.display='block';
    });
  }
})();
</script>
</body>
</html>`;

  // ── Inject owner edit bar ────────────────────────────────────────────────
  const bookingSessionUser = req.session && req.session.user
  const bookingIsOwner = bookingSessionUser && Number(bookingSessionUser.id) === Number(site.account_id)
  if (bookingIsOwner) {
    const appUrl2 = process.env.APP_URL || 'https://pagezaper.com'
    const editUrl2 = `${appUrl2}/dashboard/site/builder?site=${site.id}`
    const editBar2 = `<div id="pz-owner-bar" style="position:fixed;bottom:20px;right:20px;z-index:99999;display:flex;align-items:center;gap:8px;background:#1a1a18;border-radius:50px;padding:8px 16px 8px 12px;box-shadow:0 4px 20px rgba(0,0,0,0.25);font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <span style="font-size:13px;color:rgba(255,255,255,0.5);white-space:nowrap;">✏️</span>
  <a href="${editUrl2}" style="font-size:13px;font-weight:600;color:#fff;text-decoration:none;white-space:nowrap;">Edit site</a>
</div>`
    html = html.replace('</body>', editBar2 + '</body>')
  }

  res.send(html);
}

// ── Draft page ────────────────────────────────────────────────────────────────
function pageDraft(site) {
  const name = site.title || site.subdomain || 'This page'
  return `<!DOCTYPE html><html><head><meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Coming Soon — ${name}</title>
<style>
*{box-sizing:border-box;margin:0;padding:0;}
body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;background:#f8f7f4;color:#1a1a18;display:flex;align-items:center;justify-content:center;min-height:100vh;}
.box{text-align:center;padding:48px 32px;max-width:420px;}
.icon{font-size:52px;margin-bottom:20px;}
h1{font-size:26px;font-weight:700;margin-bottom:10px;}
p{color:#6b6b66;font-size:15px;line-height:1.6;}
.badge{display:inline-block;margin-top:24px;padding:5px 14px;border-radius:20px;background:#f0ede6;color:#b0afa8;font-size:12px;font-weight:600;letter-spacing:0.3px;}
</style>
</head>
<body>
<div class="box">
  <div class="icon">🚧</div>
  <h1>${name}</h1>
  <p>This page is under construction and will be available soon.</p>
  <span class="badge">DRAFT</span>
</div>
</body>
</html>`
}

// ── 404 page ──────────────────────────────────────────────────────────────────
function page404(sub) {
  return `<!DOCTYPE html><html><head><meta charset="UTF-8">
<title>Site not found</title>
<style>body{font-family:sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;background:#f8f7f4;}
.box{text-align:center;padding:48px;}.emoji{font-size:48px;margin-bottom:16px;}
h1{font-size:24px;color:#1a1a18;margin-bottom:8px;}p{color:#6b6b66;}</style></head>
<body><div class="box"><div class="emoji">🔍</div>
<h1>Site not found</h1>
<p>No site found for <strong>${sub || 'this domain'}</strong>.<br>It may not be published yet, or the address may be wrong.</p>
</div></body></html>`
}

module.exports = subdomainMiddleware

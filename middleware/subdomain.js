const { db }       = require('../config/db')
const themeManager = require('../config/themeManager')

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
         FROM ms_pages s
         JOIN ms_accounts u ON u.id = s.account_id
         WHERE s.subdomain = ?`,
        [lookup.subdomain]
      )
    } else {
      site = await db.first(
        `SELECT s.*, u.name as owner_name
         FROM ms_pages s
         JOIN ms_accounts u ON u.id = s.account_id
         WHERE s.custom_domain = ?`,
        [lookup.customDomain]
      )
    }

    if (!site) {
      return res.status(404).send(page404(lookup.subdomain || lookup.customDomain))
    }

    const settings  = JSON.parse(site.settings || '{}')
    const slug      = settings.template_id || site.template_id || 'minimal'
    const rawPath   = req.path.replace(/^\/+|\/+$/g, '') || 'home'
    const pathParts = rawPath.split('/')
    const pageId    = pathParts[0] || 'home'
    const subPath   = pathParts[1] || null

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

    // ── Blog: post detail (/blog/my-post-slug) ─────────────────────────────────
    if (pageId === 'blog' && subPath) {
      const post = await db.first(
        `SELECT * FROM ms_posts WHERE page_id = ? AND slug = ? AND status = 'published'`,
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
         WHERE page_id = ? AND status = 'published'
         ORDER BY created_at DESC`,
        [site.id]
      )
      const html = await themeManager.renderBlog(slug, site, settings, posts)
      return res.send(html)
    }

    // ── Normal page render ─────────────────────────────────────────────────────
    // If site is unpublished, only block from search but still serve
    const html = await themeManager.render(slug, site, settings, pageId)
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
      `SELECT slug, updated_at FROM ms_posts WHERE page_id = ? AND status = 'published'`,
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

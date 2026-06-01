const { db }         = require('../config/db')
const themeManager   = require('../config/themeManager')

async function subdomainMiddleware(req, res, next) {
  const host       = req.hostname
  const baseDomain = process.env.BASE_DOMAIN

  if (!baseDomain) return next()

  // Subdomain request: something.pagezaper.com
  if (host !== baseDomain && host.endsWith('.' + baseDomain)) {
    const subdomain = host.replace('.' + baseDomain, '')
    return serveSite(req, res, next, { subdomain })
  }

  // Custom domain request: anything that's not the base domain
  if (host !== baseDomain && !host.endsWith('.' + baseDomain)) {
    return serveSite(req, res, next, { customDomain: host })
  }

  next()
}

async function serveSite(req, res, next, lookup) {
  try {
    let site

    if (lookup.subdomain) {
      site = await db.first(
        'SELECT s.*, u.name as owner_name FROM ms_pages s JOIN ms_accounts u ON u.id = s.account_id WHERE s.subdomain = ? AND s.is_published = 1',
        [lookup.subdomain]
      )
    } else {
      site = await db.first(
        'SELECT s.*, u.name as owner_name FROM ms_pages s JOIN ms_accounts u ON u.id = s.account_id WHERE s.custom_domain = ? AND s.is_published = 1',
        [lookup.customDomain]
      )
    }

    if (!site) {
      return res.status(404).send('<h1>404 — Site not found</h1>')
    }

    const settings  = JSON.parse(site.settings || '{}')
    const slug      = settings.template_id || site.template_id || 'minimal'
    const html      = await themeManager.render(slug, site, settings)

    res.send(html)
  } catch (err) {
    console.error('Site serve error:', err)
    res.status(500).send('<h1>Something went wrong</h1>')
  }
}

module.exports = subdomainMiddleware

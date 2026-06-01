const fs      = require('fs')
const path    = require('path')
const { Liquid } = require('liquidjs')

const THEMES_DIR = path.join(__dirname, '../themes')

let cache = null

function loadAll() {
  if (cache) return cache

  const themes = {}
  if (!fs.existsSync(THEMES_DIR)) return {}

  const dirs = fs.readdirSync(THEMES_DIR, { withFileTypes: true })
    .filter(d => d.isDirectory() && !d.name.startsWith('_') && !d.name.startsWith('.'))
    .map(d => d.name)

  for (const slug of dirs) {
    const meta = loadTheme(slug)
    if (meta) themes[slug] = meta
  }

  const sorted = Object.fromEntries(
    Object.entries(themes).sort(([,a],[,b]) => (a.order||99) - (b.order||99))
  )

  cache = sorted
  return cache
}

function loadTheme(slug) {
  const jsonFile = path.join(THEMES_DIR, slug, 'theme.json')
  const tplFile  = path.join(THEMES_DIR, slug, 'index.liquid')

  if (!fs.existsSync(jsonFile) || !fs.existsSync(tplFile)) return null

  try {
    const meta = JSON.parse(fs.readFileSync(jsonFile, 'utf8'))
    meta.slug        = slug
    meta.path        = path.join(THEMES_DIR, slug)
    meta.previewUrl  = `/themes/${slug}/preview.png`
    meta.hasPreview  = fs.existsSync(path.join(THEMES_DIR, slug, 'preview.png'))
    return meta
  } catch(e) {
    console.error(`Error loading theme ${slug}:`, e.message)
    return null
  }
}

async function render(slug, site, settings) {
  const theme = loadTheme(slug) || loadTheme('minimal')
  if (!theme) throw new Error('No themes found')

  const tplFile = path.join(theme.path, 'index.liquid')
  const source  = fs.readFileSync(tplFile, 'utf8')

  const COLORS = {
    ink: '#1a1a18', blue: '#2563eb', green: '#16a34a',
    red: '#dc2626', purple: '#7c3aed', amber: '#d97706',
    cyan: '#0891b2', pink: '#be185d'
  }

  const engine = new Liquid({
    strictFilters: false,
    strictVariables: false
  })

  engine.registerFilter('wa', (phone) => (phone || '').replace(/\D/g, ''))
  engine.registerFilter('hex', (colorSlug) => COLORS[colorSlug] || COLORS.blue)

  const context = {
    site: {
      title:      site.title,
      subdomain:  site.subdomain,
      url:        `https://${site.subdomain}.${process.env.BASE_DOMAIN}`
    },
    settings: {
      ...settings,
      accent_color: COLORS[settings.theme || 'blue'] || COLORS.blue
    },
    theme,
    sections:   settings.sections || [],
    site_type:  settings.site_type || 'business',
    city:       settings.city || '',
    app_name:   process.env.APP_NAME || 'PageZaper',
    app_url:    process.env.APP_URL  || 'https://pagezaper.com'
  }

  return engine.parseAndRender(source, context)
}

function byType(type) {
  const all = loadAll()
  return Object.fromEntries(
    Object.entries(all).filter(([, t]) => {
      const types = t.for || ['all']
      return types.includes('all') || types.includes(type)
    })
  )
}

function clearCache() {
  cache = null
}

module.exports = { loadAll, loadTheme, render, byType, clearCache }

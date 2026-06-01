const fs      = require('fs')
const path    = require('path')
const { Liquid } = require('liquidjs')

const THEMES_DIR = path.join(__dirname, '../themes')

let cache = null

// Built-in color palette (used as fallback if theme doesn't define colors)
const DEFAULT_COLORS = {
  ink:    '#1a1a18',
  blue:   '#2563eb',
  green:  '#16a34a',
  red:    '#dc2626',
  purple: '#7c3aed',
  amber:  '#d97706',
  cyan:   '#0891b2',
  pink:   '#be185d',
  white:  '#ffffff'
}

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
    meta.slug       = slug
    meta.path       = path.join(THEMES_DIR, slug)
    meta.previewUrl = `/themes/${slug}/preview.png`
    meta.hasPreview = fs.existsSync(path.join(THEMES_DIR, slug, 'preview.png'))
    meta.hasAssets  = fs.existsSync(path.join(THEMES_DIR, slug, 'assets'))
    meta.assetsUrl  = `/themes/${slug}/assets`

    // Normalise sections — guarantee each section has valid fields array
    if (!Array.isArray(meta.sections)) meta.sections = []
    meta.sections = meta.sections.map(s => ({
      ...s,
      fields: Array.isArray(s.fields) ? s.fields : []
    }))

    // Build a color map from settings.colors for the render engine
    // Falls back to DEFAULT_COLORS if theme doesn't declare colors
    meta._colorMap = {}
    const colorDefs = (meta.settings && meta.settings.colors) || []
    for (const c of colorDefs) {
      meta._colorMap[c.id] = c.hex
    }
    if (!Object.keys(meta._colorMap).length) {
      meta._colorMap = { ...DEFAULT_COLORS }
    }

    return meta
  } catch(e) {
    console.error(`Error loading theme ${slug}:`, e.message)
    return null
  }
}

/**
 * Get the sections schema for a given theme slug.
 * Returns the array of section definitions from theme.json.
 * This is what the builder UI reads to render its field editor.
 */
function getSections(slug) {
  const theme = loadTheme(slug)
  if (!theme) return []
  return theme.sections || []
}

/**
 * Get a single section definition by id.
 */
function getSection(slug, sectionId) {
  return getSections(slug).find(s => s.id === sectionId) || null
}

async function render(slug, site, settings) {
  const theme = loadTheme(slug) || loadTheme('minimal')
  if (!theme) throw new Error('No themes found')

  const tplFile = path.join(theme.path, 'index.liquid')
  const source  = fs.readFileSync(tplFile, 'utf8')

  // Resolve accent color from theme's own palette, then global fallback
  const colorMap    = theme._colorMap || DEFAULT_COLORS
  const accentColor = colorMap[settings.theme || 'blue'] || colorMap.blue || '#2563eb'

  // Build font vars — themes declare fonts in settings.fonts
  const fontDefs  = (theme.settings && theme.settings.fonts) || []
  const fontMap   = {}
  for (const f of fontDefs) fontMap[f.id] = f.label || f.id

  const engine = new Liquid({
    strictFilters:    false,
    strictVariables:  false
  })

  engine.registerFilter('wa',  (phone)     => (phone || '').replace(/\D/g, ''))
  engine.registerFilter('hex', (colorSlug) => colorMap[colorSlug] || accentColor)

  const context = {
    site: {
      title:     site.title,
      subdomain: site.subdomain,
      url:       `https://${site.subdomain}.${process.env.BASE_DOMAIN || 'pagezapper.com'}`
    },
    settings: {
      ...settings,
      accent_color: accentColor
    },
    theme: {
      slug:      theme.slug,
      name:      theme.name,
      assetsUrl: theme.assetsUrl,
      colors:    theme._colorMap,
      fonts:     fontMap
    },
    sections:  settings.sections || [],
    site_type: settings.site_type || 'business',
    city:      settings.city || '',
    app_name:  process.env.APP_NAME || 'PageZapper',
    app_url:   process.env.APP_URL  || 'https://pagezapper.com'
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

module.exports = { loadAll, loadTheme, render, byType, clearCache, getSections, getSection, DEFAULT_COLORS }

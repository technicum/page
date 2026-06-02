const fs      = require('fs')
const path    = require('path')
const { Liquid } = require('liquidjs')

const THEMES_DIR   = path.join(__dirname, '../themes')
const SECTIONS_DIR = path.join(__dirname, '../sections')

// Maps old PHP template IDs → new theme slugs so existing DB records don't break
const LEGACY_TEMPLATE_MAP = {
  'template1': 'minimal',
  'template2': 'bold',
  'template3': 'modern'
}

function resolveSlug(slug) {
  return LEGACY_TEMPLATE_MAP[slug] || slug
}

let cache        = null
let sectionCache = null

// Built-in color palette (fallback if theme doesn't define colors)
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

// ── Plugin section discovery ──────────────────────────────────────────────────
function loadGlobalSections() {
  if (sectionCache) return sectionCache
  if (!fs.existsSync(SECTIONS_DIR)) { sectionCache = []; return [] }

  const dirs = fs.readdirSync(SECTIONS_DIR, { withFileTypes: true })
    .filter(d => d.isDirectory())
    .map(d => d.name)

  const sections = []
  for (const id of dirs) {
    const jsonFile = path.join(SECTIONS_DIR, id, 'section.json')
    if (!fs.existsSync(jsonFile)) continue
    try {
      const meta = JSON.parse(fs.readFileSync(jsonFile, 'utf8'))
      meta.id        = id
      meta._isPlugin = true
      meta._path     = path.join(SECTIONS_DIR, id)
      if (!Array.isArray(meta.fields)) meta.fields = []
      sections.push(meta)
    } catch(e) {
      console.error(`Error loading section plugin ${id}:`, e.message)
    }
  }

  sectionCache = sections
  return sections
}

// ── Theme loading ─────────────────────────────────────────────────────────────
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

  cache = Object.fromEntries(
    Object.entries(themes).sort(([,a],[,b]) => (a.order||99) - (b.order||99))
  )
  return cache
}

function loadTheme(slug) {
  slug = resolveSlug(slug)
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

    if (!Array.isArray(meta.sections)) meta.sections = []
    meta.sections = meta.sections.map(s => ({
      ...s,
      fields: Array.isArray(s.fields) ? s.fields : []
    }))

    meta._colorMap = {}
    const colorDefs = (meta.settings && meta.settings.colors) || []
    for (const c of colorDefs) meta._colorMap[c.id] = c.hex
    if (!Object.keys(meta._colorMap).length) meta._colorMap = { ...DEFAULT_COLORS }

    return meta
  } catch(e) {
    console.error(`Error loading theme ${slug}:`, e.message)
    return null
  }
}

// ── Section schema API ────────────────────────────────────────────────────────
/**
 * Returns all sections available for a theme:
 * theme's own sections + global plugin sections (filtered by `for` field).
 */
function getSections(slug) {
  slug = resolveSlug(slug)
  const theme   = loadTheme(slug)
  const plugins = loadGlobalSections()

  const themeSections = theme ? (theme.sections || []) : []

  // Merge plugins that aren't already declared in the theme
  const themeIds = new Set(themeSections.map(s => s.id))
  const extra = plugins.filter(p => {
    if (themeIds.has(p.id)) return false
    const forList = p.for || ['all']
    return forList.includes('all') || forList.includes(slug)
  })

  return [...themeSections, ...extra]
}

function getSection(slug, sectionId) {
  return getSections(resolveSlug(slug)).find(s => s.id === sectionId) || null
}

// ── Render ────────────────────────────────────────────────────────────────────
async function render(slug, site, settings, pageId = 'home') {
  const theme = loadTheme(resolveSlug(slug)) || loadTheme('minimal')
  if (!theme) throw new Error('No themes found')

  // Multi-page: look for {pageId}.liquid, fall back to index.liquid
  const pageFile  = path.join(theme.path, pageId + '.liquid')
  const indexFile = path.join(theme.path, 'index.liquid')
  const tplFile   = fs.existsSync(pageFile) ? pageFile : indexFile
  const source    = fs.readFileSync(tplFile, 'utf8')

  // Resolve sections for this page
  let pageSections
  if (settings.pages && typeof settings.pages === 'object') {
    pageSections = (settings.pages[pageId] && settings.pages[pageId].sections) || []
  } else {
    pageSections = settings.sections || []
  }
  settings = { ...settings, sections: pageSections }

  const colorMap    = theme._colorMap || DEFAULT_COLORS
  const accentColor = colorMap[settings.theme || 'blue'] || colorMap.blue || '#2563eb'

  const fontDefs = (theme.settings && theme.settings.fonts) || []
  const fontMap  = {}
  for (const f of fontDefs) fontMap[f.id] = f.label || f.id

  const engine = new Liquid({ strictFilters: false, strictVariables: false })
  engine.registerFilter('wa',  (phone)     => (phone || '').replace(/\D/g, ''))
  engine.registerFilter('hex', (colorSlug) => colorMap[colorSlug] || accentColor)

  // ── Pre-render plugin sections ──────────────────────────────────────────────
  const plugins        = loadGlobalSections()
  const pluginIds      = new Set(plugins.map(p => p.id))
  const themeSectionIds = new Set((theme.sections || []).map(s => s.id))
  const renderedSections = {}

  const pluginContext = {
    site: { title: site.title, subdomain: site.subdomain },
    settings: { ...settings, accent_color: accentColor },
    theme: { slug: theme.slug, name: theme.name, colors: colorMap },
    app_name: process.env.APP_NAME || 'PageZapper',
    app_url:  process.env.APP_URL  || 'https://pagezapper.com'
  }

  for (const sec of pageSections) {
    // Only pre-render sections that are plugins AND not handled inline by the theme
    if (!pluginIds.has(sec.id) || themeSectionIds.has(sec.id)) continue

    const plugin = plugins.find(p => p.id === sec.id)
    if (!plugin) continue

    // Look for theme-specific render, then default
    const themeRender   = path.join(plugin._path, theme.slug + '.liquid')
    const defaultRender = path.join(plugin._path, 'render.liquid')
    const renderFile    = fs.existsSync(themeRender) ? themeRender
                        : fs.existsSync(defaultRender) ? defaultRender
                        : null

    if (!renderFile) continue

    try {
      const pluginSource = fs.readFileSync(renderFile, 'utf8')
      renderedSections[sec.id] = await engine.parseAndRender(pluginSource, {
        ...pluginContext,
        section: sec
      })
    } catch(e) {
      console.error(`Plugin render error [${sec.id}]:`, e.message)
      renderedSections[sec.id] = `<!-- section plugin "${sec.id}" render error -->`
    }
  }

  // Build page list for nav links in multi-page themes
  const themePages = Array.isArray(theme.pages) ? theme.pages : []

  // Merge custom pages from settings (user-added via builder)
  const customPageIds = new Set(themePages.map(p => p.id))
  const customPages   = (settings.customPages || []).filter(p => !customPageIds.has(p.id))
  const allSitePages  = [...themePages, ...customPages]

  const context = {
    site: {
      title:     site.title,
      subdomain: site.subdomain,
      url:       `https://${site.subdomain}.${process.env.BASE_DOMAIN || 'pagezapper.com'}`
    },
    settings: { ...settings, accent_color: accentColor },
    theme: {
      slug:      theme.slug,
      name:      theme.name,
      assetsUrl: theme.assetsUrl,
      colors:    theme._colorMap,
      fonts:     fontMap
    },
    sections:          settings.sections || [],
    rendered_sections: renderedSections,
    page_id:           pageId,
    site_pages:        allSitePages,
    site_type:         settings.site_type || 'business',
    city:              settings.city || '',
    app_name:          process.env.APP_NAME || 'PageZapper',
    app_url:           process.env.APP_URL  || 'https://pagezapper.com'
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
  cache        = null
  sectionCache = null
}

module.exports = {
  loadAll, loadTheme, render, byType, clearCache,
  getSections, getSection, loadGlobalSections, DEFAULT_COLORS
}

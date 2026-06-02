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
  // Attach computed design CSS to each section for liquid templates
  pageSections = pageSections.map(sec => ({
    ...sec,
    _designCss: buildSectionDesignCss(sec.design || {}, colorMap, accentColor)
  }))
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

  // Nav items — user-controlled menu (label, order, visibility, external links)
  // If navItems are saved, use them filtered to show:true
  // Otherwise fall back to allSitePages
  let navItems = []
  if (settings.navItems && settings.navItems.length) {
    navItems = settings.navItems.filter(n => n.show !== false)
  } else {
    navItems = allSitePages.map(p => ({
      id:    p.id,
      label: p.label,
      url:   p.id === 'home' ? '/' : '/' + p.id,
      show:  true,
      external: false
    }))
  }

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
    nav_items:         navItems,
    site_type:         settings.site_type || 'business',
    city:              settings.city || '',
    app_name:          process.env.APP_NAME || 'PageZapper',
    app_url:           process.env.APP_URL  || 'https://pagezapper.com'
  }

  let html = await engine.parseAndRender(source, context)
  return injectGlobalStyles(html, settings)
}

// ── Blog listing render ───────────────────────────────────────────────────────
async function renderBlog(slug, site, settings, posts) {
  slug = resolveSlug(slug)
  const theme = loadTheme(slug) || loadTheme('minimal')
  if (!theme) throw new Error('No themes found')

  const blogFile  = path.join(theme.path, 'blog.liquid')
  const indexFile = path.join(theme.path, 'index.liquid')
  const tplFile   = fs.existsSync(blogFile) ? blogFile : indexFile
  const source    = fs.readFileSync(tplFile, 'utf8')

  const colorMap    = theme._colorMap || DEFAULT_COLORS
  const accentColor = colorMap[settings.theme || 'blue'] || colorMap.blue || '#2563eb'
  const themePages  = Array.isArray(theme.pages) ? theme.pages : []
  const customPages = settings.customPages || []
  const allSitePages = [...themePages, ...customPages.filter(p => !themePages.find(tp => tp.id === p.id))]
  const navItems = settings.navItems
    ? settings.navItems.filter(n => n.show !== false)
    : allSitePages.map(p => ({ id: p.id, label: p.label, url: p.id === 'home' ? '/' : '/' + p.id, show: true }))

  const engine = new Liquid({ strictFilters: false, strictVariables: false })
  engine.registerFilter('wa',  (phone) => (phone || '').replace(/\D/g, ''))
  engine.registerFilter('hex', (colorSlug) => colorMap[colorSlug] || accentColor)

  const ctx = {
    site: { title: site.title, subdomain: site.subdomain, url: `https://${site.subdomain}.${process.env.BASE_DOMAIN || 'pagezapper.com'}` },
    settings: { ...settings, accent_color: accentColor },
    theme: { slug: theme.slug, name: theme.name, assetsUrl: theme.assetsUrl, colors: colorMap },
    page_id: 'blog', sections: [], rendered_sections: {}, nav_items: navItems, site_pages: allSitePages,
    posts: posts.map(p => ({
      ...p,
      url:  `/blog/${p.slug}`,
      date: p.created_at ? new Date(p.created_at).toLocaleDateString('en-IN', { year:'numeric', month:'long', day:'numeric' }) : ''
    })),
    site_type: settings.site_type || 'business',
    app_name: process.env.APP_NAME || 'PageZapper',
    app_url:  process.env.APP_URL  || 'https://pagezapper.com'
  }

  let html = await engine.parseAndRender(source, ctx)
  html = injectGlobalStyles(html, settings)
  return html
}

// ── Blog post render ──────────────────────────────────────────────────────────
async function renderPost(slug, site, settings, post) {
  slug = resolveSlug(slug)
  const theme = loadTheme(slug) || loadTheme('minimal')
  if (!theme) throw new Error('No themes found')

  const postFile  = path.join(theme.path, 'post.liquid')
  const indexFile = path.join(theme.path, 'index.liquid')
  const tplFile   = fs.existsSync(postFile) ? postFile : indexFile
  const source    = fs.readFileSync(tplFile, 'utf8')

  const colorMap    = theme._colorMap || DEFAULT_COLORS
  const accentColor = colorMap[settings.theme || 'blue'] || colorMap.blue || '#2563eb'
  const themePages  = Array.isArray(theme.pages) ? theme.pages : []
  const customPages = settings.customPages || []
  const allSitePages = [...themePages, ...customPages.filter(p => !themePages.find(tp => tp.id === p.id))]
  const navItems = settings.navItems
    ? settings.navItems.filter(n => n.show !== false)
    : allSitePages.map(p => ({ id: p.id, label: p.label, url: p.id === 'home' ? '/' : '/' + p.id, show: true }))

  const engine = new Liquid({ strictFilters: false, strictVariables: false })
  engine.registerFilter('wa',  (phone) => (phone || '').replace(/\D/g, ''))
  engine.registerFilter('hex', (colorSlug) => colorMap[colorSlug] || accentColor)

  const postDate = post.created_at
    ? new Date(post.created_at).toLocaleDateString('en-IN', { year:'numeric', month:'long', day:'numeric' })
    : ''

  const ctx = {
    site: { title: site.title, subdomain: site.subdomain, url: `https://${site.subdomain}.${process.env.BASE_DOMAIN || 'pagezapper.com'}` },
    settings: { ...settings, accent_color: accentColor },
    theme: { slug: theme.slug, name: theme.name, assetsUrl: theme.assetsUrl, colors: colorMap },
    page_id: 'post', sections: [], rendered_sections: {}, nav_items: navItems, site_pages: allSitePages,
    post: { ...post, date: postDate, url: `/blog/${post.slug}` },
    site_type: settings.site_type || 'business',
    app_name: process.env.APP_NAME || 'PageZapper',
    app_url:  process.env.APP_URL  || 'https://pagezapper.com'
  }

  let html = await engine.parseAndRender(source, ctx)
  html = injectGlobalStyles(html, settings)
  return html
}

// ── Per-section design CSS builder ───────────────────────────────────────────
function buildSectionDesignCss(design, colorMap, accentColor) {
  if (!design || !Object.keys(design).length) return ''
  const parts = []

  // Background
  if (design.bgType === 'color' && design.bgColor) {
    parts.push(`background-color:${design.bgColor}`)
    parts.push('background-image:none')
  } else if (design.bgType === 'accent') {
    parts.push(`background-color:${accentColor}`)
    parts.push('background-image:none')
  } else if (design.bgType === 'image' && design.bgImage) {
    parts.push(`background-image:url('${design.bgImage}')`)
    parts.push('background-size:cover')
    parts.push('background-position:center')
    parts.push('background-repeat:no-repeat')
    if (design.overlay === 'dark')  parts.push('--overlay:rgba(0,0,0,0.45)')
    if (design.overlay === 'light') parts.push('--overlay:rgba(255,255,255,0.5)')
  }

  // Text color
  if (design.textColor === 'light') parts.push('color:#ffffff')
  else if (design.textColor === 'dark')  parts.push('color:#111827')

  // Padding
  if (design.paddingY === 'none')     parts.push('padding-top:0;padding-bottom:0')
  else if (design.paddingY === 'compact')  parts.push('padding-top:32px;padding-bottom:32px')
  else if (design.paddingY === 'spacious') parts.push('padding-top:120px;padding-bottom:120px')

  return parts.join(';')
}

// ── Global style injection helper ─────────────────────────────────────────────
function injectGlobalStyles(html, settings) {
  const gs = settings.globalStyles || {}
  if (!Object.keys(gs).length) return html

  const fontMap2 = { serif: "'DM Serif Display',serif", sans: "'DM Sans',sans-serif", mono: "'Courier New',monospace" }
  const btnPad   = { sm: '8px 18px', md: '12px 28px', lg: '16px 36px' }
  const spacing  = { compact: '0.6', normal: '1', spacious: '1.4' }
  const cssVars  = [
    gs.headingFont ? `--font-heading:${fontMap2[gs.headingFont] || fontMap2.serif};` : '',
    gs.bodyFont    ? `--font-body:${fontMap2[gs.bodyFont] || fontMap2.sans};` : '',
    gs.fontSize    ? `--font-size-base:${gs.fontSize};` : '',
    gs.btnRadius   ? `--btn-radius:${gs.btnRadius};` : '',
    gs.btnSize     ? `--btn-pad:${btnPad[gs.btnSize] || btnPad.md};` : '',
    gs.cardRadius  ? `--card-radius:${gs.cardRadius};` : '',
    gs.siteBg      ? `--site-bg:${gs.siteBg};` : '',
    gs.spacing     ? `--spacing-scale:${spacing[gs.spacing] || '1'};` : ''
  ].filter(Boolean).join('')

  if (!cssVars) return html

  const styleTag = `<style>:root{${cssVars}}body{background:var(--site-bg,inherit);font-size:var(--font-size-base,inherit);font-family:var(--font-body,inherit);}h1,h2,h3,h4{font-family:var(--font-heading,inherit);}.btn-p,.btn-solid,.pz-plan-cta,.link-btn{border-radius:var(--btn-radius,inherit)!important;padding:var(--btn-pad,inherit)!important;}.card,.pz-gallery-item,.pz-plan,.testi-item{border-radius:var(--card-radius,inherit)!important;}</style>`
  return html.replace('</head>', styleTag + '</head>')
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
  loadAll, loadTheme, render, renderBlog, renderPost, byType, clearCache,
  getSections, getSection, loadGlobalSections, DEFAULT_COLORS
}

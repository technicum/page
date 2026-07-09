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
async function render(slug, site, settings, pageId = 'home', siteForms = {}, extraCtx = {}) {
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
  const colorMap    = theme._colorMap || DEFAULT_COLORS
  const accentColor = colorMap[settings.theme || 'blue'] || colorMap.blue || '#2563eb'

  // Attach computed design CSS to each section for liquid templates
  pageSections = pageSections.map(sec => ({
    ...sec,
    _designCss: buildSectionDesignCss(sec.design || {}, colorMap, accentColor)
  }))
  settings = { ...settings, sections: pageSections }

  const fontDefs = (theme.settings && theme.settings.fonts) || []
  const fontMap  = {}
  for (const f of fontDefs) fontMap[f.id] = f.label || f.id

  const engine = new Liquid({ strictFilters: false, strictVariables: false })
  engine.registerFilter('wa',  (phone)     => (phone || '').replace(/\D/g, ''))
  engine.registerFilter('hex', (colorSlug) => colorMap[colorSlug] || accentColor)
  engine.registerFilter('where_includes', (arr, key, val) => Array.isArray(arr) ? arr.filter(item => Array.isArray(item[key]) && item[key].includes(val)) : [])
  engine.registerFilter('tojson', (obj) => JSON.stringify(obj) ?? 'null')
  engine.registerFilter('safejson', (obj) => (JSON.stringify(obj) ?? 'null').replace(/<\/script>/gi, '<\\/script>'))

  // ── Pre-render plugin sections ──────────────────────────────────────────────
  const plugins        = loadGlobalSections()
  const pluginIds      = new Set(plugins.map(p => p.id))
  const themeSectionIds = new Set((theme.sections || []).map(s => s.id))
  const renderedSections = {}

  const pluginContext = {
    site: { title: site.title, subdomain: site.subdomain },
    settings: { ...settings, accent_color: accentColor },
    theme: { slug: theme.slug, name: theme.name, colors: colorMap },
    app_name:   process.env.APP_NAME || 'PageZapper',
    app_url:    process.env.APP_URL  || 'https://pagezapper.com',
    site_forms: siteForms
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

  // ── Pre-render ROW sections ─────────────────────────────────────────────────

  // Extract a specific pz-sec div from fully-rendered HTML using div depth counting
  function extractPzSecDiv(html, sectionId) {
    const marker = `data-pz="${sectionId}"`
    const markerPos = html.indexOf(marker)
    if (markerPos < 0) return null

    // Walk back to find the opening <div
    let start = markerPos
    while (start > 0 && html[start] !== '<') start--

    // Count div depth to find the matching </div>
    let depth = 0, i = start
    while (i < html.length) {
      const chunk4 = html.slice(i, i + 5).toLowerCase()
      if (chunk4.startsWith('</div')) {
        depth--
        if (depth <= 0) {
          const closeEnd = html.indexOf('>', i) + 1
          return html.slice(start, closeEnd)
        }
        i += 5
      } else if (chunk4.startsWith('<div')) {
        depth++
        i += 4
      } else {
        i++
      }
    }
    return html.slice(start)
  }

  // Render a single section using the full theme template, then extract its div
  async function renderSectionInRow(sec) {
    if (!sec || sec._hidden) return ''
    const secWithCss = { ...sec, _designCss: buildSectionDesignCss(sec.design || {}, colorMap, accentColor) }
    const wrapCss    = secWithCss._designCss ? ` style="${secWithCss._designCss}"` : ''

    // 1. Global (plugin) sections have their own render.liquid
    const plugin = plugins.find(p => p.id === sec.id)
    if (plugin) {
      const themeRender   = path.join(plugin._path, theme.slug + '.liquid')
      const defaultRender = path.join(plugin._path, 'render.liquid')
      const renderFile    = fs.existsSync(themeRender) ? themeRender
                          : fs.existsSync(defaultRender) ? defaultRender : null
      if (renderFile) {
        try {
          const src = fs.readFileSync(renderFile, 'utf8')
          return await engine.parseAndRender(src, { ...pluginContext, section: secWithCss })
        } catch(e) {
          return `<!-- plugin section "${sec.id}" error: ${e.message} -->`
        }
      }
    }

    // 2. Theme-native sections: render the full theme with just this section,
    //    then extract the pz-sec div. This is reliable because it uses the
    //    theme's own rendering engine with full context.
    const indexFile = path.join(theme.path, 'index.liquid')
    if (fs.existsSync(indexFile)) {
      try {
        const source = fs.readFileSync(indexFile, 'utf8')
        const ctx = {
          ...pluginContext,
          site:     { title: site.title, subdomain: site.subdomain, url: `https://${site.subdomain}.${process.env.BASE_DOMAIN || 'pagezapper.com'}` },
          settings: { ...settings, accent_color: accentColor },
          theme:    { slug: theme.slug, name: theme.name, assetsUrl: theme.assetsUrl, colors: theme._colorMap, fonts: fontMap },
          sections: [secWithCss],
          rendered_sections: {},     // no nested rows in row sections
          page_id:    'home',
          site_pages: [],
          nav_items:  [],
          site_type:  settings.site_type || 'business',
          city:       settings.city || '',
          app_name:   process.env.APP_NAME || 'PageZapper',
          app_url:    process.env.APP_URL  || 'https://pagezapper.com',
          site_forms: siteForms
        }
        const fullHtml = await engine.parseAndRender(source, ctx)
        const extracted = extractPzSecDiv(fullHtml, sec.id)
        if (extracted) return extracted
      } catch(e) {
        console.error(`[row render] theme section "${sec.id}" error:`, e.message)
      }
    }

    // 3. Fallback placeholder
    return `<div class="pz-sec" data-pz="${sec.id}"${wrapCss} style="padding:20px;text-align:center;opacity:0.5;font-size:13px;border:1px dashed #ccc;">${sec.id}</div>`
  }

  const LAYOUT_COLS = {
    '1':       '1fr',
    '1-1':     '1fr 1fr',
    '1-1-1':   '1fr 1fr 1fr',
    '1-1-1-1': '1fr 1fr 1fr 1fr',
    '1-2':     '1fr 2fr',
    '2-1':     '2fr 1fr',
    '1-3':     '1fr 3fr',
    '3-1':     '3fr 1fr',
    '1-1-2':   '1fr 1fr 2fr',
    '2-1-1':   '2fr 1fr 1fr'
  }

  for (const sec of pageSections) {
    if (!sec._isRow) continue

    const layout   = sec.layout || '1-1'
    const gridCols = LAYOUT_COLS[layout] || '1fr 1fr'
    const cols     = sec.columns || []
    const rowCss   = buildSectionDesignCss(sec.design || {}, colorMap, accentColor)

    const colHTMLs = []
    for (const col of cols) {
      let colHTML = ''
      for (const colSec of (col || [])) {
        colHTML += await renderSectionInRow(colSec)
      }
      colHTMLs.push(colHTML)
    }

    const numCols = cols.length || 2
    renderedSections[sec.id] = `
<div class="pz-row" data-pz="${sec.id}" ${rowCss ? `style="${rowCss}"` : ''}>
  <div class="pz-row-grid" style="display:grid;grid-template-columns:${gridCols};gap:0;width:100%;align-items:start;">
    ${colHTMLs.map((h, ci) => `<div class="pz-row-col" data-col="${ci}">${h}</div>`).join('')}
  </div>
</div>
<style>
.pz-row{width:100%;}
.pz-row-grid{width:100%;}
@media(max-width:768px){.pz-row-grid{grid-template-columns:1fr!important;}}
</style>`
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
      id:        site.id,
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
    app_url:           process.env.APP_URL  || 'https://pagezapper.com',
    site_forms:        siteForms,
    ...extraCtx
  }

  let html = await engine.parseAndRender(source, context)
  html = injectGlobalStyles(html, settings)

  // Inject section order CSS when user has reordered sections
  const secOrder = settings._section_order
  if (secOrder && Array.isArray(secOrder) && secOrder.length) {
    const orderCss = secOrder.map((id, i) => `[data-sec="${id}"]{order:${i};}`).join('')
    const orderStyle = `<style>.page{display:flex!important;flex-direction:column!important;}${orderCss}.save-contact-bar{order:9998!important;}.share-bar{order:9999!important;}</style>`
    html = html.replace('</head>', orderStyle + '</head>')
  }

  return html
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
  engine.registerFilter('where_includes', (arr, key, val) => Array.isArray(arr) ? arr.filter(item => Array.isArray(item[key]) && item[key].includes(val)) : [])
  engine.registerFilter('tojson', (obj) => JSON.stringify(obj) ?? 'null')
  engine.registerFilter('safejson', (obj) => (JSON.stringify(obj) ?? 'null').replace(/<\/script>/gi, '<\\/script>'))

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
  engine.registerFilter('where_includes', (arr, key, val) => Array.isArray(arr) ? arr.filter(item => Array.isArray(item[key]) && item[key].includes(val)) : [])
  engine.registerFilter('tojson', (obj) => JSON.stringify(obj) ?? 'null')
  engine.registerFilter('safejson', (obj) => (JSON.stringify(obj) ?? 'null').replace(/<\/script>/gi, '<\\/script>'))

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

  // Padding — individual values take priority over preset chips
  const hasIndividualPad = design.paddingTop != null || design.paddingRight != null ||
                           design.paddingBottom != null || design.paddingLeft != null
  if (hasIndividualPad) {
    if (design.paddingTop    != null) parts.push(`padding-top:${design.paddingTop}px`)
    if (design.paddingRight  != null) parts.push(`padding-right:${design.paddingRight}px`)
    if (design.paddingBottom != null) parts.push(`padding-bottom:${design.paddingBottom}px`)
    if (design.paddingLeft   != null) parts.push(`padding-left:${design.paddingLeft}px`)
  } else {
    // Fall back to quick-preset chips
    if (design.paddingY === 'none')     parts.push('padding-top:0;padding-bottom:0')
    else if (design.paddingY === 'compact')  parts.push('padding-top:32px;padding-bottom:32px')
    else if (design.paddingY === 'spacious') parts.push('padding-top:120px;padding-bottom:120px')
  }

  // Margin
  if (design.marginTop    != null) parts.push(`margin-top:${design.marginTop}px`)
  if (design.marginBottom != null) parts.push(`margin-bottom:${design.marginBottom}px`)

  // Border
  const borderWidths = { thin: '1px', medium: '2px', thick: '4px' }
  if (design.border && design.border !== 'none') {
    const bw    = borderWidths[design.border] || '1px'
    const bcol  = design.borderColor || '#e5e7eb'
    parts.push(`border:${bw} solid ${bcol}`)
  }

  // Border radius
  const radii = { sm: '6px', md: '12px', lg: '20px', full: '999px' }
  if (design.borderRadius && design.borderRadius !== 'none') {
    parts.push(`border-radius:${radii[design.borderRadius] || '0'}`)
    parts.push('overflow:hidden')
  }

  // Shadow
  const shadows = {
    sm: '0 1px 4px rgba(0,0,0,0.08)',
    md: '0 4px 16px rgba(0,0,0,0.12)',
    lg: '0 12px 40px rgba(0,0,0,0.18)'
  }
  if (design.shadow && design.shadow !== 'none') {
    parts.push(`box-shadow:${shadows[design.shadow]}`)
  }

  // Opacity
  if (design.opacity && design.opacity !== '100') {
    parts.push(`opacity:${parseInt(design.opacity) / 100}`)
  }

  // Entrance animation — inject class via data attr; handled by injected CSS
  if (design.animation && design.animation !== 'none') {
    parts.push(`--pz-anim:${design.animation}`)
  }

  return parts.join(';')
}

// ── Animation CSS (always injected) ──────────────────────────────────────────
const PZ_ANIMATION_CSS = `<style>
@keyframes pzFadeIn{from{opacity:0}to{opacity:1}}
@keyframes pzSlideUp{from{opacity:0;transform:translateY(32px)}to{opacity:1;transform:translateY(0)}}
@keyframes pzSlideLeft{from{opacity:0;transform:translateX(40px)}to{opacity:1;transform:translateX(0)}}
@keyframes pzZoomIn{from{opacity:0;transform:scale(0.92)}to{opacity:1;transform:scale(1)}}
[style*="--pz-anim:fadeIn"]{animation:pzFadeIn 0.7s ease both}
[style*="--pz-anim:slideUp"]{animation:pzSlideUp 0.7s ease both}
[style*="--pz-anim:slideLeft"]{animation:pzSlideLeft 0.7s ease both}
[style*="--pz-anim:zoomIn"]{animation:pzZoomIn 0.6s ease both}
</style>`

// ── Global style injection helper ─────────────────────────────────────────────
function injectGlobalStyles(html, settings) {
  // Always inject animation CSS
  html = html.replace('</head>', PZ_ANIMATION_CSS + '</head>')

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

const { db }      = require('../config/db')
const { v4: uuidv4 } = require('uuid')
const appManager  = require('../config/appManager')

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

/* Build the pages array for a given theme — shared by create and importTheme */
function buildPagesForTheme(themeId, siteName, ts) {
  const isSpark = themeId === 'ecom-spark'
  const isEcom  = themeId.startsWith('ecom-')
  if (isSpark) {
    return [
      { title:'Home',     slug:'home',     is_home:1, sections: JSON.stringify([
          { id:uuidv4(), type:'hero',            data:{ headline:`Welcome to ${siteName}`, subheadline:'Limited drops. Zero restocks. Street-ready pieces.', cta_label:'Shop the Drop', cta_url:'/products', cta2_label:'Our Story', cta2_url:'/about', bg_color:ts.primary, text_color:'#ffffff', layout:'centered' }},
          { id:uuidv4(), type:'category_banner', data:{ heading:'Shop by Category', categories:[{name:'Tees & Tops',icon:'👕',color:'#0f172a',url:'#'},{name:'Bottoms',icon:'👖',color:'#1e293b',url:'#'},{name:'Outerwear',icon:'🧥',color:'#f43f5e',url:'#'},{name:'Accessories',icon:'🧢',color:'#334155',url:'#'}]}},
          { id:uuidv4(), type:'product_grid',    data:{ heading:'New Arrivals', products:[{icon:'🔥',name:'Product One',category:'Category',price:'₹0',badge:'New'},{icon:'⚡',name:'Product Two',category:'Category',price:'₹0'},{icon:'🧥',name:'Product Three',category:'Category',price:'₹0'},{icon:'🧢',name:'Product Four',category:'Category',price:'₹0'}]}},
          { id:uuidv4(), type:'newsletter',      data:{ heading:'Join the Drop List', subtext:'Get early access to every drop.', placeholder:'Enter your email', cta:'Subscribe' }}
        ])},
      { title:'About',    slug:'about',    is_home:0, sections: JSON.stringify([
          { id:uuidv4(), type:'hero',  data:{ headline:'Our Story', subheadline:`${siteName} — built from the ground up.`, cta_label:'Shop Now', cta_url:'/products', bg_color:'#0f172a', text_color:'#ffffff', layout:'centered' }},
          { id:uuidv4(), type:'about', data:{ heading:'Who We Are', text:'Tell your brand story here. Where did you start, what do you believe in, and why does it matter?', image:'', layout:'image_right' }},
          { id:uuidv4(), type:'cta',   data:{ heading:'Ready to Shop?', subheading:'New drops every season.', cta_label:'Shop All Products', cta_url:'/products', bg_color:ts.primary }}
        ])},
      { title:'Shop',     slug:'products', is_home:0, sections: JSON.stringify([
          { id:uuidv4(), type:'hero',         data:{ headline:'Shop All', subheadline:'New Drop — Live Now', cta_label:'', cta_url:'', bg_color:'#0f172a', text_color:'#ffffff', layout:'centered' }},
          { id:uuidv4(), type:'product_grid', data:{ heading:'All Products', products:[
            {icon:'👕',name:'Product 1',category:'Category',price:'₹0'},{icon:'👕',name:'Product 2',category:'Category',price:'₹0'},
            {icon:'👕',name:'Product 3',category:'Category',price:'₹0'},{icon:'👕',name:'Product 4',category:'Category',price:'₹0'},
            {icon:'👕',name:'Product 5',category:'Category',price:'₹0'},{icon:'👕',name:'Product 6',category:'Category',price:'₹0'}
          ]}}
        ])},
      { title:'Product',  slug:'product',  is_home:0, sections: JSON.stringify([
          { id:uuidv4(), type:'product_detail', data:{ name:'Product Name', category:'Category', price:'₹0', icon:'👕', desc:'Add your product description here.', sizes:['XS','S','M','L','XL','XXL'], colors:['#1f2937','#6b7280','#f43f5e'] }}
        ])},
      { title:'Category', slug:'category', is_home:0, sections: JSON.stringify([
          { id:uuidv4(), type:'hero',         data:{ headline:'Category Name', subheadline:'Browse the collection', cta_label:'', cta_url:'', bg_color:'#0f172a', text_color:'#ffffff', layout:'centered' }},
          { id:uuidv4(), type:'product_grid', data:{ heading:'', products:[
            {icon:'👕',name:'Product 1',category:'Category',price:'₹0'},{icon:'👕',name:'Product 2',category:'Category',price:'₹0'},
            {icon:'👕',name:'Product 3',category:'Category',price:'₹0'},{icon:'👕',name:'Product 4',category:'Category',price:'₹0'}
          ]}}
        ])},
      { title:'Cart',     slug:'cart',     is_home:0, sections: JSON.stringify([
          { id:uuidv4(), type:'cart', data:{ heading:'Your Cart', items:[{icon:'👕',name:'Product Name',variant:'Size: M',qty:1,price:'₹0'}], subtotal:'₹0', shipping:'Free', total:'₹0' }}
        ])},
      { title:'Checkout', slug:'checkout', is_home:0, sections: JSON.stringify([
          { id:uuidv4(), type:'checkout', data:{ heading:'Checkout', items:[{name:'Product Name × 1',qty:1,price:'₹0'}], subtotal:'₹0', shipping:'Free', total:'₹0' }}
        ])}
    ]
  } else if (isEcom) {
    return [
      { title:'Home', slug:'home', is_home:1, sections: JSON.stringify([
          { id:uuidv4(), type:'hero',         data:{ headline:`Welcome to ${siteName}`, subheadline:'Discover our curated collection.', cta_label:'Shop Now', cta_url:'/products', bg_color:ts.primary, text_color:'#ffffff', layout:'centered' }},
          { id:uuidv4(), type:'product_grid', data:{ heading:'Featured Products', products:[{icon:'⭐',name:'Product One',category:'',price:'₹0'},{icon:'🔥',name:'Product Two',category:'',price:'₹0'},{icon:'💎',name:'Product Three',category:'',price:'₹0'}]}},
          { id:uuidv4(), type:'testimonials', data:{ heading:'Happy Customers', items:[{name:'Customer Name', role:'Verified Buyer', quote:'Absolutely love the quality!'}]}},
          { id:uuidv4(), type:'contact',      data:{ heading:'Get in Touch', email:'', phone:'', address:'', show_form:true }}
        ])}
    ]
  } else if (themeId === 'realestate') {
    return [
      { title:'Home', slug:'home', is_home:1, sections: JSON.stringify([
          { id:uuidv4(), type:'property_search', data:{ headline:`Find Your Dream Home with ${siteName}`, subtext:'Thousands of verified properties across top cities. Your perfect home is one search away.', stats:[{num:'2,500+',label:'Properties'},{num:'850+',label:'Happy Families'},{num:'12+',label:'Years'},{num:'98%',label:'Satisfaction'}], bg_image:'' }},
          { id:uuidv4(), type:'property_listings', data:{ heading:'Featured Properties', subheading:'Hand-picked by our expert agents', properties:[
            {icon:'🏠',title:'3 BHK Apartment',location:'Bandra West, Mumbai',price:'₹1.8 Cr',beds:3,baths:2,sqft:1450,tag:'For Sale'},
            {icon:'🏡',title:'4 BHK Villa',location:'Whitefield, Bangalore',price:'₹2.4 Cr',beds:4,baths:3,sqft:2800,tag:'Featured'},
            {icon:'🏢',title:'2 BHK Flat',location:'Dwarka, Delhi',price:'₹85 L',beds:2,baths:2,sqft:980,tag:'New'}
          ], cta_label:'View All Properties', cta_url:'/properties'}},
          { id:uuidv4(), type:'services', data:{ heading:'Why Choose Us', items:[{icon:'🔑',title:'Verified Listings',desc:'Every property is personally verified by our agents for complete peace of mind.'},{icon:'📊',title:'Market Expertise',desc:'12+ years of market data to help you buy or sell at the right price.'},{icon:'🤝',title:'End-to-End Support',desc:'From shortlisting to registration, we guide you through every step.'}]}},
          { id:uuidv4(), type:'testimonials', data:{ heading:'What Our Clients Say', items:[{name:'Rajesh Kumar',role:'Home Buyer, Mumbai',quote:'Found our dream 3BHK in just 2 weeks. The team was incredibly professional and transparent throughout.'},{name:'Priya Singh',role:'Property Investor',quote:"Best real estate experience I've had. They knew exactly what I was looking for and didn't waste my time."},{name:'Ankit Sharma',role:'First-time Buyer',quote:'As a first-time buyer I had so many doubts. The team walked me through everything patiently.'}]}},
          { id:uuidv4(), type:'contact', data:{ heading:'Talk to an Agent', email:'hello@estate.in', phone:'+91 98765 43210', address:'123 Business Park, Mumbai 400001', show_form:true }}
        ])},
      { title:'About', slug:'about', is_home:0, sections: JSON.stringify([
          { id:uuidv4(), type:'hero', data:{ headline:`About ${siteName}`, subheadline:'Trusted real estate partner since 2012. Building relationships, not just transactions.', cta_label:'Meet Our Team', cta_url:'/agents', cta2_label:'Our Properties', cta2_url:'/properties', bg_color:ts.primary, text_color:'#ffffff', layout:'centered' }},
          { id:uuidv4(), type:'about', data:{ heading:'Our Story', text:`${siteName} was founded with a simple belief: buying or selling a home should be a joyful experience, not a stressful one. Over 12 years we've helped 850+ families find their perfect homes across India's top cities.`, image:'', layout:'image_right' }},
          { id:uuidv4(), type:'stats', data:{ heading:'', items:[{number:'2,500+',label:'Active Listings',emoji:'🏠'},{number:'850+',label:'Happy Families',emoji:'👨‍👩‍👧'},{number:'12',label:'Years Experience',emoji:'🏆'},{number:'98%',label:'Client Satisfaction',emoji:'⭐'}]}},
          { id:uuidv4(), type:'agents', data:{ heading:'Meet Our Agents', subheading:'Expert professionals dedicated to finding you the perfect home', items:[{icon:'👩',name:'Priya Sharma',specialty:'Luxury Residential',listings:48,sold:120,years:8},{icon:'👨',name:'Rahul Mehta',specialty:'Commercial & Investment',listings:35,sold:94,years:6},{icon:'👩',name:'Ananya Patel',specialty:'Affordable Housing',listings:52,sold:145,years:10},{icon:'👨',name:'Vikram Singh',specialty:'Plots & Land',listings:29,sold:67,years:5}]}}
        ])},
      { title:'Properties', slug:'properties', is_home:0, sections: JSON.stringify([
          { id:uuidv4(), type:'property_search', data:{ headline:'Browse All Properties', subtext:'Filter by location, type, and budget to find your ideal home.', stats:[], bg_image:'' }},
          { id:uuidv4(), type:'property_listings', data:{ heading:'All Listings', subheading:'', properties:[
            {icon:'🏠',title:'3 BHK Apartment',location:'Bandra West, Mumbai',price:'₹1.8 Cr',beds:3,baths:2,sqft:1450,tag:'For Sale'},
            {icon:'🏡',title:'4 BHK Villa',location:'Whitefield, Bangalore',price:'₹2.4 Cr',beds:4,baths:3,sqft:2800,tag:'For Sale'},
            {icon:'🏢',title:'2 BHK Flat',location:'Dwarka, Delhi',price:'₹85 L',beds:2,baths:2,sqft:980,tag:'For Rent'},
            {icon:'🏘️',title:'Independent House',location:'Koramangala, Bangalore',price:'₹1.2 Cr',beds:3,baths:2,sqft:1800,tag:'For Sale'},
            {icon:'🏙️',title:'Studio Apartment',location:'Andheri East, Mumbai',price:'₹55 L',beds:1,baths:1,sqft:520,tag:'New'},
            {icon:'🏗️',title:'Commercial Space',location:'Connaught Place, Delhi',price:'₹3.2 Cr',sqft:3200,tag:'For Sale'}
          ]}}
        ])},
      { title:'Contact', slug:'contact', is_home:0, sections: JSON.stringify([
          { id:uuidv4(), type:'hero', data:{ headline:'Get in Touch', subheadline:"Whether you're buying, selling, or just exploring — we'd love to hear from you.", cta_label:'', cta_url:'', bg_color:ts.primary, text_color:'#ffffff', layout:'centered' }},
          { id:uuidv4(), type:'contact', data:{ heading:'Reach Out to Us', email:'hello@estate.in', phone:'+91 98765 43210', address:'123 Business Park, Lower Parel, Mumbai 400013', show_form:true }}
        ])},
      { title:'Blog', slug:'blog', is_home:0, sections: JSON.stringify([
          { id:uuidv4(), type:'hero', data:{ headline:'Real Estate Insights', subheadline:'Market trends, home buying guides, and investment tips from our experts.', cta_label:'', cta_url:'', bg_color:ts.primary, text_color:'#ffffff', layout:'centered' }},
          { id:uuidv4(), type:'blog_posts', data:{ heading:'Latest Articles', subheading:'', posts:[
            {icon:'🏠',category:'Buying Guide',title:'10 Things to Check Before Buying a Flat in Mumbai',excerpt:'From legal documentation to structural quality — a complete pre-purchase checklist every buyer should follow.',author:'Priya Sharma',date:'Jul 20, 2026'},
            {icon:'📈',category:'Market Trends',title:'Bangalore Real Estate Market Report — Q2 2026',excerpt:'Key data on price movements, demand hotspots, and the best micro-markets for investment this quarter.',author:'Rahul Mehta',date:'Jul 12, 2026'},
            {icon:'🔑',category:'Selling Tips',title:'How to Price Your Property Right in a Competitive Market',excerpt:'Overpricing stalls deals. Underpricing leaves money on the table. Here\'s how to find the sweet spot.',author:'Ananya Patel',date:'Jul 5, 2026'}
          ]}}
        ])}
    ]
  } else {
    return [
      { title:'Home', slug:'home', is_home:1, sections: JSON.stringify([
          { id:uuidv4(), type:'hero',     data:{ headline:`Welcome to ${siteName}`, subheadline:'We deliver exceptional results', cta_label:'Get Started', cta_url:'#contact', bg_color:ts.primary, text_color:'#ffffff', bg_image:'' }},
          { id:uuidv4(), type:'about',    data:{ heading:'About Us', text:'Tell your story here. What makes you unique?', image:'', layout:'image_right' }},
          { id:uuidv4(), type:'services', data:{ heading:'Our Services', items:[{icon:'⚡',title:'Service One',desc:'Description'},{icon:'🎯',title:'Service Two',desc:'Description'},{icon:'💎',title:'Service Three',desc:'Description'}]}},
          { id:uuidv4(), type:'contact',  data:{ heading:'Get in Touch', email:'', phone:'', address:'', show_form:true }}
        ])}
    ]
  }
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
const THEME_SETTINGS_MAP = {
  'default':     { font: 'Inter',               primary: '#6366f1', text: '#111827', bg: '#ffffff' },
  'minimal':     { font: 'Playfair Display',    primary: '#b45309', text: '#1c1917', bg: '#fdf8f0' },
  'bold':        { font: 'Inter',               primary: '#8b5cf6', text: '#e2e8f0', bg: '#0f0f1a' },
  'ecom-fresh':  { font: 'Inter',               primary: '#059669', text: '#111827', bg: '#ffffff' },
  'ecom-luxe':   { font: 'Cormorant Garamond',  primary: '#d4af37', text: '#f5f0e8', bg: '#0a0a0f' },
  'ecom-spark':  { font: 'DM Sans',             primary: '#f43f5e', text: '#0f172a', bg: '#ffffff' },
  'realestate':  { font: 'Plus Jakarta Sans',   primary: '#0f4c81', text: '#1e293b', bg: '#ffffff' }
}

exports.create = async (req, res) => {
  const user = req.session.user
  const { title, theme } = req.body
  const themeId = (theme && THEME_SETTINGS_MAP[theme]) ? theme : 'default'
  const ts = THEME_SETTINGS_MAP[themeId]
  try {
    const base = slug(title || 'my-website')
    let sub = base, n = 1
    while (true) {
      const ex = await db.first('SELECT id FROM ms_websites WHERE subdomain = ?', [sub])
      if (!ex) break
      sub = base + '-' + (n++)
    }
    const settings = JSON.stringify({
      font: ts.font, primary: ts.primary, text: ts.text,
      bg: ts.bg, logo: '', tagline: '', theme: themeId
    })
    const result = await db.execute(
      'INSERT INTO ms_websites (account_id, title, subdomain, settings, is_published) VALUES (?,?,?,?,1)',
      [user.id, title || 'My Website', sub, settings]
    )
    const websiteId = result.insertId

    // Create starter pages
    const siteName = title || 'My Website'
    const pagesToCreate = buildPagesForTheme(themeId, siteName, ts)

    try {
      for (const pg of pagesToCreate) {
        const meta = JSON.stringify({ is_home: pg.is_home, seo_title:'', seo_desc:'' })
        await db.execute(
          `INSERT INTO ms_posts (account_id, website_id, post_type, title, slug, status, sections, meta)
           VALUES (?,?,?,?,?,?,?,?)`,
          [user.id, websiteId, 'page', pg.title, pg.slug, 'published', pg.sections, meta]
        )
      }
    } catch(e) {
      console.error('[website.create] ms_posts insert failed:', e.message)
    }

    res.redirect('/dashboard/website/' + websiteId + '/editor')
  } catch(e) {
    console.error('[website.create] failed:', e.message)
    res.redirect('/dashboard/website?error=' + encodeURIComponent(e.message))
  }
}

/* ═══════════════════════════════════════════════════════════════════════════════
   IMPORT THEME — replace all pages with theme starter content
   POST /dashboard/website/:id/import-theme
   Body: { themeId: 'ecom-spark' }
   ═══════════════════════════════════════════════════════════════════════════ */
exports.importTheme = async (req, res) => {
  const user = req.session.user
  const websiteId = parseInt(req.params.id)
  const { themeId } = req.body
  try {
    const website = await db.first('SELECT * FROM ms_websites WHERE id=? AND account_id=?', [websiteId, user.id])
    if (!website) return res.json({ ok: false, error: 'Not found' })

    const ts = THEME_SETTINGS_MAP[themeId] || THEME_SETTINGS_MAP['default']
    const existing = parseJSON(website.settings, {})
    const siteName = website.title || 'My Website'

    // 1. Update website settings with new theme defaults
    const newSettings = JSON.stringify(Object.assign(existing, {
      theme: themeId, primary: ts.primary, font: ts.font, text: ts.text, bg: ts.bg
    }))
    await db.execute('UPDATE ms_websites SET settings=? WHERE id=?', [newSettings, websiteId])

    // 2. Delete all existing pages
    await db.execute(`DELETE FROM ms_posts WHERE website_id=? AND post_type='page'`, [websiteId])

    // 3. Insert theme starter pages
    const pagesToCreate = buildPagesForTheme(themeId, siteName, ts)
    let firstPageId = null
    for (const pg of pagesToCreate) {
      const meta = JSON.stringify({ is_home: pg.is_home, seo_title: '', seo_desc: '' })
      const result = await db.execute(
        `INSERT INTO ms_posts (account_id, website_id, post_type, title, slug, status, sections, meta) VALUES (?,?,?,?,?,?,?,?)`,
        [user.id, websiteId, 'page', pg.title, pg.slug, 'published', pg.sections, meta]
      )
      if (pg.is_home) firstPageId = result.insertId
    }

    res.json({ ok: true, redirectUrl: '/dashboard/website/' + websiteId + '/editor' + (firstPageId ? '?page=' + firstPageId : '') })
  } catch(e) {
    console.error('[website.importTheme]', e.message)
    res.json({ ok: false, error: e.message })
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
         FROM ms_posts WHERE website_id = ? AND post_type = 'page' ORDER BY id ASC`,
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

    let siteAppsRaw = '{}'
    try { siteAppsRaw = JSON.stringify(JSON.parse(website.apps || '{}')) } catch(e) {}

    res.render('dashboard/website-editor.njk', {
      title: website.title + ' — Editor',
      activePage: 'website',
      user, website, pages, activeSitePage,
      siteAppsJson: siteAppsRaw,
      baseDomain: process.env.BASE_DOMAIN || 'pagezapper.com',
      serverIp:   process.env.SERVER_IP   || ''
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
   THEME DEMO — renders a fake website with demo content for theme preview
   GET /theme-demo/:themeId   (no auth required)
   ═══════════════════════════════════════════════════════════════════════════ */
const THEME_DEMO_DATA = {
  'default': {
    title: 'Nova Agency',
    settings: { font:'Inter', primary:'#6366f1', text:'#111827', bg:'#ffffff', theme:'default', logo:'', tagline:'Digital solutions for modern businesses' },
    sections: [
      { id:'d1', type:'hero', data:{ headline:'We Build Digital Experiences', subheadline:'From strategy to launch, we craft products that users love and businesses scale on. Trusted by 200+ companies worldwide.', cta_label:'Get Started', cta_url:'#contact', cta2_label:'See Our Work', cta2_url:'#services', bg_color:'#6366f1', text_color:'#ffffff', layout:'centered' }},
      { id:'d2', type:'about', data:{ heading:'Who We Are', text:'Nova Agency is a full-service digital studio founded in 2018. We partner with startups and enterprises to design, build, and grow digital products that people love. Our team of 24 designers and engineers has shipped over 200 projects across 18 countries.', image:'', layout:'image_right' }},
      { id:'d3', type:'services', data:{ heading:'What We Do', items:[
        { icon:'🎨', title:'UI/UX Design', desc:'Human-centered design systems that are beautiful, intuitive, and accessible.' },
        { icon:'⚙️', title:'Product Engineering', desc:'Scalable, performant web and mobile applications built to last.' },
        { icon:'📈', title:'Growth Strategy', desc:'Data-driven marketing and analytics to accelerate your growth.' },
        { icon:'☁️', title:'Cloud Infrastructure', desc:'DevOps and cloud architecture to keep your product fast and reliable.' },
        { icon:'🤖', title:'AI Integration', desc:'LLM-powered features and automation that give you a competitive edge.' },
        { icon:'🔒', title:'Security Audit', desc:'Comprehensive security reviews and penetration testing services.' }
      ]}},
      { id:'d4', type:'testimonials', data:{ heading:"What Our Clients Say", items:[
        { name:'Arjun Mehta', role:'CEO, Finstack', quote:'Nova delivered our entire product in 12 weeks — design, engineering, everything. The quality was exceptional and team communication was top tier.' },
        { name:'Sarah Chen', role:'Product Lead, Lumos', quote:'The design system they built has scaled from 10 to 10,000 users without a single redesign. Incredible foresight.' },
        { name:'Priya Nair', role:'Founder, Clearview', quote:"We've worked with 4 agencies before Nova. None came close to their level of execution and ownership." }
      ]}},
      { id:'d5', type:'contact', data:{ heading:'Start a Project', email:'hello@novaagency.com', phone:'+91 98765 43210', address:'12th Floor, Cyber Hub, Gurugram', show_form:true }}
    ]
  },
  'minimal': {
    title: 'Atelier Blanc',
    settings: { font:'Playfair Display', primary:'#b45309', text:'#1c1917', bg:'#fdf8f0', theme:'minimal', logo:'', tagline:'Crafted with intention' },
    sections: [
      { id:'d1', type:'hero', data:{ headline:'Crafted with Intention', subheadline:"A boutique creative studio specialising in brand identity, editorial design, and print for the world's most considered brands.", cta_label:'View Portfolio', cta_url:'#services', cta2_label:'Get in Touch', cta2_url:'#contact', bg_color:'#2c1810', text_color:'#fdf8f0', layout:'centered' }},
      { id:'d2', type:'about', data:{ heading:'Our Approach', text:"Founded in 2016, Atelier Blanc is guided by a single belief: great design is indistinguishable from great craft. We work with a small number of clients each year to ensure every project receives our full attention. Our process is slow, deliberate, and thorough.", image:'', layout:'image_left' }},
      { id:'d3', type:'services', data:{ heading:'Services', items:[
        { icon:'✒️', title:'Brand Identity', desc:'Comprehensive visual identity — logos, typography, colour systems, and brand guidelines.' },
        { icon:'📖', title:'Editorial Design', desc:'Magazines, annual reports, books, and catalogues designed for print and screen.' },
        { icon:'🖼', title:'Art Direction', desc:'Creative direction and set design for photography and campaign shoots.' },
        { icon:'📦', title:'Luxury Packaging', desc:'Packaging design that commands attention on shelf and tells a story at unboxing.' }
      ]}},
      { id:'d4', type:'testimonials', data:{ heading:'Kind Words', items:[
        { name:'Henri Rousseau', role:'Creative Director, Maison Verre', quote:"Isabelle's work elevated our brand in ways we hadn't imagined. The typography choices alone were worth the investment." },
        { name:'Clara Fontaine', role:'Founder, Botanica', quote:'Working with Atelier Blanc was a joy from first call to final print. Meticulous, thoughtful, brilliant.' }
      ]}},
      { id:'d5', type:'contact', data:{ heading:'New Enquiries', email:'bonjour@atelierblanc.com', phone:'+33 1 42 86 55 10', address:'15 Rue du Faubourg Saint-Honoré, Paris', show_form:true }}
    ]
  },
  'bold': {
    title: 'Nexus AI',
    settings: { font:'Inter', primary:'#8b5cf6', text:'#e2e8f0', bg:'#0f0f1a', theme:'bold', logo:'', tagline:'Next-generation AI infrastructure' },
    sections: [
      { id:'d1', type:'hero', data:{ headline:'AI That Works at Scale', subheadline:'Production-grade AI infrastructure — low latency, high reliability, enterprise compliance. Ship faster than your competition.', cta_label:'Start Free Trial', cta_url:'#contact', cta2_label:'View Docs', cta2_url:'#services', bg_color:'#080810', text_color:'#e2e8f0', layout:'centered' }},
      { id:'d2', type:'about', data:{ heading:'Built for Builders', text:'Nexus was founded by ex-Google Brain and DeepMind engineers. We built the AI infrastructure platform we always wanted — and now we make it available to everyone building the next generation of AI products. 3,000+ teams trust us in production.', image:'', layout:'image_right' }},
      { id:'d3', type:'services', data:{ heading:'Platform Features', items:[
        { icon:'⚡', title:'Ultra-Low Latency', desc:'Sub-100ms inference globally across our edge deployment network in 35 regions.' },
        { icon:'🧠', title:'Model Playground', desc:'Fine-tune, evaluate, and deploy any open-weight model in minutes.' },
        { icon:'🔐', title:'Enterprise Security', desc:'SOC2 Type II, GDPR compliant. Private VPC deployment available.' },
        { icon:'📊', title:'Observability', desc:'Real-time traces, cost dashboards, and anomaly detection out of the box.' },
        { icon:'🔗', title:'Universal API', desc:'One consistent API for 60+ models. Switch with a single parameter change.' },
        { icon:'🤝', title:'Dedicated Support', desc:'On-call ML engineers for enterprise customers. SLA-backed uptime.' }
      ]}},
      { id:'d4', type:'testimonials', data:{ heading:'Trusted by AI Teams', items:[
        { name:'Kavya Reddy', role:'CTO, Synthex', quote:'We migrated our inference stack to Nexus in a weekend. Latency dropped 40%, costs dropped 60%. Wish we had done it sooner.' },
        { name:'James Liu', role:'ML Lead, Driftwood', quote:'The observability tooling alone is worth the price. We finally have full visibility into what our models are doing in production.' },
        { name:'Anika Patel', role:'Founder, Fieldnotes AI', quote:'Support is phenomenal. Our dedicated engineer knows our stack better than we do at this point.' }
      ]}},
      { id:'d5', type:'contact', data:{ heading:'Talk to Us', email:'hello@nexus.ai', phone:'+1 (415) 900-1234', address:'548 Market St, San Francisco, CA', show_form:true }}
    ]
  },
  'ecom-fresh': {
    title: 'The Fresh Co.',
    settings: { font:'Inter', primary:'#059669', text:'#111827', bg:'#ffffff', theme:'ecom-fresh', logo:'', tagline:'Fresh. Natural. Delivered.' },
    sections: [
      { id:'d1', type:'hero', data:{ headline:'Fresh Finds for Every Day', subheadline:'Organic produce, natural beauty, and home essentials — curated from local farms and makers, delivered to your door within 24 hours.', cta_label:'Shop Now', cta_url:'#services', cta2_label:'Our Story', cta2_url:'#about', bg_color:'#059669', text_color:'#ffffff', layout:'centered' }},
      { id:'d2', type:'about', data:{ heading:'Why Fresh Co.?', text:"We started Fresh Co. after struggling to find genuinely fresh, genuinely natural products in the city. We work directly with 47 local farms and independent makers — no middlemen — so you get the freshest products at fair prices. Every item is quality-checked before it reaches your door.", image:'', layout:'image_right' }},
      { id:'d3', type:'services', data:{ heading:'Our Best Sellers', items:[
        { icon:'🥑', title:'Organic Produce Box', desc:'Seasonal fruits and vegetables, hand-picked at peak freshness from our partner farms.', price:'₹499/week' },
        { icon:'🌿', title:'Herbal Tea Collection', desc:'Single-origin loose leaf teas from Darjeeling, Assam, and the Nilgiris.', price:'₹349' },
        { icon:'🍯', title:'Raw Forest Honey', desc:'Unfiltered, unprocessed honey from wild Himalayan beehives.', price:'₹599' },
        { icon:'🧴', title:'Natural Skincare Set', desc:'Plant-based cleanser, toner, and moisturiser. No sulphates, no parabens.', price:'₹1,299' },
        { icon:'🫙', title:'Cold-Pressed Oils', desc:'Coconut, sesame, and mustard oils — stone-pressed and chemical-free.', price:'₹249' },
        { icon:'🌾', title:'Ancient Grain Pack', desc:'Heritage varieties of rice, wheat, and millet — nutritious and full of flavour.', price:'₹399' }
      ]}},
      { id:'d4', type:'testimonials', data:{ heading:'Happy Customers', items:[
        { name:'Priya Sharma', role:'Mumbai', quote:"The produce is incredibly fresh — noticeably better than anything I've found in the market. My family has been subscribing for 8 months." },
        { name:'Rahul Menon', role:'Bangalore', quote:'The honey is unlike anything I\'ve tasted. The customer service is wonderful too — they replaced a damaged order the same day.' },
        { name:'Ananya Gupta', role:'Skin Type: Sensitive', quote:'Finally a natural skincare range that actually works on my skin. Zero irritation and my complexion has never looked better.' }
      ]}},
      { id:'d5', type:'contact', data:{ heading:'Get in Touch', email:'hello@thefreshco.in', phone:'+91 98765 11223', address:'Delivering across Mumbai, Pune & Bangalore', show_form:true }}
    ]
  },
  'ecom-luxe': {
    title: "Maison d'Or",
    settings: { font:'Cormorant Garamond', primary:'#d4af37', text:'#f5f0e8', bg:'#0a0a0f', theme:'ecom-luxe', logo:'', tagline:"Objects of enduring beauty" },
    sections: [
      { id:'d1', type:'hero', data:{ headline:'Objects of Enduring Beauty', subheadline:"An edit of the world's finest goods — jewellery, leather, and home objects for those who demand nothing less than the extraordinary.", cta_label:'Explore Collection', cta_url:'#services', cta2_label:'Private Viewing', cta2_url:'#contact', bg_color:'#0a0a0f', text_color:'#f5f0e8', layout:'centered' }},
      { id:'d2', type:'about', data:{ heading:'The House', text:"Maison d'Or was established in 1994 with one conviction: beautiful objects, properly cared for, outlast trends. We source exclusively from ateliers and artisans who share this belief. Every piece carries a provenance certificate and a lifetime repair guarantee.", image:'', layout:'image_left' }},
      { id:'d3', type:'services', data:{ heading:'The Collection', items:[
        { icon:'💎', title:'Fine Jewellery', desc:'18K gold and platinum pieces set with conflict-free stones. Each finished over 40+ hours by hand.', price:'From ₹28,000' },
        { icon:'⌚', title:'Heritage Timepieces', desc:"Mechanical watches from Geneva's finest independent maisons. Limited allocations.", price:'From ₹1,20,000' },
        { icon:'👜', title:'Luxury Leather Goods', desc:'Full-grain leather handbags and accessories from generational French ateliers.', price:'From ₹18,000' },
        { icon:'🕯️', title:'Home Objects', desc:'Sculptural objects, candles, and serveware by emerging and established designers.', price:'From ₹4,500' },
        { icon:'🧴', title:'Rare Fragrances', desc:'Niche perfumes in limited runs — natural ingredients, complex compositions.', price:'From ₹6,800' },
        { icon:'📿', title:'Bespoke Service', desc:'Commission personalised pieces with our atelier partners. 8–16 week lead time.', price:'By enquiry' }
      ]}},
      { id:'d4', type:'testimonials', data:{ heading:'Client Testimonials', items:[
        { name:'Kavitha Nair', role:'Collector, Chennai', quote:'I purchased a gold necklace for my daughter\'s wedding. Five years on, it\'s the piece she treasures most. The craftsmanship is extraordinary.' },
        { name:'Rohan Kapoor', role:'Long-Time Client, Delhi', quote:"Their private viewing service is an experience in itself. The team's knowledge of the pieces is genuinely impressive." },
        { name:'Meera Joshi', role:'Interior Designer, Mumbai', quote:'The home objects collection is second to none in India. I specify them for my most discerning clients.' }
      ]}},
      { id:'d5', type:'contact', data:{ heading:'Private Enquiries', email:'concierge@maisondor.com', phone:'+91 11 4567 8900', address:'The Oberoi, Dr. Zakir Hussain Marg, New Delhi', show_form:true }}
    ]
  },
  'ecom-spark': {
    title: 'SPARK STUDIO',
    settings: { font:'DM Sans', primary:'#f43f5e', text:'#0f172a', bg:'#ffffff', theme:'ecom-spark', logo:'', tagline:'Drop Different.' },
    pages: [
      {
        slug: 'home', title: 'Home', is_home: true,
        sections: [
          { id:'h1', type:'hero', data:{ headline:'Drop Different.', subheadline:"Limited drops. Zero restocks. Street-ready pieces built for those who don't follow trends — they set them.", cta_label:'Shop the Drop', cta_url:'#products', cta2_label:'Our Story', cta2_url:'#about', bg_color:'#f43f5e', text_color:'#ffffff', layout:'centered' }},
          { id:'h2', type:'category_banner', data:{ heading:'Shop by Category', categories:[
            { name:'Tees & Tops', icon:'👕', color:'#0f172a', url:'#' },
            { name:'Bottoms', icon:'👖', color:'#1e293b', url:'#' },
            { name:'Outerwear', icon:'🧥', color:'#f43f5e', url:'#' },
            { name:'Accessories', icon:'🧢', color:'#334155', url:'#' }
          ]}},
          { id:'h3', type:'product_grid', data:{ heading:'New Arrivals', subheading:'HEAT 06 — Limited quantities. First come, first served.', products:[
            { icon:'🔥', name:'Oversized Tee — Charcoal', category:'Tees', price:'₹1,299', badge:'New' },
            { icon:'⚡', name:'Cargo Jogger — Olive', category:'Bottoms', price:'₹2,499', badge:'Hot' },
            { icon:'🧥', name:'Coach Jacket — Black', category:'Outerwear', price:'₹3,199' },
            { icon:'🧢', name:'Logo Dad Cap — Off White', category:'Accessories', price:'₹799', badge:'New' }
          ]}},
          { id:'h4', type:'testimonials', data:{ heading:'The Community', items:[
            { name:'Dev Tiwari', role:'Hype Collector, Delhi', quote:'Copped the Coach Jacket from HEAT 04 and wore it every day for a month. Quality is unreal for the price.' },
            { name:'Zara Khan', role:'Content Creator, Mumbai', quote:'Every drop I post goes viral. My audience goes crazy for Spark pieces.' },
            { name:'Aryan Seth', role:'Sneakerhead, Bangalore', quote:"Finally a brand that designs for people who actually know streetwear." }
          ]}},
          { id:'h5', type:'newsletter', data:{ heading:'Get Early Access to Drops', subtext:'Join 28,000+ people who never miss a drop.', placeholder:'Enter your email', cta:'Join the Drop List' }}
        ]
      },
      {
        slug: 'about', title: 'About',
        sections: [
          { id:'a1', type:'hero', data:{ headline:'Born in the Streets.', subheadline:'SPARK STUDIO started as a one-person operation in 2021. Now we dress thousands — but we still make every piece like it\'s the only one.', cta_label:'Shop Now', cta_url:'/theme-demo/ecom-spark/products', bg_color:'#0f172a', text_color:'#ffffff', layout:'centered' }},
          { id:'a2', type:'about', data:{ heading:'The Brand', text:'SPARK STUDIO was born in a Dharavi workshop in 2021. We started making one-of-one pieces for our friends, posted them online, and the internet went crazy. Now we drop 6 times a year in limited quantities. If you\'re lucky enough to cop, you\'re part of something real. We never restock. Every piece is made in India by people who care about craft — 100% of our manufacturing is local.', image:'', layout:'image_right' }},
          { id:'a3', type:'stats', data:{ heading:'By the Numbers', items:[
            { number:'6', label:'Drops per year' },
            { number:'28K+', label:'Community members' },
            { number:'100%', label:'Made in India' },
            { number:'0', label:'Restocks. Ever.' }
          ]}},
          { id:'a4', type:'testimonials', data:{ heading:'What People Say', items:[
            { name:'Dev Tiwari', role:'Hype Collector, Delhi', quote:'Copped the Coach Jacket from HEAT 04 and wore it every day for a month. Quality is unreal for the price. The brand is ascending.' },
            { name:'Zara Khan', role:'Content Creator, Mumbai', quote:'Every drop I post goes viral. My audience goes crazy for Spark pieces — impossible to find after they sell out.' }
          ]}},
          { id:'a5', type:'cta', data:{ heading:'Ready to Drop?', subheading:'The next drop goes live Friday at 12PM IST.', cta_label:'Shop All Products', cta_url:'/theme-demo/ecom-spark/products', bg_color:'#f43f5e' }}
        ]
      },
      {
        slug: 'products', title: 'Shop',
        sections: [
          { id:'p1', type:'hero', data:{ headline:'Shop All', subheadline:'HEAT 06 — Live Now', cta_label:'', cta_url:'', bg_color:'#0f172a', text_color:'#ffffff', layout:'centered' }},
          { id:'p2', type:'product_grid', data:{ heading:'All Products', products:[
            { icon:'🔥', name:'Oversized Tee — Charcoal', category:'Tees', price:'₹1,299', badge:'New' },
            { icon:'🌿', name:'Oversized Tee — Sage Green', category:'Tees', price:'₹1,299' },
            { icon:'⚡', name:'Cargo Jogger — Olive', category:'Bottoms', price:'₹2,499', badge:'Hot' },
            { icon:'🖤', name:'Cargo Jogger — Black', category:'Bottoms', price:'₹2,499' },
            { icon:'🧥', name:'Coach Jacket — Black', category:'Outerwear', price:'₹3,199' },
            { icon:'🧥', name:'Coach Jacket — Burgundy', category:'Outerwear', price:'₹3,199', badge:'Low Stock' },
            { icon:'🧢', name:'Logo Dad Cap — Off White', category:'Accessories', price:'₹799', badge:'New' },
            { icon:'👜', name:'Canvas Tote — Natural', category:'Accessories', price:'₹499' },
            { icon:'🧦', name:'Crew Socks 3-Pack', category:'Accessories', price:'₹599' },
            { icon:'🪡', name:'Lanyard — Black', category:'Accessories', price:'₹299' },
            { icon:'🔴', name:'Bucket Hat — Red', category:'Accessories', price:'₹899', badge:'New' },
            { icon:'💪', name:'Muscle Tee — White', category:'Tees', price:'₹999' }
          ]}}
        ]
      },
      {
        slug: 'product', title: 'Product',
        sections: [
          { id:'sp1', type:'product_detail', data:{
            name:'Oversized Tee — Charcoal', category:'Tees', price:'₹1,299', icon:'🔥',
            desc:'480 GSM heavy cotton, washed twice for that broken-in feel. Box fit with drop shoulders. Minimal SPARK logo embroidered on the chest. This is the tee you wear till it falls apart — and it won\'t.',
            sizes:['XS','S','M','L','XL','XXL'],
            colors:['#1f2937','#6b7280','#f43f5e','#065f46']
          }},
          { id:'sp2', type:'product_grid', data:{ heading:'You Might Also Like', products:[
            { icon:'🌿', name:'Oversized Tee — Sage Green', category:'Tees', price:'₹1,299' },
            { icon:'💪', name:'Muscle Tee — White', category:'Tees', price:'₹999' },
            { icon:'🧢', name:'Logo Dad Cap — Off White', category:'Accessories', price:'₹799' },
            { icon:'🧦', name:'Crew Socks 3-Pack', category:'Accessories', price:'₹599' }
          ]}}
        ]
      },
      {
        slug: 'category', title: 'Category',
        sections: [
          { id:'c1', type:'hero', data:{ headline:'Tees & Tops', subheadline:'Heavy cotton. Drop shoulders. Built to last.', cta_label:'', cta_url:'', bg_color:'#0f172a', text_color:'#ffffff', layout:'centered' }},
          { id:'c2', type:'product_grid', data:{ heading:'', products:[
            { icon:'🔥', name:'Oversized Tee — Charcoal', category:'Tees', price:'₹1,299', badge:'New' },
            { icon:'🌿', name:'Oversized Tee — Sage Green', category:'Tees', price:'₹1,299' },
            { icon:'💪', name:'Muscle Tee — White', category:'Tees', price:'₹999' },
            { icon:'🖤', name:'Graphic Tee — Black', category:'Tees', price:'₹1,099' },
            { icon:'🔴', name:'Logo Tee — Red', category:'Tees', price:'₹1,099' },
            { icon:'🩶', name:'Washed Tee — Grey', category:'Tees', price:'₹1,199' }
          ]}}
        ]
      },
      {
        slug: 'cart', title: 'Cart',
        sections: [
          { id:'ca1', type:'cart', data:{
            heading:'Your Cart',
            items:[
              { icon:'🔥', name:'Oversized Tee — Charcoal', variant:'Size: L · Colour: Charcoal', qty:1, price:'₹1,299' },
              { icon:'🧥', name:'Coach Jacket — Black', variant:'Size: M · Colour: Black', qty:1, price:'₹3,199' },
              { icon:'🧦', name:'Crew Socks 3-Pack', variant:'One Size', qty:2, price:'₹1,198' }
            ],
            subtotal:'₹5,696', shipping:'Free', total:'₹5,696'
          }}
        ]
      },
      {
        slug: 'checkout', title: 'Checkout',
        sections: [
          { id:'ch1', type:'checkout', data:{
            heading:'Checkout',
            items:[
              { name:'Oversized Tee — Charcoal (L)', qty:1, price:'₹1,299' },
              { name:'Coach Jacket — Black (M)', qty:1, price:'₹3,199' },
              { name:'Crew Socks 3-Pack', qty:2, price:'₹1,198' }
            ],
            subtotal:'₹5,696', shipping:'Free', total:'₹5,696'
          }}
        ]
      }
    ]
  },
  'realestate': {
    title: 'Horizon Realty',
    settings: { font:'Plus Jakarta Sans', primary:'#0f4c81', text:'#1e293b', bg:'#ffffff', theme:'realestate', logo:'', tagline:'Find Your Perfect Home' },
    pages: [
      {
        slug: 'home', title: 'Home', is_home: true,
        sections: [
          { id:'re1', type:'property_search', data:{ headline:'Find Your Dream Home', subtext:'2,500+ verified properties across Mumbai, Delhi, Bangalore & beyond.', stats:[{num:'2,500+',label:'Properties'},{num:'850+',label:'Happy Families'},{num:'12+',label:'Years'},{num:'98%',label:'Satisfaction'}], bg_image:'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=1400&q=80&auto=format&fit=crop' }},
          { id:'re2', type:'property_listings', data:{ heading:'Featured Properties', subheading:'Hand-picked by our expert agents', properties:[
            { image:'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&q=80&auto=format&fit=crop', title:'Modern 3 BHK Apartment', location:'Bandra West, Mumbai', price:'₹1.8 Cr', beds:3, baths:2, sqft:1450, tag:'For Sale' },
            { image:'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=800&q=80&auto=format&fit=crop', title:'Luxury 4 BHK Villa with Pool', location:'Whitefield, Bangalore', price:'₹3.2 Cr', beds:4, baths:4, sqft:3800, tag:'Featured' },
            { image:'https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=800&q=80&auto=format&fit=crop', title:'Cozy 2 BHK Independent House', location:'Dwarka, Delhi', price:'₹95 L', beds:2, baths:2, sqft:1100, tag:'New' }
          ], cta_label:'View All Properties', cta_url:'/theme-demo/realestate/properties' }},
          { id:'re3', type:'services', data:{ heading:'Why Choose Horizon Realty', items:[
            { icon:'🔑', title:'10,000+ Verified Listings', desc:'Every property is personally inspected and legally verified by our senior agents before listing.' },
            { icon:'📊', title:'12 Years of Market Data', desc:'Deep market intelligence across all major Indian cities to help you buy or invest at the right price.' },
            { icon:'🤝', title:'End-to-End Support', desc:'From home loan guidance to registration, we support you through every step of the process.' },
            { icon:'💰', title:'Best Price Guarantee', desc:'Our data-driven pricing ensures sellers get maximum value and buyers never overpay.' }
          ]}},
          { id:'re4', type:'testimonials', data:{ heading:"What Our Clients Say", items:[
            { name:'Rajesh Kumar', role:'Home Buyer, Mumbai', quote:'Found our dream 3BHK in just 2 weeks. The team was professional and kept us informed at every step. Could not have done it without them.' },
            { name:'Priya Nair', role:'Property Investor, Bangalore', quote:"Best real estate experience I've ever had. They knew exactly what I was looking for and matched me with the perfect investment property." },
            { name:'Ankit Sharma', role:'First-Time Buyer, Delhi', quote:'As a first-time buyer I was overwhelmed. The Horizon team guided me patiently — from shortlisting to getting my home loan approved.' }
          ]}},
          { id:'re5', type:'contact', data:{ heading:'Talk to an Agent Today', email:'hello@horizonrealty.in', phone:'+91 98765 43210', address:'Level 8, One BKC, Bandra Kurla Complex, Mumbai 400051', show_form:true }}
        ]
      },
      {
        slug: 'about', title: 'About', is_home: false,
        sections: [
          { id:'ab1', type:'hero', data:{ headline:'About Horizon Realty', subheadline:'Trusted by 850+ families since 2012. We believe every client deserves a home they love.', cta_label:'Meet Our Team', cta_url:'/theme-demo/realestate/agents', cta2_label:'Browse Properties', cta2_url:'/theme-demo/realestate/properties', bg_color:'#0f4c81', text_color:'#ffffff', layout:'centered' }},
          { id:'ab2', type:'about', data:{ heading:'Our Story', text:"Horizon Realty was founded in 2012 by a group of property professionals who believed the industry needed a more transparent, client-first approach. Today we operate across 12 cities with a team of 80+ specialists helping families find their perfect home — and investors find their next great opportunity.", image:'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800&q=80&auto=format&fit=crop', layout:'image_right' }},
          { id:'ab3', type:'stats', data:{ heading:'', items:[{number:'2,500+',label:'Active Listings',emoji:'🏠'},{number:'850+',label:'Happy Families',emoji:'👨‍👩‍👧'},{number:'12',label:'Years Experience',emoji:'🏆'},{number:'12',label:'Cities',emoji:'🏙️'}]}}
        ]
      },
      {
        slug: 'properties', title: 'Properties', is_home: false,
        sections: [
          { id:'pr1', type:'property_search', data:{ headline:'Browse All Properties', subtext:'Filter by city, type, and budget. Updated daily with fresh listings.', stats:[], bg_image:'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=1400&q=80&auto=format&fit=crop' }},
          { id:'pr2', type:'property_listings', data:{ heading:'All Listings', subheading:'', properties:[
            { image:'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&q=80&auto=format&fit=crop', title:'Modern 3 BHK Apartment', location:'Bandra West, Mumbai', price:'₹1.8 Cr', beds:3, baths:2, sqft:1450, tag:'For Sale' },
            { image:'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=800&q=80&auto=format&fit=crop', title:'Luxury 4 BHK Villa with Pool', location:'Whitefield, Bangalore', price:'₹3.2 Cr', beds:4, baths:4, sqft:3800, tag:'Featured' },
            { image:'https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=800&q=80&auto=format&fit=crop', title:'2 BHK Independent House', location:'Dwarka, Delhi', price:'₹95 L', beds:2, baths:2, sqft:1100, tag:'For Sale' },
            { image:'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=800&q=80&auto=format&fit=crop', title:'Heritage Bungalow', location:'Alipore, Kolkata', price:'₹4.5 Cr', beds:5, baths:4, sqft:5200, tag:'For Sale' },
            { image:'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&q=80&auto=format&fit=crop', title:'Studio Apartment', location:'Andheri East, Mumbai', price:'₹58 L', beds:1, baths:1, sqft:520, tag:'For Rent' },
            { image:'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&q=80&auto=format&fit=crop', title:'3 BHK Penthouse', location:'Jubilee Hills, Hyderabad', price:'₹2.1 Cr', beds:3, baths:3, sqft:2200, tag:'New' }
          ]}}
        ]
      },
      {
        slug: 'contact', title: 'Contact', is_home: false,
        sections: [
          { id:'co1', type:'hero', data:{ headline:'Get in Touch', subheadline:"Buying, selling, or just exploring? Our agents are ready to help you every step of the way.", cta_label:'', cta_url:'', bg_color:'#0f4c81', text_color:'#ffffff', layout:'centered' }},
          { id:'co2', type:'contact', data:{ heading:'Reach Our Team', email:'hello@horizonrealty.in', phone:'+91 98765 43210', address:'Level 8, One BKC, Bandra Kurla Complex, Mumbai 400051', show_form:true }}
        ]
      },
      {
        slug: 'blog', title: 'Blog', is_home: false,
        sections: [
          { id:'bl1', type:'hero', data:{ headline:'Real Estate Insights', subheadline:'Market trends, buying guides, and investment tips from the Horizon team.', cta_label:'', cta_url:'', bg_color:'#0f4c81', text_color:'#ffffff', layout:'centered' }},
          { id:'bl2', type:'blog_posts', data:{ heading:'Latest Articles', subheading:'Expert advice to help you make smarter property decisions', posts:[
            { image:'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&q=80&auto=format&fit=crop', category:'Buying Guide', title:'10 Things to Check Before Buying a Flat in Mumbai', excerpt:'From legal documentation to structural quality — the complete pre-purchase checklist every buyer needs before signing.', author:'Priya Sharma', date:'Jul 20, 2026' },
            { image:'https://images.unsplash.com/photo-1486325212027-8081e485255e?w=800&q=80&auto=format&fit=crop', category:'Market Trends', title:'Bangalore Real Estate Market Report — Q2 2026', excerpt:'Key data on price movements, demand hotspots, and the best micro-markets for investment this quarter.', author:'Rahul Mehta', date:'Jul 12, 2026' },
            { image:'https://images.unsplash.com/photo-1505691938895-1758d7feb511?w=800&q=80&auto=format&fit=crop', category:'Selling Tips', title:'How to Price Your Property Right in a Competitive Market', excerpt:"Overpricing stalls deals. Underpricing leaves money on the table. Here's how our agents find the perfect price.", author:'Ananya Patel', date:'Jul 5, 2026' }
          ]}}
        ]
      }
    ]
  }
};

exports.themeDemo = (req, res) => {
  const { themeId, pageSlug } = req.params
  const demo = THEME_DEMO_DATA[themeId]
  if (!demo) return res.status(404).send('Theme not found')

  const website = { id:0, title:demo.title, subdomain:'demo', settings:demo.settings, is_published:true, demo_theme:themeId }

  // Multi-page themes (ecom-spark) use pages array; others use single sections array
  let pages, current
  if (demo.pages) {
    pages = demo.pages.map((p, i) => ({ id: i+1, ...p, is_published: true }))
    current = (pageSlug && pages.find(p => p.slug === pageSlug)) || pages.find(p => p.is_home) || pages[0]
  } else {
    pages   = [{ id:1, title:'Home', slug:'home', is_home:true, is_published:true, sections:demo.sections }]
    current = pages[0]
  }

  res.render('website-public.njk', { website, pages, current })
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
/* ═══════════════════════════════════════════════════════════════════════════════
   SET CUSTOM DOMAIN — connect / remove a custom domain for a website
   POST /dashboard/website/:id/set-domain
   ═══════════════════════════════════════════════════════════════════════════ */
exports.setDomain = async (req, res) => {
  try {
    const user      = req.session.user
    const websiteId = parseInt(req.params.id) || 0
    const domain    = (req.body.domain || '').toLowerCase().trim()

    const website = await db.first('SELECT id FROM ms_websites WHERE id = ? AND account_id = ?', [websiteId, user.id])
    if (!website) return res.json({ ok: false, error: 'Website not found.' })

    // Remove domain
    if (!domain) {
      await db.execute('UPDATE ms_websites SET custom_domain = NULL WHERE id = ?', [websiteId])
      return res.json({ ok: true, domain: null })
    }

    // Validate format: abc.com or xyz.abc.com — no protocols, no paths
    if (!/^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$/.test(domain)) {
      return res.json({ ok: false, error: 'Invalid domain format. Use abc.com or sub.abc.com' })
    }
    const baseDomain = (process.env.BASE_DOMAIN || '').toLowerCase()
    if (baseDomain && (domain === baseDomain || domain.endsWith('.' + baseDomain))) {
      return res.json({ ok: false, error: 'Cannot use the platform domain. Enter your own domain.' })
    }

    // Uniqueness across both ms_sites and ms_websites
    const existsSite = await db.first('SELECT id FROM ms_sites WHERE custom_domain = ?', [domain])
    if (existsSite) return res.json({ ok: false, error: 'That domain is already connected to another site.' })
    const existsWeb  = await db.first('SELECT id FROM ms_websites WHERE custom_domain = ? AND id != ?', [domain, websiteId])
    if (existsWeb) return res.json({ ok: false, error: 'That domain is already connected to another website.' })

    await db.execute('UPDATE ms_websites SET custom_domain = ? WHERE id = ?', [domain, websiteId])
    return res.json({ ok: true, domain })
  } catch (err) {
    console.error('website.setDomain', err)
    return res.json({ ok: false, error: err.message })
  }
}

/* ═══════════════════════════════════════════════════════════════════════════════
   PUBLIC — render website by custom domain (called from subdomain middleware)
   ═══════════════════════════════════════════════════════════════════════════ */
exports.serveWebsiteByDomain = async (req, res, website) => {
  const pageSlug = req.path.replace(/^\/+|\/+$/g, '') || null
  try {
    website.settings = parseJSON(website.settings, {})
    const pages = await db.query(
      `SELECT *, JSON_EXTRACT(meta,'$.is_home') AS is_home, JSON_EXTRACT(meta,'$.seo_title') AS seo_title, JSON_EXTRACT(meta,'$.seo_desc') AS seo_desc
       FROM ms_posts WHERE website_id=? AND post_type='page' AND status='published' ORDER BY id ASC`,
      [website.id]
    )
    pages.forEach(p => {
      p.sections  = parseJSON(p.sections, [])
      p.is_home   = p.is_home == 1 || p.is_home === '1' || p.is_home === true
      p.is_published = 1
    })
    if (!pages.length) return res.status(404).send('No pages published')
    const current = (pageSlug ? pages.find(p => p.slug === pageSlug) : null) ||
                    pages.find(p => p.is_home) ||
                    pages[0]

    let siteApps = {}
    try { siteApps = JSON.parse(website.apps || '{}') } catch(e) {}
    const { headHtml, bodyEndHtml } = appManager.renderApps('website', siteApps)
    res.render('website-public.njk', { website, pages, current, appHeadHtml: headHtml, appBodyEndHtml: bodyEndHtml })
  } catch(e) {
    console.error('[serveWebsiteByDomain]', e.message)
    res.status(500).send('Something went wrong loading this website.')
  }
}

exports.publicSite = async (req, res) => {
  const { subdomain, pageSlug } = req.params
  try {
  const website = await db.first(
    'SELECT * FROM ms_websites WHERE subdomain = ?', [subdomain]
  )
  if (!website) return res.status(404).send('Website not found')
  website.settings = parseJSON(website.settings, {})

  const pages = await db.query(
    `SELECT *, JSON_EXTRACT(meta,'$.is_home') AS is_home, JSON_EXTRACT(meta,'$.seo_title') AS seo_title, JSON_EXTRACT(meta,'$.seo_desc') AS seo_desc
     FROM ms_posts WHERE website_id=? AND post_type='page' AND status='published' ORDER BY id ASC`,
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

  // Render enabled apps
  let siteApps = {}
  try { siteApps = JSON.parse(website.apps || '{}') } catch(e) {}
  const { headHtml, bodyEndHtml } = appManager.renderApps('website', siteApps)

  res.render('website-public.njk', { website, pages, current, appHeadHtml: headHtml, appBodyEndHtml: bodyEndHtml })
  } catch(e) {
    console.error('[publicSite] error:', e.message)
    res.status(500).send('Something went wrong loading this website.')
  }
}

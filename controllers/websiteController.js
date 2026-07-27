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
const THEME_SETTINGS_MAP = {
  'default':    { font: 'Inter',               primary: '#6366f1', text: '#111827', bg: '#ffffff' },
  'minimal':    { font: 'Playfair Display',    primary: '#b45309', text: '#1c1917', bg: '#fdf8f0' },
  'bold':       { font: 'Inter',               primary: '#8b5cf6', text: '#e2e8f0', bg: '#0f0f1a' },
  'ecom-fresh': { font: 'Inter',               primary: '#059669', text: '#111827', bg: '#ffffff' },
  'ecom-luxe':  { font: 'Cormorant Garamond',  primary: '#d4af37', text: '#f5f0e8', bg: '#0a0a0f' },
  'ecom-spark': { font: 'DM Sans',             primary: '#f43f5e', text: '#0f172a', bg: '#ffffff' }
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

    // Create default Home page in ms_posts — use ecom starter sections for ecom themes
    const isEcom = themeId.startsWith('ecom-')
    const siteName = title || 'My Website'
    const homeSections = isEcom ? JSON.stringify([
      { id: uuidv4(), type: 'hero',         data: { headline: `Welcome to ${siteName}`, subheadline: 'Discover our curated collection — quality you can feel.', cta_label: 'Shop Now', cta_url: '#services', bg_color: ts.primary, text_color: ts.text.startsWith('#f') ? ts.text : '#ffffff', bg_image: '' } },
      { id: uuidv4(), type: 'services',     data: { heading: 'Featured Products', items: [{ icon: '⭐', title: 'Product One', desc: 'Add your product description here.', price: '' }, { icon: '🔥', title: 'Product Two', desc: 'Add your product description here.', price: '' }, { icon: '💎', title: 'Product Three', desc: 'Add your product description here.', price: '' }] } },
      { id: uuidv4(), type: 'testimonials', data: { heading: 'Happy Customers', items: [{ name: 'Customer Name', role: 'Verified Buyer', quote: 'Absolutely love the quality — will order again!' }] } },
      { id: uuidv4(), type: 'contact',      data: { heading: 'Get in Touch', email: '', phone: '', address: '', show_form: true } }
    ]) : JSON.stringify([
      { id: uuidv4(), type: 'hero',     data: { headline: `Welcome to ${siteName}`, subheadline: 'We deliver exceptional results', cta_label: 'Get Started', cta_url: '#contact', bg_color: ts.primary, text_color: '#ffffff', bg_image: '' } },
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
    sections: [
      { id:'d1', type:'hero', data:{ headline:'Drop Different.', subheadline:"Limited drops, no restocks, zero compromise. Street-ready pieces built for those who don't follow trends — they set them.", cta_label:'Shop the Drop', cta_url:'#services', cta2_label:'Follow Us', cta2_url:'#contact', bg_color:'#f43f5e', text_color:'#ffffff', layout:'centered' }},
      { id:'d2', type:'about', data:{ heading:'The Brand', text:'SPARK STUDIO was born in a Dharavi workshop in 2021. We started making one-of-one pieces for our friends, posted them, and the internet went crazy. Now we drop 6 times a year in limited quantities. If you\'re lucky enough to cop, you\'re part of something real.', image:'', layout:'image_right' }},
      { id:'d3', type:'services', data:{ heading:'Current Drop: HEAT 06', items:[
        { icon:'🔥', title:'Oversized Tee — Charcoal', desc:'480 GSM heavy cotton, washed twice for that broken-in feel. Box fit, drop shoulders.', price:'₹1,299' },
        { icon:'⚡', title:'Cargo Jogger — Olive', desc:'8-pocket utility pants with adjustable ankle cuffs. Ripstop shell, fleece lining.', price:'₹2,499' },
        { icon:'👟', title:'Logo Dad Cap — Off White', desc:'6-panel unstructured cap with embroidered SPARK logo. Brass adjustable clasp.', price:'₹799' },
        { icon:'🧥', title:'Coach Jacket — Black', desc:'Satin outer, mesh inner. Chenille patch on back. Snap button closure.', price:'₹3,199' },
        { icon:'👜', title:'Canvas Tote — Natural', desc:'16oz canvas tote. SPARK screenprint front. Internal zip pocket.', price:'₹499' },
        { icon:'🧦', title:'Crew Socks 3-Pack', desc:'Thick cotton. Branded ankle ribbing in three colourways.', price:'₹599' }
      ]}},
      { id:'d4', type:'testimonials', data:{ heading:'The Community', items:[
        { name:'Dev Tiwari', role:'Hype Collector, Delhi', quote:'Copped the Coach Jacket from HEAT 04 and wore it every day for a month. Quality is unreal for the price. The brand is ascending.' },
        { name:'Zara Khan', role:'Content Creator, Mumbai', quote:'Every drop I post goes viral. My audience goes crazy for Spark pieces — impossible to find after they sell out.' },
        { name:'Aryan Seth', role:'Sneakerhead, Bangalore', quote:"Finally a brand that designs for people who actually know streetwear. They have their own language." }
      ]}},
      { id:'d5', type:'contact', data:{ heading:'Hit Us Up', email:'drop@sparkstudio.in', phone:'+91 90000 11234', address:'DM us @sparkstudio on Instagram', show_form:true }}
    ]
  }
};

exports.themeDemo = (req, res) => {
  const { themeId } = req.params
  const demo = THEME_DEMO_DATA[themeId]
  if (!demo) return res.status(404).send('Theme not found')
  const website = { id:0, title:demo.title, subdomain:'demo', settings:demo.settings, is_published:true }
  const pages   = [{ id:1, title:'Home', slug:'home', is_home:true, is_published:true, sections:demo.sections }]
  const current = pages[0]
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

  res.render('website-public.njk', { website, pages, current })
  } catch(e) {
    console.error('[publicSite] error:', e.message)
    res.status(500).send('Something went wrong loading this website.')
  }
}

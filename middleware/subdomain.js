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

    const settings  = JSON.parse(site.settings || '{}')
    const slug      = settings.template_id || site.template_id || 'minimal'
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
        const staffThemeSlug = staffSettings.template_id || staffSite.template_id || 'biolink-creator'
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
    const html = await themeManager.render(slug, site, settings, pageId, siteForms)
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
  const accent   = (settings.profile && settings.profile.accent) || '#7c3aed'
  const siteName = (settings.profile && (settings.profile.name || settings.profile.title)) || site.title || sub
  const tagline  = (settings.profile && settings.profile.tagline) || ''
  const logo     = (settings.profile && settings.profile.avatar) || (settings.profile && settings.profile.logo) || ''

  // Type-specific labels
  const isAppt   = type === 'appointment'
  const pageTitle    = isAppt ? 'Book an Appointment'    : 'Schedule a Meeting'
  const pageSub      = isAppt ? 'Select the type of appointment you\'d like to schedule.' : 'Select the type of meeting you\'d like to schedule.'
  const confirmBtn   = isAppt ? 'Confirm Appointment'    : 'Confirm Meeting'
  const successTitle = isAppt ? 'Appointment Confirmed!' : 'Meeting Confirmed!'
  const successSub   = isAppt ? 'You\'re all set. See you soon.' : 'You\'re all set. A calendar invite will be sent to your email.'
  const newBookingLbl= isAppt ? 'Book another appointment' : 'Schedule another meeting'
  const notesLabel   = isAppt ? 'Reason for visit / Notes' : 'Agenda / Notes'
  const notesPh      = isAppt ? 'Briefly describe the reason for your visit...' : 'What would you like to discuss?'
  const typeParam    = type  // passed to API

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${pageTitle} — ${siteName}</title>
<style>
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
:root{--accent:${accent};--ink:#1a1a18;--ink-m:#6b6b66;--ink-f:#b0afa8;--white:#fff;--off:#f8f7f4;--border:rgba(26,26,24,0.1);--r:12px;}
body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;background:var(--off);color:var(--ink);min-height:100vh;}
a{color:inherit;text-decoration:none;}
.page{display:flex;flex-direction:column;min-height:100vh;}
.header{background:var(--white);border-bottom:1px solid var(--border);padding:18px 24px;display:flex;align-items:center;gap:14px;}
.header-logo{width:44px;height:44px;border-radius:50%;object-fit:cover;flex-shrink:0;}
.header-logo-init{width:44px;height:44px;border-radius:50%;background:var(--accent);color:#fff;display:flex;align-items:center;justify-content:center;font-size:18px;font-weight:700;flex-shrink:0;}
.header-name{font-size:17px;font-weight:700;}
.header-tag{font-size:13px;color:var(--ink-m);margin-top:2px;}
.wrap{max-width:680px;margin:0 auto;padding:32px 16px;width:100%;}
/* Steps */
.step{display:none;}.step.active{display:block;}
/* Event cards */
.ev-list{display:flex;flex-direction:column;gap:12px;}
.ev-card{background:var(--white);border:1.5px solid var(--border);border-radius:var(--r);padding:18px 20px;cursor:pointer;transition:all 0.15s;display:flex;align-items:center;gap:16px;}
.ev-card:hover{border-color:var(--accent);box-shadow:0 2px 12px rgba(0,0,0,0.08);}
.ev-dot{width:14px;height:14px;border-radius:50%;flex-shrink:0;}
.ev-info{flex:1;}
.ev-name{font-size:16px;font-weight:600;}
.ev-meta{font-size:13px;color:var(--ink-m);margin-top:4px;display:flex;gap:12px;flex-wrap:wrap;}
.ev-arr{font-size:20px;color:var(--ink-f);}
/* Calendar */
.cal-wrap{background:var(--white);border:1px solid var(--border);border-radius:var(--r);overflow:hidden;}
.cal-head{display:flex;align-items:center;justify-content:space-between;padding:16px 20px;border-bottom:1px solid var(--border);}
.cal-month{font-size:15px;font-weight:600;}
.cal-nav{background:none;border:1px solid var(--border);border-radius:8px;width:32px;height:32px;cursor:pointer;font-size:16px;display:flex;align-items:center;justify-content:center;color:var(--ink-m);}
.cal-nav:hover{background:var(--off);}
.cal-grid{display:grid;grid-template-columns:repeat(7,1fr);gap:0;}
#calDays{display:contents;}
.cal-dh{font-size:11px;font-weight:600;color:var(--ink-f);text-align:center;padding:10px 0;text-transform:uppercase;}
.cal-day{text-align:center;padding:10px 0;font-size:14px;color:var(--ink-f);cursor:default;}
.cal-day.avail{color:var(--ink);cursor:pointer;font-weight:500;}
.cal-day.avail:hover{background:color-mix(in srgb,var(--accent) 10%,#fff);border-radius:8px;}
.cal-day.selected{background:var(--accent);color:#fff;border-radius:8px;font-weight:700;}
.cal-day.today-mark{font-weight:700;}
/* Slots */
.slots-wrap{margin-top:20px;}
.slots-label{font-size:13px;font-weight:600;color:var(--ink-m);margin-bottom:10px;text-transform:uppercase;letter-spacing:0.04em;}
.slots-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(120px,1fr));gap:8px;}
.slot-btn{border:1.5px solid var(--border);background:var(--white);border-radius:8px;padding:10px;font-size:14px;font-weight:500;cursor:pointer;transition:all 0.15s;text-align:center;}
.slot-btn:hover{border-color:var(--accent);color:var(--accent);}
.slot-btn.selected{background:var(--accent);border-color:var(--accent);color:#fff;}
/* Form */
.form-wrap{background:var(--white);border:1px solid var(--border);border-radius:var(--r);padding:24px;}
.form-group{margin-bottom:16px;}
.form-label{display:block;font-size:13px;font-weight:600;margin-bottom:6px;}
.form-input{width:100%;padding:10px 13px;border:1.5px solid var(--border);border-radius:8px;font-size:14px;font-family:inherit;transition:border-color 0.15s;}
.form-input:focus{outline:none;border-color:var(--accent);}
.form-row{display:grid;grid-template-columns:1fr 1fr;gap:12px;}
.submit-btn{width:100%;padding:13px;background:var(--accent);color:#fff;border:none;border-radius:8px;font-size:15px;font-weight:600;cursor:pointer;margin-top:8px;transition:opacity 0.15s;}
.submit-btn:hover{opacity:0.9;}
.submit-btn:disabled{opacity:0.6;cursor:not-allowed;}
/* Summary bar */
.summary{background:color-mix(in srgb,var(--accent) 8%,#fff);border:1px solid color-mix(in srgb,var(--accent) 20%,#fff);border-radius:var(--r);padding:14px 18px;margin-bottom:20px;font-size:14px;}
.summary strong{color:var(--accent);}
/* Back btn */
.back-link{display:inline-flex;align-items:center;gap:6px;font-size:13px;color:var(--ink-m);margin-bottom:20px;cursor:pointer;padding:7px 0;}
.back-link:hover{color:var(--ink);}
/* States */
.loading{text-align:center;padding:48px;color:var(--ink-m);font-size:15px;}
.empty{text-align:center;padding:48px;color:var(--ink-m);}
.err-msg{background:#fef2f2;border:1px solid #fecaca;border-radius:8px;padding:12px 16px;color:#dc2626;font-size:14px;margin-bottom:16px;}
/* Success */
.success{text-align:center;padding:48px 24px;}
.success-icon{font-size:56px;margin-bottom:16px;}
.success-title{font-size:22px;font-weight:700;margin-bottom:8px;}
.success-sub{font-size:15px;color:var(--ink-m);margin-bottom:24px;}
.success-detail{background:var(--white);border:1px solid var(--border);border-radius:var(--r);padding:18px;text-align:left;max-width:380px;margin:0 auto;font-size:14px;}
.success-detail div{padding:6px 0;border-bottom:1px solid var(--border);display:flex;gap:10px;}
.success-detail div:last-child{border-bottom:none;}
.success-detail span:first-child{color:var(--ink-m);min-width:80px;}
.new-booking-btn{margin-top:20px;display:inline-block;padding:11px 24px;border:1.5px solid var(--border);border-radius:8px;font-size:14px;font-weight:500;cursor:pointer;background:var(--white);}
.new-booking-btn:hover{background:var(--off);}
.page-title{font-size:22px;font-weight:700;margin-bottom:6px;}
.page-sub{font-size:14px;color:var(--ink-m);margin-bottom:24px;}
@media(max-width:520px){.form-row{grid-template-columns:1fr;}}
</style>
</head>
<body>
<div class="page">
  <header class="header">
    ${logo
      ? `<img class="header-logo" src="${logo}" alt="${siteName}">`
      : `<div class="header-logo-init">${siteName.charAt(0).toUpperCase()}</div>`
    }
    <div>
      <div class="header-name">${siteName}</div>
      ${tagline ? `<div class="header-tag">${tagline}</div>` : ''}
    </div>
  </header>

  <div class="wrap">
    <!-- Step 1: Choose event type -->
    <div class="step active" id="s1">
      <div class="page-title">${pageTitle}</div>
      <div class="page-sub">${pageSub}</div>
      <div id="evList" class="ev-list"><div class="loading">Loading...</div></div>
    </div>

    <!-- Step 2: Pick date & time -->
    <div class="step" id="s2">
      <div class="back-link" onclick="goStep(1)">← Back</div>
      <div id="evSummary" class="summary"></div>
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
      <div class="slots-wrap" id="slotsWrap" style="display:none;">
        <div class="slots-label" id="slotsLabel"></div>
        <div class="slots-grid" id="slotsGrid"></div>
      </div>
    </div>

    <!-- Step 3: Fill details -->
    <div class="step" id="s3">
      <div class="back-link" onclick="goStep(2)">← Back</div>
      <div id="formSummary" class="summary"></div>
      <div id="formErr" class="err-msg" style="display:none;"></div>
      <div class="form-wrap">
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Your Name *</label>
            <input class="form-input" id="fName" placeholder="Full name" required>
          </div>
          <div class="form-group">
            <label class="form-label">Email *</label>
            <input class="form-input" id="fEmail" type="email" placeholder="you@example.com" required>
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">Phone Number</label>
          <input class="form-input" id="fPhone" placeholder="+91 9999999999">
        </div>
        <div class="form-group">
          <label class="form-label">${notesLabel}</label>
          <textarea class="form-input" id="fNotes" rows="3" placeholder="${notesPh}"></textarea>
        </div>
        <button class="submit-btn" id="submitBtn" onclick="submitBooking()">${confirmBtn}</button>
      </div>
    </div>

    <!-- Step 4: Confirmation -->
    <div class="step" id="s4">
      <div class="success">
        <div class="success-icon">✅</div>
        <div class="success-title">${successTitle}</div>
        <div class="success-sub">${successSub}</div>
        <div class="success-detail" id="confirmDetail"></div>
        <div class="new-booking-btn" onclick="goStep(1)">${newBookingLbl}</div>
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

  // ── Load events ──────────────────────────────────────────────────────────────
  var EV_ID=_PZ.eventId||null
  var evFetchUrl=EV_ID?'/api/booking/'+SUB+'/events':'/api/booking/'+SUB+'/events?type='+TYPE
  fetch(evFetchUrl).then(r=>r.json()).then(function(evs){
    var el=document.getElementById('evList')
    if(!evs||!evs.length){
      el.innerHTML='<div class="empty">No appointment types available yet.</div>';return
    }
    evList=evs
    // Direct event link — auto-select and skip to calendar
    if(EV_ID){
      var idx=evs.findIndex(function(e){return e.id===EV_ID})
      if(idx>=0){pickEv(idx);return}
    }
    el.innerHTML=evs.map(function(e,i){
      var loc=e.location?'<span>📍 '+e.location+'</span>':''
      return '<div class="ev-card" onclick="pickEv('+i+')">'+
        '<div class="ev-dot" style="background:'+e.color+'"></div>'+
        '<div class="ev-info">'+
          '<div class="ev-name">'+e.name+'</div>'+
          '<div class="ev-meta"><span>⏱ '+e.duration+' min</span>'+loc+'</div>'+
        '</div>'+
        '<div class="ev-arr">›</div>'+
      '</div>'
    }).join('')
  }).catch(function(){
    document.getElementById('evList').innerHTML='<div class="empty">Could not load appointment types.</div>'
  })

  // ── Step navigation ───────────────────────────────────────────────────────────
  window.goStep=function(n){
    document.querySelectorAll('.step').forEach(function(s){s.classList.remove('active')})
    document.getElementById('s'+n).classList.add('active')
    window.scrollTo(0,0)
  }

  // ── Pick event type ───────────────────────────────────────────────────────────
  window.pickEv=function(i){
    ev=evList[i]; selDate=null; selTime=null
    document.getElementById('evSummary').innerHTML=
      '<strong>'+ev.name+'</strong> &nbsp;·&nbsp; ⏱ '+ev.duration+' min'+(ev.location?' &nbsp;·&nbsp; 📍 '+ev.location:'')
    var now=new Date(); calYear=now.getFullYear(); calMonth=now.getMonth()
    renderCal()
    document.getElementById('slotsWrap').style.display='none'
    // Hide back button if arrived via direct event link
    var s2back=document.querySelector('#s2 .back-link')
    if(s2back) s2back.style.display=EV_ID?'none':''
    goStep(2)
  }

  // ── Calendar ──────────────────────────────────────────────────────────────────
  var MONTHS=['January','February','March','April','May','June','July','August','September','October','November','December']
  function renderCal(){
    document.getElementById('calMonth').textContent=MONTHS[calMonth]+' '+calYear
    var first=new Date(calYear,calMonth,1).getDay()
    var days=new Date(calYear,calMonth+1,0).getDate()
    var today=new Date(); var todayStr=today.toISOString().slice(0,10)
    var html=''
    for(var i=0;i<first;i++) html+='<div class="cal-day"></div>'
    for(var d=1;d<=days;d++){
      var ds=calYear+'-'+String(calMonth+1).padStart(2,'0')+'-'+String(d).padStart(2,'0')
      var dt=new Date(calYear,calMonth,d)
      var isPast=ds<todayStr
      var cls='cal-day'+(isPast?'':' avail')+(ds===todayStr?' today-mark':'')+(ds===selDate?' selected':'')
      var click=isPast?'':'onclick="pickDay(&#39;'+ds+'&#39;)"'
      html+='<div class="'+cls+'" '+click+'>'+d+'</div>'
    }
    document.getElementById('calDays').innerHTML=html
  }

  window.calMo=function(dir){
    calMonth+=dir
    if(calMonth>11){calMonth=0;calYear++}
    if(calMonth<0){calMonth=11;calYear--}
    renderCal()
  }

  window.pickDay=function(ds){
    selDate=ds; selTime=null; renderCal()
    var wrap=document.getElementById('slotsWrap')
    var grid=document.getElementById('slotsGrid')
    var label=document.getElementById('slotsLabel')
    wrap.style.display='block'
    grid.innerHTML='<div style="color:var(--ink-m);font-size:13px;">Loading slots...</div>'
    var d=new Date(ds+'T00:00:00'); var wd=['Sun','Mon','Tue','Wed','Thu','Fri','Sat']
    label.textContent=wd[d.getDay()]+', '+MONTHS[d.getMonth()]+' '+d.getDate()
    fetch('/api/booking/'+SUB+'/slots/'+ev.id+'/'+ds).then(r=>r.json()).then(function(slots){
      if(!slots||!slots.length){
        grid.innerHTML='<div style="color:var(--ink-m);font-size:13px;grid-column:1/-1;">No available slots on this day.</div>';return
      }
      grid.innerHTML=slots.map(function(s){
        return '<div class="slot-btn'+(s.time===selTime?' selected':'')+'" onclick="pickSlot(&#39;'+s.time+'&#39;,&#39;'+s.label+'&#39;)">'+s.label+'</div>'
      }).join('')
    }).catch(function(){
      grid.innerHTML='<div style="color:var(--ink-m);font-size:13px;grid-column:1/-1;">Could not load slots.</div>'
    })
  }

  window.pickSlot=function(time,label){
    selTime=time
    document.querySelectorAll('.slot-btn').forEach(function(b){b.classList.remove('selected')})
    event.target.classList.add('selected')
    var d=new Date(selDate+'T00:00:00')
    var wd=['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday']
    var dateLabel=wd[d.getDay()]+', '+MONTHS[d.getMonth()]+' '+d.getDate()+', '+calYear
    document.getElementById('formSummary').innerHTML=
      '<strong>'+ev.name+'</strong> &nbsp;·&nbsp; '+dateLabel+' at <strong>'+label+'</strong>'+(ev.location?' &nbsp;·&nbsp; 📍 '+ev.location:'')
    goStep(3)
  }

  // ── Submit booking ─────────────────────────────────────────────────────────────
  window.submitBooking=function(){
    var name=document.getElementById('fName').value.trim()
    var email=document.getElementById('fEmail').value.trim()
    var phone=document.getElementById('fPhone').value.trim()
    var notes=document.getElementById('fNotes').value.trim()
    var errEl=document.getElementById('formErr')
    errEl.style.display='none'
    if(!name||!email){errEl.textContent='Please fill in your name and email.';errEl.style.display='block';return}
    if(!/^[^@]+@[^@]+[.][^@]+$/.test(email)){errEl.textContent='Please enter a valid email address.';errEl.style.display='block';return}
    var btn=document.getElementById('submitBtn')
    btn.disabled=true; btn.textContent='Confirming...'
    fetch('/api/booking/'+SUB+'/create',{
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify({event_id:ev.id,booking_date:selDate,start_time:selTime,booker_name:name,booker_email:email,booker_phone:phone,notes:notes})
    }).then(r=>r.json()).then(function(res){
      btn.disabled=false; btn.textContent=CONFIRM_BTN;
      if(!res.ok){errEl.textContent=res.error||'Something went wrong. Please try again.';errEl.style.display='block';return;}
      var d=new Date(selDate+'T00:00:00')
      var wd=['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday']
      var MONTHS2=['January','February','March','April','May','June','July','August','September','October','November','December']
      var dateLabel=wd[d.getDay()]+', '+MONTHS2[d.getMonth()]+' '+d.getDate()+', '+d.getFullYear()
      document.getElementById('confirmDetail').innerHTML=
        '<div><span>Type</span><span>'+ev.name+'</span></div>'+
        '<div><span>Date</span><span>'+dateLabel+'</span></div>'+
        '<div><span>Time</span><span>'+selTime.slice(0,5)+'</span></div>'+
        (ev.location?'<div><span>Location</span><span>'+ev.location+'</span></div>':'')+
        '<div><span>Name</span><span>'+name+'</span></div>'+
        '<div><span>Email</span><span>'+email+'</span></div>'
      goStep(4)
    }).catch(function(){
      btn.disabled=false; btn.textContent=CONFIRM_BTN;
      errEl.textContent='Network error. Please try again.'; errEl.style.display='block';
    })
  }
})()
</script>
</body>
</html>`
  res.send(html)
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

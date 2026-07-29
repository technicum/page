/* ═══════════════════════════════════════════
   HELPERS
═══════════════════════════════════════════ */
function escHtml(s) {
  if (s === null || s === undefined) return '';
  return String(s)
    .replace(/&/g,'&amp;')
    .replace(/</g,'&lt;')
    .replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;');
}

/* ═══════════════════════════════════════════
   SECTION DEFAULTS
═══════════════════════════════════════════ */
var SEC_DEF = {
  hero:         { headline:'Welcome to Our Website', subheadline:'We deliver exceptional results for every client.', cta_label:'Get Started', cta_url:'#contact', bg_color:PRIMARY, text_color:'#ffffff', bg_image:'' },
  about:        { heading:'About Us', text:'Tell your story here. What makes you unique?', image:'', layout:'image_right' },
  services:     { heading:'Our Services', items:[{icon:'⚡',title:'Service One',desc:'Description of this service.'},{icon:'🎯',title:'Service Two',desc:'Description of this service.'},{icon:'💎',title:'Service Three',desc:'Description of this service.'}] },
  gallery:      { heading:'Gallery', images:[], columns:'auto', aspect:'4/3' },
  testimonials: { heading:'What Clients Say', items:[{name:'Client Name',role:'CEO, Company',quote:'This service changed our business completely!'}] },
  team:         { heading:'Meet the Team', items:[{name:'Team Member',role:'Position',image:''}] },
  faq:          { heading:'Frequently Asked Questions', items:[{q:'What do you offer?',a:'We offer premium services tailored to your needs.'}] },
  cta:          { heading:'Ready to Get Started?', subheading:'Join hundreds of happy customers today.', cta_label:'Contact Us', cta_url:'#contact', bg_color:'#111827', text_color:'#ffffff' },
  contact:      { heading:'Get in Touch', email:'', phone:'', address:'', show_form:true },
  pricing:      { heading:'Our Pricing', subtitle:'Simple, transparent pricing.', plans:[{name:'Basic',price:'₹999/mo',features:'Feature one\nFeature two\nFeature three',cta:'Get Started',link:'#contact',featured:'no'},{name:'Pro',price:'₹1,999/mo',features:'Everything in Basic\nFeature four\nPriority support',cta:'Get Started',link:'#contact',featured:'yes'},{name:'Enterprise',price:'Custom',features:'Everything in Pro\nDedicated support\nCustom integrations',cta:'Contact Us',link:'#contact',featured:'no'}] },
  stats:        { heading:'By the Numbers', items:[{number:'500+',label:'Happy Clients',emoji:'😊'},{number:'10+',label:'Years Experience',emoji:'📅'},{number:'99%',label:'Satisfaction Rate',emoji:'⭐'},{number:'24/7',label:'Support',emoji:'🛟'}] },
  rich_text:    { title:'', content:'Write your content here. Share your story, mission, or any information that matters to your audience.\n\nAdd more paragraphs to expand on your message.', align:'left' },
  columns:      { heading:'', cols:'3', bg:'white', items:[{emoji:'✨',heading:'Column One',text:'Add your content here.',btn_text:'',btn_link:''},{emoji:'🎯',heading:'Column Two',text:'Add your content here.',btn_text:'',btn_link:''},{emoji:'💎',heading:'Column Three',text:'Add your content here.',btn_text:'',btn_link:''}] },
  video:        { heading:'', url:'', embed_url:'', caption:'' },
  logobar:      { heading:'Trusted By', logos:[{url:'',alt:'Company One'},{url:'',alt:'Company Two'},{url:'',alt:'Company Three'},{url:'',alt:'Company Four'}] },
  timeline:     { heading:'How It Works', items:[{step:'1',title:'Discovery',desc:'We learn about your goals and requirements.'},{step:'2',title:'Strategy',desc:'We craft a tailored plan for your success.'},{step:'3',title:'Execution',desc:'We build and deliver with precision.'},{step:'4',title:'Launch',desc:'We go live and continue to support you.'}] },
  newsletter:   { heading:'Stay in the Loop', subtext:'Get the latest news and updates straight to your inbox.', placeholder:'Enter your email', cta:'Subscribe' }
};

/* ═══════════════════════════════════════════
   PANEL
═══════════════════════════════════════════ */
var PANEL_TITLES = { pages:'Pages', elements:'Add Section', styles:'Styles', seo:'SEO', settings:'Site Settings', 'section-edit':'Edit Section', apps:'Apps' };

function togglePanel(name) {
  if (activePanel === name) { closePanel(); return; }
  activePanel = name;
  document.getElementById('wbPanel').classList.add('open');
  document.getElementById('panelTitle').textContent = PANEL_TITLES[name] || name;
  document.querySelectorAll('.panel-section').forEach(function(el){ el.classList.remove('active'); });
  var ps = document.getElementById('ps-' + name);
  if (ps) ps.classList.add('active');
  document.querySelectorAll('.rail-btn').forEach(function(b){ b.classList.remove('active'); });
  var rb = document.getElementById('rb-' + name);
  if (rb) rb.classList.add('active');
  if (name === 'pages') renderPageList();
  if (name === 'catalog') catLoadPanel();
  if (name === 'apps') appsLoadPanel();
}

function closePanel() {
  activePanel = null;
  document.getElementById('wbPanel').classList.remove('open');
  document.querySelectorAll('.rail-btn').forEach(function(b){ b.classList.remove('active'); });
}

function openSectionEdit(sid) {
  selectedSecId = sid;
  renderSectionEditPanel(sid);
  activePanel = 'section-edit';
  document.getElementById('wbPanel').classList.add('open');
  document.getElementById('panelTitle').textContent = 'Edit Section';
  document.querySelectorAll('.panel-section').forEach(function(el){ el.classList.remove('active'); });
  document.getElementById('ps-section-edit').classList.add('active');
  document.querySelectorAll('.rail-btn').forEach(function(b){ b.classList.remove('active'); });
  // Highlight selected section in canvas
  document.querySelectorAll('.sec-wrap').forEach(function(el){ el.classList.remove('selected'); });
  var wrap = document.querySelector('.sec-wrap[data-sid="' + sid + '"]');
  if (wrap) { wrap.classList.add('selected'); wrap.scrollIntoView({ behavior:'smooth', block:'nearest' }); }
}

function backFromEdit() {
  selectedSecId = null;
  document.querySelectorAll('.sec-wrap').forEach(function(el){ el.classList.remove('selected'); });
  togglePanel('elements');
}

/* ═══════════════════════════════════════════
   PAGE LIST
═══════════════════════════════════════════ */
function renderPageList() {
  var el = document.getElementById('pageListEl');
  el.innerHTML = allPages.map(function(p) {
    return '<div class="page-item ' + (p.id === currentPageId ? 'active' : '') + '" onclick="switchPage(' + p.id + ')">' +
      '<span class="page-item-icon">' + (p.is_home ? '🏠' : '📄') + '</span>' +
      '<span class="page-item-name">' + escHtml(p.title) + '</span>' +
      (p.is_home
        ? '<span class="page-item-home">Home</span>'
        : '<button class="page-item-del" onclick="event.stopPropagation();deletePage(' + p.id + ',this)">✕</button>'
      ) +
    '</div>';
  }).join('');
}

/* ═══════════════════════════════════════════
   CANVAS RENDER — true WYSIWYG
═══════════════════════════════════════════ */
var primary = siteSettings.primary;
var sortableInstance = null;

function renderCanvas() {
  var root = document.getElementById('canvasRoot');

  // Destroy old sortable before replacing innerHTML
  if (sortableInstance) {
    try { sortableInstance.destroy(); } catch(e) {}
    sortableInstance = null;
  }

  if (!sections.length) {
    root.innerHTML = '<div class="canvas-empty">' +
      '<div class="canvas-empty-icon">🏗</div>' +
      '<div class="canvas-empty-title">Start building your page</div>' +
      '<div class="canvas-empty-sub">Click "Add" in the sidebar to add your first section.</div>' +
      '<button class="canvas-empty-btn" onclick="togglePanel(\'elements\')">+ Add First Section</button>' +
      '</div>';
    return;
  }

  // Set primary CSS variable on canvasRoot
  root.style.setProperty('--primary', siteSettings.primary || PRIMARY);

  var html = '';
  sections.forEach(function(sec) {
    html += '<div class="sec-wrap' + (sec.id === selectedSecId ? ' selected' : '') + '" data-sid="' + escHtml(sec.id) + '">';
    // Overlay controls
    html += '<div class="sec-overlay" onclick="event.stopPropagation()">';
    html += '<div class="sec-drag-handle" title="Drag to reorder">⠿ Drag</div>';
    html += '<button class="sec-btn" onclick="openSectionEdit(\'' + escHtml(sec.id) + '\')">✏ Edit</button>';
    html += '<button class="sec-btn del" onclick="deleteSection(\'' + escHtml(sec.id) + '\')">🗑</button>';
    html += '</div>';
    // Actual public-site HTML
    html += renderSectionPreview(sec);
    html += '</div>';
  });
  // Build nav preview (non-editable, matches public site structure)
  var siteName = siteSettings.title || SUBDOMAIN;
  var navHtml = '<nav class="canvas-nav-preview">' +
    '<div class="container"><div class="nav-inner">' +
    (siteSettings.logo
      ? '<a class="nav-logo" href="#"><img src="' + escHtml(siteSettings.logo) + '" alt="' + escHtml(siteName) + '"></a>'
      : '<a class="nav-logo" href="#">' + escHtml(siteName) + '</a>') +
    '<div class="nav-links">' +
    allPages.map(function(p) {
      return '<a href="#" class="' + (p.id === currentPageId ? 'active' : '') + '">' + escHtml(p.title) + '</a>';
    }).join('') +
    '</div></div></div></nav>';

  // Build footer preview
  var footerHtml = '<footer>' +
    '<div class="container">' +
    '<p>© ' + escHtml(siteName) +
    (siteSettings.tagline ? ' — ' + escHtml(siteSettings.tagline) : '') + '</p>' +
    '<p style="margin-top:8px;font-size:11px;">Powered by <a href="#">PageZaper</a></p>' +
    '</div></footer>';

  root.innerHTML = navHtml + html + footerHtml;

  // Section click → open edit panel (ignore clicks on overlay or contenteditable)
  root.querySelectorAll('.sec-wrap').forEach(function(wrap) {
    wrap.addEventListener('click', function(e) {
      if (e.target.closest('.sec-overlay')) return;
      // If clicking on a contenteditable element, just select (don't open panel)
      var isEditable = e.target.hasAttribute('contenteditable') || e.target.closest('[contenteditable]');
      var sid = wrap.dataset.sid;
      root.querySelectorAll('.sec-wrap').forEach(function(w){ w.classList.remove('selected'); });
      wrap.classList.add('selected');
      selectedSecId = sid;
      if (!isEditable) {
        openSectionEdit(sid);
      } else {
        // Show panel title but keep section-edit panel if already open
        if (activePanel !== 'section-edit') openSectionEdit(sid);
      }
    });
  });

  // Initialize drag & drop
  initSortable();
}

/* ═══════════════════════════════════════════
   SECTION PREVIEW — matches website-public.njk
═══════════════════════════════════════════ */
function renderSectionPreview(sec) {
  var d = sec.data || {};
  var sid = sec.id;
  var p = siteSettings.primary || PRIMARY;

  // Helper: contenteditable attribute string
  function ce(key, idx, field) {
    var attrs = 'contenteditable="true" data-sid="' + escHtml(sid) + '"';
    if (key) attrs += ' data-key="' + escHtml(key) + '"';
    if (idx !== undefined && idx !== null) attrs += ' data-idx="' + idx + '"';
    if (field) attrs += ' data-field="' + escHtml(field) + '"';
    return attrs;
  }

  // Theme-specific sections are handled by the active theme's sections.js
  if (THEME_SECTIONS.canvas[sec.type]) {
    return THEME_SECTIONS.canvas[sec.type](sec, d, { ce: ce, escHtml: escHtml, p: p });
  }

  switch (sec.type) {

    case 'hero': {
      var heroBg = d.bg_image
        ? 'background:url(' + escHtml(d.bg_image) + ') center/cover no-repeat;'
        : 'background:' + escHtml(d.bg_color || p) + ';';
      heroBg += 'color:' + escHtml(d.text_color || '#fff') + ';';
      var hLayout = d.layout || 'centered';
      var hLight = d.text_color && d.text_color !== '#ffffff';
      var hBadgeCls = 'hero-badge' + (hLight ? ' badge-light' : '');
      var btnStyle = 'style="background:' + escHtml(d.text_color || '#fff') + ';color:' + escHtml(d.bg_color || p) + ';"';
      var btn2Cls = 'btn-outline-hero' + (hLight ? ' dark-outline' : '');
      // Stat values from data or defaults
      var s1num = d.stat1_num || '100M+';
      var s1lbl = d.stat1_lbl || 'Monthly Users';
      var s1pct = d.stat1_pct || '↑ 24% this month';
      var s2val = d.stat2_val || '$48,294';
      var s2lbl = d.stat2_lbl || 'Revenue';

      // Floating stat cards (reused in both layouts)
      var floatStatCard = '<div class="hero-float-card hfc-stat">' +
        '<div class="s-lbl" ' + ce('stat1_lbl') + '>' + escHtml(s1lbl) + '</div>' +
        '<div class="s-num"><span ' + ce('stat1_num') + '>' + escHtml(s1num) + '</span></div>' +
        '<div class="s-pct"><span ' + ce('stat1_pct') + '>' + escHtml(s1pct) + '</span></div>' +
      '</div>';
      var floatChartCard = '<div class="hero-float-card hfc-chart">' +
        '<div class="hfc-chart-head"><div class="hfc-icon">📈</div>' +
          '<div><div class="hfc-chart-lbl"><span ' + ce('stat2_lbl') + '>' + escHtml(s2lbl) + '</span></div>' +
          '<div class="hfc-chart-val"><span ' + ce('stat2_val') + '>' + escHtml(s2val) + '</span></div></div>' +
        '</div>' +
        '<div class="hfc-bars"><span style="height:35%;"></span><span style="height:55%;"></span><span style="height:42%;"></span><span style="height:68%;"></span><span style="height:58%;"></span><span style="height:84%;"></span><span style="height:72%;"></span><span style="height:96%;"></span></div>' +
      '</div>';

      if (hLayout === 'split') {
        // Right visual: real image if uploaded, else SVG person art
        var splitVisual;
        if (d.hero_image) {
          splitVisual = '<div style="position:absolute;inset:0;left:32px;border-radius:20px;overflow:hidden;"><img src="' + escHtml(d.hero_image) + '" style="width:100%;height:100%;object-fit:cover;display:block;"></div>';
        } else {
          var svgSplitR = '<svg viewBox="0 0 200 340" xmlns="http://www.w3.org/2000/svg" style="position:absolute;bottom:0;width:100%;height:100%;"><ellipse cx="100" cy="90" rx="50" ry="54" fill="rgba(255,255,255,.38)"/><path d="M0 340 Q100 190 200 340 Z" fill="rgba(255,255,255,.24)"/></svg>';
          var svgSplitL = '<svg viewBox="0 0 180 300" xmlns="http://www.w3.org/2000/svg" style="position:absolute;bottom:0;width:100%;height:100%;"><ellipse cx="90" cy="82" rx="46" ry="50" fill="rgba(255,255,255,.38)"/><path d="M0 300 Q90 165 180 300 Z" fill="rgba(255,255,255,.24)"/></svg>';
          splitVisual = '<div class="hero-split-card"><div class="hero-split-inner">' + svgSplitR + '</div><div class="hero-split-inner2">' + svgSplitL + '</div></div>';
        }
        return '<section class="hero hero-split" style="' + heroBg + '">' +
          '<div class="container"><div class="hero-split-grid">' +
            '<div>' +
              '<div class="' + hBadgeCls + '">✦ New — See what\'s possible</div>' +
              '<h1 ' + ce('headline') + '>' + escHtml(d.headline || 'Your Vision, Delivered') + '</h1>' +
              '<p class="hero-p" ' + ce('subheadline') + '>' + escHtml(d.subheadline || '') + '</p>' +
              '<div class="hero-btns">' +
                (d.cta_label ? '<a href="' + escHtml(d.cta_url || '#') + '" class="btn-primary" ' + btnStyle + ' onclick="return false;"><span ' + ce('cta_label') + '>' + escHtml(d.cta_label) + '</span></a>' : '') +
                (d.cta2_label ? '<a href="' + escHtml(d.cta2_url || '#') + '" class="' + btn2Cls + '" onclick="return false;"><span ' + ce('cta2_label') + '>' + escHtml(d.cta2_label) + '</span></a>' : '') +
              '</div>' +
            '</div>' +
            '<div class="hero-split-img">' + splitVisual + floatStatCard + floatChartCard + '</div>' +
          '</div></div></section>';
      }

      // ── Centered layout (default) ──
      var svgPersonL = '<svg viewBox="0 0 170 200" xmlns="http://www.w3.org/2000/svg" style="position:absolute;bottom:0;width:100%;height:100%;"><ellipse cx="85" cy="64" rx="42" ry="46" fill="rgba(255,255,255,.4)"/><path d="M0 200 Q85 112 170 200 Z" fill="rgba(255,255,255,.26)"/></svg>';
      var svgPersonR = '<svg viewBox="0 0 170 200" xmlns="http://www.w3.org/2000/svg" style="position:absolute;bottom:0;width:100%;height:100%;"><ellipse cx="85" cy="64" rx="42" ry="46" fill="rgba(255,255,255,.4)"/><path d="M0 200 Q85 112 170 200 Z" fill="rgba(255,255,255,.26)"/></svg>';
      // Visual area: real image if uploaded, else browser mockup with SVG art
      var centeredVisual;
      if (d.hero_image) {
        centeredVisual = '<div class="hero-visual"><div style="border-radius:16px 16px 0 0;overflow:hidden;box-shadow:0 24px 64px rgba(0,0,0,.32);"><img src="' + escHtml(d.hero_image) + '" style="width:100%;display:block;max-height:360px;object-fit:cover;"></div></div>';
      } else {
        centeredVisual = '<div class="hero-visual"><div class="hero-browser">' +
          '<div class="hero-browser-chrome"><span></span><span></span><span></span><div class="hero-browser-url"></div></div>' +
          '<div class="hero-browser-body">' +
            '<div class="hero-person hero-person-l">' + svgPersonL + '</div>' +
            '<div class="hero-chart-area">' +
              '<div class="hero-chart-label">Performance Overview</div>' +
              '<div class="hero-chart-bars">' +
                '<span style="height:42%;"></span><span style="height:62%;"></span><span style="height:50%;"></span>' +
                '<span style="height:80%;"></span><span style="height:60%;"></span><span style="height:90%;"></span>' +
                '<span style="height:74%;"></span><span style="height:96%;"></span><span style="height:68%;"></span>' +
                '<span style="height:100%;"></span>' +
              '</div>' +
            '</div>' +
            '<div class="hero-person hero-person-r">' + svgPersonR + '</div>' +
          '</div>' +
        '</div></div>';
      }
      return '<section class="hero hero-centered" style="' + heroBg + '">' +
        (d.bg_image ? '<div style="position:absolute;inset:0;background:rgba(0,0,0,0.35);pointer-events:none;"></div>' : '') +
        '<div class="container" style="position:relative;z-index:1;">' +
          '<div class="' + hBadgeCls + '">✦ Introducing Our Platform</div>' +
          '<h1 ' + ce('headline') + '>' + escHtml(d.headline || 'Welcome') + '</h1>' +
          '<p ' + ce('subheadline') + '>' + escHtml(d.subheadline || '') + '</p>' +
          '<div class="hero-btns">' +
            (d.cta_label ? '<a href="' + escHtml(d.cta_url || '#') + '" class="btn-primary" ' + btnStyle + ' onclick="return false;"><span ' + ce('cta_label') + '>' + escHtml(d.cta_label) + '</span></a>' : '') +
            (d.cta2_label ? '<a href="' + escHtml(d.cta2_url || '#') + '" class="' + btn2Cls + '" onclick="return false;"><span ' + ce('cta2_label') + '>' + escHtml(d.cta2_label) + '</span></a>' : '') +
          '</div>' +
          centeredVisual +
        '</div></section>';
    }

    case 'about':
      var imgRight = d.layout !== 'image_left';
      var imgHtml = d.image
        ? '<div class="about-img"><img src="' + escHtml(d.image) + '" alt="About"></div>'
        : (d.layout !== 'full_text' ? '<div class="about-img">🏢</div>' : '');
      var textHtml = '<div class="about-text">' +
        '<h2 ' + ce('heading') + '>' + escHtml(d.heading || 'About Us') + '</h2>' +
        '<p ' + ce('text') + '>' + escHtml(d.text || '') + '</p>' +
        '</div>';
      return '<section class="section">' +
        '<div class="container">' +
        '<div class="about-grid' + (d.layout === 'image_left' ? ' img-left' : '') + (d.layout === 'full_text' ? ' style="grid-template-columns:1fr"' : '') + '">' +
        (imgRight ? textHtml + imgHtml : imgHtml + textHtml) +
        '</div></div></section>';

    case 'services':
      var items = d.items || [];
      return '<section class="section section-alt">' +
        '<div class="container">' +
        '<div class="section-heading"><h2 ' + ce('heading') + '>' + escHtml(d.heading || 'Our Services') + '</h2></div>' +
        '<div class="services-grid">' +
        items.map(function(it, i) {
          return '<div class="service-card">' +
            '<div class="service-icon" ' + ce(null, i, 'icon') + '>' + escHtml(it.icon || '⚡') + '</div>' +
            '<div class="service-title" ' + ce(null, i, 'title') + '>' + escHtml(it.title || '') + '</div>' +
            '<div class="service-desc" ' + ce(null, i, 'desc') + '>' + escHtml(it.desc || '') + '</div>' +
            '</div>';
        }).join('') +
        '</div></div></section>';

    case 'gallery':
      var imgs = (d.images || []).filter(Boolean);
      var gCols = d.columns || 'auto';
      var gColsStyle = gCols === 'auto' ? 'repeat(auto-fill,minmax(180px,1fr))' : 'repeat(' + gCols + ',1fr)';
      var gAspect = d.aspect || '4/3';
      return '<section class="section">' +
        '<div class="container">' +
        (d.heading ? '<div class="section-heading"><h2 ' + ce('heading') + '>' + escHtml(d.heading) + '</h2></div>' : '') +
        '<div class="gallery-grid" style="grid-template-columns:' + gColsStyle + ';gap:12px;">' +
        (imgs.length
          ? imgs.map(function(im){ return '<div class="gallery-item" style="aspect-ratio:' + gAspect + ';"><img src="' + escHtml(im) + '" alt="Gallery" loading="lazy"></div>'; }).join('')
          : ['🖼','🖼','🖼','🖼','🖼','🖼'].map(function(ic){ return '<div class="gallery-item" style="aspect-ratio:' + gAspect + ';display:flex;align-items:center;justify-content:center;font-size:32px;color:#d1d5db;">' + ic + '</div>'; }).join('')
        ) +
        '</div></div></section>';

    case 'testimonials':
      var tItems = d.items || [];
      return '<section class="section section-alt">' +
        '<div class="container">' +
        '<div class="section-heading"><h2 ' + ce('heading') + '>' + escHtml(d.heading || 'What Clients Say') + '</h2></div>' +
        '<div class="testimonials-grid">' +
        tItems.map(function(t, i) {
          var init = (t.name && t.name[0]) ? t.name[0].toUpperCase() : '?';
          return '<div class="testi-card">' +
            '<div class="testi-quote" ' + ce(null, i, 'quote') + '>' + escHtml(t.quote || '') + '</div>' +
            '<div class="testi-author">' +
              '<div class="testi-avatar">' + escHtml(init) + '</div>' +
              '<div>' +
                '<div class="testi-name" ' + ce(null, i, 'name') + '>' + escHtml(t.name || '') + '</div>' +
                '<div class="testi-role" ' + ce(null, i, 'role') + '>' + escHtml(t.role || '') + '</div>' +
              '</div>' +
            '</div></div>';
        }).join('') +
        '</div></div></section>';

    case 'team':
      var tmItems = d.items || [];
      return '<section class="section">' +
        '<div class="container">' +
        '<div class="section-heading"><h2 ' + ce('heading') + '>' + escHtml(d.heading || 'Meet the Team') + '</h2></div>' +
        '<div class="team-grid">' +
        tmItems.map(function(m, i) {
          return '<div class="team-card">' +
            '<div class="team-photo">' +
              (m.image ? '<img src="' + escHtml(m.image) + '" alt="' + escHtml(m.name) + '">' : '👤') +
            '</div>' +
            '<div class="team-name" ' + ce(null, i, 'name') + '>' + escHtml(m.name || '') + '</div>' +
            '<div class="team-role" ' + ce(null, i, 'role') + '>' + escHtml(m.role || '') + '</div>' +
            '</div>';
        }).join('') +
        '</div></div></section>';

    case 'faq':
      var fqItems = d.items || [];
      return '<section class="section section-alt">' +
        '<div class="container">' +
        '<div class="section-heading"><h2 ' + ce('heading') + '>' + escHtml(d.heading || 'FAQ') + '</h2></div>' +
        '<div class="faq-list">' +
        fqItems.map(function(f, i) {
          return '<div class="faq-item open">' +
            '<div class="faq-q" ' + ce(null, i, 'q') + '>' + escHtml(f.q || '') + '</div>' +
            '<div class="faq-a"><div class="faq-a-inner" ' + ce(null, i, 'a') + '>' + escHtml(f.a || '') + '</div></div>' +
            '</div>';
        }).join('') +
        '</div></div></section>';

    case 'cta':
      return '<section class="cta-banner" style="background:' + escHtml(d.bg_color || '#111827') + ';color:' + escHtml(d.text_color || '#fff') + ';">' +
        '<div class="container">' +
        '<h2 ' + ce('heading') + '>' + escHtml(d.heading || 'Ready to Get Started?') + '</h2>' +
        (d.subheading ? '<p ' + ce('subheading') + '>' + escHtml(d.subheading) + '</p>' : '') +
        (d.cta_label
          ? '<a href="' + escHtml(d.cta_url || '#') + '" class="btn-primary" onclick="return false;" style="background:' + escHtml(d.text_color || '#fff') + ';color:' + escHtml(d.bg_color || '#111') + ';">' +
            '<span ' + ce('cta_label') + '>' + escHtml(d.cta_label) + '</span></a>'
          : '') +
        '</div></section>';

    case 'contact':
      return '<section class="section">' +
        '<div class="container">' +
        '<div class="section-heading"><h2 ' + ce('heading') + '>' + escHtml(d.heading || 'Get in Touch') + '</h2></div>' +
        '<div class="contact-grid">' +
        '<div class="contact-info">' +
          (d.email
            ? '<div class="contact-item"><div class="contact-item-icon">✉️</div><div>' +
              '<div class="contact-item-label">Email</div>' +
              '<div class="contact-item-text" ' + ce('email') + '>' + escHtml(d.email) + '</div>' +
              '</div></div>' : '') +
          (d.phone
            ? '<div class="contact-item"><div class="contact-item-icon">📞</div><div>' +
              '<div class="contact-item-label">Phone</div>' +
              '<div class="contact-item-text" ' + ce('phone') + '>' + escHtml(d.phone) + '</div>' +
              '</div></div>' : '') +
          (d.address
            ? '<div class="contact-item"><div class="contact-item-icon">📍</div><div>' +
              '<div class="contact-item-label">Address</div>' +
              '<div class="contact-item-text" ' + ce('address') + '>' + escHtml(d.address) + '</div>' +
              '</div></div>' : '') +
          (!d.email && !d.phone && !d.address
            ? '<p style="color:#9ca3af;font-size:13px;">Add contact details in the Edit panel →</p>'
            : '') +
        '</div>' +
        '<form class="contact-form" onsubmit="return false;">' +
          '<input class="cf-input" placeholder="Your Name" disabled>' +
          '<input class="cf-input" placeholder="Email Address" disabled>' +
          '<input class="cf-input" placeholder="Phone Number" disabled>' +
          '<textarea class="cf-input cf-textarea" placeholder="Your message…" disabled></textarea>' +
          '<button type="button" class="cf-submit" style="background:' + escHtml(p) + ';">Send Message →</button>' +
        '</form>' +
        '</div></div></section>';

    case 'pricing':
      var prPlans = d.plans || [];
      return '<section class="section section-alt">' +
        '<div class="container">' +
        '<div class="section-heading"><h2 ' + ce('heading') + '>' + escHtml(d.heading || 'Our Pricing') + '</h2>' +
        (d.subtitle ? '<p ' + ce('subtitle') + '>' + escHtml(d.subtitle) + '</p>' : '') + '</div>' +
        '<div class="pricing-grid">' +
        prPlans.map(function(plan, i) {
          var feats = (plan.features || '').split('\n').filter(Boolean);
          return '<div class="pricing-card' + (plan.featured === 'yes' ? ' featured' : '') + '">' +
            '<div class="pricing-name" ' + ce(null,i,'name') + '>' + escHtml(plan.name || '') + '</div>' +
            '<div class="pricing-price" ' + ce(null,i,'price') + '>' + escHtml(plan.price || '') + '</div>' +
            '<ul class="pricing-features">' + feats.map(function(f){ return '<li>' + escHtml(f) + '</li>'; }).join('') + '</ul>' +
            (plan.cta ? '<a class="pricing-cta" onclick="return false;" href="' + escHtml(plan.link||'#') + '">' + escHtml(plan.cta) + '</a>' : '') +
            '</div>';
        }).join('') +
        '</div></div></section>';

    case 'stats':
      var stItems = d.items || [];
      return '<section class="section">' +
        '<div class="container">' +
        (d.heading ? '<div class="section-heading"><h2 ' + ce('heading') + '>' + escHtml(d.heading) + '</h2></div>' : '') +
        '<div class="stats-grid">' +
        stItems.map(function(it, i) {
          return '<div class="stat-item">' +
            (it.emoji ? '<div class="stat-emoji">' + escHtml(it.emoji) + '</div>' : '') +
            '<div class="stat-number" ' + ce(null,i,'number') + '>' + escHtml(it.number || '') + '</div>' +
            '<div class="stat-label" ' + ce(null,i,'label') + '>' + escHtml(it.label || '') + '</div>' +
            '</div>';
        }).join('') +
        '</div></div></section>';

    case 'rich_text':
      return '<section class="section">' +
        '<div class="container">' +
        '<div class="rich-text-block' + (d.align === 'center' ? ' center' : '') + '">' +
        (d.title ? '<h2 ' + ce('title') + '>' + escHtml(d.title) + '</h2>' : '') +
        '<div class="rtb-content" ' + ce('content') + ' style="white-space:pre-wrap;">' + escHtml(d.content || '') + '</div>' +
        '</div></div></section>';

    case 'columns':
      var colItems = d.items || [];
      var colBg = d.bg === 'accent' ? 'background:' + escHtml(p) + ';color:#fff;' : '';
      var colCls = d.bg === 'light' ? 'section section-alt' : 'section';
      return '<section class="' + colCls + '"' + (colBg ? ' style="' + colBg + '"' : '') + '>' +
        '<div class="container">' +
        (d.heading ? '<div class="section-heading"><h2 ' + ce('heading') + '>' + escHtml(d.heading) + '</h2></div>' : '') +
        '<div class="columns-grid cols-' + escHtml(d.cols || '3') + '">' +
        colItems.map(function(it, i) {
          return '<div class="col-item">' +
            (it.emoji ? '<div class="col-item-icon">' + escHtml(it.emoji) + '</div>' : '') +
            (it.heading ? '<div class="col-item-heading" ' + ce(null,i,'heading') + '>' + escHtml(it.heading) + '</div>' : '') +
            (it.text ? '<div class="col-item-text" ' + ce(null,i,'text') + '>' + escHtml(it.text) + '</div>' : '') +
            (it.btn_text ? '<a class="col-item-btn" onclick="return false;">' + escHtml(it.btn_text) + '</a>' : '') +
            '</div>';
        }).join('') +
        '</div></div></section>';

    case 'video':
      var embedUrl = d.embed_url || '';
      return '<section class="section">' +
        '<div class="container">' +
        (d.heading ? '<div class="section-heading"><h2 ' + ce('heading') + '>' + escHtml(d.heading) + '</h2></div>' : '') +
        '<div class="video-wrap">' +
        (embedUrl
          ? '<div class="video-embed"><iframe src="' + escHtml(embedUrl) + '" allowfullscreen loading="lazy"></iframe></div>'
          : '<div class="video-embed" style="display:flex;align-items:center;justify-content:center;background:#f3f4f6;"><span style="font-size:48px;opacity:.3;">▶</span></div>'
        ) +
        (d.caption ? '<div class="video-caption" ' + ce('caption') + '>' + escHtml(d.caption) + '</div>' : '') +
        '</div></div></section>';

    case 'logobar':
      var lbLogos = d.logos || [];
      return '<section class="section section-alt">' +
        '<div class="container">' +
        (d.heading ? '<div class="section-heading"><h2 ' + ce('heading') + '>' + escHtml(d.heading) + '</h2></div>' : '') +
        '<div class="logo-bar">' +
        lbLogos.map(function(logo, i) {
          return '<div class="logo-item">' +
            (logo.url
              ? '<img src="' + escHtml(logo.url) + '" alt="' + escHtml(logo.alt || '') + '">'
              : '<span class="logo-item-text" ' + ce(null,i,'alt') + '>' + escHtml(logo.alt || 'Company') + '</span>'
            ) +
            '</div>';
        }).join('') +
        '</div></div></section>';

    case 'timeline':
      var tlItems = d.items || [];
      return '<section class="section">' +
        '<div class="container">' +
        '<div class="section-heading"><h2 ' + ce('heading') + '>' + escHtml(d.heading || 'How It Works') + '</h2></div>' +
        '<div class="timeline">' +
        tlItems.map(function(it, i) {
          return '<div class="tl-item">' +
            '<div class="tl-line">' +
              '<div class="tl-dot">' + escHtml(it.step || String(i + 1)) + '</div>' +
              '<div class="tl-connector"></div>' +
            '</div>' +
            '<div class="tl-content">' +
              '<div class="tl-title" ' + ce(null,i,'title') + '>' + escHtml(it.title || '') + '</div>' +
              (it.desc ? '<div class="tl-desc" ' + ce(null,i,'desc') + '>' + escHtml(it.desc) + '</div>' : '') +
            '</div>' +
          '</div>';
        }).join('') +
        '</div></div></section>';

    case 'newsletter':
      return '<section class="section section-alt">' +
        '<div class="container">' +
        '<div class="newsletter-wrap">' +
        '<h2 ' + ce('heading') + '>' + escHtml(d.heading || 'Stay in the Loop') + '</h2>' +
        (d.subtext ? '<p ' + ce('subtext') + '>' + escHtml(d.subtext) + '</p>' : '') +
        '<form class="newsletter-form" onsubmit="return false;">' +
          '<input class="nl-input" type="email" placeholder="' + escHtml(d.placeholder || 'Enter your email') + '" disabled>' +
          '<button type="button" class="nl-btn" style="background:' + escHtml(p) + ';">' + escHtml(d.cta || 'Subscribe') + '</button>' +
        '</form>' +
        '</div></div></section>';

    // ── Real Estate section types ────────────────────────────────────────────
    // (handled by themes/website/realestate/sections.js via THEME_SECTIONS.canvas)

    case 'property_listings':
    case 'property_detail':
    case 'agents':
    case 'blog_posts':
    case 'category_banner':
    case 'product_grid':
    case 'product_detail':
    case 'cart':
    case 'checkout':
      // Handled by THEME_SECTIONS.canvas (loaded from theme's sections.js)
      return '<div style="padding:40px;text-align:center;color:#9ca3af;font-size:13px;">Loading theme sections…</div>';

    case '__dead__': {
      var plCanvasProps = (d.properties||[]).slice(0,3);
      return '<section class="section section-alt">' +
        '<div class="container">' +
        (d.heading ? '<div class="section-heading"><h2 ' + ce('heading') + '>' + escHtml(d.heading) + '</h2>' + (d.subheading ? '<p ' + ce('subheading') + '>' + escHtml(d.subheading) + '</p>' : '') + '</div>' : '') +
        '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:24px;">' +
        plCanvasProps.map(function(prop,i){
          return '<div style="background:#fff;border:1.5px solid #e2e8f0;border-radius:16px;overflow:hidden;">' +
            '<div style="background:linear-gradient(135deg,' + escHtml(p) + ',#2563eb);height:150px;display:flex;align-items:center;justify-content:center;position:relative;">' +
              (prop.tag?'<div style="position:absolute;top:12px;left:12px;background:rgba(255,255,255,0.2);color:#fff;font-size:11px;font-weight:700;padding:4px 10px;border-radius:12px;">' + escHtml(prop.tag) + '</div>':'') +
              '<div style="font-size:48px;opacity:0.3;">' + escHtml(prop.icon||'🏠') + '</div>' +
            '</div>' +
            '<div style="padding:14px;">' +
              '<h3 style="font-size:15px;font-weight:700;margin:0 0 4px;" ' + ce(null,i,'title') + '>' + escHtml(prop.title||'Property') + '</h3>' +
              '<p style="font-size:12px;color:#64748b;margin:0 0 10px;">📍 <span ' + ce(null,i,'location') + '>' + escHtml(prop.location||'') + '</span></p>' +
              '<div style="display:flex;gap:10px;font-size:12px;color:#94a3b8;padding-bottom:10px;border-bottom:1px solid #f1f5f9;">' +
                (prop.beds?'<span>🛏 '+prop.beds+'</span>':'') +
                (prop.baths?'<span>🚿 '+prop.baths+'</span>':'') +
                (prop.sqft?'<span>📐 '+prop.sqft+'</span>':'') +
              '</div>' +
              '<div class="prop-price" style="font-size:17px;font-weight:800;color:' + escHtml(p) + ';margin-top:10px;" ' + ce(null,i,'price') + '>' + escHtml(prop.price||'') + '</div>' +
            '</div>' +
          '</div>';
        }).join('') +
        '</div></div></section>';
    }

    case 'property_detail': {
      var pdCanvasFeats = (d.features||[]).slice(0,6);
      return '<section class="section">' +
        '<div class="container">' +
        '<div style="display:grid;grid-template-columns:1.3fr 0.7fr;gap:40px;align-items:start;">' +
          '<div>' +
            '<div style="background:linear-gradient(135deg,' + escHtml(p) + ',#2563eb);border-radius:16px;height:260px;display:flex;align-items:center;justify-content:center;position:relative;margin-bottom:14px;">' +
              (d.tag?'<div style="position:absolute;top:14px;left:14px;background:rgba(255,255,255,0.2);color:#fff;font-size:12px;font-weight:700;padding:4px 12px;border-radius:12px;">' + escHtml(d.tag) + '</div>':'') +
              '<div style="font-size:80px;opacity:0.25;">' + escHtml(d.icon||'🏠') + '</div>' +
            '</div>' +
          '</div>' +
          '<div>' +
            '<h1 style="font-size:22px;font-weight:800;margin:0 0 6px;" ' + ce('title') + '>' + escHtml(d.title||'Property') + '</h1>' +
            '<p style="font-size:12px;color:#64748b;margin:0 0 12px;">📍 <span ' + ce('location') + '>' + escHtml(d.location||'') + '</span></p>' +
            '<div class="prd-price" style="font-size:26px;font-weight:800;color:' + escHtml(p) + ';margin-bottom:16px;" ' + ce('price') + '>' + escHtml(d.price||'') + '</div>' +
            '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;padding:12px;background:#f8fafc;border-radius:10px;margin-bottom:14px;font-size:13px;text-align:center;">' +
              [['🛏',(d.beds||0)+' Beds'],['🚿',(d.baths||0)+' Baths'],['📐',(d.sqft||0)+' sqft'],['🚗',(d.parking||0)+' Parking']].map(function(sp){ return '<div><div>'+sp[0]+'</div><div style="font-weight:700;">'+sp[1]+'</div></div>'; }).join('') +
            '</div>' +
            (pdCanvasFeats.length ? '<div style="display:grid;grid-template-columns:1fr 1fr;gap:4px;margin-bottom:14px;">' + pdCanvasFeats.map(function(f4){ return '<div style="font-size:12px;color:#374151;">✓ ' + escHtml(f4) + '</div>'; }).join('') + '</div>' : '') +
            '<a class="btn-primary" style="display:block;text-align:center;background:' + escHtml(p) + ';color:#fff;padding:12px;border-radius:10px;font-weight:700;margin-bottom:8px;" onclick="return false;">Schedule a Visit</a>' +
            '<a style="display:block;text-align:center;border:1.5px solid ' + escHtml(p) + ';color:' + escHtml(p) + ';padding:11px;border-radius:10px;font-weight:700;" onclick="return false;">Contact Agent</a>' +
          '</div>' +
        '</div>' +
        '</div></section>';
    }

    case 'agents': {
      var agCanvasItems2 = (d.items||[]).slice(0,4);
      return '<section class="section section-alt">' +
        '<div class="container">' +
        (d.heading ? '<div class="section-heading"><h2 ' + ce('heading') + '>' + escHtml(d.heading) + '</h2>' + (d.subheading ? '<p ' + ce('subheading') + '>' + escHtml(d.subheading) + '</p>' : '') + '</div>' : '') +
        '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:20px;">' +
        agCanvasItems2.map(function(ag,i){
          return '<div style="background:#fff;border:1.5px solid #e2e8f0;border-radius:16px;padding:24px;text-align:center;">' +
            '<div class="agent-photo" style="width:70px;height:70px;border-radius:50%;background:linear-gradient(135deg,' + escHtml(p) + ',#2563eb);display:flex;align-items:center;justify-content:center;font-size:36px;margin:0 auto 12px;">' + escHtml(ag.icon||'👤') + '</div>' +
            '<div style="font-size:15px;font-weight:700;" ' + ce(null,i,'name') + '>' + escHtml(ag.name||'Agent') + '</div>' +
            '<div class="agent-stat-n" style="font-size:12px;color:' + escHtml(p) + ';font-weight:600;margin:4px 0 12px;" ' + ce(null,i,'specialty') + '>' + escHtml(ag.specialty||'') + '</div>' +
            '<div style="display:flex;justify-content:space-around;border-top:1px solid #f1f5f9;padding-top:12px;font-size:13px;">' +
              '<div><div style="font-weight:800;color:' + escHtml(p) + ';">' + (ag.listings||0) + '</div><div style="font-size:11px;color:#94a3b8;">Listings</div></div>' +
              '<div><div style="font-weight:800;color:' + escHtml(p) + ';">' + (ag.sold||0) + '</div><div style="font-size:11px;color:#94a3b8;">Sold</div></div>' +
            '</div>' +
          '</div>';
        }).join('') +
        '</div></div></section>';
    }

    case 'blog_posts': {
      var bpCanvasPosts2 = (d.posts||[]).slice(0,3);
      return '<section class="section">' +
        '<div class="container">' +
        (d.heading ? '<div class="section-heading"><h2 ' + ce('heading') + '>' + escHtml(d.heading) + '</h2>' + (d.subheading ? '<p ' + ce('subheading') + '>' + escHtml(d.subheading) + '</p>' : '') + '</div>' : '') +
        '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:24px;">' +
        bpCanvasPosts2.map(function(post,i){
          return '<div style="background:#fff;border:1.5px solid #e2e8f0;border-radius:16px;overflow:hidden;">' +
            '<div style="background:linear-gradient(135deg,' + escHtml(p) + ',#2563eb);height:130px;display:flex;align-items:center;justify-content:center;">' +
              '<div style="font-size:52px;opacity:0.25;">' + escHtml(post.icon||'📰') + '</div>' +
            '</div>' +
            '<div style="padding:16px;">' +
              '<div class="blog-cat" style="font-size:11px;font-weight:700;color:' + escHtml(p) + ';letter-spacing:1px;text-transform:uppercase;margin-bottom:8px;" ' + ce(null,i,'category') + '>' + escHtml(post.category||'') + '</div>' +
              '<h3 style="font-size:15px;font-weight:700;margin:0 0 8px;line-height:1.3;" ' + ce(null,i,'title') + '>' + escHtml(post.title||'') + '</h3>' +
              '<p style="font-size:13px;color:#64748b;line-height:1.6;margin:0 0 10px;" ' + ce(null,i,'excerpt') + '>' + escHtml((post.excerpt||'').slice(0,80)) + '</p>' +
              '<div style="font-size:11px;color:#94a3b8;">' + escHtml(post.author||'') + ' · ' + escHtml(post.date||'') + '</div>' +
            '</div>' +
          '</div>';
        }).join('') +
        '</div></div></section>';
    }

    // ── Ecommerce section types ──────────────────────────────────────────────
    case 'category_banner': {
      var cbCanvasCats2 = (d.categories||[]).slice(0,4);
      var cbColors2 = ['#1f2937','#3730a3',p,'#334155'];
      return '<section class="section">' +
        '<div class="container">' +
        (d.heading ? '<div class="section-heading"><h2 ' + ce('heading') + '>' + escHtml(d.heading) + '</h2></div>' : '') +
        '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:16px;">' +
        cbCanvasCats2.map(function(cat,i){
          return '<a onclick="return false;" style="background:' + escHtml(cat.color||cbColors2[i]||p) + ';border-radius:16px;padding:32px 20px;text-align:center;display:block;text-decoration:none;">' +
            '<div style="font-size:40px;margin-bottom:10px;">' + escHtml(cat.icon||'🛍') + '</div>' +
            '<div style="font-size:16px;font-weight:700;color:#fff;" ' + ce(null,i,'name') + '>' + escHtml(cat.name||'Category') + '</div>' +
          '</a>';
        }).join('') +
        '</div></div></section>';
    }

    case 'product_grid': {
      var pgCanvasProds2 = (d.products||[]).slice(0,4);
      return '<section class="section section-alt">' +
        '<div class="container">' +
        (d.heading ? '<div class="section-heading"><h2 ' + ce('heading') + '>' + escHtml(d.heading) + '</h2></div>' : '') +
        '<div class="product-grid" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:20px;">' +
        pgCanvasProds2.map(function(pr,i){
          return '<div style="background:#fff;border:1px solid #e5e7eb;border-radius:14px;overflow:hidden;">' +
            '<div style="background:linear-gradient(135deg,' + escHtml(p) + '22,' + escHtml(p) + '08);height:150px;display:flex;align-items:center;justify-content:center;position:relative;">' +
              '<div style="font-size:64px;opacity:0.55;">' + escHtml(pr.icon||'🛍') + '</div>' +
              (pr.badge?'<div style="position:absolute;top:10px;left:10px;background:' + escHtml(p) + ';color:#fff;font-size:10px;font-weight:700;padding:3px 10px;border-radius:20px;">' + escHtml(pr.badge) + '</div>':'') +
            '</div>' +
            '<div style="padding:12px;">' +
              '<div style="font-size:11px;color:#9ca3af;margin-bottom:3px;" ' + ce(null,i,'category') + '>' + escHtml(pr.category||'') + '</div>' +
              '<div style="font-size:14px;font-weight:700;margin-bottom:6px;" ' + ce(null,i,'name') + '>' + escHtml(pr.name||'') + '</div>' +
              '<div style="font-size:16px;font-weight:800;color:' + escHtml(p) + ';" ' + ce(null,i,'price') + '>' + escHtml(pr.price||'') + '</div>' +
            '</div>' +
          '</div>';
        }).join('') +
        '</div></div></section>';
    }

    case 'product_detail': {
      var pdCanvasSizes2 = d.sizes||['XS','S','M','L','XL'];
      return '<section class="section">' +
        '<div class="container">' +
        '<div style="display:grid;grid-template-columns:1fr 1fr;gap:48px;align-items:start;">' +
          '<div style="background:linear-gradient(135deg,' + escHtml(p) + '18,' + escHtml(p) + '06);border-radius:16px;height:300px;display:flex;align-items:center;justify-content:center;">' +
            '<div style="font-size:100px;opacity:0.4;">' + escHtml(d.icon||'👕') + '</div>' +
          '</div>' +
          '<div>' +
            '<div style="font-size:11px;color:#9ca3af;letter-spacing:1.5px;text-transform:uppercase;margin-bottom:8px;" ' + ce('category') + '>' + escHtml(d.category||'') + '</div>' +
            '<h1 style="font-size:26px;font-weight:800;margin:0 0 10px;" ' + ce('name') + '>' + escHtml(d.name||'Product Name') + '</h1>' +
            '<div style="font-size:28px;font-weight:800;color:' + escHtml(p) + ';margin-bottom:16px;" ' + ce('price') + '>' + escHtml(d.price||'') + '</div>' +
            '<p style="font-size:14px;color:#6b7280;margin-bottom:18px;line-height:1.7;" ' + ce('desc') + '>' + escHtml(d.desc||'') + '</p>' +
            '<div style="margin-bottom:18px;"><div style="font-size:13px;font-weight:600;margin-bottom:8px;">Size</div>' +
              '<div style="display:flex;gap:8px;flex-wrap:wrap;">' + pdCanvasSizes2.slice(0,6).map(function(s){ return '<div style="border:1.5px solid #e5e7eb;border-radius:8px;padding:5px 12px;font-size:13px;">' + escHtml(s) + '</div>'; }).join('') + '</div>' +
            '</div>' +
            '<button type="button" class="btn-primary" style="width:100%;background:' + escHtml(p) + ';color:#fff;padding:13px;border:none;border-radius:10px;font-weight:700;" disabled>Add to Cart</button>' +
          '</div>' +
        '</div>' +
        '</div></section>';
    }

    case 'cart': {
      var ctCanvasItems2 = (d.items||[]).slice(0,3);
      return '<section class="section section-alt">' +
        '<div class="container">' +
        (d.heading ? '<h2 style="font-size:28px;font-weight:800;margin-bottom:24px;" ' + ce('heading') + '>' + escHtml(d.heading) + '</h2>' : '') +
        '<div style="display:grid;grid-template-columns:1.4fr 0.6fr;gap:24px;">' +
          '<div style="background:#fff;border:1.5px solid #e5e7eb;border-radius:16px;padding:24px;">' +
            ctCanvasItems2.map(function(item){
              return '<div style="display:flex;gap:14px;align-items:center;padding:14px 0;border-bottom:1px solid #f3f4f6;">' +
                '<div style="width:56px;height:56px;background:' + escHtml(p) + '16;border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:28px;">' + escHtml(item.icon||'🛍') + '</div>' +
                '<div style="flex:1;"><div style="font-weight:700;">' + escHtml(item.name||'') + '</div><div style="font-size:13px;color:#9ca3af;">' + escHtml(item.variant||'') + '</div></div>' +
                '<div style="font-weight:700;color:' + escHtml(p) + ';">' + escHtml(item.price||'') + '</div>' +
              '</div>';
            }).join('') +
          '</div>' +
          '<div style="background:#fff;border:1.5px solid #e5e7eb;border-radius:16px;padding:24px;">' +
            '<div style="font-weight:700;margin-bottom:16px;">Order Summary</div>' +
            '<div style="display:flex;justify-content:space-between;margin-bottom:8px;"><span style="color:#6b7280;">Subtotal</span><span>' + escHtml(d.subtotal||'') + '</span></div>' +
            '<div style="display:flex;justify-content:space-between;margin-bottom:12px;"><span style="color:#6b7280;">Shipping</span><span>' + escHtml(d.shipping||'Free') + '</span></div>' +
            '<div style="display:flex;justify-content:space-between;font-weight:700;font-size:16px;border-top:1.5px solid #e5e7eb;padding-top:12px;"><span>Total</span><span style="color:' + escHtml(p) + ';">' + escHtml(d.total||'') + '</span></div>' +
            '<button type="button" class="btn-primary" style="width:100%;background:' + escHtml(p) + ';color:#fff;padding:12px;border:none;border-radius:10px;font-weight:700;margin-top:14px;" disabled>Checkout →</button>' +
          '</div>' +
        '</div>' +
        '</div></section>';
    }

    case 'checkout': {
      var coCanvasItems2 = (d.items||[]).slice(0,2);
      return '<section class="section section-alt">' +
        '<div class="container">' +
        (d.heading ? '<h2 style="font-size:28px;font-weight:800;margin-bottom:24px;" ' + ce('heading') + '>' + escHtml(d.heading) + '</h2>' : '') +
        '<div style="display:grid;grid-template-columns:1.4fr 0.6fr;gap:24px;">' +
          '<div style="display:flex;flex-direction:column;gap:16px;">' +
            '<div style="background:#fff;border:1.5px solid #e5e7eb;border-radius:14px;padding:20px;">' +
              '<div style="font-weight:700;margin-bottom:12px;">Contact Information</div>' +
              ['Full Name','Email Address','Phone Number'].map(function(lbl){ return '<div style="background:#f9fafb;border:1.5px solid #e5e7eb;border-radius:8px;height:38px;margin-bottom:8px;display:flex;align-items:center;padding:0 12px;font-size:13px;color:#9ca3af;">'+lbl+'</div>'; }).join('') +
            '</div>' +
            '<div style="background:#fff;border:1.5px solid #e5e7eb;border-radius:14px;padding:20px;">' +
              '<div style="font-weight:700;margin-bottom:12px;">Shipping Address</div>' +
              ['Address','City, State','PIN Code'].map(function(lbl){ return '<div style="background:#f9fafb;border:1.5px solid #e5e7eb;border-radius:8px;height:38px;margin-bottom:8px;display:flex;align-items:center;padding:0 12px;font-size:13px;color:#9ca3af;">'+lbl+'</div>'; }).join('') +
            '</div>' +
          '</div>' +
          '<div style="background:#fff;border:1.5px solid #e5e7eb;border-radius:14px;padding:20px;">' +
            '<div style="font-weight:700;margin-bottom:14px;">Order Summary</div>' +
            coCanvasItems2.map(function(item){ return '<div style="display:flex;justify-content:space-between;margin-bottom:8px;font-size:14px;"><span>' + escHtml(item.name||'') + '</span><span style="font-weight:600;">' + escHtml(item.price||'') + '</span></div>'; }).join('') +
            '<div style="border-top:1.5px solid #f3f4f6;padding-top:12px;margin-top:8px;display:flex;justify-content:space-between;font-weight:700;"><span>Total</span><span style="color:' + escHtml(p) + ';">' + escHtml(d.total||'') + '</span></div>' +
            '<button type="button" class="btn-primary" style="width:100%;background:' + escHtml(p) + ';color:#fff;padding:12px;border:none;border-radius:10px;font-weight:700;margin-top:16px;" disabled>Place Order</button>' +
          '</div>' +
        '</div>' +
        '</div></section>';
    }

    default:
      return '<div style="padding:40px;text-align:center;color:#9ca3af;font-size:13px;">Unknown section type: ' + escHtml(sec.type) + '</div>';
  }
}

/* ═══════════════════════════════════════════
   SORTABLE (drag & drop reorder)
═══════════════════════════════════════════ */
function initSortable() {
  if (typeof Sortable === 'undefined') return;
  var root = document.getElementById('canvasRoot');
  if (!root || !root.querySelector('.sec-wrap')) return;

  sortableInstance = Sortable.create(root, {
    animation: 150,
    handle: '.sec-drag-handle',
    draggable: '.sec-wrap',
    ghostClass: 'sec-ghost',
    chosenClass: 'sec-chosen',
    onEnd: function() {
      // Rebuild sections array from new DOM order
      var newSections = [];
      root.querySelectorAll('.sec-wrap[data-sid]').forEach(function(el) {
        var sec = sections.find(function(s){ return s.id === el.dataset.sid; });
        if (sec) newSections.push(sec);
      });
      sections = newSections;
      pushUndo();
      setStatus('saving');
      clearTimeout(autoSaveTimer);
      autoSaveTimer = setTimeout(saveSections, 2000);
    }
  });
}

/* ═══════════════════════════════════════════
   THEME CSS — live preview in canvas
═══════════════════════════════════════════ */
function loadThemeCSS(themeName) {
  if (!themeName) return;
  fetch('/themes/website/' + themeName + '/theme.css?v=' + Date.now())
    .then(function(r) { return r.ok ? r.text() : ''; })
    .then(function(css) {
      var scoped = scopeCSS(css, '#canvasRoot');
      var el = document.getElementById('canvas-theme-css');
      if (el) el.textContent = scoped;
    })
    .catch(function(e) { console.warn('[canvas theme]', e); });
}

/* ═══════════════════════════════════════════
   THEME SECTIONS — plugin system
   Each theme can ship themes/website/<id>/sections.js
   which calls registerThemeSections({ cats, variants,
   preview, canvas, editPanel }).
═══════════════════════════════════════════ */
var THEME_SECTIONS = {
  cats:      [],
  variants:  {},
  preview:   {},   // type → fn(type, d, BG, TC, AC, variant) → html
  canvas:    {},   // type → fn(sec, d, helpers) → html
  editPanel: {},   // type → fn(d, helpers) → html  [legacy]
  fields:    {}    // type → [{key,type,label,ph,cols,colLabels,options,imageFields}]  [new API]
};

/* ── Schema field renderer (used by renderSectionEditPanel) ── */
function _renderSchemaFields(fields, d, sid, fI, fT, fC, fS, fImg, itemsEditor) {
  return fields.map(function(f) {
    var val = d[f.key];
    switch (f.type || 'text') {
      case 'textarea': return fT(f.key, f.label, val);
      case 'color':    return fC(f.key, f.label, val || f.default);
      case 'select':   return fS(f.key, f.label, val || f.default, f.options || {});
      case 'image':    return fImg(f.key, f.label, val, f.ph);
      case 'items':    return itemsEditor(f.key, d[f.key] || [], f.cols || [], f.colLabels || f.cols || [], f.imageFields || []);
      default:         return fI(f.key, f.label, val, f.ph);
    }
  }).join('');
}

/*
 * registerThemeSections(def)
 *
 * Supports two call signatures:
 *
 * ── NEW (developer-friendly) ─────────────────────────────────────
 * registerThemeSections({
 *   property_search: {
 *     cat:      { label, icon, sub, bg },
 *     variants: [{ label, icon, sub, data }],   // optional, defaults to one entry
 *     fields:   [{ key, type, label, ph, ... }], // schema → auto-renders edit panel
 *     render(d, esc) { return `<div>...</div>`; }  // one fn for both canvas + preview
 *   },
 *   property_listings: { ... }
 * })
 *
 * ── LEGACY ───────────────────────────────────────────────────────
 * registerThemeSections({ cats, variants, preview, canvas, editPanel })
 */
function registerThemeSections(def) {
  // Detect new format: keys are section type names (strings), values are section defs
  var isNewFormat = def && !def.cats && !def.canvas && !def.editPanel &&
    Object.keys(def).length > 0 &&
    typeof def[Object.keys(def)[0]] === 'object' &&
    (def[Object.keys(def)[0]].render || def[Object.keys(def)[0]].cat);

  if (isNewFormat) {
    THEME_SECTIONS.cats      = [];
    THEME_SECTIONS.variants  = {};
    THEME_SECTIONS.preview   = {};
    THEME_SECTIONS.canvas    = {};
    THEME_SECTIONS.editPanel = {};
    THEME_SECTIONS.fields    = {};

    Object.keys(def).forEach(function(type) {
      var sec = def[type];

      // cat
      if (sec.cat) {
        THEME_SECTIONS.cats.push(Object.assign({ id: type }, sec.cat));
      }

      // variants (default to one variant matching the cat)
      THEME_SECTIONS.variants[type] = sec.variants || [
        { type: type, label: (sec.cat && sec.cat.label) || type, icon: (sec.cat && sec.cat.icon) || '📄', sub: (sec.cat && sec.cat.sub) || '', data: {} }
      ];

      // render fn → canvas + preview
      if (sec.render) {
        var renderFn = sec.render;
        THEME_SECTIONS.canvas[type] = function(secObj, d, h) {
          return renderFn(d, h.escHtml);
        };
        THEME_SECTIONS.preview[type] = function(t, d, BG, TC, AC, variant) {
          return renderFn(d, escHtml);
        };
      }

      // fields → schema-based edit panel
      if (sec.fields) {
        THEME_SECTIONS.fields[type] = sec.fields;
      }

      // allow explicit editPanel override
      if (sec.editPanel) {
        THEME_SECTIONS.editPanel[type] = sec.editPanel;
      }
    });

  } else {
    // Legacy format
    THEME_SECTIONS.cats      = def.cats      || [];
    THEME_SECTIONS.variants  = def.variants  || {};
    THEME_SECTIONS.preview   = def.preview   || {};
    THEME_SECTIONS.canvas    = def.canvas    || {};
    THEME_SECTIONS.editPanel = def.editPanel || {};
    THEME_SECTIONS.fields    = def.fields    || {};
  }

  spRenderSidebar();
}

function loadThemeSections(themeName) {
  var old = document.getElementById('__theme-sections-js');
  if (old) old.remove();
  // Reset registry
  THEME_SECTIONS.cats      = [];
  THEME_SECTIONS.variants  = {};
  THEME_SECTIONS.preview   = {};
  THEME_SECTIONS.canvas    = {};
  THEME_SECTIONS.editPanel = {};
  THEME_SECTIONS.fields    = {};
  if (!themeName) return;
  var s = document.createElement('script');
  s.id  = '__theme-sections-js';
  s.src = '/themes/website/' + themeName + '/sections.js?v=' + Date.now();
  s.onerror = function() { /* theme has no custom sections — that's fine */ };
  document.head.appendChild(s);
}

function scopeCSS(css, prefix) {
  if (!css) return '';
  // Remove @import
  css = css.replace(/@import\s+[^;]+;/g, '');
  var result = [];
  var depth = 0;
  var buf = '';
  var i = 0;
  while (i < css.length) {
    // Skip /* comments */
    if (css[i] === '/' && css[i+1] === '*') {
      var end = css.indexOf('*/', i + 2);
      i = end >= 0 ? end + 2 : css.length;
      continue;
    }
    var c = css[i];
    if (c === '{') {
      if (depth === 0) {
        var sel = buf.trim();
        buf = '';
        // @keyframes / @font-face — copy as-is until matching }
        if (/^@(keyframes|font-face)/.test(sel)) {
          var atDepth = 1;
          var atBlock = sel + '{';
          i++;
          while (i < css.length && atDepth > 0) {
            if (css[i] === '{') atDepth++;
            else if (css[i] === '}') { atDepth--; if (atDepth === 0) { atBlock += '}'; i++; break; } }
            atBlock += css[i];
            i++;
          }
          result.push(atBlock);
          continue;
        }
        // @media — keep the at-rule, but scope inner selectors recursively (simple: just pass through)
        if (sel.startsWith('@')) {
          result.push(sel + '{');
        } else if (sel) {
          var prefixed = sel.split(',').map(function(s) {
            s = s.trim();
            if (!s) return '';
            if (s === ':root' || s === 'html') return prefix;
            if (s === 'body') return prefix;
            if (/^body[\s>+~]/.test(s)) return prefix + ' ' + s.slice(4).trim();
            if (/^html[\s>+~]/.test(s)) return prefix + ' ' + s.slice(4).trim();
            return prefix + ' ' + s;
          }).filter(Boolean).join(', ');
          result.push(prefixed + '{');
        } else {
          result.push('{');
        }
        depth++;
      } else {
        result.push(buf + '{');
        buf = '';
        depth++;
      }
    } else if (c === '}') {
      if (buf.trim()) result.push(buf);
      buf = '';
      result.push('}');
      depth = Math.max(0, depth - 1);
    } else {
      buf += c;
    }
    i++;
  }
  return result.join('');
}

/* ═══════════════════════════════════════════
   SECTION EDIT PANEL
═══════════════════════════════════════════ */
function renderSectionEditPanel(sid) {
  var sec = sections.find(function(s){ return s.id === sid; });
  if (!sec) return;
  var d = sec.data || {};
  var html = '';
  var type = sec.type;

  var fI = function(key, label, val, ph) {
    return '<div class="field-group"><label class="fl">' + label + '</label>' +
      '<input class="fi" value="' + escHtml(val || '') + '" placeholder="' + escHtml(ph || '') + '" ' +
      'oninput="sd(\'' + sid + '\',\'' + key + '\',this.value)"></div>';
  };
  var fT = function(key, label, val) {
    return '<div class="field-group"><label class="fl">' + label + '</label>' +
      '<textarea class="fi ft" oninput="sd(\'' + sid + '\',\'' + key + '\',this.value)">' + escHtml(val || '') + '</textarea></div>';
  };
  var fC = function(key, label, val) {
    val = val || '#6366f1';
    return '<div class="field-group"><label class="fl">' + label + '</label>' +
      '<div class="color-row">' +
      '<input type="color" class="fi-color" value="' + escHtml(val) + '" oninput="sd(\'' + sid + '\',\'' + key + '\',this.value)">' +
      '<input class="fi" value="' + escHtml(val) + '" style="flex:1;" oninput="sd(\'' + sid + '\',\'' + key + '\',this.value)">' +
      '</div></div>';
  };
  var fS = function(key, label, val, opts) {
    var s = '<div class="field-group"><label class="fl">' + label + '</label><select class="fi" onchange="sd(\'' + sid + '\',\'' + key + '\',this.value)">';
    Object.keys(opts).forEach(function(k) {
      s += '<option value="' + k + '"' + (val === k ? ' selected' : '') + '>' + opts[k] + '</option>';
    });
    return s + '</select></div>';
  };
  // Image field with media picker browse button
  var fImg = function(key, label, val, ph) {
    var inputId = 'fimg-' + sid + '-' + key;
    return '<div class="field-group"><label class="fl">' + label + '</label>' +
      '<div style="display:flex;gap:6px;">' +
      '<input id="' + inputId + '" class="fi" style="flex:1;" value="' + escHtml(val || '') + '" placeholder="' + escHtml(ph || 'https://…') + '" ' +
      'oninput="sd(\'' + sid + '\',\'' + key + '\',this.value)"> ' +
      '<button type="button" style="flex-shrink:0;padding:0 10px;border:1px solid #e5e7eb;border-radius:7px;background:#f9fafb;cursor:pointer;font-size:12px;color:#374151;" ' +
      'onclick="(function(){\
if(typeof MediaPicker===\'undefined\')return alert(\'Media library not loaded\');\
MediaPicker.open(function(f){\
  var el=document.getElementById(\'' + inputId + '\');\
  if(el){el.value=f.url;el.dispatchEvent(new Event(\'input\'));}\
},{type:\'image\'});\
})()">📁</button>' +
      '</div></div>';
  };

  function itemsEditor(key, items, fields, labels, imageFields) {
    imageFields = imageFields || [];
    var h = '<div class="field-group"><label class="fl">Items</label><div class="it-list" id="itl-' + sid + '-' + key + '">';
    items.forEach(function(item, i) {
      h += '<div class="it-card">';
      h += '<button class="it-del" onclick="removeItem(\'' + sid + '\',\'' + key + '\',' + i + ')">✕</button>';
      fields.forEach(function(f, fi) {
        var isImg = imageFields.indexOf(f) !== -1;
        if (isImg) {
          var imgId = 'itp-' + sid + '-' + key + '-' + i + '-' + f;
          h += '<div style="display:flex;align-items:center;gap:5px;margin-top:' + (fi === 0 ? '0' : '4px') + ';">';
          h += '<div style="width:32px;height:32px;flex-shrink:0;border-radius:4px;border:1px solid #e5e7eb;overflow:hidden;background:#f3f4f6;display:flex;align-items:center;justify-content:center;font-size:16px;">' +
               (item[f] ? '<img src="' + escHtml(item[f]) + '" style="width:100%;height:100%;object-fit:cover;" onerror="this.parentElement.textContent=\'🖼\'">' : '🖼') + '</div>';
          h += '<input id="' + imgId + '" class="fi" style="flex:1;font-size:11px;" placeholder="' + escHtml(labels[fi]) + '" value="' + escHtml(item[f] || '') + '" ' +
               'oninput="sdi(\'' + sid + '\',\'' + key + '\',' + i + ',\'' + f + '\',this.value)">';
          h += '<button type="button" title="Browse media library" style="flex-shrink:0;padding:0 7px;height:28px;border:1px solid #e5e7eb;border-radius:6px;background:#f9fafb;cursor:pointer;font-size:12px;" ' +
               'onclick="(function(){if(typeof MediaPicker===\'undefined\')return;MediaPicker.open(function(file){' +
               'var el=document.getElementById(\'' + imgId + '\');if(el){el.value=file.url;el.dispatchEvent(new Event(\'input\'));}' +
               '},{type:\'image\'});})()">📁</button>';
          h += '</div>';
        } else {
          h += '<input class="fi" style="margin-top:' + (fi === 0 ? '0' : '4px') + ';" placeholder="' + escHtml(labels[fi]) + '" value="' + escHtml(item[f] || '') + '" oninput="sdi(\'' + sid + '\',\'' + key + '\',' + i + ',\'' + f + '\',this.value)">';
        }
      });
      h += '</div>';
    });
    h += '</div><button class="add-it-btn" onclick="addItem(\'' + sid + '\',\'' + key + '\',\'' + fields.join(',') + '\')">+ Add item</button></div>';
    return h;
  }

  // Theme-specific section edit panels — schema-based (new API)
  if (THEME_SECTIONS.fields[type]) {
    html = _renderSchemaFields(THEME_SECTIONS.fields[type], d, sid, fI, fT, fC, fS, fImg, itemsEditor);
    document.getElementById('sec-edit-fields').innerHTML = html;
    return;
  }
  // Theme-specific section edit panels — legacy explicit fn
  if (THEME_SECTIONS.editPanel[type]) {
    html = THEME_SECTIONS.editPanel[type](d, { fI: fI, fT: fT, fC: fC, fS: fS, fImg: fImg, itemsEditor: itemsEditor, sid: sid });
    document.getElementById('sec-edit-fields').innerHTML = html;
    return;
  }

  switch (type) {
    case 'hero':
      html += fS('layout', 'Layout', d.layout || 'centered', { 'centered':'Centered + dashboard visual', 'split':'Split — text & image side by side' });
      html += '<div class="ep-section-label">Content</div>';
      html += fI('headline', 'Headline', d.headline, 'e.g. Welcome to Our Website');
      html += fT('subheadline', 'Subheadline', d.subheadline);
      html += fI('cta_label', 'Primary Button', d.cta_label, 'e.g. Get Started');
      html += fI('cta_url', 'Primary Button URL', d.cta_url, '#contact');
      html += fI('cta2_label', 'Secondary Button', d.cta2_label, 'e.g. Learn More');
      html += fI('cta2_url', 'Secondary Button URL', d.cta2_url, '#about');
      html += '<div class="ep-section-label">Image / Visual</div>';
      html += fImg('hero_image', 'Hero Image', d.hero_image, 'Upload a photo — replaces illustration');
      html += '<div class="ep-section-label">Floating Stat Cards</div>';
      html += fI('stat1_num', 'Stat 1 — Number', d.stat1_num, 'e.g. 100M+');
      html += fI('stat1_lbl', 'Stat 1 — Label', d.stat1_lbl, 'e.g. Monthly Users');
      html += fI('stat1_pct', 'Stat 1 — Change', d.stat1_pct, 'e.g. ↑ 24% this month');
      html += fI('stat2_val', 'Stat 2 — Value', d.stat2_val, 'e.g. $48,294');
      html += fI('stat2_lbl', 'Stat 2 — Label', d.stat2_lbl, 'e.g. Revenue');
      html += '<div class="ep-section-label">Background &amp; Colors</div>';
      html += fImg('bg_image', 'Background Image', d.bg_image, 'Leave blank to use color');
      html += fC('bg_color', 'Background Color', d.bg_color || '#6366f1');
      html += fC('text_color', 'Text Color', d.text_color || '#ffffff');
      break;
    case 'about':
      html += fI('heading', 'Section Heading', d.heading);
      html += fT('text', 'Content', d.text);
      html += fImg('image', 'Image URL', d.image, 'https://…');
      html += fS('layout', 'Layout', d.layout, { 'image_right':'Text left, Image right', 'image_left':'Image left, Text right', 'full_text':'Text only' });
      break;
    case 'services':
      html += fI('heading', 'Section Heading', d.heading);
      html += itemsEditor('items', d.items || [], ['icon','title','desc'], ['Icon/Emoji','Title','Description']);
      break;
    case 'gallery':
      html += fI('heading', 'Section Heading', d.heading);
      html += fS('columns', 'Columns', d.columns || 'auto', {'auto':'Auto (Responsive)','2':'2 Columns','3':'3 Columns','4':'4 Columns','5':'5 Columns'});
      html += fS('aspect', 'Aspect Ratio', d.aspect || '4/3', {'4/3':'Landscape 4:3','1/1':'Square 1:1','16/9':'Widescreen 16:9','3/2':'Photo 3:2','3/4':'Portrait 3:4'});
      html += galImgEditor(sid, d.images || []);
      break;
    case 'testimonials':
      html += fI('heading', 'Section Heading', d.heading);
      html += itemsEditor('items', d.items || [], ['name','role','quote'], ['Name','Role / Company','Quote']);
      break;
    case 'team':
      html += fI('heading', 'Section Heading', d.heading);
      html += itemsEditor('items', d.items || [], ['image','name','role'], ['Photo URL','Name','Role'], ['image']);
      break;
    case 'faq':
      html += fI('heading', 'Section Heading', d.heading);
      html += itemsEditor('items', d.items || [], ['q','a'], ['Question','Answer']);
      break;
    case 'cta':
      html += fI('heading', 'Headline', d.heading);
      html += fI('subheading', 'Subheading', d.subheading);
      html += fI('cta_label', 'Button Label', d.cta_label);
      html += fI('cta_url', 'Button URL', d.cta_url, '#contact');
      html += fC('bg_color', 'Background Color', d.bg_color || '#111827');
      html += fC('text_color', 'Text Color', d.text_color || '#ffffff');
      break;
    case 'contact':
      html += fI('heading', 'Section Heading', d.heading);
      html += fI('email', 'Email', d.email, 'contact@example.com');
      html += fI('phone', 'Phone', d.phone, '+91 ...');
      html += fI('address', 'Address', d.address, 'Street, City');
      break;

    case 'pricing':
      html += fI('heading', 'Section Heading', d.heading);
      html += fI('subtitle', 'Subtitle', d.subtitle);
      (d.plans || []).forEach(function(plan, i) {
        html += '<div class="it-card" style="margin-bottom:8px;">';
        html += '<button class="it-del" onclick="removeItem(\'' + sid + '\',\'plans\',' + i + ')">✕</button>';
        html += '<input class="fi" placeholder="Plan Name" value="' + escHtml(plan.name || '') + '" oninput="sdi(\'' + sid + '\',\'plans\',' + i + ',\'name\',this.value)">';
        html += '<input class="fi" placeholder="Price (e.g. ₹999/mo)" value="' + escHtml(plan.price || '') + '" oninput="sdi(\'' + sid + '\',\'plans\',' + i + ',\'price\',this.value)" style="margin-top:4px;">';
        html += '<textarea class="fi ft" placeholder="Features (one per line)" style="margin-top:4px;" oninput="sdi(\'' + sid + '\',\'plans\',' + i + ',\'features\',this.value)">' + escHtml(plan.features || '') + '</textarea>';
        html += '<input class="fi" placeholder="Button Text" value="' + escHtml(plan.cta || '') + '" oninput="sdi(\'' + sid + '\',\'plans\',' + i + ',\'cta\',this.value)" style="margin-top:4px;">';
        html += '<input class="fi" placeholder="Button Link" value="' + escHtml(plan.link || '') + '" oninput="sdi(\'' + sid + '\',\'plans\',' + i + ',\'link\',this.value)" style="margin-top:4px;">';
        html += '<input class="fi" placeholder="Highlighted? yes / no" value="' + escHtml(plan.featured || 'no') + '" oninput="sdi(\'' + sid + '\',\'plans\',' + i + ',\'featured\',this.value)" style="margin-top:4px;">';
        html += '</div>';
      });
      html += '<button class="add-it-btn" onclick="addPlan(\'' + sid + '\')">+ Add plan</button>';
      break;

    case 'stats':
      html += fI('heading', 'Section Heading', d.heading);
      html += itemsEditor('items', d.items || [], ['emoji','number','label'], ['Icon (emoji)','Number / Value','Label']);
      break;

    case 'rich_text':
      html += fI('title', 'Title (optional)', d.title);
      html += fT('content', 'Content', d.content);
      html += fS('align', 'Alignment', d.align || 'left', {'left':'Left','center':'Center'});
      break;

    case 'columns':
      html += fI('heading', 'Section Heading (optional)', d.heading);
      html += fS('cols', 'Number of Columns', d.cols || '3', {'2':'2 columns','3':'3 columns'});
      html += fS('bg', 'Background', d.bg || 'white', {'white':'White','light':'Light gray','accent':'Accent color'});
      html += itemsEditor('items', d.items || [], ['emoji','heading','text','btn_text','btn_link'], ['Icon (emoji)','Heading','Text','Button Text (optional)','Button Link']);
      break;

    case 'video':
      html += fI('heading', 'Section Heading (optional)', d.heading);
      html += '<div class="field-group"><label class="fl">YouTube / Vimeo URL</label>' +
        '<input class="fi" value="' + escHtml(d.url || '') + '" placeholder="https://www.youtube.com/watch?v=..." ' +
        'oninput="setVideoUrl(\'' + sid + '\',this.value)"></div>';
      html += fI('caption', 'Caption (optional)', d.caption);
      break;

    case 'logobar':
      html += fI('heading', 'Section Heading (optional)', d.heading);
      html += itemsEditor('logos', d.logos || [], ['url','alt'], ['Logo Image URL','Company Name / Alt text'], ['url']);
      break;

    case 'timeline':
      html += fI('heading', 'Section Heading', d.heading);
      html += itemsEditor('items', d.items || [], ['step','title','desc'], ['Step Number / Year','Title','Description']);
      break;

    case 'newsletter':
      html += fI('heading', 'Heading', d.heading);
      html += fI('subtext', 'Subtext', d.subtext);
      html += fI('placeholder', 'Input Placeholder', d.placeholder, 'Enter your email');
      html += fI('cta', 'Button Text', d.cta, 'Subscribe');
      break;

    // ── Real Estate / Ecom ───────────────────────────────────────────────────
    // (Handled by theme's sections.js via THEME_SECTIONS.editPanel)
    case 'property_search':
    case 'property_listings':
    case 'property_detail':
    case 'agents':
    case 'blog_posts':
    case 'category_banner':
    case 'product_grid':
    case 'product_detail':
    case 'cart':
    case 'checkout':
      html += '<div style="padding:20px;color:#9ca3af;font-size:13px;text-align:center;">Theme section — fields load when theme is active.</div>';
      break;
  }

  document.getElementById('sec-edit-fields').innerHTML = html;
}

/* ═══════════════════════════════════════════
   DYNAMIC SECTION ITEM MANAGER
   (Products / Properties inline in edit panel)
═══════════════════════════════════════════ */

/* Which section types get the inline item manager, and how */
var DYNAMIC_ITEM_SECTIONS = {
  product_grid:      { label: 'Products',   itemLabel: 'Product',  productType: 'physical' },
  property_listings: { label: 'Properties', itemLabel: 'Property', productType: 'property' }
};

/* ═══════════════════════════════════════════
   CATALOG SIDEBAR PANEL
   Theme-aware product / property manager.
   Call setCatalogConfig() from a custom sections.js
   to override the built-in CATALOG_THEME_MAP.
═══════════════════════════════════════════ */
var CATALOG_THEME_MAP = {
  'ecom-fresh': { label: 'Products',   itemLabel: 'Product',  productType: 'physical', icon: '🛍️' },
  'ecom-luxe':  { label: 'Products',   itemLabel: 'Product',  productType: 'physical', icon: '🛍️' },
  'ecom-spark': { label: 'Products',   itemLabel: 'Product',  productType: 'physical', icon: '🛍️' },
  'realestate': { label: 'Properties', itemLabel: 'Property', productType: 'property', icon: '🏠' }
};
var CATALOG_CONFIG = null;
var catActiveType  = 'physical'; // currently selected type tab in catalog panel

/* Type definitions for catalog tab switcher */
var CATALOG_TYPES = {
  physical: { label: 'Product',  plural: 'Products',   icon: '📦' },
  property: { label: 'Property', plural: 'Properties', icon: '🏠' },
  job:      { label: 'Job',      plural: 'Jobs',        icon: '💼' },
  digital:  { label: 'Digital',  plural: 'Digital',     icon: '💾' },
  service:  { label: 'Service',  plural: 'Services',    icon: '🛠'  }
};

/* Switch catalog panel to a different item type */
function catSetType(ptype, label, icon) {
  catActiveType = ptype;
  var def = CATALOG_TYPES[ptype] || { label: label, plural: label + 's', icon: icon || '📦' };
  /* Update DYNAMIC_ITEM_SECTIONS so _openItemModal picks up the right label/type */
  DYNAMIC_ITEM_SECTIONS['catalog'] = { label: def.plural, itemLabel: def.label, productType: ptype };
  /* Update Add button */
  var addBtn = document.getElementById('cat-add-btn');
  if (addBtn) addBtn.textContent = '+ Add ' + def.label;
  /* Highlight active tab */
  document.querySelectorAll('.cat-type-btn').forEach(function(b) {
    var isActive = b.dataset.ptype === ptype;
    b.style.borderColor  = isActive ? '#6366f1' : '#e5e7eb';
    b.style.background   = isActive ? '#eef2ff' : '#fff';
    b.style.color        = isActive ? '#4338ca' : '#6b7280';
    b.style.fontWeight   = isActive ? '600' : '500';
  });
  /* Reload list */
  catLoadItems();
}

/* Custom themes can call this from sections.js to set the default active tab:
   setCatalogConfig({ label:'Travel Packages', itemLabel:'Package', productType:'travel', icon:'✈️' }) */
function setCatalogConfig(cfg) {
  CATALOG_CONFIG = cfg;
  _applyCatalogConfig();
}

function _initCatalogConfig(themeId) {
  CATALOG_CONFIG = CATALOG_THEME_MAP[themeId !== undefined ? themeId : SITE_THEME] || null;
  _applyCatalogConfig();
}

function _applyCatalogConfig() {
  /* Rail button is always visible — catalog panel is available on all themes */
  var iconEl  = document.getElementById('rb-catalog-icon');
  var labelEl = document.getElementById('rb-catalog-label');
  if (CATALOG_CONFIG) {
    if (iconEl)  iconEl.textContent  = CATALOG_CONFIG.icon  || '🗂️';
    if (labelEl) labelEl.textContent = CATALOG_CONFIG.label || 'Catalog';
    /* Set default active tab based on theme */
    catActiveType = CATALOG_CONFIG.productType || 'physical';
  } else {
    if (iconEl)  iconEl.textContent  = '🗂️';
    if (labelEl) labelEl.textContent = 'Catalog';
    catActiveType = 'physical';
  }
  var def = CATALOG_TYPES[catActiveType] || { label: 'Item', plural: 'Items', icon: '📦' };
  DYNAMIC_ITEM_SECTIONS['catalog'] = { label: def.plural, itemLabel: def.label, productType: catActiveType };
  PANEL_TITLES['catalog'] = CATALOG_CONFIG ? CATALOG_CONFIG.label : 'Catalog';
}

/* Runs when catalog panel is opened — syncs active tab, loads collections + items */
function catLoadPanel() {
  /* Highlight correct tab and update add button */
  catSetType(catActiveType,
    (CATALOG_TYPES[catActiveType] || {}).label || 'Item',
    (CATALOG_TYPES[catActiveType] || {}).icon  || '📦');
  /* Populate collections dropdown */
  fetch('/dashboard/products/collections/list-json', { credentials: 'same-origin' })
    .then(function(r) { return r.json(); })
    .then(function(res) {
      var sel = document.getElementById('cat-collection-filter');
      if (!sel) return;
      var cols = res.collections || [];
      sel.innerHTML = '<option value="">All</option>' +
        cols.map(function(c) {
          return '<option value="' + escHtml(c.name) + '">' + escHtml(c.name) + '</option>';
        }).join('');
    })
    .catch(function(){});
  /* catSetType already calls catLoadItems */
}

/* Fetch items and render into #cat-list */
function catLoadItems() {
  var search = ((document.getElementById('cat-search')            || {}).value || '').toLowerCase();
  var coll   =  (document.getElementById('cat-collection-filter') || {}).value || '';
  var listEl = document.getElementById('cat-list');
  if (!listEl) return;
  listEl.innerHTML = '<div style="padding:10px 0;color:#9ca3af;font-size:12px;">Loading…</div>';

  var def = CATALOG_TYPES[catActiveType] || { label: 'Item', plural: 'Items', icon: '📦' };

  var url = '/dashboard/products/list-json?site_id=' + encodeURIComponent(WEBSITE_ID) +
            '&type=' + encodeURIComponent(catActiveType) +
            (coll ? '&collection=' + encodeURIComponent(coll) : '');

  fetch(url, { credentials: 'same-origin' })
    .then(function(r) { return r.json(); })
    .then(function(res) {
      var el = document.getElementById('cat-list');
      if (!el) return;
      if (!res.ok) { el.innerHTML = '<p style="color:#ef4444;font-size:12px;">Error loading.</p>'; return; }
      var items = res.products || [];
      if (search) {
        items = items.filter(function(p) {
          return (p.name || '').toLowerCase().indexOf(search) !== -1 ||
                 (p.description || '').toLowerCase().indexOf(search) !== -1;
        });
      }
      if (!items.length) {
        el.innerHTML =
          '<div style="padding:24px 0;text-align:center;color:#9ca3af;font-size:12px;">' +
          '<div style="font-size:28px;margin-bottom:8px;">' + def.icon + '</div>' +
          'No ' + def.plural.toLowerCase() + ' yet.<br>Click <b>+ Add</b> to create one.</div>';
        return;
      }
      el.innerHTML = items.map(function(p) {
        var thumb = p.image_url
          ? '<img src="' + escHtml(p.image_url) + '" style="width:40px;height:40px;object-fit:cover;border-radius:6px;flex-shrink:0;">'
          : '<div style="width:40px;height:40px;border-radius:6px;background:#f3f4f6;flex-shrink:0;display:flex;align-items:center;justify-content:center;font-size:18px;">' +
            def.icon + '</div>';
        var priceStr = p.price ? (p.currency || '₹') + p.price : '';
        var catStr   = p.collection ? ' · ' + p.collection : '';
        var stockBadge = (p.in_stock == 0)
          ? '<span style="font-size:10px;background:#fef2f2;color:#ef4444;padding:1px 5px;border-radius:4px;margin-left:4px;">Out of stock</span>'
          : '';
        var encoded = btoa(unescape(encodeURIComponent(JSON.stringify(p))));
        return '<div style="display:flex;align-items:center;gap:8px;padding:8px 0;border-bottom:1px solid #f3f4f6;">' +
          thumb +
          '<div style="flex:1;min-width:0;">' +
            '<div style="font-size:12px;font-weight:600;color:#111827;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">' +
              escHtml(p.name || '') + stockBadge +
            '</div>' +
            '<div style="font-size:11px;color:#6b7280;">' + escHtml(priceStr + catStr) + '</div>' +
          '</div>' +
          '<div style="display:flex;gap:3px;flex-shrink:0;">' +
            '<button onclick="catEditEncoded(\'' + encoded + '\')" ' +
              'style="padding:3px 7px;font-size:11px;border:1px solid #d1d5db;border-radius:5px;background:#fff;cursor:pointer;">Edit</button>' +
            '<button onclick="catDeleteItem(' + p.id + ')" ' +
              'style="padding:3px 7px;font-size:11px;border:1px solid #fca5a5;border-radius:5px;background:#fff;color:#ef4444;cursor:pointer;">✕</button>' +
          '</div>' +
        '</div>';
      }).join('');
    })
    .catch(function() {
      var el = document.getElementById('cat-list');
      if (el) el.innerHTML = '<p style="color:#ef4444;font-size:12px;">Error loading.</p>';
    });
}

function catFilterList() { catLoadItems(); }

function catOpenNewItem() {
  _openItemModal('_catalog_', 'catalog', null);
}

function catEditEncoded(encoded) {
  try {
    var item = JSON.parse(decodeURIComponent(escape(atob(encoded))));
    _openItemModal('_catalog_', 'catalog', item);
  } catch(e) { _openItemModal('_catalog_', 'catalog', null); }
}

function catDeleteItem(id) {
  if (!confirm('Delete this item? This cannot be undone.')) return;
  fetch('/dashboard/products/delete', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'same-origin',
    body: JSON.stringify({ id: id })
  })
  .then(function(r) { return r.json(); })
  .then(function(res) { if (res.ok) catLoadItems(); });
}

/* Appends the manage-items strip below the schema fields */
function _appendDynamicManager(sid, type, d) {
  var cfg = DYNAMIC_ITEM_SECTIONS[type];
  if (!cfg) return;
  var container = document.getElementById('sec-edit-fields');
  if (!container) return;

  var wrap = document.createElement('div');
  wrap.id  = 'dim-manager';
  wrap.innerHTML =
    '<div style="margin-top:16px;padding-top:14px;border-top:1.5px solid #e5e7eb;">' +
      '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;">' +
        '<span style="font-size:11px;font-weight:700;color:#374151;letter-spacing:0.6px;text-transform:uppercase;">' +
          '📦 Manage ' + cfg.label +
        '</span>' +
        '<button onclick="_openItemModal(\'' + sid + '\',\'' + type + '\',null)" ' +
          'style="background:#6366f1;color:#fff;border:none;border-radius:6px;' +
          'padding:5px 12px;font-size:12px;font-weight:600;cursor:pointer;">' +
          '+ Add ' + cfg.itemLabel +
        '</button>' +
      '</div>' +
      '<div id="dim-list" style="font-size:12px;color:#9ca3af;padding:4px 0;">Loading…</div>' +
    '</div>';
  container.appendChild(wrap);

  /* Load items scoped to this site + category filter */
  _loadItemsList(sid, type, (d && d.category) || '');
}

/* Fetch product list and render into #dim-list */
function _loadItemsList(sid, type, categoryFilter) {
  var cfg = DYNAMIC_ITEM_SECTIONS[type];
  if (!cfg) return;
  var url = '/dashboard/products/list-json?site_id=' + encodeURIComponent(WEBSITE_ID) +
            '&type=' + encodeURIComponent(cfg.productType) +
            (categoryFilter ? '&collection=' + encodeURIComponent(categoryFilter) : '');

  fetch(url, { credentials: 'same-origin' })
    .then(function(r) { return r.json(); })
    .then(function(res) {
      var list = document.getElementById('dim-list');
      if (!list) return;
      if (!res.ok) { list.textContent = 'Could not load items.'; return; }
      var items = res.products || [];
      if (!items.length) {
        list.innerHTML =
          '<div style="padding:10px 0;color:#9ca3af;font-size:12px;">' +
          'No ' + cfg.label.toLowerCase() + ' yet. Click "+ Add" to create the first one.' +
          '</div>';
        return;
      }
      list.innerHTML = items.map(function(p) {
        var thumb = p.image_url
          ? '<img src="' + escHtml(p.image_url) + '" style="width:34px;height:34px;object-fit:cover;border-radius:5px;flex-shrink:0;">'
          : '<div style="width:34px;height:34px;border-radius:5px;background:#f3f4f6;flex-shrink:0;display:flex;align-items:center;justify-content:center;font-size:16px;">📦</div>';
        var priceStr = p.price ? (p.currency || '₹') + ' ' + p.price : '';
        var catStr   = p.collection ? ' · ' + p.collection : '';
        /* Encode item as base64 to avoid attribute escaping issues */
        var encoded  = btoa(unescape(encodeURIComponent(JSON.stringify(p))));
        return '<div style="display:flex;align-items:center;gap:8px;padding:6px 0;border-bottom:1px solid #f3f4f6;">' +
          thumb +
          '<div style="flex:1;min-width:0;">' +
            '<div style="font-size:12px;font-weight:600;color:#111827;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">' +
              escHtml(p.name || '') +
            '</div>' +
            '<div style="font-size:11px;color:#6b7280;">' + escHtml(priceStr + catStr) + '</div>' +
          '</div>' +
          '<button onclick="_openItemModalEncoded(\'' + sid + '\',\'' + type + '\',\'' + encoded + '\')" ' +
            'style="padding:3px 8px;font-size:11px;border:1px solid #d1d5db;border-radius:5px;background:#fff;cursor:pointer;white-space:nowrap;">Edit</button> ' +
          '<button onclick="_deleteItem(' + p.id + ',\'' + sid + '\',\'' + type + '\')" ' +
            'style="padding:3px 8px;font-size:11px;border:1px solid #fca5a5;border-radius:5px;background:#fff;color:#ef4444;cursor:pointer;">✕</button>' +
        '</div>';
      }).join('');
    })
    .catch(function() {
      var list = document.getElementById('dim-list');
      if (list) list.textContent = 'Error loading items.';
    });
}

/* Helper — decodes base64 item before opening modal (avoids HTML-attr escaping problems) */
function _openItemModalEncoded(sid, type, encoded) {
  try {
    var item = JSON.parse(decodeURIComponent(escape(atob(encoded))));
    _openItemModal(sid, type, item);
  } catch(e) { _openItemModal(sid, type, null); }
}

/* Delete a product and refresh the list */
function _deleteItem(id, sid, type) {
  if (!confirm('Delete this item? This cannot be undone.')) return;
  fetch('/dashboard/products/delete', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'same-origin',
    body: JSON.stringify({ id: id })
  })
  .then(function(r) { return r.json(); })
  .then(function(res) {
    if (res.ok) {
      var sec = sections.find(function(s){ return s.id === sid; });
      _loadItemsList(sid, type, (sec && sec.data && sec.data.category) || '');
      /* Also refresh catalog sidebar if it's visible */
      if (document.getElementById('cat-list')) catLoadItems();
    }
  });
}

/* Live-update the image preview inside the item modal */
function _dimUpdateImgPreview(val) {
  var p = document.getElementById('dim-img-preview');
  if (!p) return;
  if (val) {
    if (p.tagName === 'IMG') {
      p.src = val;
      p.style.display = 'block';
    } else {
      p.outerHTML = '<img id="dim-img-preview" src="' + escHtml(val) + '" ' +
        'style="width:100%;max-height:140px;object-fit:cover;border-radius:7px;margin-bottom:8px;display:block;" ' +
        'onerror="this.style.display=\'none\'">';
    }
  } else {
    if (p.tagName === 'IMG') {
      p.outerHTML = '<div id="dim-img-preview" style="width:100%;height:72px;border-radius:7px;background:#f3f4f6;' +
        'display:flex;align-items:center;justify-content:center;font-size:28px;margin-bottom:8px;color:#d1d5db;">🖼️</div>';
    }
  }
}

/* Open MediaPicker for the item modal image field */
function _dimBrowseImage() {
  if (typeof MediaPicker === 'undefined') { alert('Media library not loaded'); return; }
  MediaPicker.open(function(f) {
    var el = document.getElementById('dim-f-image_url');
    if (el) { el.value = f.url; el.dispatchEvent(new Event('input')); }
  }, { type: 'image' });
}

/* Open the add / edit modal */
function _openItemModal(sid, type, item) {
  var cfg    = DYNAMIC_ITEM_SECTIONS[type] || { itemLabel: 'Item', productType: 'physical' };
  var isEdit = !!(item && item.id);
  var sec    = sections.find(function(s){ return s.id === sid; });
  var cat    = (sec && sec.data && sec.data.category) || '';

  /* Remove any existing modal */
  var old = document.getElementById('dim-modal-overlay');
  if (old) old.remove();

  var rows = [
    { key:'name',          label:'Name *',                 ph:'e.g. 3 BHK Apartment',    ta:false },
    { key:'price',         label:'Price',                  ph:'e.g. 2500000',             ta:false },
    { key:'compare_price', label:'Compare / Strike Price', ph:'e.g. 3000000',             ta:false },
    { key:'collection',    label:'Category / Collection',  ph:cat || 'e.g. apartment',    ta:false },
    { key:'description',   label:'Description',            ph:'',                         ta:true  }
  ];

  var imgVal = isEdit ? (item.image_url || '') : '';

  var fieldsHtml = rows.map(function(f) {
    var val = isEdit ? (item[f.key] || '') : (f.key === 'collection' ? cat : '');
    var inp = f.ta
      ? '<textarea id="dim-f-' + f.key + '" placeholder="' + escHtml(f.ph) + '" ' +
        'style="width:100%;border:1.5px solid #e5e7eb;border-radius:7px;padding:8px 10px;' +
        'font-size:13px;resize:vertical;min-height:70px;box-sizing:border-box;font-family:inherit;">' +
        escHtml(val) + '</textarea>'
      : '<input id="dim-f-' + f.key + '" value="' + escHtml(val) + '" placeholder="' + escHtml(f.ph) + '" ' +
        'style="width:100%;border:1.5px solid #e5e7eb;border-radius:7px;padding:8px 10px;' +
        'font-size:13px;box-sizing:border-box;">';
    return '<div style="margin-bottom:10px;">' +
      '<label style="display:block;font-size:11px;font-weight:600;color:#374151;margin-bottom:4px;">' + f.label + '</label>' +
      inp + '</div>';
  }).join('');

  /* Image field — media picker + live preview */
  var imgFieldHtml =
    '<div style="margin-bottom:10px;">' +
      '<label style="display:block;font-size:11px;font-weight:600;color:#374151;margin-bottom:6px;">Image</label>' +
      (imgVal
        ? '<img id="dim-img-preview" src="' + escHtml(imgVal) + '" ' +
          'style="width:100%;max-height:140px;object-fit:cover;border-radius:7px;margin-bottom:8px;display:block;" ' +
          'onerror="this.style.display=\'none\'">'
        : '<div id="dim-img-preview" style="width:100%;height:72px;border-radius:7px;background:#f3f4f6;' +
          'display:flex;align-items:center;justify-content:center;font-size:28px;margin-bottom:8px;color:#d1d5db;">🖼️</div>'
      ) +
      '<div style="display:flex;gap:6px;">' +
        '<input id="dim-f-image_url" value="' + escHtml(imgVal) + '" placeholder="https://…" ' +
          'oninput="_dimUpdateImgPreview(this.value)" ' +
          'style="flex:1;border:1.5px solid #e5e7eb;border-radius:7px;padding:8px 10px;font-size:12px;box-sizing:border-box;min-width:0;">' +
        '<button type="button" onclick="_dimBrowseImage()" ' +
          'style="flex-shrink:0;padding:0 11px;border:1.5px solid #e5e7eb;border-radius:7px;' +
          'background:#f9fafb;cursor:pointer;font-size:12px;color:#374151;font-weight:500;white-space:nowrap;">📁 Browse</button>' +
      '</div>' +
    '</div>';
  fieldsHtml += imgFieldHtml;

  var overlay = document.createElement('div');
  overlay.id  = 'dim-modal-overlay';
  overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.45);z-index:99999;display:flex;align-items:center;justify-content:center;';
  overlay.innerHTML =
    '<div style="background:#fff;border-radius:14px;width:480px;max-width:calc(100vw - 40px);' +
    'max-height:88vh;overflow-y:auto;box-shadow:0 24px 64px rgba(0,0,0,0.28);">' +
      '<div style="display:flex;align-items:center;justify-content:space-between;' +
        'padding:18px 20px 14px;border-bottom:1px solid #f3f4f6;position:sticky;top:0;background:#fff;">' +
        '<span style="font-size:15px;font-weight:700;color:#111827;">' +
          (isEdit ? 'Edit' : 'Add') + ' ' + cfg.itemLabel +
        '</span>' +
        '<button onclick="document.getElementById(\'dim-modal-overlay\').remove()" ' +
          'style="background:none;border:none;font-size:22px;color:#6b7280;cursor:pointer;line-height:1;">×</button>' +
      '</div>' +
      '<div style="padding:18px 20px;">' +
        '<input type="hidden" id="dim-f-id" value="' + (isEdit ? item.id : '') + '">' +
        '<input type="hidden" id="dim-f-ptype" value="' + escHtml(cfg.productType) + '">' +
        fieldsHtml +
        '<div id="dim-modal-err" style="color:#ef4444;font-size:12px;min-height:16px;margin-bottom:10px;"></div>' +
        '<div style="display:flex;gap:8px;justify-content:flex-end;">' +
          '<button onclick="document.getElementById(\'dim-modal-overlay\').remove()" ' +
            'style="padding:9px 18px;font-size:13px;border:1.5px solid #e5e7eb;border-radius:8px;' +
            'background:#fff;cursor:pointer;font-weight:500;">Cancel</button>' +
          '<button id="dim-save-btn" onclick="_saveItemModal(\'' + sid + '\',\'' + type + '\')" ' +
            'style="padding:9px 18px;font-size:13px;background:#6366f1;color:#fff;border:none;' +
            'border-radius:8px;font-weight:600;cursor:pointer;">' +
            (isEdit ? 'Save Changes' : 'Create ' + cfg.itemLabel) +
          '</button>' +
        '</div>' +
      '</div>' +
    '</div>';

  overlay.addEventListener('click', function(e) { if (e.target === overlay) overlay.remove(); });
  document.body.appendChild(overlay);

  var nameEl = document.getElementById('dim-f-name');
  if (nameEl) setTimeout(function(){ nameEl.focus(); }, 60);
}

/* Save from modal (create or update) */
function _saveItemModal(sid, type) {
  var id       = (document.getElementById('dim-f-id')           || {}).value || '';
  var prodType = (document.getElementById('dim-f-ptype')        || {}).value || 'physical';
  var name     = ((document.getElementById('dim-f-name')        || {}).value || '').trim();
  if (!name) {
    var errEl = document.getElementById('dim-modal-err');
    if (errEl) errEl.textContent = 'Name is required.';
    return;
  }
  var body = {
    site_id:       WEBSITE_ID,
    type:          prodType,
    name:          name,
    price:         (document.getElementById('dim-f-price')         || {}).value || '',
    compare_price: (document.getElementById('dim-f-compare_price') || {}).value || '',
    collection:    (document.getElementById('dim-f-collection')    || {}).value || '',
    description:   (document.getElementById('dim-f-description')   || {}).value || '',
    image_url:     (document.getElementById('dim-f-image_url')     || {}).value || '',
    currency:      'INR',
    in_stock:      1,
    status:        1
  };
  if (id) body.id = id;
  var url = id ? '/dashboard/products/update' : '/dashboard/products/create';

  var btn = document.getElementById('dim-save-btn');
  if (btn) { btn.textContent = 'Saving…'; btn.disabled = true; }

  fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'same-origin',
    body: JSON.stringify(body)
  })
  .then(function(r) { return r.json(); })
  .then(function(res) {
    if (!res.ok) {
      var errEl = document.getElementById('dim-modal-err');
      if (errEl) errEl.textContent = res.error || 'Could not save.';
      if (btn) { btn.textContent = id ? 'Save Changes' : 'Create'; btn.disabled = false; }
      return;
    }
    var overlay = document.getElementById('dim-modal-overlay');
    if (overlay) overlay.remove();
    /* Refresh the appropriate list */
    if (type === 'catalog') {
      catLoadItems();
    } else {
      var sec = sections.find(function(s){ return s.id === sid; });
      _loadItemsList(sid, type, (sec && sec.data && sec.data.category) || '');
      /* Also refresh catalog sidebar if it's visible */
      if (document.getElementById('cat-list')) catLoadItems();
    }
  })
  .catch(function() {
    var errEl = document.getElementById('dim-modal-err');
    if (errEl) errEl.textContent = 'Network error — please try again.';
    if (btn) { btn.textContent = id ? 'Save Changes' : 'Create'; btn.disabled = false; }
  });
}

/* Data setters (from edit panel — only update canvas, NOT the panel) */
function sd(sid, key, val) {
  var sec = sections.find(function(s){ return s.id === sid; });
  if (!sec) return;
  if (!sec.data) sec.data = {};
  sec.data[key] = val;
  renderCanvas();
  // Restore selection highlight after canvas re-render
  if (selectedSecId) {
    var wrap = document.querySelector('.sec-wrap[data-sid="' + selectedSecId + '"]');
    if (wrap) wrap.classList.add('selected');
  }
  pushUndo();
}
function sdi(sid, key, idx, field, val) {
  var sec = sections.find(function(s){ return s.id === sid; });
  if (!sec || !sec.data[key]) return;
  sec.data[key][idx][field] = val;
  renderCanvas();
  if (selectedSecId) {
    var wrap = document.querySelector('.sec-wrap[data-sid="' + selectedSecId + '"]');
    if (wrap) wrap.classList.add('selected');
  }
  pushUndo();
}
function addItem(sid, key, fieldsStr) {
  var sec = sections.find(function(s){ return s.id === sid; });
  if (!sec) return;
  if (!sec.data[key]) sec.data[key] = [];
  var fields = fieldsStr.split(',');
  var newItem = {};
  fields.forEach(function(f){ newItem[f] = ''; });
  sec.data[key].push(newItem);
  renderSectionEditPanel(sid);
  renderCanvas();
  pushUndo();
}
function removeItem(sid, key, idx) {
  var sec = sections.find(function(s){ return s.id === sid; });
  if (!sec || !sec.data[key]) return;
  sec.data[key].splice(idx, 1);
  renderSectionEditPanel(sid);
  renderCanvas();
  pushUndo();
}

/* ═══════════════════════════════════════════
   GALLERY IMAGE EDITOR HELPERS
═══════════════════════════════════════════ */
function _galInjectStyles() {
  if (document.getElementById('pzGalEdCss')) return;
  var st = document.createElement('style');
  st.id = 'pzGalEdCss';
  st.textContent = [
    /* Card base */
    '.pgc{position:relative;border-radius:9px;overflow:hidden;border:2px solid #e5e7eb;background:#f3f4f6;cursor:pointer;transition:border-color .15s;}',
    '.pgc:hover{border-color:#6366f1;}',
    /* Overlay */
    '.pgc-ov{position:absolute;inset:0;background:rgba(0,0,0,0);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:5px;transition:background .2s;padding:6px;}',
    '.pgc:hover .pgc-ov{background:rgba(0,0,0,.55);}',
    /* Buttons inside overlay — hidden until hover */
    '.pgc-ov .pgb{opacity:0;transition:opacity .15s;}',
    '.pgc:hover .pgc-ov .pgb{opacity:1;}',
    '.pgb{border:none;border-radius:6px;font-size:11px;font-weight:600;cursor:pointer;padding:4px 9px;white-space:nowrap;}',
    '.pgb-chg{background:rgba(255,255,255,.92);color:#111;}',
    '.pgb-del{background:rgba(220,38,38,.85);color:#fff;}',
    '.pgb-row{display:flex;gap:4px;}',
    '.pgb-arr{background:rgba(255,255,255,.8);color:#111;padding:4px 8px!important;font-size:12px!important;}',
    /* Add card */
    '.pgc-add{border:2px dashed #d1d5db!important;background:#fafafa!important;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:3px;}',
    '.pgc-add:hover{border-color:#6366f1!important;background:#f5f3ff!important;}',
    '.pgc-add:hover .pgc-ov{background:transparent!important;}',
    /* Image fills card */
    '.pgc img{width:100%;height:100%;object-fit:cover;display:block;transition:transform .3s;}',
    '.pgc:hover img{transform:scale(1.04);}',
    /* Empty state inside card */
    '.pgc-ph{width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-size:26px;color:#d1d5db;}'
  ].join('\n');
  document.head.appendChild(st);
}

function galImgEditor(sid, images) {
  _galInjectStyles();

  var count = (images || []).length;
  var h = '<div class="field-group">';

  // Header row: label + count + clear-all
  h += '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;">';
  h += '<label class="fl" style="margin:0;">Images <span style="font-weight:400;color:#9ca3af;">(' + count + ')</span></label>';
  if (count > 0) {
    h += '<button onclick="galClearAll(\'' + sid + '\')" style="border:none;background:none;font-size:11px;color:#9ca3af;cursor:pointer;padding:0;" title="Remove all">Clear all</button>';
  }
  h += '</div>';

  // Thumbnail grid (3 columns)
  h += '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:6px;margin-bottom:8px;">';

  (images || []).forEach(function(url, i) {
    var isLast = i === count - 1;
    // aspect-ratio via padding trick for older browsers
    h += '<div class="pgc" style="aspect-ratio:1;">';

    // Image or placeholder
    if (url) {
      h += '<img src="' + escHtml(url) + '" alt="" onerror="this.style.display=\'none\';this.nextSibling.style.display=\'flex\'">';
      h += '<div class="pgc-ph" style="display:none;">🖼</div>';
    } else {
      h += '<div class="pgc-ph">🖼</div>';
    }

    // Hover overlay
    h += '<div class="pgc-ov">';
    h += '<button class="pgb pgb-chg" onclick="event.stopPropagation();galBrowse(\'' + sid + '\',' + i + ')">✏️ Change</button>';
    h += '<button class="pgb pgb-del" onclick="event.stopPropagation();galRemove(\'' + sid + '\',' + i + ')">✕ Remove</button>';
    // Reorder row (show when > 1 image)
    if (count > 1) {
      h += '<div class="pgb-row">';
      h += '<button class="pgb pgb-arr" onclick="event.stopPropagation();galMoveUp(\'' + sid + '\',' + i + ')" ' + (i === 0 ? 'disabled style="opacity:.35;"' : '') + ' title="Move left">◀</button>';
      h += '<button class="pgb pgb-arr" onclick="event.stopPropagation();galMoveDown(\'' + sid + '\',' + i + ')" ' + (isLast ? 'disabled style="opacity:.35;"' : '') + ' title="Move right">▶</button>';
      h += '</div>';
    }
    h += '</div>'; // .pgc-ov

    h += '</div>'; // .pgc
  });

  // "Add image" placeholder cell
  h += '<div class="pgc pgc-add" style="aspect-ratio:1;" onclick="galBrowseNew(\'' + sid + '\')">';
  h += '<div style="font-size:22px;color:#9ca3af;line-height:1;">＋</div>';
  h += '<div style="font-size:10px;font-weight:600;color:#9ca3af;margin-top:2px;">Add Photo</div>';
  h += '<div class="pgc-ov"></div>';
  h += '</div>';

  h += '</div>'; // grid

  // Action buttons
  h += '<div style="display:flex;gap:5px;">';
  h += '<button onclick="galAddBlank(\'' + sid + '\')" ' +
       'style="flex:1;padding:7px 4px;border:1px dashed #d1d5db;border-radius:7px;background:#f9fafb;cursor:pointer;font-size:11px;color:#6b7280;" title="Paste an image URL">+ Paste URL</button>';
  h += '<button onclick="galBrowseMulti(\'' + sid + '\')" ' +
       'style="flex:2;padding:7px 8px;border:1px solid #6366f1;border-radius:7px;background:#eef2ff;cursor:pointer;font-size:11px;color:#6366f1;font-weight:600;">📁 Browse & Bulk Select</button>';
  h += '</div>';

  h += '</div>';
  return h;
}

function _galSave() {
  setStatus('saving');
  clearTimeout(autoSaveTimer);
  autoSaveTimer = setTimeout(saveSections, 800);
}

function galUpdateImg(sid, idx, url) {
  var sec = sections.find(function(s){ return s.id === sid; });
  if (!sec) return;
  if (!sec.data.images) sec.data.images = [];
  sec.data.images[idx] = url;
  renderCanvas(); pushUndo(); _galSave();
}

function galClearAll(sid) {
  if (!confirm('Remove all images from this gallery?')) return;
  var sec = sections.find(function(s){ return s.id === sid; });
  if (!sec) return;
  sec.data.images = [];
  renderSectionEditPanel(sid); renderCanvas(); pushUndo(); _galSave();
}

function galMoveUp(sid, idx) {
  if (idx <= 0) return;
  var sec = sections.find(function(s){ return s.id === sid; });
  if (!sec || !sec.data.images) return;
  var tmp = sec.data.images[idx]; sec.data.images[idx] = sec.data.images[idx - 1]; sec.data.images[idx - 1] = tmp;
  renderSectionEditPanel(sid); renderCanvas(); pushUndo(); _galSave();
}

function galMoveDown(sid, idx) {
  var sec = sections.find(function(s){ return s.id === sid; });
  if (!sec || !sec.data.images || idx >= sec.data.images.length - 1) return;
  var tmp = sec.data.images[idx]; sec.data.images[idx] = sec.data.images[idx + 1]; sec.data.images[idx + 1] = tmp;
  renderSectionEditPanel(sid); renderCanvas(); pushUndo(); _galSave();
}

function galRemove(sid, idx) {
  var sec = sections.find(function(s){ return s.id === sid; });
  if (!sec) return;
  (sec.data.images || []).splice(idx, 1);
  renderSectionEditPanel(sid); renderCanvas(); pushUndo(); _galSave();
}

function galAddBlank(sid) {
  var url = prompt('Enter image URL:'); if (!url || !url.trim()) return;
  var sec = sections.find(function(s){ return s.id === sid; });
  if (!sec) return;
  if (!sec.data.images) sec.data.images = [];
  sec.data.images.push(url.trim());
  renderSectionEditPanel(sid); renderCanvas(); pushUndo(); _galSave();
}

function galBrowse(sid, idx) {
  if (typeof MediaPicker === 'undefined') return;
  MediaPicker.open(function(f) {
    var sec = sections.find(function(s){ return s.id === sid; });
    if (!sec) return;
    if (!sec.data.images) sec.data.images = [];
    sec.data.images[idx] = f.url;
    renderSectionEditPanel(sid); renderCanvas(); pushUndo(); _galSave();
  }, { type: 'image' });
}

function galBrowseNew(sid) {
  if (typeof MediaPicker === 'undefined') return;
  MediaPicker.open(function(f) {
    var sec = sections.find(function(s){ return s.id === sid; });
    if (!sec) return;
    if (!sec.data.images) sec.data.images = [];
    sec.data.images.push(f.url);
    renderSectionEditPanel(sid); renderCanvas(); pushUndo(); _galSave();
  }, { type: 'image' });
}

function galBrowseMulti(sid) {
  if (typeof MediaPicker === 'undefined') return;
  MediaPicker.open(function(files) {
    var sec = sections.find(function(s){ return s.id === sid; });
    if (!sec) return;
    if (!sec.data.images) sec.data.images = [];
    (Array.isArray(files) ? files : [files]).forEach(function(f) {
      if (f && f.url) sec.data.images.push(f.url);
    });
    renderSectionEditPanel(sid); renderCanvas(); pushUndo(); _galSave();
  }, { type: 'image', multi: true });
}

/* ═══════════════════════════════════════════
   HELPER FUNCTIONS FOR NEW SECTION TYPES
═══════════════════════════════════════════ */
function addPlan(sid) {
  var sec = sections.find(function(s){ return s.id === sid; });
  if (!sec) return;
  if (!sec.data.plans) sec.data.plans = [];
  sec.data.plans.push({ name:'New Plan', price:'₹999/mo', features:'Feature one\nFeature two\nFeature three', cta:'Get Started', link:'#contact', featured:'no' });
  renderSectionEditPanel(sid);
  renderCanvas();
  pushUndo();
}

function setVideoUrl(sid, rawUrl) {
  var sec = sections.find(function(s){ return s.id === sid; });
  if (!sec) return;
  sec.data.url = rawUrl;
  // Convert to embed URL
  var embed = rawUrl;
  var m;
  if (rawUrl && !rawUrl.includes('/embed/')) {
    m = rawUrl.match(/youtu\.be\/([a-zA-Z0-9_-]+)/);
    if (m) { embed = 'https://www.youtube.com/embed/' + m[1]; }
    else {
      m = rawUrl.match(/[?&]v=([a-zA-Z0-9_-]+)/);
      if (m) { embed = 'https://www.youtube.com/embed/' + m[1]; }
      else {
        m = rawUrl.match(/vimeo\.com\/(\d+)/);
        if (m) { embed = 'https://player.vimeo.com/video/' + m[1]; }
      }
    }
  }
  sec.data.embed_url = embed;
  renderCanvas();
  if (selectedSecId) {
    var wrap = document.querySelector('.sec-wrap[data-sid="' + selectedSecId + '"]');
    if (wrap) wrap.classList.add('selected');
  }
  pushUndo();
}

/* ═══════════════════════════════════════════
   SECTION CRUD
═══════════════════════════════════════════ */
var _insertAfter = null;
function addSection(type) {
  var def = SEC_DEF[type] || {};
  var sec = { id: 'sec_' + Date.now(), type: type, data: JSON.parse(JSON.stringify(def)) };
  if (_insertAfter) {
    var idx = sections.findIndex(function(s){ return s.id === _insertAfter; });
    if (idx >= 0) { sections.splice(idx + 1, 0, sec); }
    else { sections.push(sec); }
    _insertAfter = null;
  } else {
    sections.push(sec);
  }
  renderCanvas();
  openSectionEdit(sec.id);
  pushUndo();
  setStatus('saving');
  clearTimeout(autoSaveTimer);
  autoSaveTimer = setTimeout(saveSections, 2000);
}

function insertSectionAfter(sid) {
  _insertAfter = sid;
  togglePanel('elements');
}

function deleteSection(sid) {
  if (!confirm('Remove this section?')) return;
  sections = sections.filter(function(s){ return s.id !== sid; });
  if (selectedSecId === sid) { selectedSecId = null; closePanel(); }
  renderCanvas();
  pushUndo();
  setStatus('saving');
  clearTimeout(autoSaveTimer);
  autoSaveTimer = setTimeout(saveSections, 2000);
}

function moveSection(sid, dir) {
  var idx = sections.findIndex(function(s){ return s.id === sid; });
  if (idx < 0) return;
  var ni = idx + dir;
  if (ni < 0 || ni >= sections.length) return;
  var tmp = sections[idx]; sections[idx] = sections[ni]; sections[ni] = tmp;
  renderCanvas();
  pushUndo();
}

/* ═══════════════════════════════════════════
   DEVICE TOGGLE
═══════════════════════════════════════════ */
function setDevice(d) {
  var dev = document.getElementById('wbDevice');
  dev.className = 'wb-device' + (d !== 'desktop' ? ' ' + d : '');
  ['desktop','tablet','mobile'].forEach(function(n){
    document.getElementById('d-' + n).classList.toggle('active', n === d);
  });
}

/* ═══════════════════════════════════════════
   UNDO / REDO
═══════════════════════════════════════════ */
function pushUndo() {
  undoStack = undoStack.slice(0, undoIdx + 1);
  undoStack.push(JSON.stringify(sections));
  undoIdx = undoStack.length - 1;
}
function undo() {
  if (undoIdx <= 0) return;
  undoIdx--;
  sections = JSON.parse(undoStack[undoIdx]);
  renderCanvas();
  if (selectedSecId) renderSectionEditPanel(selectedSecId);
}
function redo() {
  if (undoIdx >= undoStack.length - 1) return;
  undoIdx++;
  sections = JSON.parse(undoStack[undoIdx]);
  renderCanvas();
  if (selectedSecId) renderSectionEditPanel(selectedSecId);
}

/* ═══════════════════════════════════════════
   SAVE
═══════════════════════════════════════════ */
function setStatus(s, msg) {
  var el = document.getElementById('saveStatus');
  el.className = 'tb-saved ' + s;
  el.textContent = msg || (s === 'saving' ? 'Saving…' : s === 'saved' ? 'All changes saved' : '');
}
async function saveSections() {
  if (!currentPageId) return;
  setStatus('saving');
  try {
    var res = await fetch('/dashboard/website/' + WEBSITE_ID + '/page/' + currentPageId + '/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sections: sections })
    });
    var data = await res.json();
    setStatus(data.ok ? 'saved' : '', data.ok ? 'All changes saved' : 'Save failed');
  } catch(e) { setStatus('', 'Save failed'); }
}
async function saveAndPublish() {
  await saveSections();
  var res = await fetch('/dashboard/website/' + WEBSITE_ID + '/publish', {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}'
  });
  var data = await res.json();
  if (data.ok) {
    isPublished = data.published;
    var btn = document.getElementById('publishBtn');
    if (btn) btn.textContent = '🌐 ' + (isPublished ? 'Unpublish' : 'Publish');
    if (data.published) window.open('/w/' + SUBDOMAIN, '_blank');
  }
}
function openPreview() {
  window.open('/w/' + SUBDOMAIN, '_blank');
}

/* ═══════════════════════════════════════════
   STYLES / THEME
═══════════════════════════════════════════ */
var activeTheme = SITE_THEME;

function onStyleChange(key, val) {
  siteSettings[key] = val;
  if (key === 'primary') {
    primary = val;
    document.getElementById('canvasRoot').style.setProperty('--primary', val);
  }
  renderCanvas();
}

function selectTheme(themeId) {
  activeTheme = themeId;
  document.querySelectorAll('.theme-thumb').forEach(function(el){ el.classList.remove('selected'); });
  var tc = document.getElementById('tc-' + themeId);
  if (tc) tc.classList.add('selected');
  // Live preview in canvas
  loadThemeCSS(themeId);
  loadThemeSections(themeId);
  _initCatalogConfig(themeId);
}

async function saveStyles() {
  var res = await fetch('/dashboard/website/' + WEBSITE_ID + '/settings', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      primary: siteSettings.primary,
      font: document.getElementById('sy-font').value,
      theme: activeTheme
    })
  });
  var data = await res.json();
  if (data.ok) setStatus('saved', 'Styles saved');
}

/* ═══════════════════════════════════════════
   SETTINGS SAVE
═══════════════════════════════════════════ */
async function saveSettings() {
  var res = await fetch('/dashboard/website/' + WEBSITE_ID + '/settings', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      title:   document.getElementById('st-title').value,
      tagline: document.getElementById('st-tagline').value,
      logo:    document.getElementById('st-logo').value
    })
  });
  var data = await res.json();
  if (data.ok) setStatus('saved', 'Settings saved');
}

/* ═══════════════════════════════════════════
   SEO SAVE
═══════════════════════════════════════════ */
async function saveSEO() {
  if (!currentPageId) return;
  var res = await fetch('/dashboard/website/' + WEBSITE_ID + '/page/' + currentPageId + '/seo', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      seo_title: document.getElementById('seo-title').value,
      seo_desc:  document.getElementById('seo-desc').value
    })
  });
  var data = await res.json();
  if (data.ok) setStatus('saved', 'SEO saved');
}

/* ═══════════════════════════════════════════
   PAGES
═══════════════════════════════════════════ */
function switchPage(pageId) {
  if (pageId === currentPageId) { closePanel(); return; }
  window.location.href = '/dashboard/website/' + WEBSITE_ID + '/editor?page=' + pageId;
}
async function addPage() {
  var title = prompt('Page name:');
  if (!title) return;
  var res = await fetch('/dashboard/website/' + WEBSITE_ID + '/page/add', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title: title })
  });
  var data = await res.json();
  if (data.ok) {
    allPages.push(data.page);
    renderPageList();
    window.location.href = '/dashboard/website/' + WEBSITE_ID + '/editor?page=' + data.page.id;
  }
}
async function deletePage(pageId, btn) {
  if (!confirm('Delete this page?')) return;
  var res = await fetch('/dashboard/website/' + WEBSITE_ID + '/page/' + pageId + '/delete', {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}'
  });
  var data = await res.json();
  if (data.ok) {
    allPages = allPages.filter(function(p){ return p.id !== pageId; });
    if (currentPageId === pageId) window.location.href = '/dashboard/website/' + WEBSITE_ID + '/editor';
    else renderPageList();
  } else { alert(data.error || 'Cannot delete'); }
}

/* ═══════════════════════════════════════════
   AUTO-SAVE (panel inputs)
═══════════════════════════════════════════ */
var autoSaveTimer;
document.addEventListener('input', function(e) {
  // Don't trigger auto-save for canvas contenteditable (handled separately)
  if (e.target.closest('#canvasRoot')) return;
  clearTimeout(autoSaveTimer);
  setStatus('saving');
  autoSaveTimer = setTimeout(saveSections, 2000);
});

/* ═══════════════════════════════════════════
   CANVAS CONTENTEDITABLE — inline text editing
═══════════════════════════════════════════ */
document.getElementById('canvasRoot').addEventListener('input', function(e) {
  var el = e.target;
  if (el.contentEditable !== 'true') return;

  var wrap = el.closest('.sec-wrap');
  if (!wrap) return;
  var sid = wrap.dataset.sid;
  var key = el.dataset.key;
  var idx = el.dataset.idx;
  var field = el.dataset.field;
  var val = el.textContent;

  var sec = sections.find(function(s){ return s.id === sid; });
  if (!sec) return;
  if (!sec.data) sec.data = {};

  if (idx !== undefined && field) {
    // Item sub-field (services, testimonials, team, faq)
    var i = parseInt(idx);
    if (!isNaN(i) && sec.data.items && sec.data.items[i]) {
      sec.data.items[i][field] = val;
    }
  } else if (key) {
    sec.data[key] = val;
  }

  // Sync sidebar panel if open
  if (selectedSecId === sid && activePanel === 'section-edit') {
    // Re-render panel without re-rendering canvas (to preserve cursor)
    renderSectionEditPanel(sid);
  }

  setStatus('saving');
  clearTimeout(autoSaveTimer);
  autoSaveTimer = setTimeout(saveSections, 2000);
}, true);

/* ═══════════════════════════════════════════
   KEYBOARD SHORTCUTS
═══════════════════════════════════════════ */
document.addEventListener('keydown', function(e) {
  if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) { e.preventDefault(); undo(); }
  if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) { e.preventDefault(); redo(); }
  if ((e.ctrlKey || e.metaKey) && e.key === 's') { e.preventDefault(); saveSections(); }
  if (e.key === 'Escape') {
    closePanel();
    document.querySelectorAll('.sec-wrap').forEach(function(el){ el.classList.remove('selected'); });
    selectedSecId = null;
    if (document.activeElement && document.activeElement.blur) document.activeElement.blur();
  }
});

/* ═══════════════════════════════════════════
   FULL-SCREEN THEME CHOOSER
═══════════════════════════════════════════ */
var THEMES_LIST = [
  { id:'default',    name:'Default',      desc:'Clean modern design with soft cards and indigo accents', tags:['modern','clean','minimal','professional'], category:'Modern' },
  { id:'minimal',   name:'Elegant',      desc:'Warm cream palette with Playfair serif and gold accents', tags:['elegant','serif','classic','warm'], category:'Classic' },
  { id:'bold',      name:'Dark',         desc:'Full dark theme with glass cards and neon purple glow', tags:['dark','bold','neon','modern'], category:'Dark' },
  { id:'ecom-fresh',name:'Fresh Market', desc:'Clean white with emerald green — minimal modern ecommerce', tags:['ecommerce','clean','modern','green'], category:'Clean' },
  { id:'ecom-luxe', name:'Luxe',         desc:'Dark background with gold accents — premium luxury ecommerce', tags:['ecommerce','dark','luxury','gold'], category:'Dark' },
  { id:'ecom-spark',   name:'Spark',        desc:'Bold white with rose accents — energetic streetwear ecommerce', tags:['ecommerce','bold','modern','colorful'], category:'Bold' },
  { id:'realestate',   name:'Real Estate',   desc:'Professional navy blue real estate with property listings, agents & blog', tags:['real estate','property','professional','blue'], category:'Professional' }
];

/* Per-theme demo starter sections shown in the "import content" dialog */
var THEME_STARTER_SECTIONS = {
  'ecom-fresh': [
    { type:'hero',         data:{ headline:'Fresh Finds for Every Day', subheadline:'Shop our curated collection of everyday essentials — quality you can feel.', cta_label:'Shop Now', cta_url:'#services', bg_color:'#059669', text_color:'#ffffff', bg_image:'' } },
    { type:'services',     data:{ heading:'Featured Products', items:[{icon:'🥑',title:'Organic Fresh',desc:'Sourced from local farms, delivered to your door.',price:'₹249'},{icon:'🌿',title:'Natural Beauty',desc:'Clean formulas, sustainable packaging.',price:'₹399'},{icon:'🏺',title:'Home Essentials',desc:'Beautiful objects for everyday living.',price:'₹599'}] } },
    { type:'testimonials', data:{ heading:'Happy Customers', items:[{name:'Priya S.',role:'Regular Customer',quote:'The quality is incredible — I order every week!'},{name:'Rahul M.',role:'Verified Buyer',quote:'Fast delivery and everything arrived perfectly fresh.'}] } },
    { type:'contact',      data:{ heading:'Get in Touch', email:'hello@mystore.com', phone:'', address:'', show_form:true } }
  ],
  'ecom-luxe': [
    { type:'hero',         data:{ headline:'Crafted for the Discerning', subheadline:"A curated edit of the world's finest goods — for those who expect nothing but the best.", cta_label:'Explore Collection', cta_url:'#services', bg_color:'#0a0a0f', text_color:'#f5f0e8', bg_image:'' } },
    { type:'services',     data:{ heading:'The Collection', items:[{icon:'💎',title:'Fine Jewellery',desc:"Handcrafted pieces from the world's finest ateliers.",price:'₹12,999'},{icon:'👜',title:'Luxury Leather',desc:'Full-grain leather goods built to last a lifetime.',price:'₹8,999'},{icon:'🕯️',title:'Home Luxuries',desc:'Objects of beauty for the refined home.',price:'₹3,499'}] } },
    { type:'testimonials', data:{ heading:'Client Testimonials', items:[{name:'Aanya K.',role:'Collector',quote:'The craftsmanship is extraordinary — worth every rupee.'},{name:'Vikram R.',role:'Long-time Client',quote:'Impeccable packaging, impeccable service.'}] } },
    { type:'contact',      data:{ heading:'Private Enquiries', email:'concierge@mystore.com', phone:'', address:'', show_form:true } }
  ],
  'ecom-spark': [
    { type:'hero',         data:{ headline:'Drop Different.', subheadline:'Limited releases, bold designs — wear what sets you apart.', cta_label:'Shop the Drop', cta_url:'#services', bg_color:'#f43f5e', text_color:'#ffffff', bg_image:'' } },
    { type:'services',     data:{ heading:'Latest Drops', items:[{icon:'🔥',title:'Oversized Tee',desc:'Heavy cotton, washed finish — built for the streets.',price:'₹899'},{icon:'⚡',title:'Cargo Shorts',desc:'6-pocket utility with elastic waistband.',price:'₹1,299'},{icon:'👟',title:'Sport Cap',desc:'Unstructured fit, embroidered logo.',price:'₹499'}] } },
    { type:'testimonials', data:{ heading:'The Community', items:[{name:'Dev T.',role:'Hype Collector',quote:'Every drop is straight 🔥 — sold out in minutes for a reason.'},{name:'Zara K.',role:'Style Creator',quote:'Finally a brand that actually has taste.'}] } },
    { type:'contact',      data:{ heading:'Hit Us Up', email:'hello@mystore.com', phone:'', address:'', show_form:true } }
  ],
  'realestate': [
    { type:'property_search', data:{ headline:'Find Your Dream Home', subtext:'Thousands of verified properties. Your perfect home is one search away.', stats:[{num:'2,500+',label:'Properties'},{num:'850+',label:'Families'},{num:'12+',label:'Years'},{num:'98%',label:'Satisfaction'}], bg_image:'' } },
    { type:'property_listings', data:{ heading:'Featured Properties', subheading:'Hand-picked by our agents', properties:[
      {icon:'🏠',title:'3 BHK Apartment',location:'Bandra West, Mumbai',price:'₹1.8 Cr',beds:3,baths:2,sqft:1450,tag:'For Sale'},
      {icon:'🏡',title:'4 BHK Villa',location:'Whitefield, Bangalore',price:'₹2.4 Cr',beds:4,baths:3,sqft:2800,tag:'Featured'},
      {icon:'🏢',title:'2 BHK Flat',location:'Dwarka, Delhi',price:'₹85 L',beds:2,baths:2,sqft:980,tag:'New'}
    ], cta_label:'View All Properties', cta_url:'#' } },
    { type:'services',    data:{ heading:'Why Choose Us', items:[{icon:'🔑',title:'Verified Listings',desc:'Every property is personally inspected before listing.'},{icon:'📊',title:'Market Expertise',desc:'12+ years of data to help you buy at the right price.'},{icon:'🤝',title:'End-to-End Support',desc:'From home loan to registration, we guide every step.'}] } },
    { type:'testimonials',data:{ heading:'What Our Clients Say', items:[{name:'Rajesh Kumar',role:'Home Buyer, Mumbai',quote:'Found our dream 3BHK in just 2 weeks. Incredible team!'},{name:'Priya Nair',role:'Property Investor',quote:'Best real estate experience I have ever had.'}] } },
    { type:'contact',     data:{ heading:'Talk to an Agent', email:'hello@estate.in', phone:'+91 98765 43210', address:'', show_form:true } }
  ]
};

var _tcTag = 'all';
var _tcCat = 'all';
var _tcPendingId = null;
var _tcImportThemeId = null;

function openThemeChooser() {
  _tcPendingId = activeTheme;
  document.getElementById('tcSiteName').textContent = siteSettings.title || SUBDOMAIN;
  document.getElementById('tcFooterLabel').textContent = activeTheme;
  // Reset filters
  _tcTag = 'all'; _tcCat = 'all';
  document.querySelectorAll('.tco-chip').forEach(function(c){ c.classList.toggle('active', c.textContent.trim() === 'All'); });
  document.querySelectorAll('.tco-cat-item').forEach(function(c,i){ c.classList.toggle('active', i===0); });
  document.getElementById('tcSearch').value = '';
  document.getElementById('tcCatSel').value = 'all';
  tcRenderGrid();
  document.getElementById('themeChooser').style.display = 'flex';
}

function closeThemeChooser() {
  // Revert live preview if user cancelled
  if (_tcPendingId !== activeTheme) loadThemeCSS(activeTheme);
  document.getElementById('themeChooser').style.display = 'none';
}

function tcUseTheme() {
  var tid = _tcPendingId;
  var starters = tid && THEME_STARTER_SECTIONS[tid];
  if (starters) {
    // Close chooser and show import dialog
    _tcImportThemeId = tid;
    document.getElementById('themeChooser').style.display = 'none';
    var overlay = document.getElementById('tcImportOverlay');
    var t = THEMES_LIST.find(function(x){ return x.id === tid; });
    document.getElementById('tcImportThemeName').textContent = t ? t.name : tid;
    overlay.style.display = 'flex';
    return;
  }
  // No starter sections — apply theme defaults and reload
  if (tid) {
    var td = (typeof THEME_DEFAULTS !== 'undefined' && THEME_DEFAULTS[tid]) || {};
    var body = {
      theme:   tid,
      primary: td.primary || siteSettings.primary,
      font:    td.font    || siteSettings.font,
      text:    td.text    || siteSettings.text  || '#111827',
      bg:      td.bg      || siteSettings.bg    || '#ffffff'
    };
    document.getElementById('themeChooser').style.display = 'none';
    fetch('/dashboard/website/' + WEBSITE_ID + '/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    }).then(function() { window.location.reload(); })
      .catch(function() { window.location.reload(); });
    return;
  }
  document.getElementById('themeChooser').style.display = 'none';
}

function tcApplyTheme(importContent) {
  document.getElementById('tcImportOverlay').style.display = 'none';
  var tid = _tcImportThemeId;
  _tcImportThemeId = null;
  if (!tid) return;

  // Get the correct colors/font for the new theme
  var td = (typeof THEME_DEFAULTS !== 'undefined' && THEME_DEFAULTS[tid]) || {};
  var newPrimary = td.primary || siteSettings.primary;
  var newFont    = td.font    || siteSettings.font;
  var newText    = td.text    || siteSettings.text  || '#111827';
  var newBg      = td.bg      || siteSettings.bg    || '#ffffff';

  if (importContent) {
    // Import all theme pages from server (creates Cart, Checkout, etc.)
    fetch('/dashboard/website/' + WEBSITE_ID + '/import-theme', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ themeId: tid })
    }).then(function(r) { return r.json(); }).then(function(data) {
      if (data.redirectUrl) window.location.href = data.redirectUrl;
      else window.location.reload();
    }).catch(function() { window.location.reload(); });
  } else {
    // Style-only: save settings with new defaults and reload
    fetch('/dashboard/website/' + WEBSITE_ID + '/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ theme: tid, primary: newPrimary, font: newFont, text: newText, bg: newBg })
    }).then(function() {
      window.location.reload();
    }).catch(function() {
      window.location.reload();
    });
  }
}

function tcSetTag(tag, el) {
  _tcTag = tag;
  document.querySelectorAll('.tco-chip').forEach(function(c){ c.classList.remove('active'); });
  el.classList.add('active');
  tcFilter();
}

function tcSetCat(cat, el) {
  _tcCat = cat;
  document.querySelectorAll('.tco-cat-item').forEach(function(c){ c.classList.remove('active'); });
  el.classList.add('active');
  tcFilter();
}

function tcFilter() {
  var q = (document.getElementById('tcSearch').value || '').toLowerCase();
  var catVal = document.getElementById('tcCatSel').value;
  if (catVal !== 'all') _tcCat = catVal;
  var filtered = THEMES_LIST.filter(function(t) {
    var mSearch = !q || t.name.toLowerCase().includes(q) || t.desc.toLowerCase().includes(q) || t.tags.some(function(g){ return g.includes(q); });
    var mTag = _tcTag === 'all' || t.tags.includes(_tcTag);
    var mCat = _tcCat === 'all' || t.category === _tcCat;
    return mSearch && mTag && mCat;
  });
  var n = filtered.length;
  document.getElementById('tcShowing').textContent = 'Showing ' + (n === THEMES_LIST.length ? 'all ' : '') + n + ' theme' + (n !== 1 ? 's' : '');
  tcRenderGrid(filtered);
}

function tcRenderGrid(list) {
  list = list || THEMES_LIST;
  var sel = _tcPendingId || activeTheme;
  document.getElementById('tcGrid').innerHTML = list.map(function(t) {
    var isActive = t.id === sel;
    return '<div class="tco-card' + (isActive ? ' selected' : '') + '" data-tid="' + escHtml(t.id) + '">' +
      '<div class="tco-preview">' + tcPreviewHTML(t) + '<div class="tco-sel-badge">✓ Selected</div></div>' +
      '<div class="tco-card-info">' +
        '<div class="tco-card-name">' + escHtml(t.name) + '</div>' +
        '<div class="tco-card-desc">' + escHtml(t.desc) + '</div>' +
        '<div class="tco-tags">' + t.tags.map(function(g){ return '<span class="tco-tag">' + escHtml(g) + '</span>'; }).join('') + '</div>' +
        '<div class="tco-actions">' +
          '<button class="tco-prev-btn" onclick="event.stopPropagation();tcPreview(\'' + escHtml(t.id) + '\')">Preview</button>' +
          '<button class="tco-sel-btn" onclick="event.stopPropagation();tcPick(\'' + escHtml(t.id) + '\')">Select</button>' +
        '</div>' +
      '</div>' +
    '</div>';
  }).join('');
}

var _tcPreviewId = null;
function tcPreview(tid) {
  _tcPreviewId = tid;
  var t = THEMES_LIST.find(function(x){ return x.id === tid; });
  if (!t) return;
  var el = document.getElementById('tcPrevModalName'); if (el) el.textContent = t.name;
  var el2 = document.getElementById('tcPrevModalDesc'); if (el2) el2.textContent = t.desc;
  var el3 = document.getElementById('tcPrevModalTags');
  if (el3) el3.innerHTML = t.tags.map(function(g){ return '<span class="tco-tag">' + g + '</span>'; }).join('');
  var frame = document.getElementById('tcPrevFrame');
  if (frame) frame.src = '/theme-demo/' + tid;
  document.getElementById('tcPrevModal').style.display = 'flex';
}
function tcClosePrevModal() {
  var frame = document.getElementById('tcPrevFrame');
  if (frame) frame.src = '';
  document.getElementById('tcPrevModal').style.display = 'none';
}
function tcSelectFromPreview() {
  tcClosePrevModal();
  if (_tcPreviewId) tcPick(_tcPreviewId);
}

function tcPick(tid) {
  _tcPendingId = tid;
  loadThemeCSS(tid);
  document.getElementById('tcFooterLabel').textContent = tid;
  document.querySelectorAll('.tco-card').forEach(function(c){
    c.classList.toggle('selected', c.dataset.tid === tid);
  });
}

function tcUpdateSwatch(tid) {
  var t = THEMES_LIST.find(function(x){ return x.id === tid; });
  if (!t) return;
  var swatch = document.getElementById('tcCurrentSwatch');
  var name = document.getElementById('tcCurrentName');
  var desc = document.getElementById('tcCurrentDesc');
  if (swatch) swatch.innerHTML = tcPreviewHTML(t);
  if (name) name.textContent = t.name;
  if (desc) desc.textContent = t.desc;
}

function tcPreviewHTML(t) {
  if (t.id === 'default') {
    return [
      '<div style="background:#fff;border-bottom:1px solid #e5e7eb;display:flex;align-items:center;padding:0 12px;height:28px;">',
        '<div style="width:36px;height:7px;background:#6366f1;border-radius:4px;"></div>',
        '<div style="margin-left:auto;display:flex;gap:4px;">',
          '<div style="width:18px;height:5px;background:#f1f5f9;border-radius:3px;"></div>',
          '<div style="width:18px;height:5px;background:#f1f5f9;border-radius:3px;"></div>',
          '<div style="width:28px;height:5px;background:#6366f1;border-radius:3px;opacity:.25;"></div>',
        '</div>',
      '</div>',
      '<div style="background:linear-gradient(135deg,#667eea,#764ba2);padding:18px 14px;text-align:center;">',
        '<div style="width:62%;height:9px;background:rgba(255,255,255,.92);border-radius:5px;margin:0 auto 7px;"></div>',
        '<div style="width:42%;height:5px;background:rgba(255,255,255,.55);border-radius:4px;margin:0 auto 12px;"></div>',
        '<div style="display:inline-block;width:52px;height:15px;background:#fff;border-radius:30px;box-shadow:0 3px 10px rgba(0,0,0,.2);"></div>',
      '</div>',
      '<div style="background:#f8fafc;padding:10px 12px;">',
        '<div style="width:28%;height:6px;background:#0f172a;border-radius:4px;margin:0 auto 2px;"></div>',
        '<div style="width:18%;height:4px;background:#6366f1;border-radius:3px;margin:0 auto 8px;"></div>',
        '<div style="display:flex;gap:5px;">',
          '<div style="flex:1;background:#fff;border:1.5px solid #e5e7eb;border-radius:9px;padding:6px;">',
            '<div style="width:14px;height:14px;background:linear-gradient(135deg,#6366f1,#8b5cf6);border-radius:5px;margin-bottom:4px;"></div>',
            '<div style="width:65%;height:4px;background:#111827;border-radius:2px;margin-bottom:3px;"></div>',
            '<div style="width:88%;height:3px;background:#e5e7eb;border-radius:2px;"></div>',
          '</div>',
          '<div style="flex:1;background:#fff;border:1.5px solid #e5e7eb;border-radius:9px;padding:6px;">',
            '<div style="width:14px;height:14px;background:linear-gradient(135deg,#6366f1,#8b5cf6);border-radius:5px;margin-bottom:4px;"></div>',
            '<div style="width:65%;height:4px;background:#111827;border-radius:2px;margin-bottom:3px;"></div>',
            '<div style="width:88%;height:3px;background:#e5e7eb;border-radius:2px;"></div>',
          '</div>',
          '<div style="flex:1;background:#fff;border:1.5px solid #e5e7eb;border-radius:9px;padding:6px;">',
            '<div style="width:14px;height:14px;background:linear-gradient(135deg,#6366f1,#8b5cf6);border-radius:5px;margin-bottom:4px;"></div>',
            '<div style="width:65%;height:4px;background:#111827;border-radius:2px;margin-bottom:3px;"></div>',
            '<div style="width:88%;height:3px;background:#e5e7eb;border-radius:2px;"></div>',
          '</div>',
        '</div>',
      '</div>',
      '<div style="background:#0f172a;padding:9px 14px;text-align:center;">',
        '<div style="width:22%;height:4px;background:rgba(255,255,255,.2);border-radius:3px;margin:0 auto;"></div>',
      '</div>'
    ].join('');
  }
  if (t.id === 'minimal') {
    return [
      '<div style="background:#fdf8f3;border-bottom:1px solid #e8d5c0;display:flex;align-items:center;padding:0 12px;height:28px;">',
        '<div style="width:44px;height:6px;background:#2c1810;border-radius:1px;"></div>',
        '<div style="margin-left:auto;display:flex;gap:4px;">',
          '<div style="width:18px;height:4px;background:#e8d5c0;border-radius:1px;"></div>',
          '<div style="width:18px;height:4px;background:#e8d5c0;border-radius:1px;"></div>',
          '<div style="width:18px;height:4px;background:#b8963e;border-radius:1px;opacity:.4;"></div>',
        '</div>',
      '</div>',
      '<div style="background:#2c1810;padding:18px 14px;text-align:center;position:relative;overflow:hidden;">',
        '<div style="position:relative;width:62%;height:9px;background:rgba(253,248,243,.85);border-radius:1px;margin:0 auto 7px;"></div>',
        '<div style="position:relative;width:40%;height:5px;background:#c9a882;border-radius:1px;margin:0 auto 12px;"></div>',
        '<div style="position:relative;display:inline-block;width:52px;height:15px;border:2px solid #b8963e;border-radius:0;"></div>',
      '</div>',
      '<div style="background:#fdf8f3;padding:10px 12px;">',
        '<div style="width:28%;height:6px;background:#2c1810;border-radius:1px;margin:0 auto 2px;"></div>',
        '<div style="width:20%;height:3px;background:#b8963e;margin:0 auto 8px;"></div>',
        '<div style="display:flex;gap:5px;">',
          '<div style="flex:1;background:#fdf8f3;border:1px solid #e8d5c0;border-top:2.5px solid #b8963e;padding:6px;">',
            '<div style="width:65%;height:4px;background:#2c1810;border-radius:1px;margin-bottom:3px;"></div>',
            '<div style="width:88%;height:3px;background:#e8d5c0;border-radius:1px;"></div>',
          '</div>',
          '<div style="flex:1;background:#fdf8f3;border:1px solid #e8d5c0;border-top:2.5px solid #b8963e;padding:6px;">',
            '<div style="width:65%;height:4px;background:#2c1810;border-radius:1px;margin-bottom:3px;"></div>',
            '<div style="width:88%;height:3px;background:#e8d5c0;border-radius:1px;"></div>',
          '</div>',
          '<div style="flex:1;background:#fdf8f3;border:1px solid #e8d5c0;border-top:2.5px solid #b8963e;padding:6px;">',
            '<div style="width:65%;height:4px;background:#2c1810;border-radius:1px;margin-bottom:3px;"></div>',
            '<div style="width:88%;height:3px;background:#e8d5c0;border-radius:1px;"></div>',
          '</div>',
        '</div>',
      '</div>',
      '<div style="background:#1a0f08;padding:9px 14px;text-align:center;">',
        '<div style="width:22%;height:3px;background:rgba(184,150,62,.35);margin:0 auto;"></div>',
      '</div>'
    ].join('');
  }
  if (t.id === 'bold') {
    return [
      '<div style="background:#080810;border-bottom:1px solid rgba(255,255,255,.06);display:flex;align-items:center;padding:0 12px;height:28px;">',
        '<div style="width:36px;height:7px;background:#6366f1;border-radius:4px;box-shadow:0 0 8px rgba(99,102,241,.7);"></div>',
        '<div style="margin-left:auto;display:flex;gap:4px;">',
          '<div style="width:18px;height:5px;background:rgba(255,255,255,.12);border-radius:3px;"></div>',
          '<div style="width:18px;height:5px;background:rgba(255,255,255,.12);border-radius:3px;"></div>',
          '<div style="width:18px;height:5px;background:rgba(99,102,241,.35);border-radius:3px;"></div>',
        '</div>',
      '</div>',
      '<div style="background:#080810;padding:18px 14px;text-align:center;position:relative;overflow:hidden;">',
        '<div style="position:absolute;top:-30%;left:50%;transform:translateX(-50%);width:220px;height:160px;background:radial-gradient(ellipse,rgba(99,102,241,.32),transparent 70%);pointer-events:none;"></div>',
        '<div style="position:relative;width:62%;height:9px;background:rgba(255,255,255,.9);border-radius:5px;margin:0 auto 7px;"></div>',
        '<div style="position:relative;width:42%;height:5px;background:rgba(255,255,255,.25);border-radius:4px;margin:0 auto 12px;"></div>',
        '<div style="position:relative;display:inline-block;width:52px;height:15px;background:#6366f1;border-radius:10px;box-shadow:0 0 14px rgba(99,102,241,.7);"></div>',
      '</div>',
      '<div style="background:#080810;padding:10px 12px;">',
        '<div style="width:28%;height:6px;background:rgba(255,255,255,.85);border-radius:4px;margin:0 auto 2px;"></div>',
        '<div style="width:18%;height:4px;background:#6366f1;border-radius:3px;margin:0 auto 8px;box-shadow:0 0 6px rgba(99,102,241,.5);"></div>',
        '<div style="display:flex;gap:5px;">',
          '<div style="flex:1;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);border-radius:10px;padding:6px;">',
            '<div style="width:14px;height:14px;background:rgba(99,102,241,.2);border:1px solid rgba(99,102,241,.35);border-radius:5px;margin-bottom:4px;"></div>',
            '<div style="width:65%;height:4px;background:rgba(255,255,255,.8);border-radius:2px;margin-bottom:3px;"></div>',
            '<div style="width:88%;height:3px;background:rgba(255,255,255,.12);border-radius:2px;"></div>',
          '</div>',
          '<div style="flex:1;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);border-radius:10px;padding:6px;">',
            '<div style="width:14px;height:14px;background:rgba(99,102,241,.2);border:1px solid rgba(99,102,241,.35);border-radius:5px;margin-bottom:4px;"></div>',
            '<div style="width:65%;height:4px;background:rgba(255,255,255,.8);border-radius:2px;margin-bottom:3px;"></div>',
            '<div style="width:88%;height:3px;background:rgba(255,255,255,.12);border-radius:2px;"></div>',
          '</div>',
          '<div style="flex:1;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);border-radius:10px;padding:6px;">',
            '<div style="width:14px;height:14px;background:rgba(99,102,241,.2);border:1px solid rgba(99,102,241,.35);border-radius:5px;margin-bottom:4px;"></div>',
            '<div style="width:65%;height:4px;background:rgba(255,255,255,.8);border-radius:2px;margin-bottom:3px;"></div>',
            '<div style="width:88%;height:3px;background:rgba(255,255,255,.12);border-radius:2px;"></div>',
          '</div>',
        '</div>',
      '</div>',
      '<div style="background:#04040a;border-top:1px solid rgba(255,255,255,.05);padding:9px 14px;text-align:center;">',
        '<div style="width:22%;height:4px;background:rgba(255,255,255,.1);border-radius:2px;margin:0 auto;"></div>',
      '</div>'
    ].join('');
  }
  if (t.id === 'ecom-fresh') {
    return [
      '<div style="background:#fff;border-bottom:2px solid #d1fae5;display:flex;align-items:center;padding:0 12px;height:28px;">',
        '<div style="width:36px;height:6px;background:#111827;border-radius:3px;"></div>',
        '<div style="margin-left:auto;display:flex;gap:4px;">',
          '<div style="width:18px;height:5px;background:#f1f5f9;border-radius:3px;"></div>',
          '<div style="width:18px;height:5px;background:#f1f5f9;border-radius:3px;"></div>',
          '<div style="width:28px;height:5px;background:#059669;border-radius:3px;opacity:.3;"></div>',
        '</div>',
      '</div>',
      '<div style="background:#f0fdf4;padding:18px 14px;text-align:center;">',
        '<div style="display:inline-block;width:48px;height:8px;background:#d1fae5;border-radius:20px;margin-bottom:7px;"></div>',
        '<div style="width:60%;height:9px;background:#111827;border-radius:4px;margin:0 auto 7px;"></div>',
        '<div style="width:40%;height:5px;background:#9ca3af;border-radius:3px;margin:0 auto 12px;"></div>',
        '<div style="display:inline-block;width:52px;height:15px;background:#059669;border-radius:7px;"></div>',
      '</div>',
      '<div style="background:#fff;padding:10px 12px;">',
        '<div style="width:28%;height:6px;background:#111827;border-radius:4px;margin:0 auto 2px;"></div>',
        '<div style="width:18%;height:3px;background:#059669;border-radius:3px;margin:0 auto 8px;"></div>',
        '<div style="display:flex;gap:5px;">',
          '<div style="flex:1;background:#fff;border:1px solid #e5e7eb;border-radius:9px;overflow:hidden;">',
            '<div style="height:20px;background:#f0fdf4;margin-bottom:4px;"></div>',
            '<div style="padding:0 5px 5px;"><div style="width:65%;height:4px;background:#111827;border-radius:2px;margin-bottom:3px;"></div>',
            '<div style="width:40%;height:4px;background:#059669;border-radius:2px;margin-bottom:4px;"></div>',
            '<div style="height:8px;background:#059669;border-radius:5px;"></div></div>',
          '</div>',
          '<div style="flex:1;background:#fff;border:1px solid #e5e7eb;border-radius:9px;overflow:hidden;">',
            '<div style="height:20px;background:#f0fdf4;margin-bottom:4px;"></div>',
            '<div style="padding:0 5px 5px;"><div style="width:65%;height:4px;background:#111827;border-radius:2px;margin-bottom:3px;"></div>',
            '<div style="width:40%;height:4px;background:#059669;border-radius:2px;margin-bottom:4px;"></div>',
            '<div style="height:8px;background:#059669;border-radius:5px;"></div></div>',
          '</div>',
          '<div style="flex:1;background:#fff;border:1px solid #e5e7eb;border-radius:9px;overflow:hidden;">',
            '<div style="height:20px;background:#f0fdf4;margin-bottom:4px;"></div>',
            '<div style="padding:0 5px 5px;"><div style="width:65%;height:4px;background:#111827;border-radius:2px;margin-bottom:3px;"></div>',
            '<div style="width:40%;height:4px;background:#059669;border-radius:2px;margin-bottom:4px;"></div>',
            '<div style="height:8px;background:#059669;border-radius:5px;"></div></div>',
          '</div>',
        '</div>',
      '</div>',
      '<div style="background:#111827;padding:9px 14px;text-align:center;">',
        '<div style="width:22%;height:4px;background:rgba(255,255,255,.2);border-radius:3px;margin:0 auto;"></div>',
      '</div>'
    ].join('');
  }
  if (t.id === 'ecom-luxe') {
    return [
      '<div style="background:#0a0a0f;border-bottom:1px solid rgba(212,175,55,.15);display:flex;align-items:center;padding:0 12px;height:28px;">',
        '<div style="width:40px;height:6px;background:#d4af37;border-radius:1px;opacity:.8;"></div>',
        '<div style="margin-left:auto;display:flex;gap:4px;">',
          '<div style="width:18px;height:4px;background:rgba(255,255,255,.12);border-radius:1px;"></div>',
          '<div style="width:18px;height:4px;background:rgba(255,255,255,.12);border-radius:1px;"></div>',
          '<div style="width:18px;height:4px;background:rgba(212,175,55,.3);border-radius:1px;"></div>',
        '</div>',
      '</div>',
      '<div style="background:#050508;padding:18px 14px;text-align:center;position:relative;overflow:hidden;">',
        '<div style="position:absolute;top:-40%;left:50%;transform:translateX(-50%);width:180px;height:120px;background:radial-gradient(ellipse,rgba(212,175,55,.18),transparent 70%);"></div>',
        '<div style="position:relative;display:inline-block;width:52px;height:8px;background:rgba(212,175,55,.2);border:1px solid rgba(212,175,55,.3);border-radius:20px;margin-bottom:7px;"></div>',
        '<div style="position:relative;width:62%;height:9px;background:rgba(245,240,232,.85);border-radius:1px;margin:0 auto 7px;"></div>',
        '<div style="position:relative;width:44%;height:5px;background:rgba(148,163,184,.35);border-radius:1px;margin:0 auto 12px;"></div>',
        '<div style="position:relative;display:inline-block;width:52px;height:15px;background:#d4af37;border-radius:3px;"></div>',
      '</div>',
      '<div style="background:#0a0a0f;padding:10px 12px;">',
        '<div style="width:28%;height:5px;background:rgba(245,240,232,.8);border-radius:1px;margin:0 auto 3px;"></div>',
        '<div style="width:18%;height:1px;background:#d4af37;margin:0 auto 8px;"></div>',
        '<div style="display:flex;gap:5px;">',
          '<div style="flex:1;background:rgba(255,255,255,.04);border:1px solid rgba(212,175,55,.2);border-radius:3px;overflow:hidden;">',
            '<div style="height:20px;background:rgba(212,175,55,.07);margin-bottom:4px;"></div>',
            '<div style="padding:0 5px 5px;"><div style="width:65%;height:4px;background:rgba(226,217,200,.7);border-radius:1px;margin-bottom:3px;"></div>',
            '<div style="width:40%;height:4px;background:#d4af37;border-radius:1px;margin-bottom:4px;"></div>',
            '<div style="height:8px;background:rgba(212,175,55,.2);border:1px solid rgba(212,175,55,.3);border-radius:2px;"></div></div>',
          '</div>',
          '<div style="flex:1;background:rgba(255,255,255,.04);border:1px solid rgba(212,175,55,.2);border-radius:3px;overflow:hidden;">',
            '<div style="height:20px;background:rgba(212,175,55,.07);margin-bottom:4px;"></div>',
            '<div style="padding:0 5px 5px;"><div style="width:65%;height:4px;background:rgba(226,217,200,.7);border-radius:1px;margin-bottom:3px;"></div>',
            '<div style="width:40%;height:4px;background:#d4af37;border-radius:1px;margin-bottom:4px;"></div>',
            '<div style="height:8px;background:rgba(212,175,55,.2);border:1px solid rgba(212,175,55,.3);border-radius:2px;"></div></div>',
          '</div>',
          '<div style="flex:1;background:rgba(255,255,255,.04);border:1px solid rgba(212,175,55,.2);border-radius:3px;overflow:hidden;">',
            '<div style="height:20px;background:rgba(212,175,55,.07);margin-bottom:4px;"></div>',
            '<div style="padding:0 5px 5px;"><div style="width:65%;height:4px;background:rgba(226,217,200,.7);border-radius:1px;margin-bottom:3px;"></div>',
            '<div style="width:40%;height:4px;background:#d4af37;border-radius:1px;margin-bottom:4px;"></div>',
            '<div style="height:8px;background:rgba(212,175,55,.2);border:1px solid rgba(212,175,55,.3);border-radius:2px;"></div></div>',
          '</div>',
        '</div>',
      '</div>',
      '<div style="background:#04040a;border-top:1px solid rgba(255,255,255,.05);padding:9px 14px;text-align:center;">',
        '<div style="width:22%;height:3px;background:rgba(212,175,55,.25);margin:0 auto;"></div>',
      '</div>'
    ].join('');
  }
  if (t.id === 'ecom-spark') {
    return [
      '<div style="background:#fff;border-bottom:1px solid #f1f5f9;display:flex;align-items:center;padding:0 12px;height:28px;">',
        '<div style="width:36px;height:7px;background:#0f172a;border-radius:4px;font-weight:900;"></div>',
        '<div style="margin-left:auto;display:flex;gap:4px;">',
          '<div style="width:18px;height:5px;background:#f1f5f9;border-radius:3px;"></div>',
          '<div style="width:18px;height:5px;background:#f1f5f9;border-radius:3px;"></div>',
          '<div style="width:28px;height:5px;background:#f43f5e;border-radius:3px;opacity:.25;"></div>',
        '</div>',
      '</div>',
      '<div style="background:#fff;padding:18px 14px;text-align:center;">',
        '<div style="display:inline-block;width:44px;height:8px;background:#fff1f0;border:1px solid #fecdd3;border-radius:20px;margin-bottom:7px;"></div>',
        '<div style="width:64%;height:10px;background:#0f172a;border-radius:4px;margin:0 auto 7px;letter-spacing:-2px;"></div>',
        '<div style="width:40%;height:5px;background:#e2e8f0;border-radius:3px;margin:0 auto 12px;"></div>',
        '<div style="display:inline-block;width:56px;height:15px;background:#f43f5e;border-radius:30px;box-shadow:0 3px 10px rgba(244,63,94,.4);"></div>',
      '</div>',
      '<div style="background:#fafafa;padding:10px 12px;">',
        '<div style="width:28%;height:6px;background:#0f172a;border-radius:4px;margin:0 auto 2px;"></div>',
        '<div style="width:18%;height:4px;background:#f43f5e;border-radius:3px;margin:0 auto 8px;"></div>',
        '<div style="display:flex;gap:5px;">',
          '<div style="flex:1;background:#fff;border:1.5px solid #f1f5f9;border-radius:10px;overflow:hidden;">',
            '<div style="height:20px;background:#fff1f0;position:relative;"><div style="position:absolute;top:2px;right:2px;width:10px;height:6px;background:#f43f5e;border-radius:2px;"></div></div>',
            '<div style="padding:0 5px 5px;"><div style="width:65%;height:4px;background:#0f172a;border-radius:2px;margin-bottom:3px;"></div>',
            '<div style="width:40%;height:4px;background:#f43f5e;border-radius:2px;margin-bottom:4px;"></div>',
            '<div style="height:8px;background:#f43f5e;border-radius:20px;"></div></div>',
          '</div>',
          '<div style="flex:1;background:#fff;border:1.5px solid #f1f5f9;border-radius:10px;overflow:hidden;">',
            '<div style="height:20px;background:#fff1f0;margin-bottom:4px;"></div>',
            '<div style="padding:0 5px 5px;"><div style="width:65%;height:4px;background:#0f172a;border-radius:2px;margin-bottom:3px;"></div>',
            '<div style="width:40%;height:4px;background:#f43f5e;border-radius:2px;margin-bottom:4px;"></div>',
            '<div style="height:8px;background:#f43f5e;border-radius:20px;"></div></div>',
          '</div>',
          '<div style="flex:1;background:#fff;border:1.5px solid #f1f5f9;border-radius:10px;overflow:hidden;">',
            '<div style="height:20px;background:#fff1f0;margin-bottom:4px;"></div>',
            '<div style="padding:0 5px 5px;"><div style="width:65%;height:4px;background:#0f172a;border-radius:2px;margin-bottom:3px;"></div>',
            '<div style="width:40%;height:4px;background:#f43f5e;border-radius:2px;margin-bottom:4px;"></div>',
            '<div style="height:8px;background:#f43f5e;border-radius:20px;"></div></div>',
          '</div>',
        '</div>',
      '</div>',
      '<div style="background:#0f172a;padding:9px 14px;text-align:center;">',
        '<div style="width:22%;height:4px;background:rgba(255,255,255,.15);border-radius:3px;margin:0 auto;"></div>',
      '</div>'
    ].join('');
  }
  return '';
}

/* ═══════════════════════════════════════════
   PREBUILT SECTIONS PICKER
═══════════════════════════════════════════ */
var PREBUILT_CATS = [
  { id:'hero',         label:'Hero',         icon:'🦸', sub:'Page hero sections',             bg:'#ede9fe' },
  { id:'about',        label:'About',        icon:'👤', sub:'About / intro sections',          bg:'#fef3c7' },
  { id:'services',     label:'Services',     icon:'⚡', sub:'Services & features',             bg:'#dbeafe' },
  { id:'pricing',      label:'Pricing',      icon:'💰', sub:'Pricing plans & tiers',           bg:'#dcfce7' },
  { id:'stats',        label:'Stats',        icon:'📊', sub:'Key numbers & metrics',           bg:'#fce7f3' },
  { id:'testimonials', label:'Testimonials', icon:'💬', sub:'Client reviews & quotes',         bg:'#eff6ff' },
  { id:'team',         label:'Team',         icon:'👥', sub:'Team member profiles',            bg:'#f5f3ff' },
  { id:'faq',          label:'FAQ',          icon:'❓', sub:'Frequently asked questions',      bg:'#fefce8' },
  { id:'cta',          label:'CTA Banner',   icon:'📣', sub:'Call-to-action banners',          bg:'#fff1f2' },
  { id:'gallery',      label:'Gallery',      icon:'🖼', sub:'Photo & image galleries',         bg:'#f0fdf4' },
  { id:'video',        label:'Video',        icon:'▶️', sub:'YouTube / Vimeo embed',           bg:'#f0f9ff' },
  { id:'logobar',      label:'Logo Bar',     icon:'🏷', sub:'Client & partner logos',          bg:'#f8fafc' },
  { id:'timeline',     label:'Timeline',     icon:'🗂', sub:'Process steps & milestones',      bg:'#fdf2f8' },
  { id:'columns',      label:'Columns',      icon:'⬛', sub:'Multi-column layouts',            bg:'#f3f4f6' },
  { id:'rich_text',    label:'Rich Text',    icon:'📝', sub:'Text & content blocks',           bg:'#fefce8' },
  { id:'newsletter',   label:'Newsletter',   icon:'📧', sub:'Email subscribe sections',        bg:'#ecfdf5' },
  { id:'contact',      label:'Contact',      icon:'📬', sub:'Contact forms & info',            bg:'#f8fafc' },
  { id:'product_grid',      label:'Products',    icon:'🛍️', sub:'Dynamic product grid from your catalog',     bg:'#dcfce7' },
  { id:'property_listings', label:'Properties',  icon:'🏠', sub:'Dynamic property listings from your catalog', bg:'#e0f2fe' }
  // Theme-specific sections are registered by each theme's sections.js
  // via registerThemeSections() — see themes/website/<id>/sections.js
];

var PREBUILT_VARIANTS = {
  hero: [
    { label:'Bold Center', desc:'Large headline on gradient background with dashboard visual', color:'#6366f1', tag:'popular',
      data:{ layout:'centered', headline:'Welcome to Our Website', subheadline:'We deliver exceptional results for every client, on time and on budget.', cta_label:'Get Started', cta_url:'#contact', cta2_label:'Learn More', cta2_url:'#about', bg_color:PRIMARY, text_color:'#ffffff' } },
    { label:'Dark Hero', desc:'Dramatic dark background with bright button and visual', color:'#0f172a',
      data:{ layout:'centered', headline:'Build Something Amazing', subheadline:'Professional solutions for modern businesses that want to stand out.', cta_label:'Start Today', cta_url:'#contact', cta2_label:'See Our Work', cta2_url:'#services', bg_color:'#0f172a', text_color:'#ffffff' } },
    { label:'Light & Clean', desc:'White background split layout with visual and floating cards', color:'#f0f9ff',
      data:{ layout:'split', headline:'Your Vision, Delivered', subheadline:'Helping businesses grow since 2015. We create digital experiences that drive real results.', cta_label:'Learn More', cta_url:'#about', cta2_label:'Our Services', cta2_url:'#services', bg_color:'#f0f9ff', text_color:'#111827' } }
  ],
  about: [
    { label:'Image Right', desc:'Text on the left, image placeholder on the right', color:'#fff',
      data:{ heading:'About Us', text:'Tell your story here. What makes you unique? What values drive your work?', image:'', layout:'image_right' } },
    { label:'Image Left', desc:'Image placeholder on the left, text on the right', color:'#fff',
      data:{ heading:'Our Story', text:'We started with a simple mission — to make great things happen for our clients.', image:'', layout:'image_left' } },
    { label:'Full Width Text', desc:'No image, powerful full-width text block', color:'#f9fafb',
      data:{ heading:'Who We Are', text:'We are a team of passionate professionals dedicated to excellence in everything we do.', image:'', layout:'full_text' } }
  ],
  services: [
    { label:'3 Cards', desc:'Three service offering cards', color:'#f9fafb', tag:'popular',
      data:{ heading:'Our Services', items:[{icon:'⚡',title:'Strategy',desc:'We plan for your success.'},{icon:'🎨',title:'Design',desc:'Beautiful experiences that convert.'},{icon:'📈',title:'Growth',desc:'Scale your business faster.'}] } },
    { label:'4 Cards', desc:'Four service offerings', color:'#f9fafb',
      data:{ heading:'What We Do', items:[{icon:'🚀',title:'Launch',desc:'Get to market fast.'},{icon:'🎯',title:'Target',desc:'Reach the right audience.'},{icon:'⚙️',title:'Build',desc:'Robust solutions.'},{icon:'💎',title:'Quality',desc:'Premium at every step.'}] } },
    { label:'6 Cards', desc:'Full range of six services', color:'#f9fafb',
      data:{ heading:'Our Expertise', items:[{icon:'⚡',title:'Service 1',desc:'Short description.'},{icon:'🎯',title:'Service 2',desc:'Short description.'},{icon:'💎',title:'Service 3',desc:'Short description.'},{icon:'🚀',title:'Service 4',desc:'Short description.'},{icon:'🎨',title:'Service 5',desc:'Short description.'},{icon:'📈',title:'Service 6',desc:'Short description.'}] } }
  ],
  pricing: [
    { label:'3 Tiers', desc:'Basic, Pro, and Enterprise plans', color:'#f9fafb',
      data:{ heading:'Our Pricing', subtitle:'Simple, transparent pricing.', plans:[{name:'Basic',price:'₹999/mo',features:'Feature one\nFeature two\nFeature three',cta:'Get Started',link:'#contact',featured:'no'},{name:'Pro',price:'₹1,999/mo',features:'Everything in Basic\nFeature four\nPriority support',cta:'Get Started',link:'#contact',featured:'yes'},{name:'Enterprise',price:'Custom',features:'Everything in Pro\nDedicated support\nCustom integrations',cta:'Contact Us',link:'#contact',featured:'no'}] } },
    { label:'2 Tiers', desc:'Free vs Pro comparison', color:'#f9fafb',
      data:{ heading:'Choose Your Plan', subtitle:'Start free, upgrade anytime.', plans:[{name:'Free',price:'₹0/mo',features:'Basic features\nUp to 5 users\nEmail support',cta:'Start Free',link:'#contact',featured:'no'},{name:'Pro',price:'₹2,499/mo',features:'All features\nUnlimited users\nPriority support',cta:'Upgrade Now',link:'#contact',featured:'yes'}] } }
  ],
  stats: [
    { label:'4 Stats', desc:'Four key impact numbers with icons', color:'#fff',
      data:{ heading:'By the Numbers', items:[{number:'500+',label:'Happy Clients',emoji:'😊'},{number:'10+',label:'Years Experience',emoji:'📅'},{number:'99%',label:'Satisfaction Rate',emoji:'⭐'},{number:'24/7',label:'Support',emoji:'🛟'}] } },
    { label:'3 Stats', desc:'Three bold metrics', color:'#fff',
      data:{ heading:'Our Impact', items:[{number:'1,000+',label:'Projects Delivered',emoji:'🚀'},{number:'50+',label:'Team Members',emoji:'👥'},{number:'₹10Cr+',label:'Revenue Generated',emoji:'💰'}] } }
  ],
  testimonials: [
    { label:'3 Cards', desc:'Three client testimonials in a grid', color:'#f9fafb',
      data:{ heading:'What Clients Say', items:[{name:'Priya Sharma',role:'CEO, TechStartup',quote:'This service changed our business completely!'},{name:'Rahul Verma',role:'Founder, GrowFast',quote:'Incredible results, highly recommended.'},{name:'Anita Patel',role:'Marketing Head, BigBrand',quote:'Professional, fast, and reliable.'}] } },
    { label:'2 Cards', desc:'Two prominent testimonials', color:'#f9fafb',
      data:{ heading:'Client Love', items:[{name:'Vikram Singh',role:'Director, Innovation Co',quote:'Absolutely transformed our online presence and doubled our leads.'},{name:'Meera Nair',role:'CEO, Buildify',quote:'Best investment we made this year. Highly professional team.'}] } }
  ],
  team: [
    { label:'3 Members', desc:'Three team member cards', color:'#fff',
      data:{ heading:'Meet the Team', items:[{name:'Arjun Mehta',role:'Founder & CEO',image:''},{name:'Sneha Kapoor',role:'Lead Designer',image:''},{name:'Dev Patel',role:'Head of Technology',image:''}] } },
    { label:'4 Members', desc:'Four team member cards', color:'#fff',
      data:{ heading:'Our Team', items:[{name:'Arjun Mehta',role:'CEO',image:''},{name:'Sneha Kapoor',role:'Designer',image:''},{name:'Dev Patel',role:'Developer',image:''},{name:'Riya Shah',role:'Marketing',image:''}] } }
  ],
  faq: [
    { label:'4 Questions', desc:'Accordion FAQ with four questions', color:'#f9fafb',
      data:{ heading:'Frequently Asked Questions', items:[{q:'What do you offer?',a:'We offer premium services tailored to your needs.'},{q:'How long does it take?',a:'Most projects are completed within 2–4 weeks.'},{q:'Do you offer support?',a:'Yes, we provide ongoing support to all clients.'},{q:'What is the pricing?',a:'Pricing varies by project. Contact us for a quote.'}] } },
    { label:'3 Questions', desc:'Short FAQ — three key questions', color:'#f9fafb',
      data:{ heading:'Got Questions?', items:[{q:'How do I get started?',a:'Simply contact us and we\'ll schedule a call.'},{q:'Can I cancel anytime?',a:'Yes, no long-term contracts.'},{q:'Is there a free trial?',a:'Yes, we offer a 14-day free trial.'}] } }
  ],
  cta: [
    { label:'Dark Banner', desc:'High-contrast dark call to action', color:'#111827',
      data:{ heading:'Ready to Get Started?', subheading:'Join hundreds of happy customers today.', cta_label:'Contact Us', cta_url:'#contact', bg_color:'#111827', text_color:'#ffffff' } },
    { label:'Brand Color', desc:'Primary color call to action', color:PRIMARY,
      data:{ heading:'Let\'s Work Together', subheading:'Reach out and let\'s build something great.', cta_label:'Get in Touch', cta_url:'#contact', bg_color:PRIMARY, text_color:'#ffffff' } },
    { label:'Light', desc:'Subtle CTA on light background', color:'#f8fafc',
      data:{ heading:'Take the Next Step', subheading:'We\'re ready when you are.', cta_label:'Start Now →', cta_url:'#contact', bg_color:'#f8fafc', text_color:'#111827' } }
  ],
  gallery: [
    { label:'3-Col Grid', desc:'3-column photo grid with heading', color:'#fff',
      data:{ heading:'Our Work', images:[], columns:'3', aspect:'4/3' } },
    { label:'4-Col Grid', desc:'Compact 4-column image grid', color:'#fff',
      data:{ heading:'Gallery', images:[], columns:'4', aspect:'1/1' } },
    { label:'2-Col Wide', desc:'Large two-column landscape gallery', color:'#fff',
      data:{ heading:'Portfolio', images:[], columns:'2', aspect:'16/9' } },
    { label:'Auto Grid', desc:'Responsive auto-filling grid, no heading', color:'#fff',
      data:{ heading:'', images:[], columns:'auto', aspect:'4/3' } }
  ],
  video: [
    { label:'With Heading', desc:'Video embed with a section title', color:'#fff',
      data:{ heading:'Watch Our Story', url:'', embed_url:'', caption:'' } },
    { label:'Video Only', desc:'Full-width video, no heading', color:'#fff',
      data:{ heading:'', url:'', embed_url:'', caption:'' } }
  ],
  logobar: [
    { label:'Trusted By', desc:'Logo strip with "Trusted By" heading', color:'#f9fafb',
      data:{ heading:'Trusted By', logos:[{url:'',alt:'Company One'},{url:'',alt:'Company Two'},{url:'',alt:'Company Three'},{url:'',alt:'Company Four'},{url:'',alt:'Company Five'}] } },
    { label:'Partners', desc:'Partners strip without heading', color:'#f9fafb',
      data:{ heading:'', logos:[{url:'',alt:'Partner A'},{url:'',alt:'Partner B'},{url:'',alt:'Partner C'},{url:'',alt:'Partner D'}] } }
  ],
  timeline: [
    { label:'Process Steps', desc:'Numbered steps — great for "How It Works"', color:'#fff',
      data:{ heading:'How It Works', items:[{step:'1',title:'Discovery',desc:'We learn about your goals and requirements.'},{step:'2',title:'Strategy',desc:'We craft a tailored plan for your success.'},{step:'3',title:'Execution',desc:'We build and deliver with precision.'},{step:'4',title:'Launch',desc:'We go live and support you every step.'}] } },
    { label:'Milestones', desc:'Year-based company history timeline', color:'#fff',
      data:{ heading:'Our Journey', items:[{step:'2019',title:'Founded',desc:'Started with a small team and big dreams.'},{step:'2021',title:'100 Clients',desc:'Reached a major milestone in growth.'},{step:'2023',title:'Expanded',desc:'Grew to 20+ talented professionals.'},{step:'2024',title:'Global',desc:'Now serving clients across the world.'}] } }
  ],
  columns: [
    { label:'3 Columns', desc:'Three equal content columns with icons', color:'#fff',
      data:{ heading:'', cols:'3', bg:'white', items:[{emoji:'✨',heading:'Column One',text:'Add your content here.',btn_text:'',btn_link:''},{emoji:'🎯',heading:'Column Two',text:'Add your content here.',btn_text:'',btn_link:''},{emoji:'💎',heading:'Column Three',text:'Add your content here.',btn_text:'',btn_link:''}] } },
    { label:'2 Columns', desc:'Two equal columns with buttons', color:'#fff',
      data:{ heading:'', cols:'2', bg:'white', items:[{emoji:'🚀',heading:'Left Column',text:'Add your content here.',btn_text:'Learn More',btn_link:'#'},{emoji:'💡',heading:'Right Column',text:'Add your content here.',btn_text:'Learn More',btn_link:'#'}] } }
  ],
  rich_text: [
    { label:'Left Aligned', desc:'Text block aligned left with a title', color:'#fff',
      data:{ title:'Our Approach', content:'Write your content here. Share your story, mission, or any information that matters.\n\nAdd another paragraph for more depth.', align:'left' } },
    { label:'Centered', desc:'Centered text — great for mission statements', color:'#fff',
      data:{ title:'A Message From Us', content:'Thank you for visiting. We are dedicated to providing the best possible service.\n\nWe look forward to working with you.', align:'center' } }
  ],
  newsletter: [
    { label:'Subscribe Banner', desc:'Newsletter signup with subtext', color:'#f9fafb',
      data:{ heading:'Stay in the Loop', subtext:'Get the latest news and updates straight to your inbox.', placeholder:'Enter your email', cta:'Subscribe' } },
    { label:'Minimal', desc:'Simple compact signup form', color:'#f9fafb',
      data:{ heading:'Get Updates', subtext:'No spam, unsubscribe anytime.', placeholder:'your@email.com', cta:'Join Now' } }
  ],
  contact: [
    { label:'Form + Info', desc:'Contact form alongside email, phone & address', color:'#fff',
      data:{ heading:'Get in Touch', email:'contact@example.com', phone:'+91 98765 43210', address:'123 Main Street, City, State' } },
    { label:'Form Only', desc:'Clean form with heading, no contact details', color:'#fff',
      data:{ heading:'Send Us a Message', email:'', phone:'', address:'' } }
  ],
  product_grid: [
    { label:'Product Grid', desc:'Responsive grid of products loaded dynamically from your catalog', color:'#dcfce7', tag:'dynamic',
      data:{ heading:'Our Products', subheading:'Handpicked for you', limit:'6', category:'', sort_by:'newest' } },
    { label:'Category Shop', desc:'Filter by a specific category — great for landing pages', color:'#d1fae5',
      data:{ heading:'Shop Collection', subheading:'', limit:'8', category:'', sort_by:'newest' } },
    { label:'Featured Only', desc:'Show just 3–4 hero products above the fold', color:'#ecfdf5',
      data:{ heading:'Featured Products', subheading:'Our best sellers', limit:'4', category:'', sort_by:'featured' } }
  ],
  property_listings: [
    { label:'Property Grid', desc:'Grid of properties with price, location, and key details', color:'#e0f2fe', tag:'dynamic',
      data:{ heading:'Featured Properties', subheading:'Hand-picked by our agents', limit:'6', category:'', sort_by:'newest' } },
    { label:'New Listings', desc:'Highlight the latest additions from your property catalog', color:'#bae6fd',
      data:{ heading:'New Listings', subheading:'Fresh properties added this week', limit:'9', category:'', sort_by:'newest' } },
    { label:'By Price', desc:'Show properties sorted from lowest to highest price', color:'#e0f7fa',
      data:{ heading:'Properties', subheading:'Sorted by price', limit:'6', category:'', sort_by:'price_asc' } }
  ],
  // Theme-specific variants are registered by each theme's sections.js
  // via registerThemeSections({ variants: { ... } })
  __noop__: []
  // Theme-specific variants are in each theme's sections.js → THEME_SECTIONS.variants
};

var _spActiveCat = 'hero';

function openSectionPicker() {
  var themeCats = THEME_SECTIONS.cats.slice();
  _spActiveCat = themeCats.length ? themeCats[0].id : 'hero';
  _spSearch = '';
  var searchEl = document.getElementById('spSearch');
  if (searchEl) searchEl.value = '';
  spRenderSidebar();
  spRenderGrid(_spActiveCat);
  document.getElementById('sectionPicker').style.display = 'flex';
}

function closeSectionPicker() {
  document.getElementById('sectionPicker').style.display = 'none';
}

var _spSearch = '';

function spRenderSidebar() {
  var el = document.getElementById('spSidebar');
  var themeCats   = THEME_SECTIONS.cats.slice(); // loaded from theme's sections.js
  var genericCats = PREBUILT_CATS.filter(function(c){ return !c.themes; });
  function renderCatItem(cat) {
    var isActive = cat.id === _spActiveCat;
    return '<div class="sp-cat-item' + (isActive ? ' active' : '') + '" onclick="spSetCat(\'' + cat.id + '\')">' +
      '<span class="sp-cat-icon" style="background:' + (cat.bg || '#f3f4f6') + '">' + cat.icon + '</span>' +
      escHtml(cat.label) +
    '</div>';
  }
  var html = '';
  if (themeCats.length) {
    html += '<div class="sp-cat-label" style="color:var(--primary,#6366f1);">✦ This Theme</div>';
    html += themeCats.map(renderCatItem).join('');
    html += '<div class="sp-cat-label" style="margin-top:10px;">General</div>';
  } else {
    html += '<div class="sp-cat-label">Section type</div>';
  }
  html += genericCats.map(renderCatItem).join('');
  el.innerHTML = html;
}

function spSetCat(catId) {
  _spActiveCat = catId;
  _spSearch = '';
  var searchEl = document.getElementById('spSearch');
  if (searchEl) searchEl.value = '';
  spRenderSidebar();
  spRenderGrid(catId);
}

function _spCardHTML(catId, i, v) {
  var tagHtml = '';
  if (v.tag === 'popular') tagHtml = '<span class="sp-tag sp-tag-popular">⭐ Popular</span>';
  else if (v.tag === 'new') tagHtml = '<span class="sp-tag sp-tag-new">✦ New</span>';
  return '<div class="sp-card">' +
    '<div class="sp-preview">' + spPreviewHTML(catId, i, v) +
      '<div class="sp-overlay"><button class="sp-overlay-btn" onclick="spAddSection(\'' + catId + '\',' + i + ')">＋ Add section</button></div>' +
    '</div>' +
    '<div class="sp-card-info">' +
      '<div class="sp-card-name">' + escHtml(v.label) + '</div>' +
      '<div class="sp-card-desc">' + escHtml(v.desc) + '</div>' +
      '<div class="sp-card-foot">' +
        '<button class="sp-add-btn" onclick="spAddSection(\'' + catId + '\',' + i + ')">＋ Add section</button>' +
        tagHtml +
      '</div>' +
    '</div>' +
  '</div>';
}

function spRenderGrid(catId, filter) {
  var cat = PREBUILT_CATS.find(function(c){ return c.id === catId; }) ||
            THEME_SECTIONS.cats.find(function(c){ return c.id === catId; });
  var variants = PREBUILT_VARIANTS[catId] || THEME_SECTIONS.variants[catId] || [];
  document.getElementById('spSectionTitle').textContent = cat ? cat.icon + ' ' + cat.label : catId;
  document.getElementById('spSectionSub').textContent = cat ? cat.sub : '';

  var q = (filter || '').toLowerCase().trim();
  var filtered = q
    ? variants.filter(function(v){ return (v.label + ' ' + v.desc).toLowerCase().includes(q); })
    : variants;

  document.getElementById('spGrid').innerHTML = filtered.length
    ? filtered.map(function(v, i) { return _spCardHTML(catId, variants.indexOf(v), v); }).join('')
    : '<div class="sp-no-results">No layouts found for "<strong>' + escHtml(q) + '</strong>"</div>';
}

function spFilterSearch(q) {
  _spSearch = q;
  spRenderGrid(_spActiveCat, q);
}

function spAddSection(catId, variantIdx) {
  var variants = PREBUILT_VARIANTS[catId] || [];
  var variant = variants[variantIdx];
  if (!variant) return;
  var sec = { id:'sec_' + Date.now(), type:catId, data:JSON.parse(JSON.stringify(variant.data)) };
  if (_insertAfter) {
    var idx = sections.findIndex(function(s){ return s.id === _insertAfter; });
    if (idx >= 0) sections.splice(idx + 1, 0, sec);
    else sections.push(sec);
    _insertAfter = null;
  } else {
    sections.push(sec);
  }
  closeSectionPicker();
  renderCanvas();
  openSectionEdit(sec.id);
  pushUndo();
  setStatus('saving');
  clearTimeout(autoSaveTimer);
  autoSaveTimer = setTimeout(saveSections, 2000);
}

// ─── Realistic scaled section previews ────────────────────────────────────────

function _spIsLight(hex) {
  if (!hex || hex[0] !== '#') return true;
  var r = parseInt(hex.slice(1,3),16)||0, g = parseInt(hex.slice(3,5),16)||0, b = parseInt(hex.slice(5,7),16)||0;
  return (0.299*r + 0.587*g + 0.114*b) / 255 > 0.5;
}

function _spNavBar(TC, AC) {
  var dark = TC === '#ffffff';
  var border = dark ? 'rgba(255,255,255,0.1)' : '#e5e7eb';
  var linkCol = dark ? 'rgba(255,255,255,0.6)' : '#6b7280';
  var btnBg = dark ? 'rgba(255,255,255,0.15)' : AC;
  return '<div style="display:flex;align-items:center;justify-content:space-between;padding:22px 56px;border-bottom:1px solid '+border+';box-sizing:border-box;">' +
    '<div style="font-size:20px;font-weight:800;color:'+TC+';letter-spacing:-0.5px;">Brand</div>' +
    '<div style="display:flex;gap:28px;">' +
      ['Home','About','Services','Contact'].map(function(l){ return '<span style="font-size:14px;color:'+linkCol+';">'+l+'</span>'; }).join('') +
    '</div>' +
    '<div style="padding:9px 22px;background:'+btnBg+';border-radius:9px;font-size:13px;font-weight:700;color:'+(dark?TC:'#fff')+';">Get Started</div>' +
  '</div>';
}

function spPreviewHTML(type, idx, variant) {
  var d = variant.data || {};
  var AC = siteSettings.primary || PRIMARY || '#6366f1';
  var BG = d.bg_color || variant.color || '#f9fafb';
  var light = _spIsLight(BG);
  var TC = d.text_color || (light ? '#111827' : '#ffffff');
  var html = _spRealisticPreview(type, d, BG, TC, AC, variant);
  return '<div style="position:absolute;top:0;left:0;width:1000px;transform:scale(0.218);transform-origin:top left;pointer-events:none;font-family:Inter,system-ui,sans-serif;line-height:1.5;overflow:hidden;">' + html + '</div>';
}

function _spRealisticPreview(type, d, BG, TC, AC, variant) {
  // Theme-specific section previews handled by theme's sections.js
  if (THEME_SECTIONS.preview[type]) {
    return THEME_SECTIONS.preview[type](type, d, BG, TC, AC, variant);
  }

  var dark = TC === '#ffffff';
  var muted = dark ? 'rgba(255,255,255,0.55)' : '#6b7280';
  var cardBg = dark ? 'rgba(255,255,255,0.07)' : '#ffffff';
  var cardBorder = dark ? 'rgba(255,255,255,0.12)' : '#e5e7eb';
  var sep = dark ? 'rgba(255,255,255,0.1)' : '#f3f4f6';

  switch (type) {

    case 'hero': {
      var hl = escHtml(d.headline || 'Build Something Extraordinary');
      var sub = escHtml(d.subheadline || 'We help businesses grow with creative solutions that drive real results.');
      var cta = escHtml(d.cta_label || 'Get Started');
      var cta2 = escHtml(d.cta2_label || 'Learn More');
      var layout = d.layout || 'centered';
      var btnBg = dark ? '#ffffff' : AC;
      var btnTc = dark ? BG : '#ffffff';
      var btn2Border = dark ? 'rgba(255,255,255,0.25)' : '#d1d5db';

      // ── Stats row (appears below hero on the preview page) ──
      var hStatsRow =
        '<div style="background:'+(dark?'rgba(255,255,255,0.04)':'#f8fafc')+';border-top:1px solid '+(dark?'rgba(255,255,255,0.07)':'#e5e7eb')+';padding:38px 56px;display:flex;gap:0;">' +
          [['100M+','Monthly active users'],['200k+','Results delivered'],['150','Countries served']].map(function(s,si){
            return '<div style="flex:1;'+(si>0?'border-left:1px solid '+(dark?'rgba(255,255,255,0.07)':'#e5e7eb')+';padding-left:36px;':'')+'">' +
              '<div style="font-size:38px;font-weight:800;color:'+(dark?'#fff':AC)+';line-height:1;">'+s[0]+'</div>' +
              '<div style="font-size:14px;color:'+muted+';margin-top:6px;">'+s[1]+'</div>' +
            '</div>';
          }).join('') +
        '</div>';

      // ── Services preview (dark section below stats) ──
      var hServicesSection =
        '<div style="background:#0f172a;padding:60px 56px;">' +
          '<div style="font-size:13px;font-weight:700;color:'+AC+';letter-spacing:2px;text-transform:uppercase;text-align:center;margin-bottom:10px;">Our services</div>' +
          '<div style="font-size:34px;font-weight:800;color:#ffffff;text-align:center;margin-bottom:36px;">Impactful solutions for business</div>' +
          '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:16px;">' +
            [
              {icon:'🎯',title:'Strategy',desc:'Actionable plans built around your goals and vision.'},
              {icon:'📊',title:'Analytics',desc:'Data-driven insights that inform every decision.'},
              {icon:'🚀',title:'Growth',desc:'Campaigns that convert and scale your business.'}
            ].map(function(s){
              return '<div style="background:rgba(255,255,255,0.055);border:1px solid rgba(255,255,255,0.08);border-radius:14px;padding:24px 20px;">' +
                '<div style="width:44px;height:44px;background:'+AC+'44;border-radius:11px;display:flex;align-items:center;justify-content:center;font-size:22px;margin-bottom:14px;">'+s.icon+'</div>' +
                '<div style="font-size:17px;font-weight:700;color:#fff;margin-bottom:8px;">'+s.title+'</div>' +
                '<div style="font-size:13px;color:rgba(255,255,255,0.45);line-height:1.6;">'+s.desc+'</div>' +
              '</div>';
            }).join('') +
          '</div>' +
        '</div>';

      // ── Person block (used in split layout) ──
      var personBlock =
        '<div style="flex:1;position:relative;min-height:420px;">' +
          // Main gradient image card
          '<div style="position:absolute;top:0;right:0;bottom:0;left:40px;background:linear-gradient(140deg,'+AC+'18,'+AC+'08);border-radius:24px;overflow:hidden;">' +
            // Person 1 — right side, large
            '<div style="position:absolute;bottom:0;right:0;width:55%;height:90%;background:linear-gradient(155deg,'+AC+',#8b5cf6);border-radius:20px 0 0 0;overflow:hidden;">' +
              '<svg viewBox="0 0 220 340" xmlns="http://www.w3.org/2000/svg" style="position:absolute;bottom:0;width:100%;height:100%;">' +
                '<ellipse cx="110" cy="88" rx="46" ry="50" fill="rgba(255,255,255,0.38)"/>' +
                '<path d="M0 340 Q110 180 220 340 Z" fill="rgba(255,255,255,0.22)"/>' +
              '</svg>' +
            '</div>' +
            // Person 2 — left side
            '<div style="position:absolute;bottom:0;left:0;width:48%;height:80%;background:linear-gradient(155deg,#f59e0b,#ef4444);border-radius:0 20px 0 24px;overflow:hidden;">' +
              '<svg viewBox="0 0 200 300" xmlns="http://www.w3.org/2000/svg" style="position:absolute;bottom:0;width:100%;height:100%;">' +
                '<ellipse cx="100" cy="80" rx="42" ry="46" fill="rgba(255,255,255,0.38)"/>' +
                '<path d="M0 300 Q100 160 200 300 Z" fill="rgba(255,255,255,0.22)"/>' +
              '</svg>' +
            '</div>' +
          '</div>' +
          // Floating metric card — bottom left
          '<div style="position:absolute;bottom:36px;left:0;background:#fff;border-radius:16px;padding:16px 20px;box-shadow:0 16px 48px rgba(0,0,0,0.14);min-width:180px;">' +
            '<div style="font-size:11px;color:#9ca3af;font-weight:500;margin-bottom:5px;">Monthly Users</div>' +
            '<div style="font-size:26px;font-weight:800;color:#111827;line-height:1;">100M+</div>' +
            '<div style="font-size:11px;color:#10b981;font-weight:700;margin-top:5px;">↑ 24% this month</div>' +
          '</div>' +
          // Floating chart card — top left
          '<div style="position:absolute;top:24px;left:0;background:#fff;border-radius:16px;padding:14px 16px;box-shadow:0 16px 48px rgba(0,0,0,0.12);">' +
            '<div style="display:flex;gap:10px;align-items:center;margin-bottom:10px;">' +
              '<div style="width:36px;height:36px;border-radius:10px;background:'+AC+'22;display:flex;align-items:center;justify-content:center;font-size:17px;">📈</div>' +
              '<div>' +
                '<div style="font-size:11px;color:#9ca3af;">Revenue</div>' +
                '<div style="font-size:16px;font-weight:700;color:#111827;">$48,294</div>' +
              '</div>' +
            '</div>' +
            '<div style="display:flex;gap:3px;align-items:flex-end;height:24px;">' +
              [30,50,40,65,55,80,70,95].map(function(h){ return '<div style="flex:1;background:'+AC+';border-radius:2px;height:'+h+'%;opacity:0.75;"></div>'; }).join('') +
            '</div>' +
          '</div>' +
        '</div>';

      // ── Dashboard / browser mockup (used in centered layout) ──
      var dashboardMockup =
        '<div style="max-width:740px;margin:0 auto;padding:0 56px;">' +
          '<div style="background:#1e293b;border-radius:16px 16px 0 0;padding:14px 18px 0;box-shadow:0 30px 80px rgba(0,0,0,0.28);">' +
            // Browser chrome
            '<div style="display:flex;align-items:center;gap:7px;margin-bottom:14px;">' +
              '<div style="width:12px;height:12px;border-radius:50%;background:#ef4444;"></div>' +
              '<div style="width:12px;height:12px;border-radius:50%;background:#f59e0b;"></div>' +
              '<div style="width:12px;height:12px;border-radius:50%;background:#22c55e;"></div>' +
              '<div style="flex:1;background:rgba(255,255,255,0.07);border-radius:5px;height:22px;margin-left:10px;"></div>' +
            '</div>' +
            // Dashboard body
            '<div style="background:linear-gradient(155deg,'+AC+'28,#8b5cf628);border-radius:10px 10px 0 0;padding:24px 20px 0;display:flex;gap:16px;align-items:flex-end;">' +
              // Person left
              '<div style="width:150px;flex-shrink:0;background:linear-gradient(145deg,'+AC+',#8b5cf6);border-radius:12px 12px 0 0;height:160px;overflow:hidden;position:relative;">' +
                '<svg viewBox="0 0 150 160" xmlns="http://www.w3.org/2000/svg" style="position:absolute;bottom:0;width:100%;height:100%;">' +
                  '<ellipse cx="75" cy="52" rx="34" ry="38" fill="rgba(255,255,255,0.4)"/>' +
                  '<path d="M0 160 Q75 90 150 160 Z" fill="rgba(255,255,255,0.28)"/>' +
                '</svg>' +
              '</div>' +
              // Chart area middle
              '<div style="flex:1;">' +
                '<div style="font-size:11px;color:rgba(255,255,255,0.45);font-weight:500;margin-bottom:10px;">Performance Overview</div>' +
                '<div style="display:flex;gap:5px;align-items:flex-end;height:100px;">' +
                  [42,60,50,78,58,88,72,95,68,100].map(function(h){
                    return '<div style="flex:1;background:linear-gradient(to top,'+AC+',#8b5cf6);border-radius:4px 4px 0 0;height:'+h+'%;opacity:0.85;"></div>';
                  }).join('') +
                '</div>' +
              '</div>' +
              // Person right
              '<div style="width:150px;flex-shrink:0;background:linear-gradient(145deg,#f59e0b,#f97316);border-radius:12px 12px 0 0;height:140px;overflow:hidden;position:relative;">' +
                '<svg viewBox="0 0 150 140" xmlns="http://www.w3.org/2000/svg" style="position:absolute;bottom:0;width:100%;height:100%;">' +
                  '<ellipse cx="75" cy="46" rx="34" ry="38" fill="rgba(255,255,255,0.4)"/>' +
                  '<path d="M0 140 Q75 75 150 140 Z" fill="rgba(255,255,255,0.28)"/>' +
                '</svg>' +
              '</div>' +
            '</div>' +
          '</div>' +
        '</div>';

      // ── Assemble hero content ──
      var heroBody;
      if (layout === 'split' || layout === 'split_image_right') {
        heroBody =
          '<div style="display:flex;align-items:center;gap:60px;padding:56px 56px 48px;">' +
            '<div style="flex:1;display:flex;flex-direction:column;">' +
              '<div style="display:inline-block;padding:6px 16px;background:'+AC+'22;color:'+AC+';border-radius:20px;font-size:13px;font-weight:600;margin-bottom:22px;letter-spacing:0.3px;">✦ New — See what\'s possible</div>' +
              '<div style="font-size:60px;font-weight:800;color:'+TC+';line-height:1.06;margin-bottom:18px;">'+hl+'</div>' +
              '<div style="font-size:18px;color:'+muted+';margin-bottom:36px;line-height:1.65;">'+sub+'</div>' +
              '<div style="display:flex;gap:14px;">' +
                '<div style="padding:14px 36px;background:'+btnBg+';color:'+btnTc+';border-radius:11px;font-size:16px;font-weight:700;box-shadow:0 4px 16px '+AC+'44;">'+cta+'</div>' +
                '<div style="padding:14px 36px;border:2px solid '+btn2Border+';color:'+TC+';border-radius:11px;font-size:16px;font-weight:600;">'+cta2+'</div>' +
              '</div>' +
            '</div>' +
            personBlock +
          '</div>';
      } else {
        heroBody =
          '<div style="padding:60px 56px 0;text-align:center;">' +
            '<div style="display:inline-block;padding:6px 18px;background:'+AC+'22;color:'+AC+';border-radius:20px;font-size:13px;font-weight:600;margin-bottom:22px;letter-spacing:0.3px;">✦ Introducing PageZaper</div>' +
            '<div style="font-size:66px;font-weight:800;color:'+TC+';line-height:1.05;margin-bottom:18px;max-width:780px;margin-left:auto;margin-right:auto;">'+hl+'</div>' +
            '<div style="font-size:19px;color:'+muted+';margin-bottom:40px;max-width:520px;margin-left:auto;margin-right:auto;line-height:1.65;">'+sub+'</div>' +
            '<div style="display:flex;gap:14px;justify-content:center;margin-bottom:52px;">' +
              '<div style="padding:15px 44px;background:'+btnBg+';color:'+btnTc+';border-radius:11px;font-size:17px;font-weight:700;box-shadow:0 4px 20px '+AC+'44;">'+cta+'</div>' +
              '<div style="padding:15px 44px;border:2px solid '+btn2Border+';color:'+TC+';border-radius:11px;font-size:17px;font-weight:600;">'+cta2+'</div>' +
            '</div>' +
            dashboardMockup +
          '</div>';
      }

      return '<div style="background:'+BG+';">' + _spNavBar(TC,AC) + heroBody + '</div>' +
             hStatsRow +
             hServicesSection;
    }

    case 'about': {
      var aBg = '#ffffff';
      var aHd = escHtml(d.heading || 'Who We Are');
      var aTx = escHtml(d.text || 'We are a passionate team dedicated to delivering exceptional results. Our mission is to help businesses grow and succeed.');
      if (d.layout === 'full_text') {
        return '<div style="background:'+aBg+';padding:80px 80px;">' +
          '<div style="font-size:50px;font-weight:800;color:#111827;margin-bottom:18px;">'+aHd+'</div>' +
          '<div style="height:3px;width:56px;background:'+AC+';border-radius:2px;margin-bottom:28px;"></div>' +
          '<div style="font-size:18px;color:#374151;line-height:1.8;max-width:780px;">'+aTx+'</div>' +
        '</div>';
      }
      var imgLeft = d.layout === 'image_left';
      var textCol = '<div style="flex:1;display:flex;flex-direction:column;justify-content:center;gap:20px;">' +
        '<div style="font-size:50px;font-weight:800;color:#111827;line-height:1.08;">'+aHd+'</div>' +
        '<div style="height:3px;width:50px;background:'+AC+';border-radius:2px;"></div>' +
        '<div style="font-size:17px;color:#6b7280;line-height:1.75;">'+aTx+'</div>' +
        '<div style="display:inline-flex;align-items:center;gap:8px;background:'+AC+';color:#fff;padding:13px 32px;border-radius:10px;font-size:16px;font-weight:700;width:fit-content;">Learn More →</div>' +
      '</div>';
      var imgCol = '<div style="flex:1;background:linear-gradient(135deg,#e0e7ff 0%,#c7d2fe 100%);border-radius:20px;min-height:340px;display:flex;align-items:center;justify-content:center;">' +
        '<div style="font-size:70px;opacity:0.5;">👤</div>' +
      '</div>';
      return '<div style="background:#fff;padding:80px 80px;">' +
        '<div style="display:flex;gap:60px;align-items:center;">' + (imgLeft ? imgCol + textCol : textCol + imgCol) + '</div>' +
      '</div>';
    }

    case 'services': {
      var sItems = d.items || [{icon:'⚡',title:'Strategy',desc:'Actionable plans built around your goals.'},{icon:'🎨',title:'Design',desc:'Beautiful interfaces your users will love.'},{icon:'🚀',title:'Growth',desc:'Data-driven campaigns that convert.'}];
      var nc = Math.min(sItems.length, 4);
      var sBg = d.bg === 'dark' ? '#111827' : d.bg === 'accent' ? AC : '#f8fafc';
      var sHdC = (d.bg==='dark'||d.bg==='accent') ? '#fff' : '#111827';
      var sSubC = (d.bg==='dark'||d.bg==='accent') ? 'rgba(255,255,255,0.6)' : '#6b7280';
      var sCardBg = (d.bg==='dark') ? 'rgba(255,255,255,0.06)' : (d.bg==='accent') ? 'rgba(255,255,255,0.12)' : '#fff';
      var sCardBorder = (d.bg==='dark'||d.bg==='accent') ? 'rgba(255,255,255,0.12)' : '#e5e7eb';
      return '<div style="background:'+sBg+';padding:80px 80px;">' +
        '<div style="text-align:center;margin-bottom:52px;">' +
          '<div style="font-size:48px;font-weight:800;color:'+sHdC+';margin-bottom:14px;">'+escHtml(d.heading||'Our Services')+'</div>' +
          '<div style="height:3px;width:50px;background:'+AC+';border-radius:2px;margin:0 auto;"></div>' +
          (d.subtitle ? '<div style="font-size:17px;color:'+sSubC+';margin-top:16px;">'+escHtml(d.subtitle)+'</div>' : '') +
        '</div>' +
        '<div style="display:grid;grid-template-columns:repeat('+nc+',1fr);gap:22px;">' +
          sItems.slice(0,nc).map(function(it){
            return '<div style="background:'+sCardBg+';border:1.5px solid '+sCardBorder+';border-radius:16px;padding:32px 24px;">' +
              '<div style="width:52px;height:52px;background:'+AC+'22;border-radius:13px;display:flex;align-items:center;justify-content:center;font-size:26px;margin-bottom:18px;">'+escHtml(it.icon||'⭐')+'</div>' +
              '<div style="font-size:20px;font-weight:700;color:'+sHdC+';margin-bottom:10px;">'+escHtml(it.title||'Service')+'</div>' +
              '<div style="font-size:14px;color:'+sSubC+';line-height:1.65;">'+escHtml(it.desc||'')+'</div>' +
            '</div>';
          }).join('') +
        '</div>' +
      '</div>';
    }

    case 'testimonials': {
      var tItems = d.items || [
        {name:'Sarah Johnson',role:'CEO, TechCorp',quote:'Absolutely transformed how we work. Incredible results!'},
        {name:'Mark Davis',role:'Founder, Studio X',quote:'The best investment we made this year. Highly recommend.'},
        {name:'Emily Chen',role:'Director, GrowthCo',quote:'Outstanding quality and support throughout the project.'}
      ];
      var nt = Math.min(tItems.length, 3);
      var tBg = d.bg === 'dark' ? '#111827' : '#f8fafc';
      var tHdC = d.bg==='dark' ? '#fff' : '#111827';
      var tTC = d.bg==='dark' ? '#e5e7eb' : '#374151';
      var tCard = d.bg==='dark' ? 'rgba(255,255,255,0.06)' : '#fff';
      var tBorder = d.bg==='dark' ? 'rgba(255,255,255,0.1)' : '#e5e7eb';
      return '<div style="background:'+tBg+';padding:80px 80px;">' +
        '<div style="text-align:center;margin-bottom:52px;">' +
          '<div style="font-size:48px;font-weight:800;color:'+tHdC+';">'+escHtml(d.heading||'What Our Clients Say')+'</div>' +
        '</div>' +
        '<div style="display:grid;grid-template-columns:repeat('+nt+',1fr);gap:22px;">' +
          tItems.slice(0,nt).map(function(t){
            var init = t.name && t.name[0] ? t.name[0].toUpperCase() : '?';
            return '<div style="background:'+tCard+';border:1.5px solid '+tBorder+';border-radius:16px;padding:30px 24px;">' +
              '<div style="color:#fbbf24;font-size:18px;letter-spacing:2px;margin-bottom:14px;">★★★★★</div>' +
              '<div style="font-size:15px;color:'+tTC+';line-height:1.7;font-style:italic;margin-bottom:22px;">"'+escHtml(t.quote||'')+'"</div>' +
              '<div style="display:flex;align-items:center;gap:12px;border-top:1px solid '+tBorder+';padding-top:16px;">' +
                '<div style="width:40px;height:40px;border-radius:50%;background:'+AC+';color:#fff;display:flex;align-items:center;justify-content:center;font-size:15px;font-weight:700;flex-shrink:0;">'+escHtml(init)+'</div>' +
                '<div><div style="font-weight:700;color:'+tHdC+';font-size:14px;">'+escHtml(t.name||'')+'</div><div style="font-size:12px;color:'+muted+';">'+escHtml(t.role||'')+'</div></div>' +
              '</div>' +
            '</div>';
          }).join('') +
        '</div>' +
      '</div>';
    }

    case 'stats': {
      var stItems = d.items || [{emoji:'🚀',number:'120+',label:'Projects Delivered'},{emoji:'😊',number:'98%',label:'Client Satisfaction'},{emoji:'🌍',number:'40+',label:'Countries Served'},{emoji:'🏆',number:'15',label:'Awards Won'}];
      var stBg = d.bg==='dark'?'#111827':d.bg==='accent'?AC:'#fff';
      var stHdC = (d.bg==='dark'||d.bg==='accent')?'#fff':'#111827';
      var stSubC = (d.bg==='dark'||d.bg==='accent')?'rgba(255,255,255,0.55)':'#6b7280';
      var stNumC = (d.bg==='accent')?'#fff':(d.bg==='dark'?'#fff':AC);
      var stCard = (d.bg==='dark')?'rgba(255,255,255,0.06)':(d.bg==='accent')?'rgba(255,255,255,0.12)':'#f8fafc';
      var stBrd = (d.bg==='dark'||d.bg==='accent')?'rgba(255,255,255,0.1)':'#e5e7eb';
      return '<div style="background:'+stBg+';padding:80px 80px;">' +
        (d.heading ? '<div style="text-align:center;font-size:42px;font-weight:800;color:'+stHdC+';margin-bottom:48px;">'+escHtml(d.heading)+'</div>' : '') +
        '<div style="display:grid;grid-template-columns:repeat('+stItems.length+',1fr);gap:18px;text-align:center;">' +
          stItems.map(function(s){
            return '<div style="padding:36px 16px;background:'+stCard+';border:1.5px solid '+stBrd+';border-radius:16px;">' +
              '<div style="font-size:32px;margin-bottom:12px;">'+escHtml(s.emoji||'⭐')+'</div>' +
              '<div style="font-size:50px;font-weight:800;color:'+stNumC+';line-height:1;">'+escHtml(s.number||'0')+'</div>' +
              '<div style="font-size:14px;color:'+stSubC+';margin-top:8px;font-weight:500;">'+escHtml(s.label||'')+'</div>' +
            '</div>';
          }).join('') +
        '</div>' +
      '</div>';
    }

    case 'team': {
      var tmItems = d.items || [
        {name:'Alex Morgan',role:'CEO & Founder'},
        {name:'Jamie Lee',role:'Head of Design'},
        {name:'Chris Park',role:'Lead Developer'},
        {name:'Sam Rivera',role:'Marketing Director'}
      ];
      var nm = Math.min(tmItems.length, 4);
      var tmBg = d.bg==='dark'?'#111827':'#fff';
      var tmHdC = d.bg==='dark'?'#fff':'#111827';
      var tmRC = d.bg==='dark'?'rgba(255,255,255,0.5)':'#9ca3af';
      var tmCard = d.bg==='dark'?'rgba(255,255,255,0.06)':'#f8fafc';
      var tmBord = d.bg==='dark'?'rgba(255,255,255,0.1)':'#e5e7eb';
      return '<div style="background:'+tmBg+';padding:80px 80px;">' +
        '<div style="text-align:center;margin-bottom:52px;">' +
          '<div style="font-size:48px;font-weight:800;color:'+tmHdC+';">'+escHtml(d.heading||'Meet the Team')+'</div>' +
        '</div>' +
        '<div style="display:grid;grid-template-columns:repeat('+nm+',1fr);gap:22px;text-align:center;">' +
          tmItems.slice(0,nm).map(function(m){
            return '<div style="background:'+tmCard+';border:1.5px solid '+tmBord+';border-radius:16px;padding:32px 16px;">' +
              '<div style="width:80px;height:80px;border-radius:50%;background:linear-gradient(135deg,'+AC+','+AC+'88);margin:0 auto 16px;display:flex;align-items:center;justify-content:center;font-size:32px;color:#fff;font-weight:700;">'+(m.name?m.name[0].toUpperCase():'?')+'</div>' +
              '<div style="font-size:18px;font-weight:700;color:'+tmHdC+';">'+escHtml(m.name||'')+'</div>' +
              '<div style="font-size:13px;color:'+tmRC+';margin-top:4px;">'+escHtml(m.role||'')+'</div>' +
            '</div>';
          }).join('') +
        '</div>' +
      '</div>';
    }

    case 'faq': {
      var fItems = d.items || [
        {q:'How do I get started?',a:'Simply reach out to us and we\'ll schedule a free consultation call.'},
        {q:'What\'s your turnaround time?',a:'Most projects are completed within 2–4 weeks depending on scope.'},
        {q:'Do you offer revisions?',a:'Yes! We offer unlimited revisions until you\'re 100% satisfied.'},
        {q:'What payment methods do you accept?',a:'We accept all major credit cards, bank transfers, and PayPal.'}
      ];
      var fBg = d.bg==='dark'?'#111827':'#fff';
      var fHdC = d.bg==='dark'?'#fff':'#111827';
      var fQC = d.bg==='dark'?'#e5e7eb':'#111827';
      var fAC2 = d.bg==='dark'?'rgba(255,255,255,0.55)':'#6b7280';
      var fCard = d.bg==='dark'?'rgba(255,255,255,0.05)':'#f8fafc';
      var fBrd = d.bg==='dark'?'rgba(255,255,255,0.1)':'#e5e7eb';
      return '<div style="background:'+fBg+';padding:80px 80px;">' +
        '<div style="font-size:48px;font-weight:800;color:'+fHdC+';margin-bottom:48px;">'+escHtml(d.heading||'Frequently Asked Questions')+'</div>' +
        '<div style="display:flex;flex-direction:column;gap:10px;">' +
          fItems.map(function(f,fi){
            var open = fi===0;
            return '<div style="border:1.5px solid '+fBrd+';border-radius:12px;padding:22px 26px;background:'+(open?fCard:fBg)+';">' +
              '<div style="display:flex;align-items:center;justify-content:space-between;gap:16px;">' +
                '<div style="font-size:17px;font-weight:600;color:'+fQC+';">'+escHtml(f.q||'')+'</div>' +
                '<div style="width:28px;height:28px;border-radius:50%;background:'+(open?AC:'rgba(0,0,0,0.06)')+';color:'+(open?'#fff':fAC2)+';display:flex;align-items:center;justify-content:center;font-size:18px;flex-shrink:0;font-weight:600;">'+(open?'−':'+')+'</div>' +
              '</div>' +
              (open?'<div style="font-size:15px;color:'+fAC2+';margin-top:14px;line-height:1.65;">'+escHtml(f.a||'')+'</div>':'') +
            '</div>';
          }).join('') +
        '</div>' +
      '</div>';
    }

    case 'cta': {
      var ctaBg = d.bg_color || '#111827';
      var ctaTC = d.text_color || '#ffffff';
      var ctaSub = d.bg==='gradient'?'linear-gradient(135deg,'+AC+',#8b5cf6)':ctaBg;
      return '<div style="background:'+ctaSub+';padding:100px 80px;text-align:center;">' +
        '<div style="font-size:58px;font-weight:800;color:'+ctaTC+';line-height:1.05;margin-bottom:18px;">'+escHtml(d.heading||'Ready to Get Started?')+'</div>' +
        (d.subheading?'<div style="font-size:19px;color:'+ctaTC+';opacity:0.65;margin-bottom:44px;">'+escHtml(d.subheading)+'</div>':'<div style="margin-bottom:44px;"></div>') +
        '<div style="display:inline-flex;gap:14px;justify-content:center;">' +
          '<div style="padding:15px 48px;background:'+AC+';color:#fff;border-radius:11px;font-size:17px;font-weight:700;">'+escHtml(d.cta_label||'Contact Us')+'</div>' +
          (d.cta2_label?'<div style="padding:15px 40px;border:2px solid rgba(255,255,255,0.3);color:'+ctaTC+';border-radius:11px;font-size:17px;font-weight:600;">'+escHtml(d.cta2_label)+'</div>':'') +
        '</div>' +
      '</div>';
    }

    case 'gallery': {
      var gCols = parseInt(d.columns)||3;
      var gBg = '#fff';
      var swatches = ['#dbeafe','#e0e7ff','#fce7f3','#d1fae5','#fef3c7','#ffe4e6','#f3e8ff','#fff7ed','#e0f2fe','#f0fdf4'];
      return '<div style="background:'+gBg+';padding:80px 80px;">' +
        (d.heading?'<div style="font-size:48px;font-weight:800;color:#111827;margin-bottom:44px;">'+escHtml(d.heading)+'</div>':'') +
        '<div style="display:grid;grid-template-columns:repeat('+gCols+',1fr);gap:10px;">' +
          Array(gCols*2).fill(0).map(function(_x,gi){
            return '<div style="aspect-ratio:'+(d.aspect||'4/3')+';background:'+swatches[gi%swatches.length]+';border-radius:10px;display:flex;align-items:center;justify-content:center;"><div style="font-size:28px;opacity:0.35;">🖼️</div></div>';
          }).join('') +
        '</div>' +
      '</div>';
    }

    case 'pricing': {
      var pPlans = d.plans || [
        {name:'Starter',price:'$29/mo',features:'5 Projects\n10 GB Storage\nEmail Support\nBasic Analytics',cta:'Get Started',featured:'no'},
        {name:'Pro',price:'$79/mo',features:'Unlimited Projects\n100 GB Storage\nPriority Support\nAdvanced Analytics',cta:'Start Free Trial',featured:'yes'},
        {name:'Enterprise',price:'$199/mo',features:'Everything in Pro\n1 TB Storage\nDedicated Manager\nCustom Integrations',cta:'Contact Sales',featured:'no'}
      ];
      return '<div style="background:#f8fafc;padding:80px 80px;">' +
        '<div style="text-align:center;margin-bottom:52px;">' +
          '<div style="font-size:48px;font-weight:800;color:#111827;margin-bottom:14px;">'+escHtml(d.heading||'Simple Pricing')+'</div>' +
          (d.subtitle?'<div style="font-size:17px;color:#6b7280;">'+escHtml(d.subtitle)+'</div>':'') +
        '</div>' +
        '<div style="display:grid;grid-template-columns:repeat('+Math.min(pPlans.length,3)+',1fr);gap:22px;align-items:start;">' +
          pPlans.slice(0,3).map(function(pl){
            var feat = pl.featured==='yes';
            var plBg = feat ? AC : '#fff';
            var plTC2 = feat ? '#fff' : '#111827';
            var plSub = feat ? 'rgba(255,255,255,0.7)' : '#6b7280';
            var plBrd = feat ? 'none' : '1.5px solid #e5e7eb';
            return '<div style="background:'+plBg+';border:'+plBrd+';border-radius:20px;padding:36px 28px;'+(feat?'box-shadow:0 20px 60px rgba(99,102,241,0.35);':'')+'position:relative;">' +
              (feat?'<div style="position:absolute;top:-12px;left:50%;transform:translateX(-50%);background:#10b981;color:#fff;font-size:11px;font-weight:700;padding:4px 14px;border-radius:20px;white-space:nowrap;">⭐ Most Popular</div>':'') +
              '<div style="font-size:18px;font-weight:700;color:'+plTC2+';margin-bottom:8px;">'+escHtml(pl.name||'')+'</div>' +
              '<div style="font-size:44px;font-weight:800;color:'+(feat?'rgba(255,255,255,0.95)':AC)+';margin-bottom:6px;line-height:1;">'+escHtml(pl.price||'')+'</div>' +
              '<div style="font-size:12px;color:'+plSub+';margin-bottom:26px;"></div>' +
              '<div style="display:flex;flex-direction:column;gap:10px;margin-bottom:28px;">' +
                (pl.features||'').split('\n').filter(Boolean).slice(0,4).map(function(f2){
                  return '<div style="display:flex;align-items:center;gap:10px;font-size:14px;color:'+plSub+';">' +
                    '<span style="color:'+(feat?'rgba(255,255,255,0.8)':AC)+';font-weight:700;font-size:16px;">✓</span>' + escHtml(f2) +
                  '</div>';
                }).join('') +
              '</div>' +
              '<div style="background:'+(feat?'rgba(255,255,255,0.18)':AC)+';color:'+(feat?'#fff':'#fff')+';padding:13px;border-radius:10px;font-size:14px;font-weight:700;text-align:center;">'+escHtml(pl.cta||'Get Started')+'</div>' +
            '</div>';
          }).join('') +
        '</div>' +
      '</div>';
    }

    case 'newsletter': {
      var nlBg = d.bg_color || AC;
      var nlTC = d.text_color || '#ffffff';
      var nlDark = _spIsLight(nlBg) ? false : true;
      return '<div style="background:'+nlBg+';padding:100px 80px;text-align:center;">' +
        '<div style="font-size:54px;font-weight:800;color:'+nlTC+';line-height:1.1;margin-bottom:16px;">'+escHtml(d.heading||'Stay in the Loop')+'</div>' +
        '<div style="font-size:19px;color:'+nlTC+';opacity:0.65;margin-bottom:44px;">'+escHtml(d.subheading||'Get the latest news and updates straight to your inbox.')+'</div>' +
        '<div style="display:flex;gap:12px;max-width:520px;margin:0 auto;">' +
          '<div style="flex:1;background:#fff;border-radius:11px;height:52px;display:flex;align-items:center;padding:0 18px;"><span style="font-size:14px;color:#9ca3af;">Your email address</span></div>' +
          '<div style="background:'+(d.btn_color||'#111827')+';padding:0 28px;border-radius:11px;height:52px;display:flex;align-items:center;font-size:15px;font-weight:700;color:#fff;white-space:nowrap;">'+escHtml(d.btn_text||'Subscribe')+'</div>' +
        '</div>' +
      '</div>';
    }

    case 'logobar': {
      var lbItems = d.items || [{name:'Stripe'},{name:'Vercel'},{name:'Notion'},{name:'Linear'},{name:'Figma'}];
      var lbDark = d.bg==='dark';
      var lbBg = lbDark ? '#111827' : '#fff';
      var lbC = lbDark ? 'rgba(255,255,255,0.3)' : '#d1d5db';
      return '<div style="background:'+lbBg+';padding:60px 80px;">' +
        (d.heading?'<div style="text-align:center;font-size:13px;font-weight:600;color:#9ca3af;letter-spacing:2px;text-transform:uppercase;margin-bottom:36px;">'+escHtml(d.heading)+'</div>':'') +
        '<div style="display:flex;align-items:center;justify-content:center;gap:52px;flex-wrap:wrap;">' +
          lbItems.slice(0,6).map(function(lb){
            return '<div style="font-size:24px;font-weight:800;color:'+lbC+';letter-spacing:-0.5px;">'+escHtml(lb.name||'Brand')+'</div>';
          }).join('') +
        '</div>' +
      '</div>';
    }

    case 'timeline': {
      var tlItems = d.items || [
        {date:'2020',title:'Founded',desc:'Started with a small team and a big vision.'},
        {date:'2021',title:'First 100 Clients',desc:'Reached our first major milestone in growth.'},
        {date:'2023',title:'Global Expansion',desc:'Launched operations in 20+ countries worldwide.'},
        {date:'2024',title:'Award-Winning',desc:'Recognized as industry leader by top publications.'}
      ];
      var tlBg = d.bg==='dark'?'#111827':'#fff';
      var tlHdC = d.bg==='dark'?'#fff':'#111827';
      var tlTC2 = d.bg==='dark'?'#e5e7eb':'#374151';
      var tlSub2 = d.bg==='dark'?'rgba(255,255,255,0.5)':'#6b7280';
      return '<div style="background:'+tlBg+';padding:80px 80px;">' +
        '<div style="font-size:48px;font-weight:800;color:'+tlHdC+';margin-bottom:52px;">'+escHtml(d.heading||'Our Journey')+'</div>' +
        '<div style="display:flex;flex-direction:column;gap:0;">' +
          tlItems.map(function(tl,ti){
            return '<div style="display:flex;gap:28px;margin-bottom:32px;">' +
              '<div style="display:flex;flex-direction:column;align-items:center;">' +
                '<div style="width:42px;height:42px;border-radius:50%;background:'+AC+';color:#fff;display:flex;align-items:center;justify-content:center;font-size:15px;font-weight:700;flex-shrink:0;">'+(ti+1)+'</div>' +
                (ti<tlItems.length-1?'<div style="width:2px;flex:1;background:'+AC+'33;min-height:30px;margin:6px 0;"></div>':'') +
              '</div>' +
              '<div style="padding-top:8px;">' +
                (tl.date?'<div style="font-size:12px;font-weight:700;color:'+AC+';letter-spacing:1.5px;text-transform:uppercase;margin-bottom:6px;">'+escHtml(tl.date)+'</div>':'') +
                '<div style="font-size:20px;font-weight:700;color:'+tlTC2+';margin-bottom:8px;">'+escHtml(tl.title||'')+'</div>' +
                '<div style="font-size:14px;color:'+tlSub2+';line-height:1.6;">'+escHtml(tl.desc||'')+'</div>' +
              '</div>' +
            '</div>';
          }).join('') +
        '</div>' +
      '</div>';
    }

    case 'columns': {
      var colItems = d.items || [
        {emoji:'⚡',heading:'Fast Delivery',text:'We deliver projects on time, every time, without sacrificing quality.'},
        {emoji:'🎯',heading:'Precision Work',text:'Every detail matters. We craft solutions that hit the mark.'},
        {emoji:'🔒',heading:'Secure & Reliable',text:'Enterprise-grade security baked in from day one.'}
      ];
      var nc3 = parseInt(d.cols)||3;
      var colDark = d.bg==='dark', colAccent = d.bg==='accent';
      var colBG = colDark?'#111827':colAccent?AC:'#fff';
      var colTC2 = (colDark||colAccent)?'#fff':'#111827';
      var colSub2 = (colDark||colAccent)?'rgba(255,255,255,0.6)':'#6b7280';
      var colAlign = d.align==='left'?'left':'center';
      return '<div style="background:'+colBG+';padding:80px 80px;">' +
        (d.heading?'<div style="text-align:center;font-size:42px;font-weight:800;color:'+colTC2+';margin-bottom:52px;">'+escHtml(d.heading)+'</div>':'') +
        '<div style="display:grid;grid-template-columns:repeat('+nc3+',1fr);gap:32px;text-align:'+colAlign+';">' +
          colItems.map(function(col){
            return '<div>' +
              '<div style="font-size:48px;margin-bottom:18px;">'+escHtml(col.emoji||'✨')+'</div>' +
              '<div style="font-size:22px;font-weight:700;color:'+colTC2+';margin-bottom:12px;">'+escHtml(col.heading||'')+'</div>' +
              '<div style="font-size:15px;color:'+colSub2+';line-height:1.65;">'+escHtml(col.text||'')+'</div>' +
            '</div>';
          }).join('') +
        '</div>' +
      '</div>';
    }

    case 'video': {
      return '<div style="background:#fff;padding:80px 80px;">' +
        (d.heading?'<div style="text-align:center;font-size:42px;font-weight:800;color:#111827;margin-bottom:36px;">'+escHtml(d.heading)+'</div>':'') +
        '<div style="background:#0f172a;border-radius:18px;aspect-ratio:16/9;display:flex;align-items:center;justify-content:center;position:relative;overflow:hidden;">' +
          '<div style="position:absolute;inset:0;background:linear-gradient(135deg,rgba(99,102,241,0.4),rgba(139,92,246,0.2));"></div>' +
          '<div style="position:relative;width:80px;height:80px;border-radius:50%;background:rgba(255,255,255,0.15);backdrop-filter:blur(8px);display:flex;align-items:center;justify-content:center;">' +
            '<div style="width:0;height:0;border-top:18px solid transparent;border-bottom:18px solid transparent;border-left:30px solid rgba(255,255,255,0.9);margin-left:6px;"></div>' +
          '</div>' +
        '</div>' +
        (d.caption?'<div style="text-align:center;font-size:14px;color:#9ca3af;margin-top:18px;">'+escHtml(d.caption)+'</div>':'') +
      '</div>';
    }

    case 'rich_text': {
      var rtCenter = d.align==='center';
      var rtBg = d.bg==='dark'?'#111827':'#fff';
      var rtHdC = d.bg==='dark'?'#fff':'#111827';
      var rtTC2 = d.bg==='dark'?'#d1d5db':'#374151';
      var content = d.content || 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.\n\nUt enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.';
      return '<div style="background:'+rtBg+';padding:80px 80px;">' +
        '<div style="max-width:780px;margin:0 auto;'+(rtCenter?'text-align:center;':'')+'"">' +
          (d.title?'<div style="font-size:50px;font-weight:800;color:'+rtHdC+';margin-bottom:20px;">'+escHtml(d.title)+'</div>':'') +
          (d.title?'<div style="height:3px;width:50px;background:'+AC+';border-radius:2px;margin-bottom:28px;'+(rtCenter?'margin-left:auto;margin-right:auto;':'')+'"></div>':'') +
          '<div style="font-size:17px;color:'+rtTC2+';line-height:1.8;">' +
            content.split('\n\n').slice(0,2).map(function(par){
              return '<p style="margin:0 0 20px;">'+escHtml(par)+'</p>';
            }).join('') +
          '</div>' +
        '</div>' +
      '</div>';
    }

    case 'contact': {
      return '<div style="background:#fff;padding:80px 80px;">' +
        '<div style="font-size:48px;font-weight:800;color:#111827;margin-bottom:48px;">'+escHtml(d.heading||'Get in Touch')+'</div>' +
        '<div style="display:grid;grid-template-columns:1.1fr 0.9fr;gap:60px;">' +
          '<div style="display:flex;flex-direction:column;gap:18px;">' +
            [['Name',''],['Email address',''],['Your message','110']].map(function(lbl){
              return '<div><div style="font-size:13px;font-weight:600;color:#374151;margin-bottom:8px;">'+lbl[0]+'</div>' +
                '<div style="background:#f9fafb;border:1.5px solid #e5e7eb;border-radius:10px;height:'+(lbl[1]||'48')+'px;"></div></div>';
            }).join('') +
            '<div style="background:'+AC+';color:#fff;padding:15px;border-radius:10px;font-size:15px;font-weight:700;text-align:center;cursor:pointer;">Send Message</div>' +
          '</div>' +
          '<div style="display:flex;flex-direction:column;gap:26px;padding-top:8px;">' +
            [['📧',d.email||'contact@example.com'],['📞',d.phone||'+1 (555) 000-1234'],['📍',d.address||'123 Main Street, New York, NY 10001']].map(function(row){
              return '<div style="display:flex;gap:16px;align-items:flex-start;">' +
                '<div style="width:46px;height:46px;background:#eef2ff;border-radius:11px;display:flex;align-items:center;justify-content:center;font-size:20px;flex-shrink:0;">'+row[0]+'</div>' +
                '<div style="font-size:15px;color:#374151;padding-top:12px;">'+escHtml(row[1])+'</div>' +
              '</div>';
            }).join('') +
          '</div>' +
        '</div>' +
      '</div>';
    }

    // ── Real Estate / Ecom ──────────────────────────────────────────────────
    // (Handled by theme's sections.js via THEME_SECTIONS.preview)
    case 'property_search':
    case 'property_listings':
    case 'property_detail':
    case 'agents':
    case 'blog_posts':
    case 'category_banner':
    case 'product_grid':
    case 'product_detail':
    case 'cart':
    case 'checkout':
      return '<div style="background:' + BG + ';min-height:200px;display:flex;align-items:center;justify-content:center;"><div style="text-align:center;color:#9ca3af;font-size:13px;">Loading theme sections…</div></div>';

    case '__dead_re_ecom__': { /* unreachable — old implementations kept for reference */
      var psStats = d.stats || [{num:'2,500+',label:'Properties'},{num:'850+',label:'Families Served'},{num:'12+',label:'Years'}];
      return '<div style="background:#0f4c81;min-height:680px;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:80px 80px;text-align:center;">' +
        '<div style="font-size:62px;font-weight:800;color:#ffffff;line-height:1.08;margin-bottom:16px;">'+escHtml(d.headline||'Find Your Dream Home')+'</div>' +
        '<div style="font-size:18px;color:rgba(255,255,255,0.7);margin-bottom:44px;">'+escHtml(d.subtext||'Thousands of verified properties across top cities.')+'</div>' +
        '<div style="background:#fff;border-radius:16px;padding:20px 24px;display:flex;gap:12px;width:100%;max-width:900px;box-shadow:0 20px 60px rgba(0,0,0,0.25);">' +
          '<div style="flex:1.5;border:1.5px solid #e5e7eb;border-radius:10px;height:52px;display:flex;align-items:center;padding:0 16px;font-size:14px;color:#9ca3af;">📍 City or Area</div>' +
          '<div style="flex:1;border:1.5px solid #e5e7eb;border-radius:10px;height:52px;display:flex;align-items:center;padding:0 16px;font-size:14px;color:#9ca3af;">🏠 Type</div>' +
          '<div style="flex:1;border:1.5px solid #e5e7eb;border-radius:10px;height:52px;display:flex;align-items:center;padding:0 16px;font-size:14px;color:#9ca3af;">💰 Budget</div>' +
          '<div style="background:#0f4c81;border-radius:10px;height:52px;padding:0 32px;display:flex;align-items:center;font-size:15px;font-weight:700;color:#fff;white-space:nowrap;flex-shrink:0;">Search</div>' +
        '</div>' +
        (psStats.length ? '<div style="display:flex;gap:56px;margin-top:56px;">' +
          psStats.slice(0,3).map(function(s){ return '<div style="text-align:center;"><div style="font-size:38px;font-weight:800;color:#fff;">'+escHtml(s.num||'')+'</div><div style="font-size:13px;color:rgba(255,255,255,0.65);margin-top:4px;">'+escHtml(s.label||'')+'</div></div>'; }).join('') +
        '</div>' : '') +
      '</div>';
    }

    case 'property_listings': {
      var plProps = (d.properties || []).slice(0,3);
      if (!plProps.length) plProps = [
        {icon:'🏠',title:'3 BHK Apartment',location:'City, Area',price:'₹1.8 Cr',beds:3,baths:2,sqft:1450,tag:'For Sale'},
        {icon:'🏡',title:'4 BHK Villa',location:'City, Area',price:'₹2.4 Cr',beds:4,baths:3,sqft:2800,tag:'Featured'},
        {icon:'🏢',title:'2 BHK Flat',location:'City, Area',price:'₹85 L',beds:2,baths:2,sqft:980,tag:'For Rent'}
      ];
      return '<div style="background:#f8fafc;padding:80px 80px;">' +
        '<div style="text-align:center;margin-bottom:48px;">' +
          '<div style="font-size:48px;font-weight:800;color:#0f172a;">'+escHtml(d.heading||'Featured Properties')+'</div>' +
          (d.subheading?'<div style="font-size:17px;color:#64748b;margin-top:10px;">'+escHtml(d.subheading)+'</div>':'') +
        '</div>' +
        '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:24px;">' +
          plProps.slice(0,3).map(function(p){
            var ptag = p.tag||'';
            var tagColor = ptag==='Featured'?'#f59e0b':'#0f4c81';
            return '<div style="background:#fff;border:1.5px solid #e2e8f0;border-radius:16px;overflow:hidden;">' +
              '<div style="background:linear-gradient(135deg,#0f4c81,#2563eb);height:180px;display:flex;align-items:center;justify-content:center;position:relative;">' +
                '<div style="font-size:72px;opacity:0.18;position:absolute;">'+escHtml(p.icon||'🏠')+'</div>' +
                (ptag?'<div style="position:absolute;top:14px;left:14px;background:'+tagColor+';color:#fff;font-size:11px;font-weight:700;padding:4px 12px;border-radius:20px;">'+escHtml(ptag)+'</div>':'') +
                '<div style="position:absolute;bottom:14px;right:14px;background:rgba(255,255,255,0.15);border-radius:50%;width:32px;height:32px;display:flex;align-items:center;justify-content:center;color:#fff;font-size:16px;">♡</div>' +
              '</div>' +
              '<div style="padding:20px;">' +
                '<div style="font-size:18px;font-weight:700;color:#0f172a;margin-bottom:6px;">'+escHtml(p.title||'Property')+'</div>' +
                '<div style="font-size:13px;color:#64748b;margin-bottom:14px;">📍 '+escHtml(p.location||'Location')+'</div>' +
                '<div style="display:flex;gap:16px;font-size:12px;color:#64748b;margin-bottom:14px;padding-bottom:14px;border-bottom:1px solid #f1f5f9;">' +
                  (p.beds?'<span>🛏 '+p.beds+' Beds</span>':'') +
                  (p.baths?'<span>🚿 '+p.baths+' Baths</span>':'') +
                  (p.sqft?'<span>📐 '+p.sqft+'</span>':'') +
                '</div>' +
                '<div style="font-size:20px;font-weight:800;color:#0f4c81;">'+escHtml(p.price||'₹1 Cr')+'</div>' +
              '</div>' +
            '</div>';
          }).join('') +
        '</div>' +
      '</div>';
    }

    case 'property_detail': {
      var pdFeats = (d.features || ['Swimming Pool','Club House','Power Backup','24/7 Security','Landscaped Garden','Children Play Area']).slice(0,6);
      return '<div style="background:#fff;padding:64px 64px;">' +
        '<div style="display:grid;grid-template-columns:1.3fr 0.7fr;gap:56px;">' +
          '<div>' +
            '<div style="background:linear-gradient(135deg,#0f4c81,#2563eb);border-radius:20px;height:340px;display:flex;align-items:center;justify-content:center;position:relative;margin-bottom:20px;">' +
              '<div style="font-size:110px;opacity:0.18;">'+escHtml(d.icon||'🏠')+'</div>' +
              (d.tag?'<div style="position:absolute;top:20px;left:20px;background:#0f4c81;color:#fff;font-size:12px;font-weight:700;padding:6px 16px;border-radius:20px;">'+escHtml(d.tag)+'</div>':'') +
            '</div>' +
            '<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:10px;">' +
              [0,1,2,3].map(function(){ return '<div style="background:#dbeafe;border-radius:10px;height:68px;"></div>'; }).join('') +
            '</div>' +
          '</div>' +
          '<div>' +
            '<div style="font-size:30px;font-weight:800;color:#0f172a;margin-bottom:8px;">'+escHtml(d.title||'4 BHK Luxury Villa')+'</div>' +
            '<div style="font-size:13px;color:#64748b;margin-bottom:18px;">📍 '+escHtml(d.location||'City, Area')+'</div>' +
            '<div style="font-size:32px;font-weight:800;color:#0f4c81;margin-bottom:20px;">'+escHtml(d.price||'₹2.8 Cr')+'</div>' +
            '<div style="display:grid;grid-template-columns:repeat(2,1fr);gap:10px;padding:16px;background:#f8fafc;border-radius:12px;margin-bottom:20px;">' +
              [['🛏',d.beds||4,'Bedrooms'],['🚿',d.baths||3,'Bathrooms'],['📐',(d.sqft||2800)+' sqft','Area'],['🚗',d.parking||2,'Parking']].map(function(spec){
                return '<div style="text-align:center;padding:8px;"><div style="font-size:18px;">'+spec[0]+'</div><div style="font-size:15px;font-weight:700;color:#0f172a;">'+spec[1]+'</div><div style="font-size:11px;color:#64748b;">'+spec[2]+'</div></div>';
              }).join('') +
            '</div>' +
            '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:20px;">' +
              pdFeats.map(function(f3){ return '<div style="font-size:12px;color:#374151;">✓ '+escHtml(f3)+'</div>'; }).join('') +
            '</div>' +
            '<div style="display:flex;flex-direction:column;gap:10px;">' +
              '<div style="background:#0f4c81;color:#fff;padding:14px;border-radius:10px;font-size:14px;font-weight:700;text-align:center;">Schedule a Visit</div>' +
              '<div style="border:1.5px solid #0f4c81;color:#0f4c81;padding:13px;border-radius:10px;font-size:14px;font-weight:700;text-align:center;">Contact Agent</div>' +
            '</div>' +
          '</div>' +
        '</div>' +
      '</div>';
    }

    case 'agents': {
      var agItems = (d.items || []).slice(0,4);
      if (!agItems.length) agItems = [
        {icon:'👩',name:'Agent Name',specialty:'Luxury Residential',listings:48,sold:120,years:8},
        {icon:'👨',name:'Agent Name',specialty:'Commercial & Investment',listings:35,sold:94,years:6},
        {icon:'👩',name:'Agent Name',specialty:'Affordable Housing',listings:52,sold:145,years:10},
        {icon:'👨',name:'Agent Name',specialty:'Plots & Land',listings:29,sold:67,years:5}
      ];
      return '<div style="background:#f8fafc;padding:80px 80px;">' +
        '<div style="text-align:center;margin-bottom:48px;">' +
          '<div style="font-size:48px;font-weight:800;color:#0f172a;">'+escHtml(d.heading||'Meet Our Agents')+'</div>' +
          (d.subheading?'<div style="font-size:16px;color:#64748b;margin-top:10px;">'+escHtml(d.subheading)+'</div>':'') +
        '</div>' +
        '<div style="display:grid;grid-template-columns:repeat('+Math.min(agItems.length,4)+',1fr);gap:20px;">' +
          agItems.map(function(ag){
            return '<div style="background:#fff;border:1.5px solid #e2e8f0;border-radius:16px;padding:24px;text-align:center;">' +
              '<div style="width:80px;height:80px;border-radius:50%;background:linear-gradient(135deg,#0f4c81,#2563eb);display:flex;align-items:center;justify-content:center;font-size:42px;margin:0 auto 14px;">'+escHtml(ag.icon||'👤')+'</div>' +
              '<div style="font-size:17px;font-weight:700;color:#0f172a;margin-bottom:4px;">'+escHtml(ag.name||'Agent')+'</div>' +
              '<div style="font-size:12px;color:#0f4c81;font-weight:600;margin-bottom:16px;">'+escHtml(ag.specialty||'Residential')+'</div>' +
              '<div style="display:flex;justify-content:space-around;padding:12px 0;border-top:1px solid #f1f5f9;border-bottom:1px solid #f1f5f9;margin-bottom:16px;">' +
                '<div style="text-align:center;"><div style="font-size:18px;font-weight:800;color:#0f4c81;">'+(ag.listings||0)+'</div><div style="font-size:10px;color:#94a3b8;">Listings</div></div>' +
                '<div style="text-align:center;"><div style="font-size:18px;font-weight:800;color:#0f4c81;">'+(ag.sold||0)+'</div><div style="font-size:10px;color:#94a3b8;">Sold</div></div>' +
                '<div style="text-align:center;"><div style="font-size:18px;font-weight:800;color:#0f4c81;">'+(ag.years||0)+'y</div><div style="font-size:10px;color:#94a3b8;">Exp</div></div>' +
              '</div>' +
              '<div style="background:#0f4c81;color:#fff;padding:10px;border-radius:8px;font-size:13px;font-weight:600;">Contact</div>' +
            '</div>';
          }).join('') +
        '</div>' +
      '</div>';
    }

    case 'blog_posts': {
      var bpPosts = (d.posts || []).slice(0,3);
      if (!bpPosts.length) bpPosts = [
        {icon:'🏠',category:'Buying Guide',title:'10 Things to Check Before Buying a Flat',excerpt:'The complete pre-purchase checklist.',author:'Your Name',date:'Jul 2026'},
        {icon:'📈',category:'Market Trends',title:'Real Estate Market Outlook 2026',excerpt:'Key data on price movements.',author:'Your Name',date:'Jul 2026'},
        {icon:'🔑',category:'Selling Tips',title:'How to Price Your Property Right',excerpt:"Find the perfect price point.",author:'Your Name',date:'Jul 2026'}
      ];
      return '<div style="background:#fff;padding:80px 80px;">' +
        '<div style="text-align:center;margin-bottom:48px;">' +
          '<div style="font-size:48px;font-weight:800;color:#0f172a;">'+escHtml(d.heading||'Latest Articles')+'</div>' +
          (d.subheading?'<div style="font-size:16px;color:#64748b;margin-top:10px;">'+escHtml(d.subheading)+'</div>':'') +
        '</div>' +
        '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:24px;">' +
          bpPosts.slice(0,3).map(function(post){
            return '<div style="background:#fff;border:1.5px solid #e2e8f0;border-radius:16px;overflow:hidden;">' +
              '<div style="background:linear-gradient(135deg,#0f4c81,#2563eb);height:160px;display:flex;align-items:center;justify-content:center;">' +
                '<div style="font-size:72px;opacity:0.2;">'+escHtml(post.icon||'📰')+'</div>' +
              '</div>' +
              '<div style="padding:20px;">' +
                '<div style="font-size:11px;font-weight:700;color:#0f4c81;letter-spacing:1px;text-transform:uppercase;margin-bottom:10px;">'+escHtml(post.category||'Article')+'</div>' +
                '<div style="font-size:17px;font-weight:700;color:#0f172a;margin-bottom:10px;line-height:1.35;">'+escHtml(post.title||'')+'</div>' +
                '<div style="font-size:13px;color:#64748b;line-height:1.6;margin-bottom:16px;">'+escHtml(post.excerpt||'')+'</div>' +
                '<div style="display:flex;align-items:center;justify-content:space-between;">' +
                  '<div style="font-size:12px;color:#94a3b8;">'+escHtml(post.author||'')+' · '+escHtml(post.date||'')+'</div>' +
                  '<div style="font-size:12px;color:#0f4c81;font-weight:600;">Read →</div>' +
                '</div>' +
              '</div>' +
            '</div>';
          }).join('') +
        '</div>' +
      '</div>';
    }

    // ── Ecommerce ────────────────────────────────────────────────────────────
    case 'category_banner': {
      var cbCats = (d.categories || [{name:'Category 1',icon:'👕'},{name:'Category 2',icon:'👖'},{name:'Category 3',icon:'🧥'},{name:'Category 4',icon:'🧢'}]).slice(0,4);
      var cbColors = ['#1f2937','#3730a3','#0f4c81','#334155'];
      return '<div style="background:#fff;padding:80px 80px;">' +
        '<div style="text-align:center;font-size:48px;font-weight:800;color:#111827;margin-bottom:48px;">'+escHtml(d.heading||'Shop by Category')+'</div>' +
        '<div style="display:grid;grid-template-columns:repeat('+cbCats.length+',1fr);gap:20px;">' +
          cbCats.map(function(cat,ci){
            var cbg = cbColors[ci] || cbColors[0];
            return '<div style="background:'+cbg+';border-radius:20px;padding:40px 24px;text-align:center;">' +
              '<div style="font-size:52px;margin-bottom:16px;">'+escHtml(cat.icon||'🛍')+'</div>' +
              '<div style="font-size:18px;font-weight:700;color:#fff;margin-bottom:10px;">'+escHtml(cat.name||'Category')+'</div>' +
              '<div style="font-size:13px;color:rgba(255,255,255,0.6);">Shop Now →</div>' +
            '</div>';
          }).join('') +
        '</div>' +
      '</div>';
    }

    case 'product_grid': {
      var pgProds = (d.products || []).slice(0,4);
      if (!pgProds.length) pgProds = [
        {icon:'⭐',name:'Product One',category:'Category',price:'₹999',badge:'New'},
        {icon:'🔥',name:'Product Two',category:'Category',price:'₹1,499'},
        {icon:'💎',name:'Product Three',category:'Category',price:'₹2,999'},
        {icon:'🚀',name:'Product Four',category:'Category',price:'₹799'}
      ];
      return '<div style="background:#f9fafb;padding:80px 80px;">' +
        '<div style="text-align:center;font-size:48px;font-weight:800;color:#111827;margin-bottom:48px;">'+escHtml(d.heading||'Featured Products')+'</div>' +
        '<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:18px;">' +
          pgProds.slice(0,4).map(function(p){
            return '<div style="background:#fff;border:1px solid #e5e7eb;border-radius:14px;overflow:hidden;">' +
              '<div style="background:linear-gradient(135deg,'+AC+'22,'+AC+'08);height:160px;display:flex;align-items:center;justify-content:center;position:relative;">' +
                '<div style="font-size:64px;opacity:0.65;">'+escHtml(p.icon||'🛍')+'</div>' +
                (p.badge?'<div style="position:absolute;top:10px;left:10px;background:'+AC+';color:#fff;font-size:10px;font-weight:700;padding:3px 10px;border-radius:20px;">'+escHtml(p.badge)+'</div>':'') +
              '</div>' +
              '<div style="padding:14px;">' +
                '<div style="font-size:11px;color:#9ca3af;margin-bottom:4px;">'+escHtml(p.category||'Category')+'</div>' +
                '<div style="font-size:15px;font-weight:700;color:#111827;margin-bottom:8px;">'+escHtml(p.name||'Product')+'</div>' +
                '<div style="display:flex;align-items:center;justify-content:space-between;">' +
                  '<div style="font-size:17px;font-weight:800;color:'+AC+';">'+escHtml(p.price||'₹999')+'</div>' +
                  '<div style="width:32px;height:32px;background:'+AC+';border-radius:8px;display:flex;align-items:center;justify-content:center;color:#fff;font-size:20px;line-height:1;">+</div>' +
                '</div>' +
              '</div>' +
            '</div>';
          }).join('') +
        '</div>' +
      '</div>';
    }

    case 'product_detail': {
      var pdSizes = d.sizes || ['XS','S','M','L','XL','XXL'];
      return '<div style="background:#fff;padding:64px 64px;">' +
        '<div style="display:grid;grid-template-columns:1fr 1fr;gap:64px;align-items:start;">' +
          '<div>' +
            '<div style="background:linear-gradient(135deg,'+AC+'18,'+AC+'06);border-radius:20px;height:360px;display:flex;align-items:center;justify-content:center;margin-bottom:16px;">' +
              '<div style="font-size:120px;opacity:0.45;">'+escHtml(d.icon||'👕')+'</div>' +
            '</div>' +
            '<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:10px;">' +
              [0,1,2,3].map(function(){ return '<div style="background:'+AC+'14;border:1.5px solid '+AC+'22;border-radius:10px;height:68px;display:flex;align-items:center;justify-content:center;font-size:28px;opacity:0.55;">'+escHtml(d.icon||'👕')+'</div>'; }).join('') +
            '</div>' +
          '</div>' +
          '<div>' +
            '<div style="font-size:11px;color:#9ca3af;font-weight:600;letter-spacing:1.5px;text-transform:uppercase;margin-bottom:12px;">'+escHtml(d.category||'Category')+'</div>' +
            '<div style="font-size:34px;font-weight:800;color:#111827;margin-bottom:14px;line-height:1.2;">'+escHtml(d.name||'Product Name')+'</div>' +
            '<div style="font-size:36px;font-weight:800;color:'+AC+';margin-bottom:24px;">'+escHtml(d.price||'₹1,999')+'</div>' +
            '<div style="font-size:14px;color:#6b7280;line-height:1.7;margin-bottom:28px;">'+escHtml((d.desc||'Add your product description here.').slice(0,100))+'</div>' +
            '<div style="margin-bottom:24px;">' +
              '<div style="font-size:13px;font-weight:600;color:#374151;margin-bottom:10px;">Select Size</div>' +
              '<div style="display:flex;gap:8px;flex-wrap:wrap;">' +
                pdSizes.slice(0,6).map(function(s){ return '<div style="border:1.5px solid #e5e7eb;border-radius:8px;padding:6px 14px;font-size:13px;font-weight:500;color:#374151;">'+escHtml(s)+'</div>'; }).join('') +
              '</div>' +
            '</div>' +
            '<div style="display:flex;gap:12px;">' +
              '<div style="flex:1;background:'+AC+';color:#fff;padding:15px;border-radius:11px;font-size:15px;font-weight:700;text-align:center;">Add to Cart</div>' +
              '<div style="width:52px;height:52px;border:1.5px solid #e5e7eb;border-radius:11px;display:flex;align-items:center;justify-content:center;font-size:22px;">♡</div>' +
            '</div>' +
          '</div>' +
        '</div>' +
      '</div>';
    }

    case 'cart': {
      var ctItems = (d.items || [{icon:'👕',name:'Product Name',variant:'Size: M',qty:1,price:'₹1,999'}]).slice(0,3);
      return '<div style="background:#f9fafb;padding:64px 80px;">' +
        '<div style="font-size:42px;font-weight:800;color:#111827;margin-bottom:36px;">'+escHtml(d.heading||'Your Cart')+'</div>' +
        '<div style="display:grid;grid-template-columns:1.4fr 0.6fr;gap:28px;">' +
          '<div style="background:#fff;border-radius:16px;border:1.5px solid #e5e7eb;padding:28px;display:flex;flex-direction:column;gap:20px;">' +
            ctItems.map(function(item,ii){
              return (ii>0?'<div style="height:1px;background:#f3f4f6;margin:-10px 0;"></div>':'')+
                '<div style="display:flex;gap:18px;align-items:center;">' +
                  '<div style="width:72px;height:72px;background:'+AC+'16;border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:36px;flex-shrink:0;">'+escHtml(item.icon||'🛍')+'</div>' +
                  '<div style="flex:1;">' +
                    '<div style="font-size:16px;font-weight:700;color:#111827;">'+escHtml(item.name||'Product')+'</div>' +
                    '<div style="font-size:13px;color:#9ca3af;">'+escHtml(item.variant||'')+'</div>' +
                  '</div>' +
                  '<div style="text-align:right;">' +
                    '<div style="font-size:17px;font-weight:700;color:'+AC+';">'+escHtml(item.price||'₹0')+'</div>' +
                    '<div style="font-size:13px;color:#9ca3af;margin-top:4px;">Qty: '+(item.qty||1)+'</div>' +
                  '</div>' +
                '</div>';
            }).join('') +
          '</div>' +
          '<div style="background:#fff;border-radius:16px;border:1.5px solid #e5e7eb;padding:28px;">' +
            '<div style="font-size:20px;font-weight:700;color:#111827;margin-bottom:20px;">Order Summary</div>' +
            [['Subtotal',d.subtotal||'₹1,999'],['Shipping',d.shipping||'Free'],['Total',d.total||'₹1,999']].map(function(row,ri){
              return '<div style="display:flex;justify-content:space-between;margin-bottom:14px;'+(ri===2?'padding-top:14px;border-top:1.5px solid #e5e7eb;font-weight:700;font-size:17px;':'')+'">' +
                '<span style="color:'+(ri===2?'#111827':'#6b7280')+'">'+row[0]+'</span>' +
                '<span style="color:'+(ri===2?AC:'#111827')+'">'+row[1]+'</span>' +
              '</div>';
            }).join('') +
            '<div style="background:'+AC+';color:#fff;padding:15px;border-radius:11px;font-size:15px;font-weight:700;text-align:center;margin-top:8px;">Proceed to Checkout</div>' +
          '</div>' +
        '</div>' +
      '</div>';
    }

    case 'checkout': {
      var coItems = (d.items || [{name:'Product Name × 1',price:'₹1,999'}]).slice(0,3);
      return '<div style="background:#f9fafb;padding:64px 80px;">' +
        '<div style="font-size:42px;font-weight:800;color:#111827;margin-bottom:36px;">'+escHtml(d.heading||'Checkout')+'</div>' +
        '<div style="display:grid;grid-template-columns:1.4fr 0.6fr;gap:28px;">' +
          '<div style="display:flex;flex-direction:column;gap:20px;">' +
            '<div style="background:#fff;border-radius:16px;border:1.5px solid #e5e7eb;padding:24px;">' +
              '<div style="font-size:16px;font-weight:700;color:#111827;margin-bottom:16px;">Contact Information</div>' +
              ['Full Name','Email Address','Phone Number'].map(function(lbl){
                return '<div style="margin-bottom:12px;"><div style="font-size:12px;font-weight:600;color:#374151;margin-bottom:6px;">'+lbl+'</div><div style="background:#f9fafb;border:1.5px solid #e5e7eb;border-radius:8px;height:40px;"></div></div>';
              }).join('') +
            '</div>' +
            '<div style="background:#fff;border-radius:16px;border:1.5px solid #e5e7eb;padding:24px;">' +
              '<div style="font-size:16px;font-weight:700;color:#111827;margin-bottom:16px;">Shipping Address</div>' +
              ['Address','City','PIN Code'].map(function(lbl){
                return '<div style="margin-bottom:12px;"><div style="font-size:12px;font-weight:600;color:#374151;margin-bottom:6px;">'+lbl+'</div><div style="background:#f9fafb;border:1.5px solid #e5e7eb;border-radius:8px;height:40px;"></div></div>';
              }).join('') +
            '</div>' +
          '</div>' +
          '<div style="background:#fff;border-radius:16px;border:1.5px solid #e5e7eb;padding:24px;">' +
            '<div style="font-size:18px;font-weight:700;color:#111827;margin-bottom:20px;">Order Summary</div>' +
            coItems.map(function(item){
              return '<div style="display:flex;justify-content:space-between;margin-bottom:12px;font-size:14px;">' +
                '<span style="color:#374151;">'+escHtml(item.name||'Product')+'</span>' +
                '<span style="font-weight:600;color:#111827;">'+escHtml(item.price||'₹0')+'</span>' +
              '</div>';
            }).join('') +
            '<div style="height:1px;background:#f3f4f6;margin:16px 0;"></div>' +
            [['Subtotal',d.subtotal||'₹1,999'],['Shipping',d.shipping||'Free'],['Total',d.total||'₹1,999']].map(function(row,ri){
              return '<div style="display:flex;justify-content:space-between;margin-bottom:10px;'+(ri===2?'font-weight:700;font-size:16px;':'')+'">' +
                '<span style="color:'+(ri===2?'#111827':'#6b7280')+'">'+row[0]+'</span>' +
                '<span style="color:'+(ri===2?AC:'#374151')+'">'+row[1]+'</span>' +
              '</div>';
            }).join('') +
            '<div style="background:'+AC+';color:#fff;padding:14px;border-radius:11px;font-size:14px;font-weight:700;text-align:center;margin-top:16px;">Place Order</div>' +
          '</div>' +
        '</div>' +
      '</div>';
    }

    default: {
      return '<div style="background:'+BG+';min-height:600px;display:flex;align-items:center;justify-content:center;">' +
        '<div style="text-align:center;">' +
          '<div style="font-size:72px;margin-bottom:16px;">'+(variant.icon||'📄')+'</div>' +
          '<div style="font-size:32px;font-weight:700;color:'+TC+';">'+escHtml(variant.label||type)+'</div>' +
        '</div>' +
      '</div>';
    }
  }
}

/* ═══════════════════════════════════════════
   APPS / PLUGINS
═══════════════════════════════════════════ */
var _appsData        = [];       // all apps from server
var _appsState       = {};       // current enabled+config per appId  { appId: { enabled, ...fields } }
var _appsConfigAppId = null;     // which app's config drawer is open

/* Merge saved state from server on page load — injected by websiteController */
try { _appsState = JSON.parse(document.getElementById('_siteAppsJson').textContent || '{}'); } catch(e) { _appsState = {}; }

/* Load the apps panel: fetch app list then render */
function appsLoadPanel() {
  var listEl = document.getElementById('apps-list');
  var drawer = document.getElementById('apps-config-drawer');
  if (!listEl) return;
  drawer.style.display = 'none';
  listEl.innerHTML = '<div style="color:#9ca3af;font-size:12px;padding:10px 0;text-align:center;">Loading apps…</div>';

  fetch('/dashboard/apps/list?target=website', { credentials: 'same-origin' })
    .then(function(r) { return r.json(); })
    .then(function(data) {
      _appsData = data.apps || [];
      appsRenderList();
    })
    .catch(function() {
      listEl.innerHTML = '<div style="color:#ef4444;font-size:12px;padding:10px 0;text-align:center;">Failed to load apps.</div>';
    });
}

/* Render cards for all discovered apps */
function appsRenderList() {
  var listEl = document.getElementById('apps-list');
  if (!listEl) return;

  if (!_appsData.length) {
    listEl.innerHTML = '<div style="text-align:center;padding:24px 12px;">' +
      '<div style="font-size:32px;margin-bottom:8px;">🔌</div>' +
      '<div style="font-size:13px;color:#6b7280;">No apps installed yet.</div>' +
      '<div style="font-size:11px;color:#9ca3af;margin-top:4px;">Add apps to <code>apps/website/</code></div>' +
    '</div>';
    return;
  }

  var html = _appsData.map(function(app) {
    var saved   = _appsState[app.id] || {};
    var enabled = !!saved.enabled;
    var hasConfig = app.config && app.config.length > 0;

    return '<div style="background:#fff;border:1.5px solid ' + (enabled ? '#6366f1' : '#e5e7eb') + ';border-radius:10px;padding:12px;display:flex;flex-direction:column;gap:8px;">' +
      '<div style="display:flex;align-items:center;gap:8px;">' +
        '<span style="font-size:22px;flex-shrink:0;">' + escHtml(app.icon || '🔌') + '</span>' +
        '<div style="flex:1;min-width:0;">' +
          '<div style="font-size:13px;font-weight:600;color:#111827;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">' + escHtml(app.name) + '</div>' +
          '<div style="font-size:11px;color:#9ca3af;">' + escHtml(app.description || '') + '</div>' +
        '</div>' +
        /* Toggle switch */
        '<label style="position:relative;display:inline-flex;align-items:center;cursor:pointer;flex-shrink:0;">' +
          '<input type="checkbox" ' + (enabled ? 'checked' : '') + ' onchange="appsToggle(\'' + escHtml(app.id) + '\',this.checked)" style="opacity:0;width:0;height:0;position:absolute;">' +
          '<div style="width:36px;height:20px;background:' + (enabled ? '#6366f1' : '#d1d5db') + ';border-radius:20px;position:relative;transition:background .2s;">' +
            '<div style="position:absolute;top:2px;left:' + (enabled ? '18px' : '2px') + ';width:16px;height:16px;background:#fff;border-radius:50%;transition:left .2s;"></div>' +
          '</div>' +
        '</label>' +
      '</div>' +
      (hasConfig && enabled
        ? '<button onclick="appsOpenConfig(\'' + escHtml(app.id) + '\')" style="width:100%;padding:6px;background:#f3f4f6;border:1px solid #e5e7eb;border-radius:7px;font-size:12px;font-weight:500;color:#374151;cursor:pointer;font-family:inherit;">⚙ Configure</button>'
        : '') +
    '</div>';
  }).join('');

  listEl.innerHTML = html;
}

/* Toggle an app on/off and save immediately */
function appsToggle(appId, enabled) {
  if (!_appsState[appId]) _appsState[appId] = {};
  _appsState[appId].enabled = enabled;
  /* Re-render list so toggle switch + configure button update */
  appsRenderList();
  appsPersist();
}

/* Open config drawer for an app */
function appsOpenConfig(appId) {
  _appsConfigAppId = appId;
  var app = _appsData.find(function(a) { return a.id === appId; });
  if (!app) return;

  var listEl  = document.getElementById('apps-list');
  var drawer  = document.getElementById('apps-config-drawer');
  var titleEl = document.getElementById('apps-config-title');
  var fieldsEl= document.getElementById('apps-config-fields');
  var msgEl   = document.getElementById('apps-config-msg');

  if (titleEl) titleEl.textContent = app.icon + ' ' + app.name;
  if (msgEl)   msgEl.textContent   = '';

  var saved  = _appsState[appId] || {};
  var fields = app.config || [];

  var html = fields.map(function(field) {
    var val = saved[field.key] !== undefined ? saved[field.key] : (field.default !== undefined ? field.default : '');

    var input = '';
    if (field.type === 'select' && field.options) {
      input = '<select id="appcf-' + escHtml(field.key) + '" style="width:100%;padding:7px 10px;border:1.5px solid #e5e7eb;border-radius:7px;font-size:13px;background:#fff;font-family:inherit;">' +
        field.options.map(function(opt) {
          var optVal   = typeof opt === 'object' ? opt.value : opt;
          var optLabel = typeof opt === 'object' ? opt.label : opt;
          return '<option value="' + escHtml(String(optVal)) + '"' + (String(val) === String(optVal) ? ' selected' : '') + '>' + escHtml(optLabel) + '</option>';
        }).join('') +
      '</select>';
    } else if (field.type === 'textarea') {
      input = '<textarea id="appcf-' + escHtml(field.key) + '" rows="3" style="width:100%;padding:7px 10px;border:1.5px solid #e5e7eb;border-radius:7px;font-size:13px;box-sizing:border-box;font-family:inherit;resize:vertical;" placeholder="' + escHtml(field.placeholder || '') + '">' + escHtml(String(val)) + '</textarea>';
    } else if (field.type === 'color') {
      input = '<input type="color" id="appcf-' + escHtml(field.key) + '" value="' + escHtml(String(val)) + '" style="width:100%;height:36px;border:1.5px solid #e5e7eb;border-radius:7px;cursor:pointer;">';
    } else {
      input = '<input type="' + (field.type === 'password' ? 'password' : 'text') + '" id="appcf-' + escHtml(field.key) + '" value="' + escHtml(String(val)) + '" placeholder="' + escHtml(field.placeholder || '') + '" style="width:100%;padding:7px 10px;border:1.5px solid #e5e7eb;border-radius:7px;font-size:13px;box-sizing:border-box;font-family:inherit;">';
    }

    return '<div style="margin-bottom:10px;">' +
      '<label style="font-size:12px;font-weight:600;color:#374151;display:block;margin-bottom:4px;">' +
        escHtml(field.label) + (field.required ? '<span style="color:#ef4444;"> *</span>' : '') +
      '</label>' +
      input +
      (field.hint ? '<div style="font-size:11px;color:#9ca3af;margin-top:3px;">' + escHtml(field.hint) + '</div>' : '') +
    '</div>';
  }).join('');

  if (!html) html = '<div style="font-size:12px;color:#9ca3af;text-align:center;padding:8px 0;">No settings for this app.</div>';
  if (fieldsEl) fieldsEl.innerHTML = html;

  listEl.style.display  = 'none';
  drawer.style.display  = 'block';
}

function appsCloseConfig() {
  _appsConfigAppId = null;
  var listEl = document.getElementById('apps-list');
  var drawer = document.getElementById('apps-config-drawer');
  if (listEl) listEl.style.display = '';
  if (drawer) drawer.style.display = 'none';
}

/* Read config fields from the drawer and save */
function appsSaveConfig() {
  if (!_appsConfigAppId) return;
  var app  = _appsData.find(function(a) { return a.id === _appsConfigAppId; });
  var msgEl = document.getElementById('apps-config-msg');
  if (!app) return;

  var saved = _appsState[_appsConfigAppId] || {};
  saved.enabled = true;
  (app.config || []).forEach(function(field) {
    var el = document.getElementById('appcf-' + field.key);
    if (el) saved[field.key] = el.value;
  });
  _appsState[_appsConfigAppId] = saved;

  appsPersist(function(ok) {
    if (msgEl) {
      msgEl.style.color = ok ? '#059669' : '#ef4444';
      msgEl.textContent = ok ? 'Saved!' : 'Save failed.';
      setTimeout(function() { if (msgEl) msgEl.textContent = ''; }, 2000);
    }
    if (ok) appsCloseConfig();
  });
}

/* POST current _appsState to server */
function appsPersist(callback) {
  fetch('/dashboard/apps/save', {
    method: 'POST',
    credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ site_id: WEBSITE_ID, apps: _appsState })
  })
  .then(function(r) { return r.json(); })
  .then(function(data) { if (callback) callback(data.ok); })
  .catch(function() { if (callback) callback(false); });
}

/* ═══════════════════════════════════════════
   INIT
═══════════════════════════════════════════ */
renderCanvas();
togglePanel('pages');
loadThemeCSS(activeTheme);
loadThemeSections(activeTheme);
_initCatalogConfig();
// Init swatch in styles panel
(function(){
  var t = THEMES_LIST.find(function(x){ return x.id === activeTheme; });
  if (t) tcUpdateSwatch(t.id);
})();

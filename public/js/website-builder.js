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
var PANEL_TITLES = { pages:'Pages', elements:'Add Section', styles:'Styles', seo:'SEO', settings:'Site Settings', 'section-edit':'Edit Section' };

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

  switch (sec.type) {

    case 'hero': {
      var heroBg = d.bg_image
        ? 'background:url(' + escHtml(d.bg_image) + ') center/cover no-repeat;'
        : 'background:' + escHtml(d.bg_color || p) + ';';
      heroBg += 'color:' + escHtml(d.text_color || '#fff') + ';';
      if (d.bg_image) heroBg += 'position:relative;';
      return '<section class="hero" style="' + heroBg + '">' +
        (d.bg_image ? '<div style="position:absolute;inset:0;background:rgba(0,0,0,0.35);pointer-events:none;"></div>' : '') +
        '<div class="container" style="position:relative;z-index:1;">' +
        '<h1 ' + ce('headline') + '>' + escHtml(d.headline || 'Welcome') + '</h1>' +
        '<p ' + ce('subheadline') + '>' + escHtml(d.subheadline || '') + '</p>' +
        (d.cta_label
          ? '<a href="' + escHtml(d.cta_url || '#') + '" class="btn-primary" style="background:' + escHtml(d.text_color || '#fff') + ';color:' + escHtml(d.bg_color || p) + ';" onclick="return false;">' +
            '<span ' + ce('cta_label') + '>' + escHtml(d.cta_label) + '</span></a>'
          : '') +
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

  switch (type) {
    case 'hero':
      html += fI('headline', 'Headline', d.headline, 'e.g. Welcome to Our Website');
      html += fI('subheadline', 'Subheadline', d.subheadline, 'e.g. We deliver results');
      html += fI('cta_label', 'Button Label', d.cta_label, 'e.g. Get Started');
      html += fI('cta_url', 'Button URL', d.cta_url, '#contact');
      html += fImg('bg_image', 'Background Image', d.bg_image, 'Leave blank to use color');
      html += fC('bg_color', 'Background Color (no image)', d.bg_color || '#6366f1');
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
  }

  document.getElementById('sec-edit-fields').innerHTML = html;
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
  { id:'default', name:'Default', desc:'Clean modern design with soft cards and indigo accents', tags:['modern','clean','minimal','professional'], category:'Modern' },
  { id:'minimal', name:'Elegant', desc:'Warm cream palette with Playfair serif and gold accents', tags:['elegant','serif','classic','warm'], category:'Classic' },
  { id:'bold',    name:'Dark',    desc:'Full dark theme with glass cards and neon purple glow', tags:['dark','bold','neon','modern'], category:'Dark' }
];

var _tcTag = 'all';
var _tcCat = 'all';
var _tcPendingId = null;

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
  if (_tcPendingId) selectTheme(_tcPendingId);
  document.getElementById('themeChooser').style.display = 'none';
  // Update the swatch in styles panel
  tcUpdateSwatch(_tcPendingId);
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

function tcPreview(tid) {
  loadThemeCSS(tid);
  document.getElementById('tcFooterLabel').textContent = tid;
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
  { id:'contact',      label:'Contact',      icon:'📬', sub:'Contact forms & info',            bg:'#f8fafc' }
];

var PREBUILT_VARIANTS = {
  hero: [
    { label:'Bold Center', desc:'Large headline on gradient background', color:'#6366f1', tag:'popular',
      data:{ headline:'Welcome to Our Website', subheadline:'We deliver exceptional results for every client.', cta_label:'Get Started', cta_url:'#contact', bg_color:PRIMARY, text_color:'#ffffff' } },
    { label:'Dark Hero', desc:'Dramatic dark background with bright button', color:'#0f172a',
      data:{ headline:'Build Something Amazing', subheadline:'Professional solutions for modern businesses.', cta_label:'Start Today', cta_url:'#contact', bg_color:'#0f172a', text_color:'#ffffff' } },
    { label:'Light & Clean', desc:'White background with accent color text', color:'#f0f9ff',
      data:{ headline:'Your Vision, Delivered', subheadline:'Helping businesses grow since 2015.', cta_label:'Learn More', cta_url:'#about', bg_color:'#f0f9ff', text_color:'#111827' } }
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
  ]
};

var _spActiveCat = 'hero';

function openSectionPicker() {
  _spActiveCat = 'hero';
  _spSearch = '';
  var searchEl = document.getElementById('spSearch');
  if (searchEl) searchEl.value = '';
  spRenderSidebar();
  spRenderGrid('hero');
  document.getElementById('sectionPicker').style.display = 'flex';
}

function closeSectionPicker() {
  document.getElementById('sectionPicker').style.display = 'none';
}

var _spSearch = '';

function spRenderSidebar() {
  var el = document.getElementById('spSidebar');
  el.innerHTML = '<div class="sp-cat-label">Section type</div>' +
    PREBUILT_CATS.map(function(cat) {
      var isActive = cat.id === _spActiveCat;
      return '<div class="sp-cat-item' + (isActive ? ' active' : '') + '" onclick="spSetCat(\'' + cat.id + '\')">' +
        '<span class="sp-cat-icon" style="background:' + (cat.bg || '#f3f4f6') + '">' + cat.icon + '</span>' +
        escHtml(cat.label) +
      '</div>';
    }).join('');
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
  if (v.tag === 'popular') tagHtml = '<span class="sp-tag sp-tag-popular">Popular</span>';
  else if (v.tag === 'new')  tagHtml = '<span class="sp-tag sp-tag-new">New</span>';
  return '<div class="sp-card" onclick="spAddSection(\'' + catId + '\',' + i + ')">' +
    '<div class="sp-preview">' + spPreviewHTML(catId, i, v) +
      '<div class="sp-overlay"><button class="sp-overlay-btn" onclick="event.stopPropagation();spAddSection(\'' + catId + '\',' + i + ')">＋ Add section</button></div>' +
    '</div>' +
    '<div class="sp-card-info">' +
      '<div class="sp-card-name">' + escHtml(v.label) + '</div>' +
      '<div class="sp-card-desc">' + escHtml(v.desc) + '</div>' +
      (tagHtml ? '<div class="sp-card-foot">' + tagHtml + '</div>' : '') +
    '</div>' +
  '</div>';
}

function spRenderGrid(catId, filter) {
  var cat = PREBUILT_CATS.find(function(c){ return c.id === catId; });
  var variants = PREBUILT_VARIANTS[catId] || [];
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

function spPreviewHTML(type, idx, variant) {
  var c = variant.color || '#f9fafb';
  var p = siteSettings.primary || PRIMARY || '#6366f1';
  var isDark = c === '#111827' || c === '#0f172a' || c === '#080810';
  var textColor = isDark ? 'rgba(255,255,255,.85)' : '#111827';
  var subColor = isDark ? 'rgba(255,255,255,.4)' : '#9ca3af';
  var barColor = isDark ? 'rgba(255,255,255,.12)' : '#e5e7eb';

  // Shared mini-block helpers
  var line = function(w, col, h, mb) { return '<div style="width:' + w + '%;height:' + (h||4) + 'px;background:' + (col||barColor) + ';border-radius:3px;margin-bottom:' + (mb||5) + 'px;"></div>'; };
  var card = function(w, h, col) { return '<div style="flex:1;background:' + (col||'rgba(255,255,255,.7)') + ';border:1px solid rgba(0,0,0,.06);border-radius:8px;height:' + (h||50) + 'px;min-width:' + (w||0) + 'px;"></div>'; };

  var wrap = function(inner, bg, extra) { return '<div style="width:100%;height:100%;background:' + (bg||c) + ';padding:12px 14px;box-sizing:border-box;' + (extra||'') + '">' + inner + '</div>'; };

  switch(type) {
    case 'hero':
      return wrap(
        '<div style="text-align:center;padding:8px 0;">' +
        line(65, textColor === '#111827' ? '#111' : 'rgba(255,255,255,.9)', 7, 7) +
        '<div style="margin:0 auto 5px;width:45%;height:4px;background:' + subColor + ';border-radius:3px;"></div>' +
        '<div style="display:inline-block;padding:5px 14px;background:' + (isDark ? p : p) + ';border-radius:20px;margin-top:6px;">' +
          '<div style="width:40px;height:5px;background:rgba(255,255,255,.9);border-radius:3px;"></div>' +
        '</div>' +
        '</div>', c
      );
    case 'about':
      if (idx === 2) return wrap(line(50,'#111',6,8) + line(100,barColor,3,4) + line(95,barColor,3,4) + line(88,barColor,3,0));
      return wrap(
        '<div style="display:flex;gap:8px;align-items:center;">' +
          (idx === 0 ? '<div style="flex:1;">' + line(70,'#111',6,8) + line(100,barColor,3,4) + line(90,barColor,3,0) + '</div><div style="width:60px;height:55px;background:#e5e7eb;border-radius:8px;flex-shrink:0;"></div>'
                     : '<div style="width:60px;height:55px;background:#e5e7eb;border-radius:8px;flex-shrink:0;"></div><div style="flex:1;">' + line(70,'#111',6,8) + line(100,barColor,3,4) + line(90,barColor,3,0) + '</div>') +
        '</div>'
      );
    case 'services':
      var nCols = idx === 2 ? 3 : (idx === 1 ? 4 : 3);
      return wrap(
        line(40,'#111',6,10) +
        '<div style="display:flex;gap:6px;">' +
          Array(nCols).fill(0).map(function(){
            return '<div style="flex:1;background:#fff;border:1px solid #e5e7eb;border-radius:8px;padding:6px;">' +
              '<div style="width:16px;height:16px;background:' + p + ';border-radius:4px;margin-bottom:5px;opacity:.8;"></div>' +
              line(70,'#111',4,3) + line(90,barColor,3,0) +
            '</div>';
          }).join('') +
        '</div>'
      );
    case 'pricing':
      var plans = idx === 1 ? 2 : 3;
      return wrap(
        line(40,'#111',6,10) +
        '<div style="display:flex;gap:5px;align-items:flex-start;">' +
          Array(plans).fill(0).map(function(_, pi) {
            var isFeat = (plans === 3 && pi === 1) || (plans === 2 && pi === 1);
            return '<div style="flex:1;background:#fff;border:' + (isFeat ? '2px solid ' + p : '1px solid #e5e7eb') + ';border-radius:8px;padding:6px;' + (isFeat ? 'transform:scale(1.04);' : '') + '">' +
              line(60,'#888',3,4) + line(50,'#111',6,5) +
              line(80,barColor,2,2) + line(75,barColor,2,2) + line(70,barColor,2,5) +
              '<div style="background:' + p + ';border-radius:5px;height:12px;"></div>' +
            '</div>';
          }).join('') +
        '</div>'
      );
    case 'stats':
      var nStats = idx === 1 ? 3 : 4;
      return wrap(
        line(40,'#111',6,10) +
        '<div style="display:flex;gap:6px;">' +
          Array(nStats).fill(0).map(function(){
            return '<div style="flex:1;text-align:center;padding:4px 0;">' +
              '<div style="font-size:16px;margin-bottom:4px;">●</div>' +
              '<div style="height:14px;background:' + p + ';border-radius:3px;margin:0 auto 4px;width:70%;opacity:.8;"></div>' +
              line(80,barColor,3,0) +
            '</div>';
          }).join('') +
        '</div>'
      );
    case 'testimonials':
      var nT = idx === 1 ? 2 : 3;
      return wrap(
        line(45,'#111',6,10) +
        '<div style="display:flex;gap:6px;">' +
          Array(nT).fill(0).map(function(){
            return '<div style="flex:1;background:#fff;border:1px solid #e5e7eb;border-radius:8px;padding:7px;">' +
              line(90,barColor,3,2) + line(80,barColor,3,7) +
              '<div style="display:flex;align-items:center;gap:4px;">' +
                '<div style="width:16px;height:16px;border-radius:50%;background:' + p + ';opacity:.7;flex-shrink:0;"></div>' +
                '<div>' + line(55,'#111',4,2) + line(45,barColor,3,0) + '</div>' +
              '</div>' +
            '</div>';
          }).join('') +
        '</div>'
      );
    case 'team':
      var nMem = idx === 1 ? 4 : 3;
      return wrap(
        line(40,'#111',6,10) +
        '<div style="display:flex;gap:8px;">' +
          Array(nMem).fill(0).map(function(){
            return '<div style="flex:1;text-align:center;">' +
              '<div style="width:32px;height:32px;background:#e5e7eb;border-radius:8px;margin:0 auto 5px;"></div>' +
              line(80,'#111',4,2) + line(65,barColor,3,0) +
            '</div>';
          }).join('') +
        '</div>'
      );
    case 'faq':
      var nQ = idx === 1 ? 3 : 4;
      return wrap(
        line(40,'#111',6,10) +
        Array(nQ).fill(0).map(function(){
          return '<div style="background:#fff;border:1px solid #e5e7eb;border-radius:6px;padding:6px 8px;margin-bottom:4px;display:flex;align-items:center;gap:6px;">' +
            line(70,'#111',4,0) + '<div style="margin-left:auto;width:6px;height:6px;border-right:2px solid #9ca3af;border-bottom:2px solid #9ca3af;transform:rotate(45deg);flex-shrink:0;"></div>' +
          '</div>';
        }).join('')
      );
    case 'cta':
      return wrap(
        '<div style="text-align:center;padding:8px 0;">' +
        line(55, isDark ? 'rgba(255,255,255,.9)' : '#111', 7, 7) +
        '<div style="margin:0 auto 10px;width:65%;height:3px;background:' + (isDark ? 'rgba(255,255,255,.3)' : barColor) + ';border-radius:3px;"></div>' +
        '<div style="display:inline-block;padding:5px 14px;background:' + (idx === 2 ? p : 'rgba(255,255,255,.9)') + ';border-radius:20px;">' +
          '<div style="width:40px;height:5px;background:' + (idx === 2 ? '#fff' : '#111') + ';border-radius:3px;"></div>' +
        '</div>' +
        '</div>', c
      );
    case 'gallery':
      return wrap(
        (idx === 0 ? line(35,'#111',6,8) : '<div style="height:8px;"></div>') +
        '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:4px;">' +
          Array(6).fill(0).map(function(){ return '<div style="background:#e5e7eb;border-radius:4px;height:24px;"></div>'; }).join('') +
        '</div>'
      );
    case 'video':
      return wrap(
        (variant.data.heading ? line(40,'#111',6,8) : '<div style="height:4px;"></div>') +
        '<div style="background:#111;border-radius:8px;height:65px;display:flex;align-items:center;justify-content:center;">' +
          '<div style="width:22px;height:22px;border-radius:50%;background:rgba(255,255,255,.15);display:flex;align-items:center;justify-content:center;">' +
            '<div style="width:0;height:0;border-top:5px solid transparent;border-bottom:5px solid transparent;border-left:8px solid rgba(255,255,255,.7);margin-left:2px;"></div>' +
          '</div>' +
        '</div>'
      );
    case 'logobar':
      return wrap(
        (variant.data.heading ? line(30,'#111',5,10) : '<div style="height:10px;"></div>') +
        '<div style="display:flex;gap:8px;align-items:center;justify-content:center;opacity:.5;">' +
          Array(4).fill(0).map(function(){ return '<div style="width:36px;height:12px;background:#6b7280;border-radius:2px;"></div>'; }).join('') +
        '</div>'
      );
    case 'timeline':
      return wrap(
        line(40,'#111',6,10) +
        Array(3).fill(0).map(function(_, ti){
          return '<div style="display:flex;gap:8px;align-items:flex-start;margin-bottom:' + (ti<2?8:0) + 'px;">' +
            '<div style="width:18px;height:18px;border-radius:50%;background:' + p + ';flex-shrink:0;opacity:.8;"></div>' +
            '<div style="flex:1;padding-top:2px;">' + line(60,'#111',4,3) + line(85,barColor,3,0) + '</div>' +
          '</div>';
        }).join('')
      );
    case 'columns':
      var nCol = variant.data.cols === '2' ? 2 : 3;
      return wrap(
        '<div style="display:flex;gap:6px;">' +
          Array(nCol).fill(0).map(function(){
            return '<div style="flex:1;padding:6px 0;">' +
              '<div style="font-size:16px;margin-bottom:6px;">✨</div>' +
              line(75,'#111',5,4) + line(90,barColor,3,3) + line(85,barColor,3,0) +
            '</div>';
          }).join('') +
        '</div>'
      );
    case 'rich_text':
      var centered = variant.data.align === 'center';
      return wrap(
        (variant.data.title ? '<div style="width:' + (centered?'45%':'55%') + ';height:6px;background:#111;border-radius:3px;margin:' + (centered?'0 auto ':'')+' 0 10px;"></div>' : '') +
        line(centered ? 90 : 100, barColor, 3, 3) + line(centered ? 85 : 95, barColor, 3, 3) +
        line(centered ? 90 : 88, barColor, 3, 3) + line(centered ? 70 : 78, barColor, 3, 0)
      );
    case 'newsletter':
      return wrap(
        line(45,'#111',6,6) +
        line(65,barColor,3,8) +
        '<div style="display:flex;gap:4px;max-width:90%;margin:0 auto;">' +
          '<div style="flex:1;background:#fff;border:1px solid #e5e7eb;border-radius:6px;height:20px;"></div>' +
          '<div style="background:' + p + ';border-radius:6px;padding:0 8px;height:20px;min-width:32px;"></div>' +
        '</div>'
      );
    case 'contact':
      return wrap(
        line(40,'#111',6,10) +
        '<div style="display:flex;gap:8px;">' +
          (variant.data.email
            ? '<div style="width:70px;">' + line(80,barColor,3,4) + line(80,barColor,3,4) + line(80,barColor,3,0) + '</div>'
            : '') +
          '<div style="flex:1;background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:6px;">' +
            line(90,barColor,3,3) + line(90,barColor,3,3) + line(90,barColor,3,3) +
            '<div style="background:' + p + ';border-radius:5px;height:10px;margin-top:4px;opacity:.8;"></div>' +
          '</div>' +
        '</div>'
      );
    default:
      return '<div style="width:100%;height:100%;background:' + c + ';display:flex;align-items:center;justify-content:center;font-size:28px;">✦</div>';
  }
}

/* ═══════════════════════════════════════════
   INIT
═══════════════════════════════════════════ */
renderCanvas();
togglePanel('pages');
loadThemeCSS(activeTheme);
// Init swatch in styles panel
(function(){
  var t = THEMES_LIST.find(function(x){ return x.id === activeTheme; });
  if (t) tcUpdateSwatch(t.id);
})();

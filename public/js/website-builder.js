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
  hero:         { headline:'Welcome to Our Website', subheadline:'We deliver exceptional results for every client.', cta_label:'Get Started', cta_url:'#contact', bg_color:PRIMARY, text_color:'#ffffff' },
  about:        { heading:'About Us', text:'Tell your story here. What makes you unique?', image:'', layout:'image_right' },
  services:     { heading:'Our Services', items:[{icon:'⚡',title:'Service One',desc:'Description of this service.'},{icon:'🎯',title:'Service Two',desc:'Description of this service.'},{icon:'💎',title:'Service Three',desc:'Description of this service.'}] },
  gallery:      { heading:'Gallery', images:[] },
  testimonials: { heading:'What Clients Say', items:[{name:'Client Name',role:'CEO, Company',quote:'This service changed our business completely!'}] },
  team:         { heading:'Meet the Team', items:[{name:'Team Member',role:'Position',image:''}] },
  faq:          { heading:'Frequently Asked Questions', items:[{q:'What do you offer?',a:'We offer premium services tailored to your needs.'}] },
  cta:          { heading:'Ready to Get Started?', subheading:'Join hundreds of happy customers today.', cta_label:'Contact Us', cta_url:'#contact', bg_color:'#111827', text_color:'#ffffff' },
  contact:      { heading:'Get in Touch', email:'', phone:'', address:'', show_form:true }
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
  root.innerHTML = html;

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

    case 'hero':
      return '<section class="hero" style="background:' + escHtml(d.bg_color || p) + ';color:' + escHtml(d.text_color || '#fff') + ';">' +
        '<div class="container">' +
        '<h1 ' + ce('headline') + '>' + escHtml(d.headline || 'Welcome') + '</h1>' +
        '<p ' + ce('subheadline') + '>' + escHtml(d.subheadline || '') + '</p>' +
        (d.cta_label
          ? '<a href="' + escHtml(d.cta_url || '#') + '" class="btn-primary" style="background:' + escHtml(d.text_color || '#fff') + ';color:' + escHtml(d.bg_color || p) + ';" onclick="return false;">' +
            '<span ' + ce('cta_label') + '>' + escHtml(d.cta_label) + '</span></a>'
          : '') +
        '</div></section>';

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
      return '<section class="section">' +
        '<div class="container">' +
        (d.heading ? '<div class="section-heading"><h2 ' + ce('heading') + '>' + escHtml(d.heading) + '</h2></div>' : '') +
        '<div class="gallery-grid">' +
        (imgs.length
          ? imgs.map(function(im){ return '<div class="gallery-item"><img src="' + escHtml(im) + '" alt="Gallery" loading="lazy"></div>'; }).join('')
          : '<div class="gallery-item" style="display:flex;align-items:center;justify-content:center;font-size:32px;color:#d1d5db;">🖼</div>' +
            '<div class="gallery-item" style="display:flex;align-items:center;justify-content:center;font-size:32px;color:#d1d5db;">🖼</div>' +
            '<div class="gallery-item" style="display:flex;align-items:center;justify-content:center;font-size:32px;color:#d1d5db;">🖼</div>'
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

  function itemsEditor(key, items, fields, labels) {
    var h = '<div class="field-group"><label class="fl">Items</label><div class="it-list" id="itl-' + sid + '-' + key + '">';
    items.forEach(function(item, i) {
      h += '<div class="it-card">';
      h += '<button class="it-del" onclick="removeItem(\'' + sid + '\',\'' + key + '\',' + i + ')">✕</button>';
      fields.forEach(function(f, fi) {
        h += '<input class="fi" placeholder="' + escHtml(labels[fi]) + '" value="' + escHtml(item[f] || '') + '" oninput="sdi(\'' + sid + '\',\'' + key + '\',' + i + ',\'' + f + '\',this.value)">';
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
      html += fC('bg_color', 'Background Color', d.bg_color || '#6366f1');
      html += fC('text_color', 'Text Color', d.text_color || '#ffffff');
      break;
    case 'about':
      html += fI('heading', 'Section Heading', d.heading);
      html += fT('text', 'Content', d.text);
      html += fI('image', 'Image URL', d.image, 'https://...');
      html += fS('layout', 'Layout', d.layout, { 'image_right':'Text left, Image right', 'image_left':'Image left, Text right', 'full_text':'Text only' });
      break;
    case 'services':
      html += fI('heading', 'Section Heading', d.heading);
      html += itemsEditor('items', d.items || [], ['icon','title','desc'], ['Icon/Emoji','Title','Description']);
      break;
    case 'gallery':
      html += fI('heading', 'Section Heading', d.heading);
      html += '<div class="field-group"><label class="fl">Image URLs (one per line)</label>' +
        '<textarea class="fi ft" oninput="sd(\'' + sid + '\',\'images\',this.value.split(\'\\n\').filter(Boolean))">' +
        escHtml((d.images || []).join('\n')) + '</textarea></div>';
      break;
    case 'testimonials':
      html += fI('heading', 'Section Heading', d.heading);
      html += itemsEditor('items', d.items || [], ['name','role','quote'], ['Name','Role / Company','Quote']);
      break;
    case 'team':
      html += fI('heading', 'Section Heading', d.heading);
      html += itemsEditor('items', d.items || [], ['image','name','role'], ['Photo URL','Name','Role']);
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
  document.querySelectorAll('.theme-card').forEach(function(el){ el.classList.remove('selected'); });
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
   INIT
═══════════════════════════════════════════ */
renderCanvas();
togglePanel('pages');
loadThemeCSS(activeTheme);

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
}
function backFromEdit() {
  selectedSecId = null;
  document.querySelectorAll('.cs-section').forEach(function(el){ el.classList.remove('selected'); });
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
      '<span class="page-item-name">' + p.title + '</span>' +
      (p.is_home ? '<span class="page-item-home">Home</span>' : '<button class="page-item-del" onclick="event.stopPropagation();deletePage(' + p.id + ',this)">✕</button>') +
    '</div>';
  }).join('');
}

/* ═══════════════════════════════════════════
   CANVAS RENDER
═══════════════════════════════════════════ */
var primary = siteSettings.primary;

function renderCanvas() {
  var root = document.getElementById('canvasRoot');
  if (!sections.length) {
    root.innerHTML = '<div class="canvas-empty"><div class="canvas-empty-icon">🏗</div><div class="canvas-empty-title">Start building your page</div><div class="canvas-empty-sub">Click "Add" in the left sidebar to add your first section.</div><button class="canvas-empty-btn" onclick="togglePanel(\'elements\')">+ Add First Section</button></div>';
    return;
  }
  var html = '';
  sections.forEach(function(sec, i) {
    html += '<div class="cs-section" id="cs-' + sec.id + '" onclick="clickSection(event,\'' + sec.id + '\')">';
    html += '<div class="cs-toolbar">';
    html += (i > 0 ? '<button class="cs-tb-btn" onclick="event.stopPropagation();moveSection(\'' + sec.id + '\',-1)" title="Move up">↑</button>' : '');
    html += (i < sections.length-1 ? '<button class="cs-tb-btn" onclick="event.stopPropagation();moveSection(\'' + sec.id + '\',1)" title="Move down">↓</button>' : '');
    html += '<button class="cs-tb-btn del" onclick="event.stopPropagation();deleteSection(\'' + sec.id + '\')" title="Delete">🗑</button>';
    html += '</div>';
    html += renderSectionPreview(sec);
    html += '</div>';
    html += '<div class="cs-add-row"><button class="cs-add-btn" onclick="event.stopPropagation();insertSectionAfter(\'' + sec.id + '\')">+</button></div>';
  });
  root.innerHTML = html;
  // restore selected
  if (selectedSecId) {
    var el = document.getElementById('cs-' + selectedSecId);
    if (el) el.classList.add('selected');
  }
}

function renderSectionPreview(sec) {
  var d = sec.data || {};
  var p = siteSettings.primary;
  switch(sec.type) {
    case 'hero':
      return '<div class="cs-hero" style="background:' + (d.bg_color||p) + ';color:' + (d.text_color||'#fff') + ';">' +
        '<h1>' + (d.headline||'Welcome') + '</h1>' +
        (d.subheadline ? '<p>' + d.subheadline + '</p>' : '') +
        (d.cta_label ? '<a href="' + (d.cta_url||'#') + '" class="cs-cta" style="background:' + (d.text_color||'#fff') + ';color:' + (d.bg_color||p) + ';">' + d.cta_label + '</a>' : '') +
        '</div>';

    case 'about':
      var imgRight = d.layout !== 'image_left';
      var hasImg = d.image;
      var imgHtml = hasImg
        ? '<div class="cs-about-img"><img src="' + d.image + '" alt="About"></div>'
        : (d.layout !== 'full_text' ? '<div class="cs-about-img">🏢</div>' : '');
      var textHtml = '<div class="cs-about-text"><h2>' + (d.heading||'About Us') + '</h2><p>' + (d.text||'') + '</p></div>';
      return '<div class="cs-about"><div class="cs-about-grid' + (d.layout==='full_text'?' text-only':'') + '">' +
        (imgRight ? textHtml + imgHtml : imgHtml + textHtml) +
        '</div></div>';

    case 'services':
      var items = d.items || [];
      return '<div class="cs-services"><div class="cs-sec-heading"><h2>' + (d.heading||'Services') + '</h2></div>' +
        '<div class="cs-services-grid">' +
        items.map(function(it){ return '<div class="cs-svc-card"><div class="cs-svc-icon">'+(it.icon||'⚡')+'</div><div class="cs-svc-title">'+(it.title||'')+'</div><div class="cs-svc-desc">'+(it.desc||'')+'</div></div>'; }).join('') +
        '</div></div>';

    case 'gallery':
      var imgs = (d.images||[]).filter(Boolean);
      return '<div class="cs-gallery"><div class="cs-sec-heading"><h2>'+(d.heading||'Gallery')+'</h2></div>' +
        '<div class="cs-gallery-grid">' +
        (imgs.length ? imgs.slice(0,6).map(function(im){ return '<div class="cs-gallery-item"><img src="'+im+'" alt="Gallery" loading="lazy"></div>'; }).join('') : '<div class="cs-gallery-item"><div class="cs-gallery-ph">🖼</div></div><div class="cs-gallery-item"><div class="cs-gallery-ph">🖼</div></div><div class="cs-gallery-item"><div class="cs-gallery-ph">🖼</div></div>') +
        '</div></div>';

    case 'testimonials':
      var tits = d.items || [];
      return '<div class="cs-testimonials"><div class="cs-sec-heading"><h2>'+(d.heading||'Testimonials')+'</h2></div>' +
        '<div class="cs-testi-grid">' +
        tits.map(function(t){ return '<div class="cs-testi-card"><div class="cs-testi-q">"'+(t.quote||'')+'"</div><div class="cs-testi-name">'+(t.name||'')+'</div><div class="cs-testi-role">'+(t.role||'')+'</div></div>'; }).join('') +
        '</div></div>';

    case 'team':
      var tms = d.items || [];
      return '<div class="cs-team"><div class="cs-sec-heading"><h2>'+(d.heading||'Team')+'</h2></div>' +
        '<div class="cs-team-grid">' +
        tms.map(function(m){ return '<div class="cs-team-card"><div class="cs-team-photo">'+(m.image?'<img src="'+m.image+'" alt="'+m.name+'">':'👤')+'</div><div class="cs-team-name">'+(m.name||'')+'</div><div class="cs-team-role">'+(m.role||'')+'</div></div>'; }).join('') +
        '</div></div>';

    case 'faq':
      var fqs = d.items || [];
      return '<div class="cs-faq"><div class="cs-sec-heading"><h2>'+(d.heading||'FAQ')+'</h2></div>' +
        '<div class="cs-faq-list">' +
        fqs.slice(0,3).map(function(f){ return '<div class="cs-faq-item"><div class="cs-faq-q">'+(f.q||'')+'</div><div class="cs-faq-a">'+(f.a||'')+'</div></div>'; }).join('') +
        (fqs.length>3?'<div style="text-align:center;font-size:12px;color:#9ca3af;padding:8px;">+' + (fqs.length-3) + ' more…</div>':'') +
        '</div></div>';

    case 'cta':
      return '<div class="cs-cta-banner" style="background:'+(d.bg_color||'#111827')+';color:'+(d.text_color||'#fff')+';"><h2>'+(d.heading||'Get Started')+'</h2>'+(d.subheading?'<p>'+d.subheading+'</p>':'')+(d.cta_label?'<a href="'+(d.cta_url||'#')+'" class="cs-cta" style="background:'+(d.text_color||'#fff')+';color:'+(d.bg_color||'#111')+';">'+(d.cta_label)+'</a>':'')+'</div>';

    case 'contact':
      return '<div class="cs-contact"><div class="cs-sec-heading"><h2>'+(d.heading||'Contact')+'</h2></div>' +
        '<div class="cs-contact-grid">' +
        '<div>' +
        (d.email?'<div class="cs-contact-info-item"><div class="cs-contact-info-icon" style="background:'+p+'22;">✉️</div><div><div class="cs-contact-info-label">Email</div><div class="cs-contact-info-text">'+d.email+'</div></div></div>':'') +
        (d.phone?'<div class="cs-contact-info-item"><div class="cs-contact-info-icon" style="background:'+p+'22;">📞</div><div><div class="cs-contact-info-label">Phone</div><div class="cs-contact-info-text">'+d.phone+'</div></div></div>':'') +
        (d.address?'<div class="cs-contact-info-item"><div class="cs-contact-info-icon" style="background:'+p+'22;">📍</div><div><div class="cs-contact-info-label">Address</div><div class="cs-contact-info-text">'+d.address+'</div></div></div>':'') +
        (!d.email&&!d.phone&&!d.address?'<p style="color:#9ca3af;font-size:14px;">Add contact details in the editor →</p>':'') +
        '</div>' +
        '<div class="cs-contact-form"><input class="cs-cf-input" placeholder="Your Name"><input class="cs-cf-input" placeholder="Email"><textarea class="cs-cf-input" style="min-height:80px;resize:none;" placeholder="Message"></textarea><button class="cs-cf-sub" style="background:'+p+';color:#fff;">Send Message</button></div>' +
        '</div></div>';

    default:
      return '<div style="padding:40px;text-align:center;color:#9ca3af;">Section: ' + sec.type + '</div>';
  }
}

/* ═══════════════════════════════════════════
   SECTION CLICK / SELECT
═══════════════════════════════════════════ */
function clickSection(e, sid) {
  if (e.target.closest('.cs-toolbar')) return;
  document.querySelectorAll('.cs-section').forEach(function(el){ el.classList.remove('selected'); });
  var el = document.getElementById('cs-' + sid);
  if (el) el.classList.add('selected');
  openSectionEdit(sid);
}

/* ═══════════════════════════════════════════
   SECTION EDIT PANEL
═══════════════════════════════════════════ */
function renderSectionEditPanel(sid) {
  var sec = sections.find(function(s){ return s.id===sid; });
  if (!sec) return;
  var d = sec.data || {};
  var html = '';
  var type = sec.type;

  var fI  = function(key, label, val, ph){ return '<div class="field-group"><label class="fl">'+label+'</label><input class="fi" value="'+(val||'')+'" placeholder="'+(ph||'')+'" oninput="sd(\''+sid+'\',\''+key+'\',this.value)"></div>'; };
  var fT  = function(key, label, val){ return '<div class="field-group"><label class="fl">'+label+'</label><textarea class="fi ft" oninput="sd(\''+sid+'\',\''+key+'\',this.value)">'+(val||'')+'</textarea></div>'; };
  var fC  = function(key, label, val){ return '<div class="field-group"><label class="fl">'+label+'</label><div class="color-row"><input type="color" class="fi-color" value="'+(val||'#6366f1')+'" oninput="sd(\''+sid+'\',\''+key+'\',this.value)"><input class="fi" value="'+(val||'')+'" style="flex:1;" oninput="sd(\''+sid+'\',\''+key+'\',this.value)"></div></div>'; };
  var fS  = function(key, label, val, opts){ var s='<div class="field-group"><label class="fl">'+label+'</label><select class="fi" onchange="sd(\''+sid+'\',\''+key+'\',this.value)">'; Object.keys(opts).forEach(function(k){ s+='<option value="'+k+'"'+(val===k?' selected':'')+'>'+opts[k]+'</option>'; }); return s+'</select></div>'; };

  function itemsEditor(key, items, fields, labels) {
    var h = '<div class="field-group"><label class="fl">Items</label><div class="it-list" id="itl-'+sid+'-'+key+'">';
    items.forEach(function(item, i) {
      h += '<div class="it-card">';
      h += '<button class="it-del" onclick="removeItem(\''+sid+'\',\''+key+'\','+i+')">✕</button>';
      fields.forEach(function(f, fi) {
        h += '<input class="fi" placeholder="'+labels[fi]+'" value="'+(item[f]||'')+'" oninput="sdi(\''+sid+'\',\''+key+'\','+i+',\''+f+'\',this.value)">';
      });
      h += '</div>';
    });
    h += '</div><button class="add-it-btn" onclick="addItem(\''+sid+'\',\''+key+'\',\''+fields.join(',')+'\')" >+ Add item</button></div>';
    return h;
  }

  switch (type) {
    case 'hero':
      html += fI('headline','Headline',d.headline,'e.g. Welcome to Our Website');
      html += fI('subheadline','Subheadline',d.subheadline,'e.g. We deliver results');
      html += fI('cta_label','Button Label',d.cta_label,'e.g. Get Started');
      html += fI('cta_url','Button URL',d.cta_url,'#contact');
      html += fC('bg_color','Background Color',d.bg_color||'#6366f1');
      html += fC('text_color','Text Color',d.text_color||'#ffffff');
      break;
    case 'about':
      html += fI('heading','Section Heading',d.heading);
      html += fT('text','Content',d.text);
      html += fI('image','Image URL',d.image,'https://...');
      html += fS('layout','Layout',d.layout,{'image_right':'Text left, Image right','image_left':'Image left, Text right','full_text':'Text only'});
      break;
    case 'services':
      html += fI('heading','Section Heading',d.heading);
      html += itemsEditor('items', d.items||[], ['icon','title','desc'], ['Icon/Emoji','Title','Description']);
      break;
    case 'gallery':
      html += fI('heading','Section Heading',d.heading);
      html += '<div class="field-group"><label class="fl">Image URLs (one per line)</label><textarea class="fi ft" oninput="sd(\''+sid+'\',\'images\',this.value.split(\'\\n\').filter(Boolean))">'+(d.images||[]).join('\n')+'</textarea></div>';
      break;
    case 'testimonials':
      html += fI('heading','Section Heading',d.heading);
      html += itemsEditor('items', d.items||[], ['name','role','quote'], ['Name','Role / Company','Quote']);
      break;
    case 'team':
      html += fI('heading','Section Heading',d.heading);
      html += itemsEditor('items', d.items||[], ['image','name','role'], ['Photo URL','Name','Role']);
      break;
    case 'faq':
      html += fI('heading','Section Heading',d.heading);
      html += itemsEditor('items', d.items||[], ['q','a'], ['Question','Answer']);
      break;
    case 'cta':
      html += fI('heading','Headline',d.heading);
      html += fI('subheading','Subheading',d.subheading);
      html += fI('cta_label','Button Label',d.cta_label);
      html += fI('cta_url','Button URL',d.cta_url,'#contact');
      html += fC('bg_color','Background Color',d.bg_color||'#111827');
      html += fC('text_color','Text Color',d.text_color||'#ffffff');
      break;
    case 'contact':
      html += fI('heading','Section Heading',d.heading);
      html += fI('email','Email',d.email,'contact@example.com');
      html += fI('phone','Phone',d.phone,'+91 ...');
      html += fI('address','Address',d.address,'Street, City');
      break;
  }

  document.getElementById('sec-edit-fields').innerHTML = html;
}

/* Data setters */
function sd(sid, key, val) {
  var sec = sections.find(function(s){ return s.id===sid; });
  if (!sec) return;
  if (!sec.data) sec.data = {};
  sec.data[key] = val;
  renderCanvas();
  pushUndo();
}
function sdi(sid, key, idx, field, val) {
  var sec = sections.find(function(s){ return s.id===sid; });
  if (!sec || !sec.data[key]) return;
  sec.data[key][idx][field] = val;
  renderCanvas();
  pushUndo();
}
function addItem(sid, key, fieldsStr) {
  var sec = sections.find(function(s){ return s.id===sid; });
  if (!sec) return;
  if (!sec.data[key]) sec.data[key] = [];
  var fields = fieldsStr.split(',');
  var newItem = {}; fields.forEach(function(f){ newItem[f]=''; });
  sec.data[key].push(newItem);
  renderSectionEditPanel(sid);
  renderCanvas();
  pushUndo();
}
function removeItem(sid, key, idx) {
  var sec = sections.find(function(s){ return s.id===sid; });
  if (!sec || !sec.data[key]) return;
  sec.data[key].splice(idx, 1);
  renderSectionEditPanel(sid);
  renderCanvas();
  pushUndo();
}

/* ═══════════════════════════════════════════
   SECTION CRUD
═══════════════════════════════════════════ */
function addSection(type) {
  var def = SEC_DEF[type] || {};
  var sec = { id: 'sec_' + Date.now(), type: type, data: JSON.parse(JSON.stringify(def)) };
  sections.push(sec);
  renderCanvas();
  openSectionEdit(sec.id);
  pushUndo();
  setStatus('saving');
}
function insertSectionAfter(sid) {
  togglePanel('elements');
  window._insertAfter = sid;
}
// Override addSection when inserting after
(function(){
  var orig = window.addSection;
  window.addSection = function(type) {
    var def = SEC_DEF[type] || {};
    var sec = { id: 'sec_' + Date.now(), type: type, data: JSON.parse(JSON.stringify(def)) };
    if (window._insertAfter) {
      var idx = sections.findIndex(function(s){ return s.id === window._insertAfter; });
      if (idx >= 0) { sections.splice(idx+1, 0, sec); window._insertAfter = null; }
      else sections.push(sec);
    } else {
      sections.push(sec);
    }
    renderCanvas();
    openSectionEdit(sec.id);
    pushUndo();
    setStatus('saving');
  };
})();

function deleteSection(sid) {
  if (!confirm('Remove this section?')) return;
  sections = sections.filter(function(s){ return s.id !== sid; });
  if (selectedSecId === sid) { selectedSecId = null; closePanel(); }
  renderCanvas();
  pushUndo();
}
function moveSection(sid, dir) {
  var idx = sections.findIndex(function(s){ return s.id===sid; });
  if (idx < 0) return;
  var ni = idx + dir;
  if (ni < 0 || ni >= sections.length) return;
  var tmp = sections[idx]; sections[idx] = sections[ni]; sections[ni] = tmp;
  renderCanvas();
}

/* ═══════════════════════════════════════════
   DEVICE TOGGLE
═══════════════════════════════════════════ */
function setDevice(d) {
  var dev = document.getElementById('wbDevice');
  dev.className = 'wb-device' + (d !== 'desktop' ? ' ' + d : '');
  ['desktop','tablet','mobile'].forEach(function(n){
    document.getElementById('d-'+n).classList.toggle('active', n===d);
  });
}

/* ═══════════════════════════════════════════
   UNDO / REDO
═══════════════════════════════════════════ */
function pushUndo() {
  undoStack = undoStack.slice(0, undoIdx+1);
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
  if (undoIdx >= undoStack.length-1) return;
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
  el.textContent = msg || (s==='saving'?'Saving…':s==='saved'?'All changes saved':'');
}
async function saveSections() {
  if (!currentPageId) return;
  setStatus('saving');
  try {
    var res = await fetch('/dashboard/website/'+WEBSITE_ID+'/page/'+currentPageId+'/save', {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ sections: sections })
    });
    var data = await res.json();
    setStatus(data.ok ? 'saved' : '', data.ok ? 'All changes saved' : 'Save failed');
  } catch(e) { setStatus('','Save failed'); }
}
async function saveAndPublish() {
  await saveSections();
  var res = await fetch('/dashboard/website/'+WEBSITE_ID+'/publish', {
    method:'POST', headers:{'Content-Type':'application/json'}, body:'{}'
  });
  var data = await res.json();
  if (data.ok) {
    isPublished = data.published;
    if (data.published) window.open('/w/'+SUBDOMAIN, '_blank');
  }
}
function openPreview() {
  window.open('/w/'+SUBDOMAIN, '_blank');
}

/* ═══════════════════════════════════════════
   STYLES SAVE
═══════════════════════════════════════════ */
function onStyleChange(key, val) {
  siteSettings[key] = val;
  if (key === 'primary') primary = val;
  renderCanvas();
}
async function saveStyles() {
  var res = await fetch('/dashboard/website/'+WEBSITE_ID+'/settings', {
    method:'POST', headers:{'Content-Type':'application/json'},
    body: JSON.stringify({ primary: siteSettings.primary, font: document.getElementById('sy-font').value })
  });
  var data = await res.json();
  if (data.ok) setStatus('saved','Styles saved');
}

/* ═══════════════════════════════════════════
   SETTINGS SAVE
═══════════════════════════════════════════ */
async function saveSettings() {
  var res = await fetch('/dashboard/website/'+WEBSITE_ID+'/settings', {
    method:'POST', headers:{'Content-Type':'application/json'},
    body: JSON.stringify({
      title:   document.getElementById('st-title').value,
      tagline: document.getElementById('st-tagline').value,
      logo:    document.getElementById('st-logo').value,
    })
  });
  var data = await res.json();
  if (data.ok) setStatus('saved','Settings saved');
}

/* ═══════════════════════════════════════════
   SEO SAVE
═══════════════════════════════════════════ */
async function saveSEO() {
  if (!currentPageId) return;
  var res = await fetch('/dashboard/website/'+WEBSITE_ID+'/page/'+currentPageId+'/seo', {
    method:'POST', headers:{'Content-Type':'application/json'},
    body: JSON.stringify({
      seo_title: document.getElementById('seo-title').value,
      seo_desc:  document.getElementById('seo-desc').value
    })
  });
  var data = await res.json();
  if (data.ok) setStatus('saved','SEO saved');
}

/* ═══════════════════════════════════════════
   PAGES
═══════════════════════════════════════════ */
function switchPage(pageId) {
  if (pageId === currentPageId) { closePanel(); return; }
  window.location.href = '/dashboard/website/'+WEBSITE_ID+'/editor?page='+pageId;
}
async function addPage() {
  var title = prompt('Page name:');
  if (!title) return;
  var res = await fetch('/dashboard/website/'+WEBSITE_ID+'/page/add', {
    method:'POST', headers:{'Content-Type':'application/json'},
    body: JSON.stringify({ title: title })
  });
  var data = await res.json();
  if (data.ok) {
    allPages.push(data.page);
    renderPageList();
    window.location.href = '/dashboard/website/'+WEBSITE_ID+'/editor?page='+data.page.id;
  }
}
async function deletePage(pageId, btn) {
  if (!confirm('Delete this page?')) return;
  var res = await fetch('/dashboard/website/'+WEBSITE_ID+'/page/'+pageId+'/delete', {
    method:'POST', headers:{'Content-Type':'application/json'}, body:'{}'
  });
  var data = await res.json();
  if (data.ok) {
    allPages = allPages.filter(function(p){ return p.id !== pageId; });
    if (currentPageId === pageId) window.location.href = '/dashboard/website/'+WEBSITE_ID+'/editor';
    else renderPageList();
  } else { alert(data.error || 'Cannot delete'); }
}

/* ═══════════════════════════════════════════
   AUTO-SAVE
═══════════════════════════════════════════ */
var autoSaveTimer;
document.addEventListener('input', function() {
  clearTimeout(autoSaveTimer);
  setStatus('saving');
  autoSaveTimer = setTimeout(saveSections, 2000);
});

/* ═══════════════════════════════════════════
   KEYBOARD
═══════════════════════════════════════════ */
document.addEventListener('keydown', function(e) {
  if ((e.ctrlKey||e.metaKey) && e.key==='z' && !e.shiftKey) { e.preventDefault(); undo(); }
  if ((e.ctrlKey||e.metaKey) && (e.key==='y'||(e.key==='z'&&e.shiftKey))) { e.preventDefault(); redo(); }
  if ((e.ctrlKey||e.metaKey) && e.key==='s') { e.preventDefault(); saveSections(); }
  if (e.key==='Escape') { closePanel(); document.querySelectorAll('.cs-section').forEach(function(el){ el.classList.remove('selected'); }); selectedSecId=null; }
});

/* ═══════════════════════════════════════════
   INIT
═══════════════════════════════════════════ */
renderCanvas();
togglePanel('pages');

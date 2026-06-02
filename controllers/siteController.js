const { db }        = require('../config/db')
const themeManager  = require('../config/themeManager')
const axios         = require('axios')

exports.store = async (req, res) => {
  const user = req.session.user
  const { title, subdomain: rawSub, category, template_id, site_type,
          description, city, phone, whatsapp, address,
          skills, bio, instagram, youtube, blog_topic, author,
          product_desc, theme } = req.body

  const subdomain = (rawSub || '').toLowerCase().trim()
  const errors    = []

  if (!title)     errors.push('Title is required.')
  if (!subdomain) errors.push('Subdomain is required.')
  if (!/^[a-z0-9-]+$/.test(subdomain)) errors.push('Only lowercase letters, numbers, hyphens allowed.')

  if (!errors.length) {
    const exists = await db.first('SELECT id FROM ms_pages WHERE subdomain = ?', [subdomain])
    if (exists) errors.push('That subdomain is already taken.')
  }

  if (errors.length) {
    req.flash('errors', errors)
    return res.redirect('/dashboard/wizard')
  }

  const settings = JSON.stringify({
    site_type, description, city, phone, whatsapp, address,
    skills, bio, instagram, youtube, blog_topic, author,
    product_desc, theme: theme || 'blue',
    template_id: template_id || 'minimal',
    sections: null
  })

  const id = await db.lastId(
    'INSERT INTO ms_pages (account_id, title, subdomain, category, template_id, settings, is_published) VALUES (?, ?, ?, ?, ?, ?, 1)',
    [user.id, title, subdomain, category || '', template_id || 'minimal', settings]
  )

  res.redirect(`/dashboard/site/templates?id=${id}&new=1`)
}

exports.setTemplate = async (req, res) => {
  const user     = req.session.user
  const { site_id, template_id } = req.body
  const allowed  = themeManager.loadAll()

  if (!allowed[template_id]) {
    return res.json({ ok: false, error: 'Invalid template' })
  }

  const site = await db.first('SELECT * FROM ms_pages WHERE id = ? AND account_id = ?', [site_id, user.id])
  if (!site) return res.json({ ok: false })

  const settings          = JSON.parse(site.settings || '{}')
  settings.template_id    = template_id
  settings.sections       = null

  await db.execute('UPDATE ms_pages SET template_id = ?, settings = ? WHERE id = ?',
    [template_id, JSON.stringify(settings), site_id])

  res.json({ ok: true })
}

exports.builderPreview = async (req, res) => {
  const user = req.session.user
  const { site_id, sections, theme, all_pages, page_id } = req.body

  const site = await db.first('SELECT * FROM ms_pages WHERE id = ? AND account_id = ?', [site_id, user.id])
  if (!site) return res.status(404).send('<h1>Not found</h1>')

  const settings    = JSON.parse(site.settings || '{}')
  settings.theme    = theme || settings.theme || 'blue'
  const pageId      = page_id || 'home'

  if (all_pages) {
    settings.pages = JSON.parse(all_pages)
  } else {
    settings.sections = JSON.parse(sections || '[]')
  }

  const { global_styles, custom_pages, nav_items } = req.body
  if (global_styles) settings.globalStyles = JSON.parse(global_styles)
  if (custom_pages)  settings.customPages  = JSON.parse(custom_pages)
  if (nav_items)     settings.navItems     = JSON.parse(nav_items)

  const slug = settings.template_id || site.template_id || 'minimal'
  try {
    let html = await themeManager.render(slug, site, settings, pageId)
    // Inject builder interaction script when called from the builder
    if (req.body._builder) {
      const sectionIds = JSON.stringify((settings.sections || []).map(s => s.id))
      html = html.replace('</body>', `
<style>
.pz-sec{position:relative;transition:outline 0.1s;}
.pz-sec:hover{outline:2px dashed rgba(99,102,241,0.5);outline-offset:-2px;cursor:pointer;}
.pz-sec.pz-active{outline:2px solid #6366f1!important;outline-offset:-2px;}
.pz-badge{display:none;position:absolute;top:0;left:0;background:#6366f1;color:#fff;font-size:10px;font-weight:700;padding:2px 8px;letter-spacing:0.5px;z-index:9999;border-radius:0 0 6px 0;pointer-events:none;font-family:sans-serif;}
.pz-sec.pz-active .pz-badge,.pz-sec:hover .pz-badge{display:block;}
</style>
<script>
(function(){
  document.querySelectorAll('[data-pz]').forEach(function(el){
    var b=document.createElement('div');b.className='pz-badge';b.textContent=el.getAttribute('data-pz');el.appendChild(b);
    el.addEventListener('click',function(e){
      e.preventDefault();e.stopPropagation();
      document.querySelectorAll('[data-pz]').forEach(function(s){s.classList.remove('pz-active');});
      el.classList.add('pz-active');
      window.parent.postMessage({type:'pz-select',id:el.getAttribute('data-pz')},'*');
    });
  });
  window.addEventListener('message',function(e){
    if(!e.data||e.data.type!=='pz-highlight')return;
    document.querySelectorAll('[data-pz]').forEach(function(s){s.classList.remove('pz-active');});
    var el=document.querySelector('[data-pz="'+e.data.id+'"]');
    if(el){el.classList.add('pz-active');el.scrollIntoView({behavior:'smooth',block:'nearest'});}
  });
})();
<\/script>
</body>`)
    }
    res.send(html)
  } catch(e) {
    res.status(500).send('<p>Preview error: ' + e.message + '</p>')
  }
}

exports.builderSave = async (req, res) => {
  const user = req.session.user
  const { site_id, sections, theme, font, all_pages } = req.body

  const site = await db.first('SELECT * FROM ms_pages WHERE id = ? AND account_id = ?', [site_id, user.id])
  if (!site) return res.json({ ok: false })

  const settings    = JSON.parse(site.settings || '{}')
  settings.theme    = theme || settings.theme || 'blue'
  settings.font     = font  || settings.font  || 'sans'

  if (all_pages) {
    settings.pages = JSON.parse(all_pages)
    delete settings.sections
  } else {
    settings.sections = JSON.parse(sections || '[]')
  }

  const { global_styles, custom_pages, nav_items } = req.body
  if (global_styles) settings.globalStyles = JSON.parse(global_styles)
  if (custom_pages)  settings.customPages  = JSON.parse(custom_pages)
  if (nav_items)     settings.navItems     = JSON.parse(nav_items)

  await db.execute('UPDATE ms_pages SET settings = ? WHERE id = ?', [JSON.stringify(settings), site_id])
  res.json({ ok: true })
}

exports.delete = async (req, res) => {
  const user    = req.session.user
  const siteId  = parseInt(req.body.site_id) || 0

  await db.execute('DELETE FROM ms_pages WHERE id = ? AND account_id = ?', [siteId, user.id])
  req.flash('success', 'Site deleted.')
  res.redirect('/dashboard')
}

exports.templatePreview = async (req, res) => {
  const slug    = (req.query.id || 'minimal').replace(/[^a-z0-9-]/g, '')
  const preview = themeManager.loadAll()[slug] ? slug : 'minimal'
  const data    = themeManager.loadAll()[preview]

  const isBiolink = (preview === 'biolink')
  const demoSite  = { id: 0, title: isBiolink ? 'Priya Sharma' : 'Demo Business', subdomain: 'demo', template_id: preview, is_published: 1, owner_name: 'Demo' }
  const demoSettings = isBiolink ? {
    site_type: 'linktree', theme: 'violet', template_id: preview,
    sections: [
      { id: 'profile', fields: { avatar_emoji: '✨', name: 'Priya Sharma', tagline: '@priyacreates', bio: 'Content Creator · Photographer · Based in Mumbai 🇮🇳' }},
      { id: 'links',   fields: { items: [
        { emoji: '🎬', label: 'Watch my videos', url: 'https://youtube.com', style: 'solid' },
        { emoji: '📸', label: 'Follow on Instagram', url: 'https://instagram.com', style: 'outline' },
        { emoji: '🛍️', label: 'Shop my presets', url: '#', style: 'ghost' }
      ]}},
      { id: 'socials', fields: { instagram: 'https://instagram.com', youtube: 'https://youtube.com', tiktok: 'https://tiktok.com' }}
    ]
  } : {
    site_type: 'business', theme: 'blue', city: 'Ludhiana',
    phone: '+91 98765 43210', whatsapp: '+91 98765 43210',
    address: 'Model Town, Ludhiana', template_id: preview,
    sections: [
      { id:'hero',     fields:{ headline:'We do amazing work', subheading:'A professional business serving clients across India with passion and expertise', btn_text:'Contact Us', btn2_text:'Learn More' }},
      { id:'about',    fields:{ title:'About Us', text:'We are dedicated professionals committed to delivering exceptional results. With years of experience, we bring quality and reliability to every project.' }},
      { id:'services', fields:{ title:'What We Offer', items:[{ emoji:'✂️', name:'Premium Service', desc:'Top quality service delivery' },{ emoji:'💆', name:'Expert Consulting', desc:'Professional guidance and support' },{ emoji:'🎨', name:'Custom Solutions', desc:'Tailored to your needs' }]}},
      { id:'contact',  fields:{ title:'Get in Touch', phone:'+91 98765 43210', whatsapp:'+91 98765 43210', address:'Model Town, Ludhiana' }}
    ]
  }

  try {
    const html = await themeManager.render(preview, demoSite, demoSettings)
    res.send(html)
  } catch(e) {
    res.status(500).send('<h1>Preview error: ' + e.message + '</h1>')
  }
}

exports.aiSuggest = async (req, res) => {
  const { site_type, title, section, field, current } = req.body
  const apiKey = process.env.ANTHROPIC_API_KEY

  if (!apiKey) return res.json({ suggestions: ['Add your ANTHROPIC_API_KEY to .env to enable AI suggestions.'] })

  try {
    const prompt = `You are a copywriter for a website builder. Generate 3 short compelling suggestions for the '${field}' field of the '${section}' section for a ${site_type} site called '${title}'. Current value: '${current}'. Return ONLY a JSON array of 3 strings, no explanation, no markdown.`

    const response = await axios.post('https://api.anthropic.com/v1/messages', {
      model:      'claude-haiku-4-5-20251001',
      max_tokens: 300,
      messages:   [{ role: 'user', content: prompt }]
    }, {
      headers: {
        'x-api-key':         apiKey,
        'anthropic-version': '2023-06-01',
        'Content-Type':      'application/json'
      }
    })

    const text        = response.data.content[0].text
    const suggestions = JSON.parse(text)
    res.json({ suggestions: Array.isArray(suggestions) ? suggestions : [text] })
  } catch(e) {
    res.json({ suggestions: [] })
  }
}

exports.aiGenerate = async (req, res) => {
  const { prompt, site_type, sections } = req.body
  const apiKey = process.env.ANTHROPIC_API_KEY

  if (!apiKey) return res.json({ error: 'No API key configured.' })

  try {
    const aiPrompt = `You are a website content writer. Given this business description: '${prompt}', generate compelling content for a ${site_type} website. Fill in the following sections JSON structure with real content. Return ONLY valid JSON with the same structure but filled with good content. No markdown, no explanation.\n\nSections to fill:\n${JSON.stringify(sections)}`

    const response = await axios.post('https://api.anthropic.com/v1/messages', {
      model:      'claude-haiku-4-5-20251001',
      max_tokens: 1500,
      messages:   [{ role: 'user', content: aiPrompt }]
    }, {
      headers: {
        'x-api-key':         apiKey,
        'anthropic-version': '2023-06-01',
        'Content-Type':      'application/json'
      }
    })

    const text   = response.data.content[0].text
    const filled = JSON.parse(text)
    res.json({ sections: Array.isArray(filled) ? filled : sections })
  } catch(e) {
    res.json({ error: 'Generation failed.' })
  }
}

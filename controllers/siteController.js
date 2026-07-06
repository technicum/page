const { db }                  = require('../config/db')
const themeManager            = require('../config/themeManager')
const { loadFormsForAccount } = require('./formController')
const axios                   = require('axios')
const { geocodeCity }         = require('../config/geocode')

exports.store = async (req, res) => {
  const user = req.session.user
  const { title, subdomain: rawSub, category, category_id, template_id, site_type,
          description, city, phone, whatsapp, address,
          skills, bio, instagram, youtube, blog_topic, author,
          product_desc, theme } = req.body

  const subdomain = (rawSub || '').toLowerCase().trim()
  const errors    = []

  if (!title)     errors.push('Title is required.')
  if (!subdomain) errors.push('Subdomain is required.')
  if (!/^[a-z0-9-]+$/.test(subdomain)) errors.push('Only lowercase letters, numbers, hyphens allowed.')

  if (!errors.length) {
    const exists = await db.first('SELECT id FROM ms_sites WHERE subdomain = ?', [subdomain])
    if (exists) errors.push('That subdomain is already taken.')
  }

  if (errors.length) {
    req.flash('errors', errors)
    return res.redirect('/dashboard/wizard')
  }

  const settings = JSON.stringify({
    site_type, subcategory: category || '', description, city, phone, whatsapp, address,
    skills, bio, instagram, youtube, blog_topic, author,
    product_desc, theme: theme || 'blue',
    template_id: template_id || 'minimal',
    sections: null
  })

  // category: use the site_type as the primary category (linktree/business/etc.)
  // The subcategory dropdown value (Salon & Beauty, etc.) is saved inside settings
  const resolvedCategory = site_type || category || ''

  const id = await db.lastId(
    'INSERT INTO ms_sites (account_id, title, subdomain, category, template_id, settings, is_published) VALUES (?, ?, ?, ?, ?, ?, 1)',
    [user.id, title, subdomain, resolvedCategory, template_id || 'minimal', settings]
  )

  // Save business category FK if provided
  const catId = parseInt(category_id) || null
  if (catId) {
    await db.execute('UPDATE ms_sites SET category_id = ? WHERE id = ?', [catId, id])
  }

  // Geocode city in background (non-blocking — don't await)
  if (city) {
    geocodeCity(city).then(geo => {
      if (geo) db.execute('UPDATE ms_sites SET lat=?, lng=?, state=? WHERE id=?', [geo.lat, geo.lng, geo.state, id])
    }).catch(() => {})
  }

  res.redirect(`/dashboard/site/biolink-builder?id=${id}`)
}

exports.setTemplate = async (req, res) => {
  const user     = req.session.user
  const { site_id, template_id } = req.body
  const allowed  = themeManager.loadAll()

  if (!allowed[template_id]) {
    return res.json({ ok: false, error: 'Invalid template' })
  }

  const site = await db.first('SELECT * FROM ms_sites WHERE id = ? AND account_id = ?', [site_id, user.id])
  if (!site) return res.json({ ok: false })

  const settings          = JSON.parse(site.settings || '{}')
  settings.template_id    = template_id
  settings.sections       = null

  await db.execute('UPDATE ms_sites SET template_id = ?, settings = ? WHERE id = ?',
    [template_id, JSON.stringify(settings), site_id])

  res.json({ ok: true })
}

exports.builderPreview = async (req, res) => {
  const user = req.session.user
  const { site_id, sections, theme, all_pages, page_id } = req.body

  const site = await db.first('SELECT * FROM ms_sites WHERE id = ? AND account_id = ?', [site_id, user.id])
  if (!site) return res.status(404).send('<h1>Not found</h1>')

  const settings    = JSON.parse(site.settings || '{}')
  settings.theme    = theme || settings.theme || 'blue'
  const pageId      = page_id || 'home'

  if (all_pages) {
    settings.pages = JSON.parse(all_pages)
  } else {
    settings.sections = JSON.parse(sections || '[]')
  }

  const { global_styles, custom_pages, nav_items, seo } = req.body
  if (global_styles) settings.globalStyles = JSON.parse(global_styles)
  if (custom_pages)  settings.customPages  = JSON.parse(custom_pages)
  if (nav_items)     settings.navItems     = JSON.parse(nav_items)
  if (seo)           settings.seo          = JSON.parse(seo)

  const slug = settings.template_id || site.template_id || 'minimal'
  let siteForms = {}
  try { siteForms = await loadFormsForAccount(site.account_id) } catch(e) {}
  try {
    let html = await themeManager.render(slug, site, settings, pageId, siteForms)
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

  const site = await db.first('SELECT * FROM ms_sites WHERE id = ? AND account_id = ?', [site_id, user.id])
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

  const { global_styles, custom_pages, nav_items, seo } = req.body
  if (global_styles) settings.globalStyles = JSON.parse(global_styles)
  if (custom_pages)  settings.customPages  = JSON.parse(custom_pages)
  if (nav_items)     settings.navItems     = JSON.parse(nav_items)
  if (seo)           settings.seo          = JSON.parse(seo)

  await db.execute('UPDATE ms_sites SET settings = ? WHERE id = ?', [JSON.stringify(settings), site_id])
  res.json({ ok: true })
}

exports.biolinkPreview = async (req, res) => {
  const user = req.session.user
  const { site_id, settings: newSettings } = req.body

  const site = await db.first('SELECT * FROM ms_sites WHERE id = ? AND account_id = ?', [site_id, user.id])
  if (!site) return res.status(404).send('<h1>Not found</h1>')

  const existing = JSON.parse(site.settings || '{}')
  // Always deep-merge blocks/appearance/seo from the new payload
  const merged = Object.assign({}, existing, newSettings, {
    template_id: 'biolink-creator',
    blocks:      newSettings.blocks      !== undefined ? newSettings.blocks      : (existing.blocks || []),
    appearance:  newSettings.appearance  !== undefined ? newSettings.appearance  : (existing.appearance || {}),
    seo:         newSettings.seo         !== undefined ? newSettings.seo         : (existing.seo || {})
  })

  try {
    const html = await themeManager.render('biolink-creator', site, merged)
    res.send(html)
  } catch (e) {
    res.status(500).send('<p style="font-family:sans-serif;padding:20px;color:#dc2626">Preview error: ' + e.message + '</p>')
  }
}

exports.biolinkSave = async (req, res) => {
  const user = req.session.user
  const { site_id, settings: newSettings } = req.body

  const site = await db.first('SELECT * FROM ms_sites WHERE id = ? AND account_id = ?', [site_id, user.id])
  if (!site) return res.json({ ok: false })

  const existing = JSON.parse(site.settings || '{}')
  // Always store blocks/appearance/seo and lock template to biolink-creator
  const merged = Object.assign({}, existing, newSettings, {
    template_id: 'biolink-creator',
    blocks:     newSettings.blocks     !== undefined ? newSettings.blocks     : (existing.blocks || []),
    appearance: newSettings.appearance !== undefined ? newSettings.appearance : (existing.appearance || {}),
    seo:        newSettings.seo        !== undefined ? newSettings.seo        : (existing.seo || {})
  })

  await db.execute('UPDATE ms_sites SET settings = ?, template_id = ? WHERE id = ?', [JSON.stringify(merged), 'biolink-creator', site_id])
  res.json({ ok: true })
}

exports.updateInfo = async (req, res) => {
  const user = req.session.user
  const { site_id, title, category_id, city, phone, whatsapp, address, description, logo } = req.body

  const site = await db.first('SELECT * FROM ms_sites WHERE id = ? AND account_id = ?', [parseInt(site_id), user.id])
  if (!site) return res.json({ ok: false, error: 'Site not found' })

  // Update title
  if (title) await db.execute('UPDATE ms_sites SET title = ? WHERE id = ?', [title.trim(), site.id])

  // Update category FK
  if (category_id !== undefined) {
    await db.execute('UPDATE ms_sites SET category_id = ? WHERE id = ?', [parseInt(category_id) || null, site.id])
  }

  // Merge settings
  const settings = JSON.parse(site.settings || '{}')
  if (city        !== undefined) settings.city        = city.trim()
  if (phone       !== undefined) settings.phone       = phone.trim()
  if (whatsapp    !== undefined) settings.whatsapp    = whatsapp.trim()
  if (address     !== undefined) settings.address     = address.trim()
  if (description !== undefined) settings.description = description.trim()
  if (logo        !== undefined) settings.logo        = logo.trim()
  await db.execute('UPDATE ms_sites SET settings = ? WHERE id = ?', [JSON.stringify(settings), site.id])

  // Re-geocode city in background
  if (city && city.trim()) {
    geocodeCity(city.trim()).then(geo => {
      if (geo) db.execute('UPDATE ms_sites SET lat=?, lng=?, state=? WHERE id=?', [geo.lat, geo.lng, geo.state, site.id])
    }).catch(() => {})
  }

  res.json({ ok: true })
}

exports.updateSeo = async (req, res) => {
  try {
    const user = req.session.user
    const { site_id, seo_title, seo_description, seo_og_image, seo_noindex } = req.body

    const site = await db.first('SELECT * FROM ms_sites WHERE id = ? AND account_id = ?', [parseInt(site_id) || 0, user.id])
    if (!site) return res.json({ ok: false, error: 'Site not found' })

    const settings   = JSON.parse(site.settings || '{}')
    settings.seo     = settings.seo || {}
    if (seo_title       !== undefined) settings.seo.title       = (seo_title       || '').trim()
    if (seo_description !== undefined) settings.seo.description = (seo_description || '').trim()
    if (seo_og_image    !== undefined) settings.seo.og_image    = (seo_og_image    || '').trim()
    // seo_noindex: '1' = block, anything else = allow
    settings.seo.noindex = seo_noindex === '1' || seo_noindex === true

    await db.execute('UPDATE ms_sites SET settings = ? WHERE id = ?', [JSON.stringify(settings), site.id])
    res.json({ ok: true })
  } catch (err) {
    console.error('updateSeo', err)
    res.json({ ok: false, error: err.message })
  }
}

exports.createStaffSite = async (req, res) => {
  try {
    const user = req.session.user
    const { parent_site_id, employee_name, path_slug: rawSlug } = req.body

    const name     = (employee_name || '').trim()
    const pathSlug = (rawSlug || '').toLowerCase().trim()
      .replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '')

    if (!name)     return res.json({ ok: false, error: 'Employee name is required.' })
    if (!pathSlug) return res.json({ ok: false, error: 'URL slug is required.' })
    if (!/^[a-z0-9-]+$/.test(pathSlug)) return res.json({ ok: false, error: 'Slug: only lowercase letters, numbers, hyphens.' })
    if (pathSlug.length < 2)            return res.json({ ok: false, error: 'Slug must be at least 2 characters.' })

    // Verify parent belongs to this user
    const parent = await db.first('SELECT * FROM ms_sites WHERE id = ? AND account_id = ?', [parseInt(parent_site_id) || 0, user.id])
    if (!parent) return res.json({ ok: false, error: 'Invalid parent site.' })

    // Check path_slug uniqueness under this parent
    const slugExists = await db.first(
      'SELECT id FROM ms_sites WHERE parent_site_id = ? AND path_slug = ?',
      [parent.id, pathSlug]
    )
    if (slugExists) return res.json({ ok: false, error: 'That slug is already used by another staff link on this business.' })

    // Synthetic internal subdomain (must be globally unique, never served publicly)
    // Pattern: {parent_sub}--{slug}  (double-hyphen prefix makes it visually distinct)
    const syntheticSub = `${parent.subdomain}--${pathSlug}`.substring(0, 60)
    const subExists = await db.first('SELECT id FROM ms_sites WHERE subdomain = ?', [syntheticSub])
    if (subExists) return res.json({ ok: false, error: 'Slug conflict — please try a slightly different slug.' })

    // Inherit parent branding
    const parentSettings = JSON.parse(parent.settings || '{}')
    const settings = JSON.stringify({
      site_type:   'linktree',
      template_id: parent.template_id || 'biolink-creator',
      theme:       parentSettings.theme || 'blue',
      city:        parentSettings.city  || '',
      description: '',
      sections:    null
    })

    const id = await db.lastId(
      `INSERT INTO ms_sites
        (account_id, title, subdomain, category, template_id, settings, is_published, parent_site_id, path_slug, category_id, lat, lng, state)
       VALUES (?, ?, ?, 'linktree', ?, ?, 1, ?, ?, ?, ?, ?, ?)`,
      [user.id, name, syntheticSub, parent.template_id || 'biolink-creator', settings,
       parent.id, pathSlug, parent.category_id || null, parent.lat || null, parent.lng || null, parent.state || null]
    )

    res.json({ ok: true, id, pathSlug, parentSub: parent.subdomain, redirect: `/dashboard/site/biolink-builder?id=${id}` })
  } catch (err) {
    console.error('createStaffSite', err)
    res.json({ ok: false, error: err.message || 'Server error. Please try again.' })
  }
}

exports.togglePublish = async (req, res) => {
  try {
    const user   = req.session.user
    const siteId = parseInt(req.body.site_id) || 0

    const site = await db.first('SELECT id, is_published FROM ms_sites WHERE id = ? AND account_id = ?', [siteId, user.id])
    if (!site) return res.json({ ok: false, error: 'Site not found.' })

    const newStatus = site.is_published ? 0 : 1
    await db.execute('UPDATE ms_sites SET is_published = ? WHERE id = ?', [newStatus, siteId])
    res.json({ ok: true, is_published: newStatus })
  } catch (err) {
    console.error('togglePublish', err)
    res.json({ ok: false, error: err.message })
  }
}

exports.delete = async (req, res) => {
  const user    = req.session.user
  const siteId  = parseInt(req.body.site_id) || 0

  await db.execute('DELETE FROM ms_sites WHERE id = ? AND account_id = ?', [siteId, user.id])
  req.flash('success', 'Site deleted.')
  res.redirect('/dashboard')
}

exports.templatePreview = async (req, res) => {
  const slug    = (req.query.id || 'minimal').replace(/[^a-z0-9-]/g, '')
  const all     = themeManager.loadAll()
  const preview = all[slug] ? slug : 'minimal'
  const data    = all[preview]

  // Auto-build demo settings from each section's field defaults in theme.json
  const demoSettings = { template_id: preview }
  if (data && data.sections) {
    data.sections.forEach(section => {
      const sData = {}
      ;(section.fields || []).forEach(field => {
        if (field.default !== undefined) sData[field.id] = field.default
      })
      demoSettings[section.id] = sData
    })
  }

  // Fill empty contact fields so phone/WhatsApp sections render in preview
  if (demoSettings.contact) {
    if (!demoSettings.contact.whatsapp) demoSettings.contact.whatsapp = '+91 98765 43210'
    if (!demoSettings.contact.phone)    demoSettings.contact.phone    = '+91 98765 43210'
    if (!demoSettings.contact.email)    demoSettings.contact.email    = 'demo@example.com'
    if (!demoSettings.contact.address)  demoSettings.contact.address  = 'Mumbai, Maharashtra'
  }

  // Derive the site title from the profile name default (or theme name)
  const profileSection = data && data.sections && data.sections.find(s => s.id === 'profile')
  const nameField      = profileSection && profileSection.fields && profileSection.fields.find(f => f.id === 'name')
  const siteTitle      = (nameField && nameField.default) || (data && data.name) || 'Demo'

  const demoSite = { id: 0, title: siteTitle, subdomain: 'demo', template_id: preview, is_published: 1, owner_name: siteTitle }

  try {
    const html = await themeManager.render(preview, demoSite, demoSettings)
    res.send(html)
  } catch(e) {
    res.status(500).send('<h1>Preview error: ' + e.message + '</h1>')
  }
}

exports.templatePreviewFrame = (req, res) => {
  const slug      = (req.query.id || '').replace(/[^a-z0-9-]/g, '')
  const all       = themeManager.loadAll()
  const themeData = all[slug]
  const themeName = themeData ? themeData.name : slug
  res.render('dashboard/preview-frame.njk', { themeSlug: slug, themeName })
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

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
  const { site_id, sections, theme } = req.body

  const site = await db.first('SELECT * FROM ms_pages WHERE id = ? AND account_id = ?', [site_id, user.id])
  if (!site) return res.status(404).send('<h1>Not found</h1>')

  const settings         = JSON.parse(site.settings || '{}')
  settings.sections      = JSON.parse(sections || '[]')
  settings.theme         = theme || settings.theme || 'blue'

  const slug = settings.template_id || site.template_id || 'minimal'
  try {
    const html = await themeManager.render(slug, site, settings)
    res.send(html)
  } catch(e) {
    res.status(500).send('<p>Preview error: ' + e.message + '</p>')
  }
}

exports.builderSave = async (req, res) => {
  const user = req.session.user
  const { site_id, sections, theme, font } = req.body

  const site = await db.first('SELECT * FROM ms_pages WHERE id = ? AND account_id = ?', [site_id, user.id])
  if (!site) return res.json({ ok: false })

  const settings       = JSON.parse(site.settings || '{}')
  settings.sections    = JSON.parse(sections || '[]')
  settings.theme       = theme  || settings.theme  || 'blue'
  settings.font        = font   || settings.font   || 'sans'

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

  const demoSite = { id: 0, title: 'Demo Business', subdomain: 'demo', template_id: preview, is_published: 1, owner_name: 'Demo' }
  const demoSettings = {
    site_type: 'business', theme: 'blue', city: 'Ludhiana',
    phone: '+91 98765 43210', whatsapp: '+91 98765 43210',
    address: 'Model Town, Ludhiana', template_id: preview,
    sections: [
      { id:'hero',     emoji:'🌟', label:'Hero',     fields:{ headline:'We do amazing work', subheading:'A professional business serving clients across India with passion and expertise', btn_text:'Contact Us', btn2_text:'Learn More' }},
      { id:'about',    emoji:'ℹ️',  label:'About',    fields:{ title:'About Us', text:'We are dedicated professionals committed to delivering exceptional results. With years of experience, we bring quality and reliability to every project.' }},
      { id:'services', emoji:'⚡', label:'Services', fields:{ title:'What We Offer', items:[{ emoji:'✂️', name:'Premium Service', desc:'Top quality service delivery' },{ emoji:'💆', name:'Expert Consulting', desc:'Professional guidance and support' },{ emoji:'🎨', name:'Custom Solutions', desc:'Tailored to your needs' }]}},
      { id:'contact',  emoji:'📞', label:'Contact',  fields:{ title:'Get in Touch', phone:'+91 98765 43210', whatsapp:'+91 98765 43210', address:'Model Town, Ludhiana' }}
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

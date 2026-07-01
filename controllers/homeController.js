const { db }  = require('../config/db')
const axios   = require('axios')

exports.index = async (req, res) => {
  res.render('home.njk', { title: 'PageZaper' })
}

exports.search = async (req, res) => {
  const { q = '', city = '', category_id = '' } = req.query

  let sql     = `SELECT s.id, s.title, s.subdomain, s.category, s.settings,
                        c.name as cat_name, c.icon as cat_icon
                 FROM ms_sites s
                 LEFT JOIN ms_categories c ON c.id = s.category_id
                 WHERE s.is_published = 1`
  const params = []

  if (q) {
    sql += ' AND (s.title LIKE ? OR JSON_EXTRACT(s.settings, "$.description") LIKE ?)'
    params.push(`%${q}%`, `%${q}%`)
  }
  if (city) {
    sql += ' AND JSON_EXTRACT(s.settings, "$.city") LIKE ?'
    params.push(`%${city}%`)
  }
  if (category_id) {
    sql += ' AND s.category_id = ?'
    params.push(category_id)
  }

  sql += ' ORDER BY s.created_at DESC LIMIT 48'

  let results    = []
  let categories = []
  try {
    results = await db.query(sql, params)
    results = results.map(s => ({ ...s, settings: JSON.parse(s.settings || '{}') }))
    categories = await db.query('SELECT id, name, icon FROM ms_categories WHERE status = 1 ORDER BY sort_order ASC, name ASC')
  } catch(e) { results = [] }

  res.render('search.njk', { title: 'Search', results, q, city, category_id, categories: categories || [] })
}

// ── Server-side proxy: IP → city via ip-api.com (no API key needed) ───────────
exports.detectCity = async (req, res) => {
  try {
    const raw = req.headers['x-forwarded-for'] || req.socket?.remoteAddress || req.ip || ''
    const ip  = raw.split(',')[0].trim()
    const isLocal = !ip || ip === '::1' || ip.startsWith('127.') || ip.startsWith('::ffff:127.')
    const url = isLocal
      ? 'http://ip-api.com/json/?fields=city,regionName,status'
      : `http://ip-api.com/json/${ip}?fields=city,regionName,status`
    const { data } = await axios.get(url, { timeout: 4000 })
    if (data.status === 'success') {
      return res.json({ city: data.city || '', region: data.regionName || '' })
    }
    res.json({ city: '', region: '' })
  } catch(e) {
    res.json({ city: '', region: '' })
  }
}

// ── Reverse geocode: lat/lng → city via Nominatim (free, no key) ──────────────
exports.reverseGeocode = async (req, res) => {
  try {
    const { lat, lng } = req.query
    if (!lat || !lng) return res.json({ city: '' })
    const { data } = await axios.get(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=10`,
      { headers: { 'User-Agent': 'PageZaper/1.0 contact@pagezaper.com' }, timeout: 6000 }
    )
    const addr = data.address || {}
    const city = addr.city || addr.town || addr.village || addr.county || ''
    res.json({ city })
  } catch(e) {
    res.json({ city: '' })
  }
}

// ── AJAX: nearby vendors for homepage cards ────────────────────────────────────
exports.nearby = async (req, res) => {
  const { city = '' } = req.query
  let results = []
  try {
    let sql = `SELECT s.id, s.title, s.subdomain, s.settings,
                      c.name as cat_name, c.icon as cat_icon
               FROM ms_sites s
               LEFT JOIN ms_categories c ON c.id = s.category_id
               WHERE s.is_published = 1`
    const params = []
    if (city) {
      sql += ' AND JSON_EXTRACT(s.settings, "$.city") LIKE ?'
      params.push(`%${city}%`)
    }
    sql += ' ORDER BY s.created_at DESC LIMIT 6'
    results = await db.query(sql, params)
    results = results.map(s => {
      const st = JSON.parse(s.settings || '{}')
      return {
        id:          s.id,
        title:       s.title,
        subdomain:   s.subdomain,
        cat_name:    s.cat_name || st.subcategory || 'Business',
        cat_icon:    s.cat_icon || '🏪',
        city:        st.city    || '',
        description: st.description || ''
      }
    })
  } catch(e) { results = [] }
  res.json({ results })
}

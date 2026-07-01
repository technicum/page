const { db }                        = require('../config/db')
const axios                         = require('axios')
const { suggestLocations }          = require('../config/geocode')

exports.index = async (req, res) => {
  res.render('home.njk', { title: 'PageZaper' })
}

exports.search = async (req, res) => {
  const { q = '', city = '', state = '', lat = '', lng = '', radius = '25', category_id = '' } = req.query

  const userLat    = parseFloat(lat)
  const userLng    = parseFloat(lng)
  const userRadius = parseInt(radius) || 25
  const hasCoords  = !isNaN(userLat) && !isNaN(userLng)

  let sql, params

  if (hasCoords) {
    // ── Haversine radius search ────────────────────────────────────────────────
    sql = `SELECT s.id, s.title, s.subdomain, s.settings, s.lat, s.lng, s.state,
                  c.name AS cat_name, c.icon AS cat_icon,
                  ROUND(6371 * ACOS(LEAST(1, GREATEST(-1,
                    COS(RADIANS(?)) * COS(RADIANS(s.lat)) * COS(RADIANS(s.lng) - RADIANS(?)) +
                    SIN(RADIANS(?)) * SIN(RADIANS(s.lat))
                  ))), 1) AS distance_km
           FROM ms_sites s
           LEFT JOIN ms_categories c ON c.id = s.category_id
           WHERE s.is_published = 1
             AND s.parent_site_id IS NULL
             AND s.lat IS NOT NULL AND s.lng IS NOT NULL`
    params = [userLat, userLng, userLat]

    if (q) {
      sql += ' AND (s.title LIKE ? OR JSON_EXTRACT(s.settings, "$.description") LIKE ?)'
      params.push(`%${q}%`, `%${q}%`)
    }
    if (category_id) {
      sql += ' AND s.category_id = ?'
      params.push(category_id)
    }
    sql += ' HAVING distance_km <= ? ORDER BY distance_km ASC LIMIT 48'
    params.push(userRadius)

  } else {
    // ── Text-based city / state search ────────────────────────────────────────
    sql = `SELECT s.id, s.title, s.subdomain, s.settings, s.state,
                  c.name AS cat_name, c.icon AS cat_icon
           FROM ms_sites s
           LEFT JOIN ms_categories c ON c.id = s.category_id
           WHERE s.is_published = 1
             AND s.parent_site_id IS NULL`
    params = []

    if (q) {
      sql += ' AND (s.title LIKE ? OR JSON_EXTRACT(s.settings, "$.description") LIKE ?)'
      params.push(`%${q}%`, `%${q}%`)
    }
    if (city) {
      sql += ' AND JSON_EXTRACT(s.settings, "$.city") LIKE ?'
      params.push(`%${city}%`)
    }
    if (state) {
      sql += ' AND s.state LIKE ?'
      params.push(`%${state}%`)
    }
    if (category_id) {
      sql += ' AND s.category_id = ?'
      params.push(category_id)
    }
    sql += ' ORDER BY s.created_at DESC LIMIT 48'
  }

  let results = [], categories = []
  try {
    results    = await db.query(sql, params)
    results    = results.map(s => ({ ...s, settings: JSON.parse(s.settings || '{}') }))
    categories = await db.query('SELECT id, name, icon FROM ms_categories WHERE status = 1 ORDER BY sort_order ASC, name ASC')
  } catch(e) { results = [] }

  res.render('search.njk', {
    title: 'Search', results, q, city, state,
    lat, lng, radius: userRadius, category_id,
    categories: categories || [],
    hasCoords
  })
}

// ── Location autocomplete: city/state suggestions via Nominatim ───────────────
exports.locationSuggest = async (req, res) => {
  const suggestions = await suggestLocations(req.query.q || '')
  res.json(suggestions)
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
  const { city = '', lat = '', lng = '', radius = '25' } = req.query
  const uLat = parseFloat(lat), uLng = parseFloat(lng)
  const hasCoords = !isNaN(uLat) && !isNaN(uLng)
  let results = []
  try {
    let sql, params
    if (hasCoords) {
      sql = `SELECT s.id, s.title, s.subdomain, s.settings,
                    c.name as cat_name, c.icon as cat_icon,
                    ROUND(6371 * ACOS(LEAST(1, GREATEST(-1,
                      COS(RADIANS(?)) * COS(RADIANS(s.lat)) * COS(RADIANS(s.lng) - RADIANS(?)) +
                      SIN(RADIANS(?)) * SIN(RADIANS(s.lat))
                    ))), 1) AS distance_km
             FROM ms_sites s
             LEFT JOIN ms_categories c ON c.id = s.category_id
             WHERE s.is_published = 1 AND s.parent_site_id IS NULL AND s.lat IS NOT NULL AND s.lng IS NOT NULL
             HAVING distance_km <= ?
             ORDER BY distance_km ASC LIMIT 6`
      params = [uLat, uLng, uLat, parseInt(radius) || 25]
    } else {
      sql = `SELECT s.id, s.title, s.subdomain, s.settings,
                    c.name as cat_name, c.icon as cat_icon
             FROM ms_sites s
             LEFT JOIN ms_categories c ON c.id = s.category_id
             WHERE s.is_published = 1 AND s.parent_site_id IS NULL`
      params = []
      if (city) { sql += ' AND JSON_EXTRACT(s.settings, "$.city") LIKE ?'; params.push(`%${city}%`) }
      sql += ' ORDER BY s.created_at DESC LIMIT 6'
    }
    results = await db.query(sql, params)
    results = results.map(s => {
      const st = JSON.parse(s.settings || '{}')
      return {
        id:          s.id,
        title:       s.title,
        subdomain:   s.subdomain,
        cat_name:    s.cat_name    || st.subcategory || 'Business',
        cat_icon:    s.cat_icon    || '🏪',
        city:        st.city       || '',
        description: st.description || '',
        distance_km: s.distance_km || null
      }
    })
  } catch(e) { results = [] }
  res.json({ results })
}

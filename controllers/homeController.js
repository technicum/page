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
                  ROUND(AVG(rv.rating), 1) AS avg_rating,
                  COUNT(rv.id)             AS review_count,
                  ROUND(6371 * ACOS(LEAST(1, GREATEST(-1,
                    COS(RADIANS(?)) * COS(RADIANS(s.lat)) * COS(RADIANS(s.lng) - RADIANS(?)) +
                    SIN(RADIANS(?)) * SIN(RADIANS(s.lat))
                  ))), 1) AS distance_km
           FROM ms_sites s
           LEFT JOIN ms_categories c  ON c.id  = s.category_id
           LEFT JOIN ms_reviews rv    ON rv.site_id = s.id AND rv.is_approved = 1
           WHERE s.is_published = 1
             AND s.parent_site_id IS NULL
             AND s.lat IS NOT NULL AND s.lng IS NOT NULL`
    params = [userLat, userLng, userLat]

    if (q) {
      sql += ' AND (s.title LIKE ? OR JSON_EXTRACT(s.settings, "$.description") LIKE ? OR c.name LIKE ?)'
      params.push(`%${q}%`, `%${q}%`, `%${q}%`)
    }
    if (category_id) {
      sql += ' AND s.category_id = ?'
      params.push(category_id)
    }
    sql += ' GROUP BY s.id HAVING distance_km <= ? ORDER BY distance_km ASC LIMIT 48'
    params.push(userRadius)

  } else {
    // ── Text-based city / state search ────────────────────────────────────────
    sql = `SELECT s.id, s.title, s.subdomain, s.settings, s.state,
                  c.name AS cat_name, c.icon AS cat_icon,
                  ROUND(AVG(rv.rating), 1) AS avg_rating,
                  COUNT(rv.id)             AS review_count
           FROM ms_sites s
           LEFT JOIN ms_categories c  ON c.id  = s.category_id
           LEFT JOIN ms_reviews rv    ON rv.site_id = s.id AND rv.is_approved = 1
           WHERE s.is_published = 1
             AND s.parent_site_id IS NULL`
    params = []

    if (q) {
      sql += ' AND (s.title LIKE ? OR JSON_EXTRACT(s.settings, "$.description") LIKE ? OR c.name LIKE ?)'
      params.push(`%${q}%`, `%${q}%`, `%${q}%`)
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
    sql += ' GROUP BY s.id ORDER BY avg_rating DESC, review_count DESC, s.created_at DESC LIMIT 48'
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

// ── City landing pages ────────────────────────────────────────────────────────
exports.cityPage = async (req, res, next) => {
  try {
    const rawSlug    = req.params.city.toLowerCase()
    const citySearch = rawSlug.replace(/-/g, ' ')   // "new-delhi" → "new delhi"

    // Try city match first, then state match
    let rows = await db.query(`
      SELECT s.id, s.title, s.subdomain, s.settings, s.state,
             c.name AS cat_name, c.icon AS cat_icon,
             ROUND(AVG(rv.rating), 1) AS avg_rating,
             COUNT(rv.id)             AS review_count
      FROM ms_sites s
      LEFT JOIN ms_categories c  ON c.id = s.category_id
      LEFT JOIN ms_reviews rv    ON rv.site_id = s.id AND rv.is_approved = 1
      WHERE s.is_published = 1
        AND s.parent_site_id IS NULL
        AND LOWER(JSON_EXTRACT(s.settings, '$.city')) = ?
      GROUP BY s.id
      ORDER BY avg_rating DESC, review_count DESC, s.created_at DESC LIMIT 60
    `, [citySearch])

    if (!rows.length) {
      rows = await db.query(`
        SELECT s.id, s.title, s.subdomain, s.settings, s.state,
               c.name AS cat_name, c.icon AS cat_icon,
               ROUND(AVG(rv.rating), 1) AS avg_rating,
               COUNT(rv.id)             AS review_count
        FROM ms_sites s
        LEFT JOIN ms_categories c  ON c.id = s.category_id
        LEFT JOIN ms_reviews rv    ON rv.site_id = s.id AND rv.is_approved = 1
        WHERE s.is_published = 1
          AND s.parent_site_id IS NULL
          AND LOWER(s.state) = ?
        GROUP BY s.id
        ORDER BY avg_rating DESC, review_count DESC, s.created_at DESC LIMIT 60
      `, [citySearch])
    }

    if (!rows.length) return next()   // no businesses → fall through to 404

    // Recover display name from first row's settings
    const firstSt  = JSON.parse(rows[0].settings || '{}')
    const cityName = firstSt.city || firstSt.state ||
                     citySearch.replace(/\b\w/g, c => c.toUpperCase())

    const results = rows.map(s => {
      const st = JSON.parse(s.settings || '{}')
      return { ...s, settings: st, logo: st.logo || (st.profile && st.profile.avatar) || '' }
    })

    const categories = await db.query(
      'SELECT id, name, icon FROM ms_categories WHERE status = 1 ORDER BY sort_order ASC, name ASC'
    )

    res.render('city.njk', {
      title:      `Businesses in ${cityName} | PageZaper`,
      cityName,
      citySlug:   rawSlug,
      results,
      categories: categories || []
    })
  } catch (e) {
    next(e)
  }
}

// ── Alias landing pages /:city/:alias ────────────────────────────────────────
exports.aliasPage = async (req, res, next) => {
  try {
    const citySlug   = req.params.city.toLowerCase()
    const aliasSlug  = req.params.alias.toLowerCase()
    const citySearch = citySlug.replace(/-/g, ' ')   // "new-delhi" → "new delhi"

    // Look up the alias
    const alias = await db.first(`
      SELECT a.id, a.keyword, a.slug, a.page_title, a.meta_desc, a.h1,
             c.id AS cat_id, c.name AS cat_name, c.icon AS cat_icon
      FROM ms_category_aliases a
      JOIN ms_categories c ON c.id = a.category_id
      WHERE a.slug = ? AND a.status = 1
    `, [aliasSlug])

    if (!alias) return next()  // not a known alias → fall through to 404

    // Capitalise city for display: "new delhi" → "New Delhi"
    const cityDisplay = citySearch.replace(/\b\w/g, c => c.toUpperCase())

    // Swap {city} placeholder in SEO fields
    const pageTitle = alias.page_title.replace(/\{city\}/g, cityDisplay)
    const metaDesc  = (alias.meta_desc || '').replace(/\{city\}/g, cityDisplay)
    const h1        = alias.h1.replace(/\{city\}/g, cityDisplay)

    // Fetch businesses in this category + city
    let rows = await db.query(`
      SELECT s.id, s.title, s.subdomain, s.settings, s.state,
             c.name AS cat_name, c.icon AS cat_icon,
             ROUND(AVG(rv.rating), 1) AS avg_rating,
             COUNT(rv.id)             AS review_count
      FROM ms_sites s
      LEFT JOIN ms_categories c  ON c.id  = s.category_id
      LEFT JOIN ms_reviews rv    ON rv.site_id = s.id AND rv.is_approved = 1
      WHERE s.is_published = 1
        AND s.parent_site_id IS NULL
        AND s.category_id = ?
        AND LOWER(JSON_EXTRACT(s.settings, '$.city')) = ?
      GROUP BY s.id
      ORDER BY avg_rating DESC, review_count DESC, s.created_at DESC
      LIMIT 60
    `, [alias.cat_id, citySearch])

    const results = rows.map(s => {
      const st = JSON.parse(s.settings || '{}')
      return { ...s, settings: st, logo: st.logo || (st.profile && st.profile.avatar) || '' }
    })

    const categories = await db.query(
      'SELECT id, name, icon FROM ms_categories WHERE status = 1 ORDER BY sort_order ASC, name ASC'
    )

    res.render('alias.njk', {
      title:      pageTitle,
      metaDesc,
      h1,
      aliasKeyword: alias.keyword,
      catName:    alias.cat_name,
      catIcon:    alias.cat_icon,
      cityName:   cityDisplay,
      citySlug,
      aliasSlug,
      results,
      categories: categories || []
    })
  } catch (e) {
    next(e)
  }
}

// ── Sitemap ───────────────────────────────────────────────────────────────────
exports.sitemap = async (req, res) => {
  try {
    const BASE = process.env.APP_URL || 'https://pagezaper.com'

    // Distinct cities with at least one published site
    const cities = await db.query(`
      SELECT DISTINCT LOWER(JSON_EXTRACT(s.settings, '$.city')) AS city
      FROM ms_sites s
      WHERE s.is_published = 1
        AND s.parent_site_id IS NULL
        AND JSON_EXTRACT(s.settings, '$.city') IS NOT NULL
        AND JSON_EXTRACT(s.settings, '$.city') != ''
    `)

    const cityUrls = cities
      .map(r => r.city ? r.city.trim().replace(/\s+/g, '-') : null)
      .filter(Boolean)
      .map(slug => `  <url><loc>${BASE}/${encodeURIComponent(slug)}</loc><changefreq>weekly</changefreq><priority>0.8</priority></url>`)
      .join('\n')

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>${BASE}/</loc><changefreq>daily</changefreq><priority>1.0</priority></url>
  <url><loc>${BASE}/search</loc><changefreq>daily</changefreq><priority>0.9</priority></url>
${cityUrls}
</urlset>`

    res.set('Content-Type', 'application/xml')
    res.send(xml)
  } catch (e) {
    res.status(500).send('<?xml version="1.0"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></urlset>')
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
                    ROUND(AVG(rv.rating), 1) AS avg_rating,
                    COUNT(rv.id)             AS review_count,
                    ROUND(6371 * ACOS(LEAST(1, GREATEST(-1,
                      COS(RADIANS(?)) * COS(RADIANS(s.lat)) * COS(RADIANS(s.lng) - RADIANS(?)) +
                      SIN(RADIANS(?)) * SIN(RADIANS(s.lat))
                    ))), 1) AS distance_km
             FROM ms_sites s
             LEFT JOIN ms_categories c  ON c.id = s.category_id
             LEFT JOIN ms_reviews rv    ON rv.site_id = s.id AND rv.is_approved = 1
             WHERE s.is_published = 1 AND s.parent_site_id IS NULL AND s.lat IS NOT NULL AND s.lng IS NOT NULL
             GROUP BY s.id
             HAVING distance_km <= ?
             ORDER BY distance_km ASC LIMIT 6`
      params = [uLat, uLng, uLat, parseInt(radius) || 25]
    } else {
      sql = `SELECT s.id, s.title, s.subdomain, s.settings,
                    c.name as cat_name, c.icon as cat_icon,
                    ROUND(AVG(rv.rating), 1) AS avg_rating,
                    COUNT(rv.id)             AS review_count
             FROM ms_sites s
             LEFT JOIN ms_categories c  ON c.id = s.category_id
             LEFT JOIN ms_reviews rv    ON rv.site_id = s.id AND rv.is_approved = 1
             WHERE s.is_published = 1 AND s.parent_site_id IS NULL`
      params = []
      if (city) { sql += ' AND JSON_EXTRACT(s.settings, "$.city") LIKE ?'; params.push(`%${city}%`) }
      sql += ' GROUP BY s.id ORDER BY avg_rating DESC, review_count DESC, s.created_at DESC LIMIT 6'
    }
    results = await db.query(sql, params)
    results = results.map(s => {
      const st = JSON.parse(s.settings || '{}')
      return {
        id:           s.id,
        title:        s.title,
        subdomain:    s.subdomain,
        cat_name:     s.cat_name    || st.subcategory || 'Business',
        cat_icon:     s.cat_icon    || '🏪',
        city:         st.city       || '',
        description:  st.description || '',
        distance_km:  s.distance_km || null,
        logo:         st.logo || (st.profile && st.profile.avatar) || '',
        avg_rating:   s.avg_rating  || null,
        review_count: s.review_count || 0
      }
    })
  } catch(e) { results = [] }
  res.json({ results })
}

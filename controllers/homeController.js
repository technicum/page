const { db } = require('../config/db')

exports.index = async (req, res) => {
  let featured = []
  try {
    featured = await db.query(
      'SELECT s.*, u.name as owner_name FROM ms_pages s JOIN ms_accounts u ON u.id = s.account_id WHERE s.is_published = 1 ORDER BY s.created_at DESC LIMIT 6'
    )
    featured = featured.map(s => ({
      ...s,
      settings: JSON.parse(s.settings || '{}')
    }))
  } catch (e) { featured = [] }

  res.render('home.njk', { title: 'PageZaper', featured })
}

exports.search = async (req, res) => {
  const { q = '', city = '', category = '' } = req.query

  let sql    = 'SELECT s.*, u.name as owner_name FROM ms_pages s JOIN ms_accounts u ON u.id = s.account_id WHERE s.is_published = 1'
  const params = []

  if (q) {
    sql += ' AND (s.title LIKE ? OR s.description LIKE ?)'
    params.push(`%${q}%`, `%${q}%`)
  }
  if (city) {
    sql += " AND JSON_EXTRACT(s.settings, '$.city') LIKE ?"
    params.push(`%${city}%`)
  }
  if (category) {
    sql += ' AND s.category = ?'
    params.push(category)
  }

  sql += ' ORDER BY s.created_at DESC LIMIT 24'

  let results = []
  try {
    results = await db.query(sql, params)
    results = results.map(s => ({ ...s, settings: JSON.parse(s.settings || '{}') }))
  } catch(e) { results = [] }

  res.render('search.njk', { title: 'Search', results, q, city, category })
}

const { db } = require('../config/db')

function parseImages(val) {
  if (!val) return []
  try { const a = JSON.parse(val); return Array.isArray(a) ? a : [] }
  catch (e) { return [] }
}

/* GET /dashboard/galleries */
exports.index = async (req, res) => {
  const user = req.session.user
  let galleries = []
  try {
    galleries = await db.query(
      'SELECT * FROM ms_galleries WHERE account_id = ? ORDER BY sort_order ASC, created_at DESC',
      [user.id]
    ) || []
  } catch (e) {
    // table not yet created — run migration
    try {
      await db.query(`
        CREATE TABLE IF NOT EXISTS ms_galleries (
          id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
          account_id  INT UNSIGNED NOT NULL,
          site_id     INT UNSIGNED DEFAULT NULL,
          name        VARCHAR(200) NOT NULL,
          description TEXT DEFAULT NULL,
          cover_url   VARCHAR(500) DEFAULT NULL,
          images      LONGTEXT DEFAULT NULL,
          status      TINYINT(1) DEFAULT 1,
          sort_order  INT DEFAULT 0,
          created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          KEY idx_account (account_id),
          KEY idx_site (site_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `)
    } catch (e2) { /* already exists */ }
  }

  galleries = galleries.map(g => ({
    ...g,
    images: parseImages(g.images)
  }))

  const sites = await db.query(
    'SELECT id, title, subdomain FROM ms_sites WHERE account_id = ? AND parent_site_id IS NULL ORDER BY id ASC',
    [user.id]
  ).catch(() => [])

  res.render('dashboard/galleries', {
    activePage: 'galleries',
    user,
    galleries,
    sites: sites || []
  })
}

/* GET /dashboard/galleries/list-json */
exports.listJson = async (req, res) => {
  const user    = req.session.user
  const siteId  = req.query.site_id || null
  try {
    let rows = await db.query(
      'SELECT * FROM ms_galleries WHERE account_id = ? AND status = 1 ORDER BY sort_order ASC, created_at DESC',
      [user.id]
    ) || []
    if (siteId) rows = rows.filter(g => !g.site_id || String(g.site_id) === String(siteId))
    rows = rows.map(g => ({ ...g, images: parseImages(g.images) }))
    res.json({ ok: true, galleries: rows })
  } catch (e) {
    res.json({ ok: false, error: e.message })
  }
}

/* POST /dashboard/galleries/create */
exports.create = async (req, res) => {
  const user = req.session.user
  const { name, description, cover_url, images, site_id, status } = req.body
  if (!name || !name.trim()) return res.json({ ok: false, error: 'Name is required.' })
  try {
    await db.query(`
      CREATE TABLE IF NOT EXISTS ms_galleries (
        id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        account_id INT UNSIGNED NOT NULL, site_id INT UNSIGNED DEFAULT NULL,
        name VARCHAR(200) NOT NULL, description TEXT DEFAULT NULL,
        cover_url VARCHAR(500) DEFAULT NULL, images LONGTEXT DEFAULT NULL,
        status TINYINT(1) DEFAULT 1, sort_order INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        KEY idx_account (account_id), KEY idx_site (site_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `)
    const imgJson = Array.isArray(images) ? JSON.stringify(images) : (images || '[]')
    const result  = await db.query(
      'INSERT INTO ms_galleries (account_id, site_id, name, description, cover_url, images, status) VALUES (?,?,?,?,?,?,?)',
      [user.id, site_id || null, name.trim(), description || null, cover_url || null, imgJson, status != null ? (status ? 1 : 0) : 1]
    )
    res.json({ ok: true, id: result.insertId })
  } catch (e) {
    res.json({ ok: false, error: e.message })
  }
}

/* POST /dashboard/galleries/update */
exports.update = async (req, res) => {
  const user = req.session.user
  const { id, name, description, cover_url, images, site_id, status } = req.body
  if (!id) return res.json({ ok: false, error: 'Missing id.' })
  if (!name || !name.trim()) return res.json({ ok: false, error: 'Name is required.' })
  try {
    const imgJson = Array.isArray(images) ? JSON.stringify(images) : (images || '[]')
    await db.query(
      'UPDATE ms_galleries SET name=?, description=?, cover_url=?, images=?, site_id=?, status=? WHERE id=? AND account_id=?',
      [name.trim(), description || null, cover_url || null, imgJson, site_id || null, status != null ? (status ? 1 : 0) : 1, id, user.id]
    )
    res.json({ ok: true })
  } catch (e) {
    res.json({ ok: false, error: e.message })
  }
}

/* POST /dashboard/galleries/delete */
exports.destroy = async (req, res) => {
  const user = req.session.user
  const { id } = req.body
  if (!id) return res.json({ ok: false, error: 'Missing id.' })
  try {
    await db.query('DELETE FROM ms_galleries WHERE id=? AND account_id=?', [id, user.id])
    res.json({ ok: true })
  } catch (e) {
    res.json({ ok: false, error: e.message })
  }
}

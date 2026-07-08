const { db } = require('../config/db')

/* GET /dashboard/products */
exports.index = async (req, res) => {
  const user = req.session.user
  const products = await db.query(
    'SELECT * FROM ms_products WHERE account_id = ? ORDER BY sort_order ASC, created_at DESC',
    [user.id]
  )
  const sites = await db.query(
    'SELECT id, title, subdomain FROM ms_sites WHERE account_id = ? AND parent_site_id IS NULL ORDER BY id ASC',
    [user.id]
  )
  res.render('dashboard/products.njk', {
    title: 'Products',
    user,
    activePage: 'products',
    products: products || [],
    sites: sites || []
  })
}

/* POST /dashboard/products/create */
exports.create = async (req, res) => {
  const user = req.session.user
  const { site_id, type, name, description, price, compare_price, currency, image_url, file_url, duration, collection } = req.body
  if (!name || !name.trim()) return res.json({ ok: false, error: 'Name is required.' })

  const id = await db.lastId(
    `INSERT INTO ms_products (account_id, site_id, type, name, description, price, compare_price, currency, image_url, file_url, duration, collection)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      user.id,
      site_id || null,
      type || 'physical',
      name.trim(),
      description || '',
      price || null,
      compare_price || null,
      currency || 'INR',
      image_url || '',
      file_url || '',
      duration || '',
      collection || ''
    ]
  )

  const product = await db.first('SELECT * FROM ms_products WHERE id = ?', [id])
  res.json({ ok: true, product })
}

/* POST /dashboard/products/update */
exports.update = async (req, res) => {
  const user = req.session.user
  const { id, site_id, type, name, description, price, compare_price, currency, image_url, file_url, duration, collection, in_stock, status } = req.body

  const existing = await db.first('SELECT id FROM ms_products WHERE id = ? AND account_id = ?', [id, user.id])
  if (!existing) return res.json({ ok: false, error: 'Product not found.' })

  await db.execute(
    `UPDATE ms_products
     SET site_id=?, type=?, name=?, description=?, price=?, compare_price=?, currency=?, image_url=?, file_url=?, duration=?, collection=?, in_stock=?, status=?
     WHERE id=? AND account_id=?`,
    [
      site_id || null,
      type || 'physical',
      name || '',
      description || '',
      price || null,
      compare_price || null,
      currency || 'INR',
      image_url || '',
      file_url || '',
      duration || '',
      collection || '',
      in_stock == '0' ? 0 : 1,
      status == '0' ? 0 : 1,
      id,
      user.id
    ]
  )

  res.json({ ok: true })
}

/* POST /dashboard/products/delete */
exports.destroy = async (req, res) => {
  const user = req.session.user
  const { id } = req.body
  if (!id) return res.json({ ok: false, error: 'ID required.' })
  await db.execute('DELETE FROM ms_products WHERE id = ? AND account_id = ?', [id, user.id])
  res.json({ ok: true })
}

/* POST /dashboard/products/reorder */
exports.reorder = async (req, res) => {
  const user = req.session.user
  const { ids } = req.body // array of ids in new order
  if (!Array.isArray(ids)) return res.json({ ok: false })
  for (let i = 0; i < ids.length; i++) {
    await db.execute('UPDATE ms_products SET sort_order=? WHERE id=? AND account_id=?', [i, ids[i], user.id])
  }
  res.json({ ok: true })
}

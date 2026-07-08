const { db }   = require('../config/db')
const multer   = require('multer')
const path     = require('path')
const fs       = require('fs')

// ── Product image uploader ────────────────────────────────────────────────────
function productUploadDir(accountId) {
  return path.join(__dirname, '../public/media/products', String(accountId))
}
function ensureDir(dir) { if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true }) }

function productUploader(accountId) {
  const dir = productUploadDir(accountId)
  ensureDir(dir)
  const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, dir),
    filename:    (req, file, cb) => {
      const ext  = path.extname(file.originalname).toLowerCase()
      const base = path.basename(file.originalname, ext).replace(/[^a-z0-9]/gi, '-').toLowerCase().slice(0, 40)
      cb(null, `${base}-${Date.now()}${ext}`)
    }
  })
  const fileFilter = (req, file, cb) => {
    const ok = ['.jpg','.jpeg','.png','.gif','.webp','.avif']
    if (ok.includes(path.extname(file.originalname).toLowerCase())) cb(null, true)
    else cb(new Error('Only image files allowed'), false)
  }
  return multer({ storage, fileFilter, limits: { fileSize: 5 * 1024 * 1024 } })
}

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
  let collections = []
  try {
    collections = await db.query(
      'SELECT * FROM ms_collections WHERE account_id = ? ORDER BY sort_order ASC, name ASC',
      [user.id]
    ) || []
  } catch(e) { /* table not yet created */ }

  res.render('dashboard/products.njk', {
    title: 'Products',
    user,
    activePage: 'products',
    products: products || [],
    collections,
    sites: sites || []
  })
}

/* GET /dashboard/products/collections */
exports.collectionsPage = async (req, res) => {
  const user = req.session.user
  let collections = []
  try {
    collections = await db.query(
      'SELECT c.*, COUNT(p.id) AS product_count FROM ms_collections c LEFT JOIN ms_products p ON p.collection = c.name AND p.account_id = c.account_id WHERE c.account_id = ? GROUP BY c.id ORDER BY c.sort_order ASC, c.name ASC',
      [user.id]
    ) || []
  } catch(e) { /* table not yet created */ }

  res.render('dashboard/products-collections.njk', {
    title: 'Collections',
    user,
    activePage: 'collections',
    collections
  })
}

/* POST /dashboard/products/collections/create */
exports.createCollection = async (req, res) => {
  const user = req.session.user
  const { name } = req.body
  if (!name || !name.trim()) return res.json({ ok: false, error: 'Name is required.' })
  try {
    const id = await db.lastId(
      'INSERT INTO ms_collections (account_id, name) VALUES (?, ?)',
      [user.id, name.trim()]
    )
    res.json({ ok: true, collection: { id, name: name.trim() } })
  } catch(e) {
    res.json({ ok: false, error: 'Could not create collection.' })
  }
}

/* POST /dashboard/products/collections/delete */
exports.deleteCollection = async (req, res) => {
  const user = req.session.user
  const { id } = req.body
  if (!id) return res.json({ ok: false, error: 'ID required.' })
  try {
    await db.execute('DELETE FROM ms_collections WHERE id = ? AND account_id = ?', [id, user.id])
    res.json({ ok: true })
  } catch(e) {
    res.json({ ok: false, error: 'Could not delete.' })
  }
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

/* POST /dashboard/products/upload-image */
exports.uploadImage = async (req, res) => {
  const user = req.session.user
  const uploader = productUploader(user.id)
  uploader.single('image')(req, res, async (err) => {
    if (err) return res.status(400).json({ ok: false, error: err.message })
    if (!req.file) return res.status(400).json({ ok: false, error: 'No file uploaded' })
    const url = `/media/products/${user.id}/${req.file.filename}`
    res.json({ ok: true, url })
  })
}

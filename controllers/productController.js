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

// Parse a product's collection JSON field into an array (handles legacy plain strings)
function parseCollections(val) {
  if (!val) return []
  try { const c = JSON.parse(val); return Array.isArray(c) ? c : (c ? [String(c)] : []) }
  catch(e) { return val.trim() ? [val.trim()] : [] }
}

/* GET /dashboard/products */
exports.index = async (req, res) => {
  const user = req.session.user
  const rawProducts = await db.query(
    'SELECT * FROM ms_products WHERE account_id = ? ORDER BY sort_order ASC, created_at DESC',
    [user.id]
  )
  // Enrich each product with a parsed collections array for the template
  const products = (rawProducts || []).map(p => ({
    ...p,
    collections: parseCollections(p.collection)
  }))
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
    activeTab: req.query.tab || '',
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
    // JSON_CONTAINS handles both new JSON-array format and legacy plain-string format
    collections = await db.query(
      `SELECT c.*, COUNT(p.id) AS product_count
       FROM ms_collections c
       LEFT JOIN ms_products p
         ON p.account_id = c.account_id
         AND (
           JSON_CONTAINS(p.collection, JSON_QUOTE(c.name))
           OR (JSON_VALID(p.collection) = 0 AND p.collection = c.name)
         )
       WHERE c.account_id = ?
       GROUP BY c.id
       ORDER BY c.sort_order ASC, c.name ASC`,
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

/* POST /dashboard/products/collections/update */
exports.updateCollection = async (req, res) => {
  const user = req.session.user
  const { id, name } = req.body
  if (!name || !name.trim()) return res.json({ ok: false, error: 'Name is required.' })
  try {
    const existing = await db.first('SELECT name FROM ms_collections WHERE id = ? AND account_id = ?', [id, user.id])
    if (!existing) return res.json({ ok: false, error: 'Collection not found.' })
    const newName = name.trim()
    if (newName === existing.name) return res.json({ ok: true, name: newName })
    const dup = await db.first('SELECT id FROM ms_collections WHERE account_id = ? AND name = ? AND id != ?', [user.id, newName, id])
    if (dup) return res.json({ ok: false, error: 'That name is already taken.' })
    await db.execute('UPDATE ms_collections SET name = ? WHERE id = ? AND account_id = ?', [newName, id, user.id])
    // Rename collection in all products (handles both JSON array and legacy plain-string formats)
    const allProds = await db.query('SELECT id, collection FROM ms_products WHERE account_id = ?', [user.id])
    for (const p of (allProds || [])) {
      const cols = parseCollections(p.collection)
      const idx  = cols.indexOf(existing.name)
      if (idx !== -1) {
        cols[idx] = newName
        await db.execute('UPDATE ms_products SET collection = ? WHERE id = ?', [JSON.stringify(cols), p.id])
      }
    }
    res.json({ ok: true, name: newName })
  } catch(e) {
    res.json({ ok: false, error: 'Could not update.' })
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
  const { site_id, type, name, description, price, compare_price, currency, image_url, file_url, duration, collection, images } = req.body
  if (!name || !name.trim()) return res.json({ ok: false, error: 'Name is required.' })

  // Ensure images column exists (auto-migrate)
  try { await db.execute('ALTER TABLE ms_products ADD COLUMN images LONGTEXT DEFAULT NULL') } catch(e) { /* already exists */ }

  const imgJson = Array.isArray(images) ? JSON.stringify(images) : (images || null)

  const id = await db.lastId(
    `INSERT INTO ms_products (account_id, site_id, type, name, description, price, compare_price, currency, image_url, file_url, duration, collection, images)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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
      collection || '',
      imgJson
    ]
  )

  const product = await db.first('SELECT * FROM ms_products WHERE id = ?', [id])
  res.json({ ok: true, product })
}

/* POST /dashboard/products/update */
exports.update = async (req, res) => {
  const user = req.session.user
  const { id, site_id, type, name, description, price, compare_price, currency, image_url, file_url, duration, collection, in_stock, status, images } = req.body

  const existing = await db.first('SELECT id FROM ms_products WHERE id = ? AND account_id = ?', [id, user.id])
  if (!existing) return res.json({ ok: false, error: 'Product not found.' })

  // Ensure images column exists (auto-migrate)
  try { await db.execute('ALTER TABLE ms_products ADD COLUMN images LONGTEXT DEFAULT NULL') } catch(e) { /* already exists */ }

  const imgJson = Array.isArray(images) ? JSON.stringify(images) : (images || null)

  await db.execute(
    `UPDATE ms_products
     SET site_id=?, type=?, name=?, description=?, price=?, compare_price=?, currency=?, image_url=?, file_url=?, duration=?, collection=?, in_stock=?, status=?, images=?
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
      imgJson,
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

/* GET /dashboard/products/list-json — used by website builder inline manager
   ?site_id=X   filter by site (required)
   ?type=Y      filter by ms_products.type (optional, e.g. "property")
   ?collection= filter by collection slug (optional)             */
exports.listJson = async (req, res) => {
  const user = req.session.user
  const { site_id, type, collection } = req.query
  if (!site_id) return res.json({ ok: false, error: 'site_id required' })
  let sql    = 'SELECT * FROM ms_products WHERE account_id = ? AND site_id = ?'
  const args = [user.id, site_id]
  if (type)       { sql += ' AND type = ?';       args.push(type)       }
  if (collection) { sql += ' AND (collection = ? OR collection LIKE ? OR collection LIKE ? OR collection LIKE ?)';
                    args.push(collection, collection + ',%', '%,' + collection, '%,' + collection + ',%') }
  sql += ' ORDER BY sort_order ASC, id ASC'
  const products = await db.query(sql, args) || []
  res.json({ ok: true, products })
}

/* GET /dashboard/products/collections/list-json — used by website builder */
exports.collectionsListJson = async (req, res) => {
  const user = req.session.user
  let collections = []
  try {
    collections = await db.query(
      'SELECT * FROM ms_collections WHERE account_id = ? ORDER BY sort_order ASC, name ASC',
      [user.id]
    ) || []
  } catch(e) { /* table may not exist yet */ }
  res.json({ ok: true, collections })
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

/* POST /api/products/:id/interest — public, no auth.
   A customer browsing search results expresses interest in (or applies for)
   a product/service/job. Creates a Lead against the owning business — no cart,
   no payment, this just plugs the listing into the seller's existing Leads CRM. */
exports.expressInterest = async (req, res) => {
  try {
    const productId = parseInt(req.params.id) || 0
    const name    = (req.body.name    || '').trim()
    const phone   = (req.body.phone   || '').trim()
    const email   = (req.body.email   || '').trim()
    const message = (req.body.message || '').trim()

    if (!productId)      return res.json({ ok: false, error: 'Invalid listing.' })
    if (!name || !phone) return res.json({ ok: false, error: 'Name and phone are required.' })

    const product = await db.first(
      'SELECT id, account_id, site_id, name, type FROM ms_products WHERE id = ? AND status = 1',
      [productId]
    )
    if (!product) return res.json({ ok: false, error: 'Listing not found.' })

    // Products aren't always pinned to one site — fall back to the account's first site
    let siteId = product.site_id
    if (!siteId) {
      const fallback = await db.first(
        'SELECT id FROM ms_sites WHERE account_id = ? ORDER BY id ASC LIMIT 1',
        [product.account_id]
      )
      siteId = fallback && fallback.id
    }
    if (!siteId) return res.json({ ok: false, error: 'This listing has no active site.' })

    const verb  = product.type === 'job' ? 'Applied for' : 'Interested in'
    const notes = `${verb}: ${product.name}` + (message ? `\n\n${message}` : '')

    await db.execute(
      `INSERT INTO ms_leads (site_id, name, email, phone, source, source_id, stage, notes)
       VALUES (?, ?, ?, ?, 'product', ?, 'new', ?)`,
      [siteId, name, email, phone, productId, notes]
    )
    res.json({ ok: true })
  } catch (err) {
    console.error('expressInterest', err)
    res.json({ ok: false, error: 'Something went wrong. Please try again.' })
  }
}

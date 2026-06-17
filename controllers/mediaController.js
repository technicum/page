const multer = require('multer')
const path   = require('path')
const fs     = require('fs')
const { db } = require('../config/db')

// ── Per-site upload directory ─────────────────────────────────────────────────
function siteUploadDir(siteId) {
  return path.join(__dirname, '../public/media', String(siteId))
}

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
}

function sizeLabel(bytes) {
  return bytes > 1024 * 1024
    ? (bytes / (1024 * 1024)).toFixed(1) + ' MB'
    : Math.round(bytes / 1024) + ' KB'
}

// ── Multer config ─────────────────────────────────────────────────────────────
function uploaderFor(siteId) {
  const dir = siteUploadDir(siteId)
  ensureDir(dir)

  const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, dir),
    filename:    (req, file, cb) => {
      const ext  = path.extname(file.originalname).toLowerCase()
      const base = path.basename(file.originalname, ext)
        .replace(/[^a-z0-9]/gi, '-').toLowerCase().slice(0, 40)
      const name = `${base}-${Date.now()}${ext}`
      cb(null, name)
    }
  })

  const fileFilter = (req, file, cb) => {
    const allowed = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.avif']
    const ext = path.extname(file.originalname).toLowerCase()
    if (allowed.includes(ext)) cb(null, true)
    else cb(new Error('Only image files are allowed'), false)
  }

  return multer({ storage, fileFilter, limits: { fileSize: 5 * 1024 * 1024 } })
}

// ── Library page (HTML) — reads from DB ──────────────────────────────────────
exports.library = async (req, res) => {
  const user   = req.session.user
  const siteId = parseInt(req.params.siteId) || 0

  const site = await db.first('SELECT * FROM ms_sites WHERE id = ? AND account_id = ?', [siteId, user.id])
  if (!site) return res.status(403).send('Not found')

  const rows = await db.query(
    'SELECT * FROM ms_media WHERE site_id = ? AND account_id = ? ORDER BY created_at DESC',
    [siteId, user.id]
  )

  const files = rows.map(r => ({
    id:        r.id,
    name:      r.filename,
    original:  r.original,
    url:       r.url,
    mime_type: r.mime_type,
    size:      r.size,
    sizeLabel: sizeLabel(r.size || 0),
    alt:       r.alt || '',
    folder:    r.folder || '',
    modified:  r.created_at ? new Date(r.created_at).toISOString().slice(0, 10) : ''
  }))

  res.render('dashboard/media-library.njk', {
    title: 'Media Library',
    user,
    site,
    files,
    siteId
  })
}

// ── List media for a site (JSON API) — reads from DB ─────────────────────────
exports.list = async (req, res) => {
  const user   = req.session.user
  const siteId = parseInt(req.params.siteId) || 0

  const site = await db.first('SELECT id FROM ms_sites WHERE id = ? AND account_id = ?', [siteId, user.id])
  if (!site) return res.status(403).json({ error: 'Not found' })

  const rows = await db.query(
    'SELECT * FROM ms_media WHERE site_id = ? AND account_id = ? ORDER BY created_at DESC',
    [siteId, user.id]
  )

  const files = rows.map(r => ({
    id:   r.id,
    name: r.filename,
    url:  r.url,
    size: r.size
  }))

  res.json({ files })
}

// ── Upload image — saves file + inserts DB row ────────────────────────────────
exports.upload = async (req, res) => {
  const user   = req.session.user
  const siteId = parseInt(req.params.siteId) || 0

  const site = await db.first('SELECT id FROM ms_sites WHERE id = ? AND account_id = ?', [siteId, user.id])
  if (!site) return res.status(403).json({ error: 'Not found' })

  const upload = uploaderFor(siteId)
  upload.single('image')(req, res, async err => {
    if (err) return res.status(400).json({ error: err.message })
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' })

    const url      = `/media/${siteId}/${req.file.filename}`
    const mimeType = req.file.mimetype || null
    const size     = req.file.size     || 0
    const original = req.file.originalname || req.file.filename
    const folder   = req.body.folder   || null

    try {
      const insertId = await db.lastId(
        `INSERT INTO ms_media (account_id, site_id, filename, original, url, mime_type, size, folder)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [user.id, siteId, req.file.filename, original, url, mimeType, size, folder]
      )

      res.json({
        ok:   true,
        id:   insertId,
        url,
        name: req.file.filename
      })
    } catch (dbErr) {
      // DB insert failed — remove the uploaded file to avoid orphans
      const filePath = path.join(siteUploadDir(siteId), req.file.filename)
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath)
      res.status(500).json({ error: 'Upload saved but DB record failed: ' + dbErr.message })
    }
  })
}

// ── Delete image — removes file + deletes DB row ──────────────────────────────
exports.destroy = async (req, res) => {
  const user     = req.session.user
  const siteId   = parseInt(req.params.siteId) || 0
  const filename = req.params.filename

  if (!filename || filename.includes('..') || filename.includes('/')) {
    return res.status(400).json({ error: 'Invalid filename' })
  }

  const site = await db.first('SELECT id FROM ms_sites WHERE id = ? AND account_id = ?', [siteId, user.id])
  if (!site) return res.status(403).json({ error: 'Not found' })

  // Delete file from disk
  const filePath = path.join(siteUploadDir(siteId), filename)
  if (fs.existsSync(filePath)) fs.unlinkSync(filePath)

  // Delete DB record
  await db.query(
    'DELETE FROM ms_media WHERE site_id = ? AND account_id = ? AND filename = ?',
    [siteId, user.id, filename]
  )

  res.json({ ok: true })
}

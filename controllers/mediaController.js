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

// ── List media for a site ─────────────────────────────────────────────────────
exports.list = async (req, res) => {
  const user   = req.session.user
  const siteId = parseInt(req.params.siteId) || 0

  const site = await db.first('SELECT id FROM ms_pages WHERE id = ? AND account_id = ?', [siteId, user.id])
  if (!site) return res.status(403).json({ error: 'Not found' })

  const dir = siteUploadDir(siteId)
  ensureDir(dir)

  const files = fs.readdirSync(dir)
    .filter(f => /\.(jpg|jpeg|png|gif|webp|svg|avif)$/i.test(f))
    .map(f => ({
      name: f,
      url:  `/media/${siteId}/${f}`,
      size: fs.statSync(path.join(dir, f)).size
    }))
    .reverse()

  res.json({ files })
}

// ── Upload image ──────────────────────────────────────────────────────────────
exports.upload = async (req, res) => {
  const user   = req.session.user
  const siteId = parseInt(req.params.siteId) || 0

  const site = await db.first('SELECT id FROM ms_pages WHERE id = ? AND account_id = ?', [siteId, user.id])
  if (!site) return res.status(403).json({ error: 'Not found' })

  const upload = uploaderFor(siteId)
  upload.single('image')(req, res, err => {
    if (err) return res.status(400).json({ error: err.message })
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' })

    res.json({
      ok:  true,
      url: `/media/${siteId}/${req.file.filename}`,
      name: req.file.filename
    })
  })
}

// ── Delete image ──────────────────────────────────────────────────────────────
exports.destroy = async (req, res) => {
  const user     = req.session.user
  const siteId   = parseInt(req.params.siteId) || 0
  const filename = req.params.filename

  if (!filename || filename.includes('..') || filename.includes('/')) {
    return res.status(400).json({ error: 'Invalid filename' })
  }

  const site = await db.first('SELECT id FROM ms_pages WHERE id = ? AND account_id = ?', [siteId, user.id])
  if (!site) return res.status(403).json({ error: 'Not found' })

  const filePath = path.join(siteUploadDir(siteId), filename)
  if (fs.existsSync(filePath)) fs.unlinkSync(filePath)

  res.json({ ok: true })
}

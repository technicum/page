const multer = require('multer')
const path   = require('path')
const fs     = require('fs')
const { db } = require('../config/db')

// ── Directory helpers ─────────────────────────────────────────────────────────
function siteUploadDir(siteId) {
  return path.join(__dirname, '../public/media', String(siteId))
}
function accountUploadDir(accountId, folder) {
  const base = path.join(__dirname, '../public/media', 'u' + String(accountId))
  if (folder) {
    const safe = folder.replace(/[^a-z0-9_\-]/gi, '_').toLowerCase().slice(0, 40)
    return path.join(base, safe)
  }
  return base
}
function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
}
function sizeLabel(bytes) {
  if (!bytes) return '0 KB'
  return bytes > 1024 * 1024
    ? (bytes / (1024 * 1024)).toFixed(1) + ' MB'
    : Math.round(bytes / 1024) + ' KB'
}
function safeFilename(original) {
  const ext  = path.extname(original).toLowerCase()
  const base = path.basename(original, ext)
    .replace(/[^a-z0-9]/gi, '-').toLowerCase().slice(0, 50)
  return `${base}-${Date.now()}${ext}`
}

// ── Allowed extensions ────────────────────────────────────────────────────────
const ALLOWED_EXT = [
  '.jpg','.jpeg','.png','.gif','.webp','.svg','.avif',
  '.pdf','.mp4','.mov','.webm','.mp3','.wav',
  '.zip','.doc','.docx','.xls','.xlsx','.txt','.csv'
]
const IMAGE_EXT = ['.jpg','.jpeg','.png','.gif','.webp','.svg','.avif']

// ── Multer for site-based uploads ─────────────────────────────────────────────
function siteUploader(siteId) {
  const dir = siteUploadDir(siteId)
  ensureDir(dir)
  const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, dir),
    filename:    (req, file, cb) => cb(null, safeFilename(file.originalname))
  })
  const fileFilter = (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase()
    IMAGE_EXT.includes(ext) ? cb(null, true) : cb(new Error('Only image files allowed'), false)
  }
  return multer({ storage, fileFilter, limits: { fileSize: 10 * 1024 * 1024 } })
}

// ── Multer for account-based uploads ─────────────────────────────────────────
function accountUploader(accountId, folder) {
  const dir = accountUploadDir(accountId, folder)
  ensureDir(dir)
  const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, dir),
    filename:    (req, file, cb) => cb(null, safeFilename(file.originalname))
  })
  const fileFilter = (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase()
    ALLOWED_EXT.includes(ext) ? cb(null, true) : cb(new Error('File type not allowed'), false)
  }
  return multer({ storage, fileFilter, limits: { fileSize: 20 * 1024 * 1024 } })
}

// ─────────────────────────────────────────────────────────────────────────────
// ACCOUNT-WIDE MEDIA LIBRARY
// ─────────────────────────────────────────────────────────────────────────────

// GET /dashboard/media  — account media library page
exports.accountLibrary = async (req, res) => {
  const user = req.session.user

  // Get all folders this user has used
  const folderRows = await db.query(
    `SELECT DISTINCT folder FROM ms_media
     WHERE account_id = ? AND site_id IS NULL AND folder IS NOT NULL AND folder != ''
     ORDER BY folder ASC`,
    [user.id]
  ).catch(() => [])

  const folders = folderRows.map(r => r.folder)

  res.render('dashboard/media-library.njk', {
    title: 'Media Library',
    user,
    folders,
    mode: 'account',
    activePage: 'media'
  })
}

// GET /api/media  — list files (JSON, for picker)
exports.accountList = async (req, res) => {
  const user   = req.session.user
  const folder = req.query.folder || null   // null = all, '' = uncategorized
  const type   = req.query.type  || 'all'  // 'image' | 'all'
  const q      = req.query.q     || ''

  let sql    = 'SELECT * FROM ms_media WHERE account_id = ? AND site_id IS NULL'
  const args = [user.id]

  if (folder === '') {
    sql += ' AND (folder IS NULL OR folder = "")'
  } else if (folder) {
    sql += ' AND folder = ?'
    args.push(folder)
  }

  if (type === 'image') {
    sql += ' AND (mime_type LIKE "image/%" OR filename LIKE "%.jpg" OR filename LIKE "%.jpeg" OR filename LIKE "%.png" OR filename LIKE "%.gif" OR filename LIKE "%.webp" OR filename LIKE "%.svg" OR filename LIKE "%.avif")'
  }

  if (q) {
    sql += ' AND (filename LIKE ? OR original LIKE ?)'
    args.push('%' + q + '%', '%' + q + '%')
  }

  sql += ' ORDER BY created_at DESC LIMIT 200'

  const rows = await db.query(sql, args)
  const files = rows.map(r => ({
    id:        r.id,
    name:      r.filename,
    original:  r.original || r.filename,
    url:       r.url,
    mime_type: r.mime_type || '',
    size:      r.size || 0,
    sizeLabel: sizeLabel(r.size || 0),
    folder:    r.folder || '',
    isImage:   IMAGE_EXT.includes(path.extname(r.filename).toLowerCase()),
    modified:  r.created_at ? new Date(r.created_at).toISOString().slice(0, 10) : ''
  }))

  // Also return folder list
  const folderRows = await db.query(
    `SELECT DISTINCT folder, COUNT(*) as count FROM ms_media
     WHERE account_id = ? AND site_id IS NULL AND folder IS NOT NULL AND folder != ''
     GROUP BY folder ORDER BY folder ASC`,
    [user.id]
  ).catch(() => [])

  res.json({ files, folders: folderRows })
}

// POST /api/media/upload  — account upload
exports.accountUpload = async (req, res) => {
  const user   = req.session.user
  const folder = (req.body && req.body.folder) || (req.query && req.query.folder) || null

  // We need to parse folder from body first — use a middleware trick
  // Actually multer will parse it; we call the uploader after getting folder from query
  const folderVal = req.query.folder || null

  const uploader = accountUploader(user.id, folderVal)
  uploader.single('file')(req, res, async err => {
    if (err) return res.status(400).json({ error: err.message })
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' })

    const folderFromBody = (req.body && req.body.folder) || folderVal || null
    const ext  = path.extname(req.file.originalname).toLowerCase()
    const isImg = IMAGE_EXT.includes(ext)

    // Build URL path: /media/u{accountId}/{folder?}/{filename}
    let urlPath = `/media/u${user.id}`
    if (folderFromBody) {
      const safe = folderFromBody.replace(/[^a-z0-9_\-]/gi, '_').toLowerCase().slice(0, 40)
      urlPath += `/${safe}`
    }
    urlPath += `/${req.file.filename}`

    try {
      const insertId = await db.lastId(
        `INSERT INTO ms_media (account_id, site_id, filename, original, url, mime_type, size, folder)
         VALUES (?, NULL, ?, ?, ?, ?, ?, ?)`,
        [
          user.id,
          req.file.filename,
          req.file.originalname || req.file.filename,
          urlPath,
          req.file.mimetype || null,
          req.file.size || 0,
          folderFromBody || null
        ]
      )
      res.json({ ok: true, id: insertId, url: urlPath, name: req.file.filename, isImage: isImg })
    } catch (dbErr) {
      // Cleanup orphaned file
      if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path)
      res.status(500).json({ error: 'DB error: ' + dbErr.message })
    }
  })
}

// DELETE /api/media/:id  — delete account file by DB id
exports.accountDelete = async (req, res) => {
  const user = req.session.user
  const id   = parseInt(req.params.id)

  const row = await db.first(
    'SELECT * FROM ms_media WHERE id = ? AND account_id = ? AND site_id IS NULL',
    [id, user.id]
  )
  if (!row) return res.status(404).json({ error: 'Not found' })

  // Build disk path
  let filePath
  const folder = row.folder
  if (folder) {
    const safe = folder.replace(/[^a-z0-9_\-]/gi, '_').toLowerCase().slice(0, 40)
    filePath = path.join(accountUploadDir(user.id, safe), row.filename)
  } else {
    filePath = path.join(accountUploadDir(user.id, null), row.filename)
  }
  if (fs.existsSync(filePath)) fs.unlinkSync(filePath)

  await db.query('DELETE FROM ms_media WHERE id = ? AND account_id = ?', [id, user.id])
  res.json({ ok: true })
}

// POST /api/media/folder  — create a folder (just validates the name; folders are virtual)
exports.createFolder = async (req, res) => {
  const user = req.session.user
  const name = (req.body.name || '').trim()
  if (!name) return res.status(400).json({ error: 'Folder name required' })
  const safe = name.replace(/[^a-z0-9_\- ]/gi, '').trim().slice(0, 40)
  if (!safe) return res.status(400).json({ error: 'Invalid folder name' })

  // Folders are virtual (stored as tag in ms_media.folder)
  // Ensure the directory exists on disk
  const dir = accountUploadDir(user.id, safe)
  ensureDir(dir)

  res.json({ ok: true, folder: safe })
}

// DELETE /api/media/folder/:name  — delete a folder if empty
exports.deleteFolder = async (req, res) => {
  const user = req.session.user
  const name = req.params.name

  const count = await db.first(
    'SELECT COUNT(*) as c FROM ms_media WHERE account_id = ? AND site_id IS NULL AND folder = ?',
    [user.id, name]
  )
  if (count && count.c > 0) {
    return res.status(400).json({ error: 'Folder is not empty. Move or delete files first.' })
  }

  // Try to remove the directory if it's empty
  const dir = accountUploadDir(user.id, name)
  try {
    if (fs.existsSync(dir)) fs.rmdirSync(dir)
  } catch (e) { /* ignore if not empty on disk */ }

  res.json({ ok: true })
}

// ─────────────────────────────────────────────────────────────────────────────
// LEGACY SITE-BASED API (kept for backward compat — biolink builder)
// ─────────────────────────────────────────────────────────────────────────────

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
    id: r.id, name: r.filename, original: r.original, url: r.url,
    mime_type: r.mime_type, size: r.size, sizeLabel: sizeLabel(r.size || 0),
    alt: r.alt || '', folder: r.folder || '',
    modified: r.created_at ? new Date(r.created_at).toISOString().slice(0, 10) : ''
  }))
  res.render('dashboard/media-library.njk', { title: 'Media Library', user, site, files, siteId, mode: 'site' })
}

exports.list = async (req, res) => {
  const user   = req.session.user
  const siteId = parseInt(req.params.siteId) || 0
  const site = await db.first('SELECT id FROM ms_sites WHERE id = ? AND account_id = ?', [siteId, user.id])
  if (!site) return res.status(403).json({ error: 'Not found' })
  const rows = await db.query(
    'SELECT * FROM ms_media WHERE site_id = ? AND account_id = ? ORDER BY created_at DESC',
    [siteId, user.id]
  )
  res.json({ files: rows.map(r => ({ id: r.id, name: r.filename, url: r.url, size: r.size })) })
}

exports.upload = async (req, res) => {
  const user   = req.session.user
  const siteId = parseInt(req.params.siteId) || 0
  const site = await db.first('SELECT id FROM ms_sites WHERE id = ? AND account_id = ?', [siteId, user.id])
  if (!site) return res.status(403).json({ error: 'Not found' })

  const uploader = siteUploader(siteId)
  uploader.single('image')(req, res, async err => {
    if (err) return res.status(400).json({ error: err.message })
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' })
    const url    = `/media/${siteId}/${req.file.filename}`
    const folder = (req.body && req.body.folder) || null
    try {
      const insertId = await db.lastId(
        `INSERT INTO ms_media (account_id, site_id, filename, original, url, mime_type, size, folder)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [user.id, siteId, req.file.filename, req.file.originalname || req.file.filename,
         url, req.file.mimetype || null, req.file.size || 0, folder]
      )
      res.json({ ok: true, id: insertId, url, name: req.file.filename })
    } catch (dbErr) {
      const fp = path.join(siteUploadDir(siteId), req.file.filename)
      if (fs.existsSync(fp)) fs.unlinkSync(fp)
      res.status(500).json({ error: dbErr.message })
    }
  })
}

exports.destroy = async (req, res) => {
  const user     = req.session.user
  const siteId   = parseInt(req.params.siteId) || 0
  const filename = req.params.filename
  if (!filename || filename.includes('..') || filename.includes('/')) {
    return res.status(400).json({ error: 'Invalid filename' })
  }
  const site = await db.first('SELECT id FROM ms_sites WHERE id = ? AND account_id = ?', [siteId, user.id])
  if (!site) return res.status(403).json({ error: 'Not found' })
  const fp = path.join(siteUploadDir(siteId), filename)
  if (fs.existsSync(fp)) fs.unlinkSync(fp)
  await db.query('DELETE FROM ms_media WHERE site_id = ? AND account_id = ? AND filename = ?',
    [siteId, user.id, filename])
  res.json({ ok: true })
}

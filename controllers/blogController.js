const { db } = require('../config/db')

// ── Slugify helper ────────────────────────────────────────────────────────────
function slugify(str) {
  return str.toLowerCase().trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')
}

// ── List posts for a site ─────────────────────────────────────────────────────
exports.index = async (req, res) => {
  const user   = req.session.user
  const siteId = parseInt(req.params.siteId) || 0

  const site  = await db.first('SELECT * FROM ms_pages WHERE id = ? AND account_id = ?', [siteId, user.id])
  if (!site) return res.redirect('/dashboard')

  let posts = []
  try {
    posts = await db.query(
      'SELECT id, title, slug, status, created_at FROM ms_posts WHERE page_id = ? ORDER BY created_at DESC',
      [siteId]
    )
  } catch(e) {
    // Table may not exist yet — show migration notice
    return res.render('dashboard/blog.njk', { title: 'Blog', user, site, posts: [], needsMigration: true })
  }

  res.render('dashboard/blog.njk', { title: 'Blog', user, site, posts, needsMigration: false })
}

// ── Show new post form ────────────────────────────────────────────────────────
exports.newForm = (req, res) => {
  const user   = req.session.user
  const siteId = parseInt(req.params.siteId) || 0
  res.render('dashboard/blog-editor.njk', {
    title: 'New Post', user, siteId, post: null, errors: []
  })
}

// ── Create post ───────────────────────────────────────────────────────────────
exports.create = async (req, res) => {
  const user   = req.session.user
  const siteId = parseInt(req.params.siteId) || 0
  const { title, content, excerpt, meta_title, meta_desc, og_image, status } = req.body

  if (!title) {
    return res.render('dashboard/blog-editor.njk', {
      title: 'New Post', user, siteId, post: req.body, errors: ['Title is required.']
    })
  }

  let slug = slugify(title)
  // Ensure unique slug
  const existing = await db.first('SELECT id FROM ms_posts WHERE page_id = ? AND slug = ?', [siteId, slug])
  if (existing) slug += '-' + Date.now()

  await db.lastId(
    `INSERT INTO ms_posts (page_id, account_id, title, slug, content, excerpt, meta_title, meta_desc, og_image, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [siteId, user.id, title, slug, content || '', excerpt || '', meta_title || '', meta_desc || '', og_image || '', status || 'draft']
  )

  req.flash('success', 'Post created.')
  res.redirect(`/dashboard/blog/${siteId}`)
}

// ── Show edit form ────────────────────────────────────────────────────────────
exports.editForm = async (req, res) => {
  const user   = req.session.user
  const siteId = parseInt(req.params.siteId) || 0
  const postId = parseInt(req.params.postId) || 0

  const post = await db.first(
    'SELECT * FROM ms_posts WHERE id = ? AND page_id = ? AND account_id = ?',
    [postId, siteId, user.id]
  )
  if (!post) return res.redirect(`/dashboard/blog/${siteId}`)

  res.render('dashboard/blog-editor.njk', {
    title: 'Edit Post', user, siteId, post, errors: []
  })
}

// ── Update post ───────────────────────────────────────────────────────────────
exports.update = async (req, res) => {
  const user   = req.session.user
  const siteId = parseInt(req.params.siteId) || 0
  const postId = parseInt(req.params.postId) || 0
  const { title, content, excerpt, meta_title, meta_desc, og_image, status } = req.body

  if (!title) {
    const post = await db.first('SELECT * FROM ms_posts WHERE id = ?', [postId])
    return res.render('dashboard/blog-editor.njk', {
      title: 'Edit Post', user, siteId, post: { ...post, ...req.body }, errors: ['Title is required.']
    })
  }

  await db.execute(
    `UPDATE ms_posts SET title=?, content=?, excerpt=?, meta_title=?, meta_desc=?, og_image=?, status=?, updated_at=NOW()
     WHERE id = ? AND account_id = ?`,
    [title, content || '', excerpt || '', meta_title || '', meta_desc || '', og_image || '', status || 'draft', postId, user.id]
  )

  req.flash('success', 'Post saved.')
  res.redirect(`/dashboard/blog/${siteId}`)
}

// ── Delete post ───────────────────────────────────────────────────────────────
exports.destroy = async (req, res) => {
  const user   = req.session.user
  const siteId = parseInt(req.params.siteId) || 0
  const postId = parseInt(req.params.postId) || 0

  await db.execute('DELETE FROM ms_posts WHERE id = ? AND account_id = ?', [postId, user.id])
  req.flash('success', 'Post deleted.')
  res.redirect(`/dashboard/blog/${siteId}`)
}

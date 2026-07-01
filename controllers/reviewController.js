const { db } = require('../config/db')

// ── Public: show review form ──────────────────────────────────────────────────
exports.showForm = async (req, res, next) => {
  try {
    const site = await db.first(
      `SELECT s.id, s.title, s.subdomain, s.settings,
              c.name AS cat_name, c.icon AS cat_icon
       FROM ms_sites s
       LEFT JOIN ms_categories c ON c.id = s.category_id
       WHERE s.subdomain = ? AND s.is_published = 1 AND s.parent_site_id IS NULL`,
      [req.params.subdomain]
    )
    if (!site) return next()

    site.settings = JSON.parse(site.settings || '{}')

    const stats = await db.first(
      `SELECT ROUND(AVG(rating), 1) AS avg_rating, COUNT(*) AS total
       FROM ms_reviews WHERE site_id = ? AND is_approved = 1`,
      [site.id]
    )

    const reviews = await db.query(
      `SELECT reviewer_name, rating, comment, created_at
       FROM ms_reviews
       WHERE site_id = ? AND is_approved = 1
       ORDER BY created_at DESC LIMIT 10`,
      [site.id]
    )

    res.render('review.njk', {
      title: `Review ${site.title}`,
      site,
      stats,
      reviews,
      submitted: req.query.submitted === '1',
      error: req.query.error || null
    })
  } catch (e) {
    next(e)
  }
}

// ── Public: submit review ─────────────────────────────────────────────────────
exports.submit = async (req, res, next) => {
  try {
    const site = await db.first(
      'SELECT id FROM ms_sites WHERE subdomain = ? AND is_published = 1',
      [req.params.subdomain]
    )
    if (!site) return next()

    const { reviewer_name, reviewer_email, rating, comment } = req.body
    const r = parseInt(rating)

    if (!reviewer_name || !reviewer_name.trim()) {
      return res.redirect(`/review/${req.params.subdomain}?error=name`)
    }
    if (!r || r < 1 || r > 5) {
      return res.redirect(`/review/${req.params.subdomain}?error=rating`)
    }

    await db.query(
      `INSERT INTO ms_reviews (site_id, reviewer_name, reviewer_email, rating, comment)
       VALUES (?, ?, ?, ?, ?)`,
      [site.id, reviewer_name.trim(), reviewer_email?.trim() || null, r, comment?.trim() || null]
    )

    res.redirect(`/review/${req.params.subdomain}?submitted=1`)
  } catch (e) {
    next(e)
  }
}

// ── Public API: get reviews for a site (for theme embeds) ─────────────────────
exports.apiReviews = async (req, res) => {
  try {
    const site = await db.first('SELECT id FROM ms_sites WHERE subdomain = ?', [req.params.subdomain])
    if (!site) return res.json({ reviews: [], avg_rating: null, total: 0 })

    const stats = await db.first(
      `SELECT ROUND(AVG(rating), 1) AS avg_rating, COUNT(*) AS total
       FROM ms_reviews WHERE site_id = ? AND is_approved = 1`,
      [site.id]
    )
    const reviews = await db.query(
      `SELECT reviewer_name, rating, comment, created_at
       FROM ms_reviews WHERE site_id = ? AND is_approved = 1
       ORDER BY created_at DESC LIMIT 20`,
      [site.id]
    )
    res.json({ reviews, avg_rating: stats?.avg_rating || null, total: stats?.total || 0 })
  } catch (e) {
    res.json({ reviews: [], avg_rating: null, total: 0 })
  }
}

// ── Dashboard: list reviews for a site ───────────────────────────────────────
exports.siteReviews = async (req, res) => {
  try {
    const siteId = parseInt(req.query.id)
    const userId = req.session.user.id

    // Verify ownership
    const site = await db.first(
      'SELECT id, title FROM ms_sites WHERE id = ? AND account_id = ?',
      [siteId, userId]
    )
    if (!site) return res.json({ ok: false, error: 'Not found' })

    const stats = await db.first(
      `SELECT ROUND(AVG(rating), 1) AS avg_rating, COUNT(*) AS total
       FROM ms_reviews WHERE site_id = ? AND is_approved = 1`,
      [siteId]
    )
    const reviews = await db.query(
      `SELECT id, reviewer_name, reviewer_email, rating, comment, is_approved, created_at
       FROM ms_reviews WHERE site_id = ?
       ORDER BY created_at DESC`,
      [siteId]
    )

    res.json({ ok: true, reviews, stats })
  } catch (e) {
    res.json({ ok: false, error: e.message })
  }
}

// ── Dashboard: delete a review ────────────────────────────────────────────────
exports.deleteReview = async (req, res) => {
  try {
    const { review_id, site_id } = req.body
    const userId = req.session.user.id

    // Verify ownership via site
    const site = await db.first(
      'SELECT id FROM ms_sites WHERE id = ? AND account_id = ?',
      [site_id, userId]
    )
    if (!site) return res.json({ ok: false, error: 'Not found' })

    await db.query(
      'DELETE FROM ms_reviews WHERE id = ? AND site_id = ?',
      [review_id, site_id]
    )
    res.json({ ok: true })
  } catch (e) {
    res.json({ ok: false, error: e.message })
  }
}

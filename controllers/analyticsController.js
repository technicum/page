const { db } = require('../config/db')

exports.index = async (req, res) => {
  const user = req.session.user

  // All sites for this user
  const sites = await db.query(
    'SELECT id, title, subdomain, is_published FROM ms_sites WHERE account_id = ? ORDER BY title ASC',
    [user.id]
  )

  // Selected site (default to first)
  const siteId = parseInt(req.query.site_id) || (sites[0] ? sites[0].id : 0)
  const site   = sites.find(s => s.id === siteId) || sites[0] || null

  if (!site) {
    return res.render('dashboard/analytics.njk', {
      title: 'Analytics', user, sites, site: null,
      stats: null, daily: [], topBlocks: []
    })
  }

  // ── Total stats ──
  const [totals] = await db.query(`
    SELECT
      SUM(event_type = 'view')  AS total_views,
      SUM(event_type = 'click') AS total_clicks,
      COUNT(DISTINCT ip_hash)   AS unique_visitors
    FROM ms_analytics
    WHERE site_id = ?
  `, [site.id])

  // ── Last 7 days daily breakdown ──
  const daily = await db.query(`
    SELECT
      DATE(created_at) AS day,
      SUM(event_type = 'view')  AS views,
      SUM(event_type = 'click') AS clicks
    FROM ms_analytics
    WHERE site_id = ? AND created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
    GROUP BY DATE(created_at)
    ORDER BY day ASC
  `, [site.id])

  // ── Top clicked blocks ──
  const topBlocks = await db.query(`
    SELECT label, block_type, COUNT(*) AS clicks
    FROM ms_analytics
    WHERE site_id = ? AND event_type = 'click' AND label IS NOT NULL AND label != ''
    GROUP BY label, block_type
    ORDER BY clicks DESC
    LIMIT 10
  `, [site.id])

  // ── Today vs yesterday ──
  const [today] = await db.query(`
    SELECT
      SUM(event_type = 'view')  AS views,
      SUM(event_type = 'click') AS clicks
    FROM ms_analytics
    WHERE site_id = ? AND DATE(created_at) = CURDATE()
  `, [site.id])

  const [yesterday] = await db.query(`
    SELECT
      SUM(event_type = 'view')  AS views,
      SUM(event_type = 'click') AS clicks
    FROM ms_analytics
    WHERE site_id = ? AND DATE(created_at) = DATE_SUB(CURDATE(), INTERVAL 1 DAY)
  `, [site.id])

  const stats = {
    totalViews:       parseInt(totals.total_views)      || 0,
    totalClicks:      parseInt(totals.total_clicks)     || 0,
    uniqueVisitors:   parseInt(totals.unique_visitors)  || 0,
    todayViews:       parseInt(today.views)             || 0,
    todayClicks:      parseInt(today.clicks)            || 0,
    yesterdayViews:   parseInt(yesterday.views)         || 0,
    yesterdayClicks:  parseInt(yesterday.clicks)        || 0,
  }

  res.render('dashboard/analytics.njk', {
    title: 'Analytics',
    user, sites, site, stats, daily, topBlocks,
    activePage: 'analytics'
  })
}

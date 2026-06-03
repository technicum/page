const { db } = require('../config/db')

// Auto-create leads table on first use
let tableReady = false
async function ensureTable() {
  if (tableReady) return
  await db.execute(`
    CREATE TABLE IF NOT EXISTS ms_biolink_leads (
      id         INT AUTO_INCREMENT PRIMARY KEY,
      page_id    INT NOT NULL,
      name       VARCHAR(255),
      phone      VARCHAR(100),
      email      VARCHAR(255),
      message    TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_page (page_id)
    ) CHARACTER SET utf8mb4
  `)
  tableReady = true
}

exports.submitLead = async (req, res) => {
  const siteId = parseInt(req.params.siteId) || 0
  const { name, phone, email, message } = req.body

  if (!siteId) return res.json({ ok: false, error: 'Invalid site' })
  if (!name && !phone && !email) return res.json({ ok: false, error: 'Please fill in at least one field.' })

  try {
    await ensureTable()
    await db.execute(
      'INSERT INTO ms_biolink_leads (page_id, name, phone, email, message) VALUES (?, ?, ?, ?, ?)',
      [siteId, name || '', phone || '', email || '', message || '']
    )
    res.json({ ok: true, message: "Thanks! We'll be in touch soon." })
  } catch (err) {
    console.error('[biolink lead]', err.message)
    res.json({ ok: false, error: 'Server error, please try again.' })
  }
}

// Dashboard: list leads for a site
exports.listLeads = async (req, res) => {
  const user   = req.session.user
  const siteId = parseInt(req.params.siteId) || 0

  const site = await db.first('SELECT id, title FROM ms_pages WHERE id = ? AND account_id = ?', [siteId, user.id])
  if (!site) return res.redirect('/dashboard')

  try {
    await ensureTable()
    const leads = await db.query(
      'SELECT * FROM ms_biolink_leads WHERE page_id = ? ORDER BY created_at DESC',
      [siteId]
    )
    res.render('dashboard/biolink-leads.njk', { title: 'Leads — ' + site.title, user, site, leads })
  } catch (err) {
    res.render('dashboard/biolink-leads.njk', { title: 'Leads', user, site, leads: [] })
  }
}

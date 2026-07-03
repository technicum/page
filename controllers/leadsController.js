const { db } = require('../config/db')

const STAGES = ['new', 'contacted', 'qualified', 'won', 'lost']

// ── Helper: clean comma-separated tags ───────────────────────────────────────
function cleanTags(raw) {
  return (raw || '').split(',').map(t => t.trim()).filter(Boolean).join(',')
}

// ── Auto-capture helper (called from other controllers) ───────────────────────
exports.captureLead = async ({ siteId, name, email, phone, source, sourceId }) => {
  try {
    // Avoid duplicates from the same source record
    if (source !== 'manual' && sourceId) {
      const existing = await db.first(
        'SELECT id FROM ms_leads WHERE site_id = ? AND source = ? AND source_id = ?',
        [siteId, source, sourceId]
      )
      if (existing) return
    }
    await db.execute(
      `INSERT INTO ms_leads (site_id, name, email, phone, source, source_id)
       VALUES (?,?,?,?,?,?)`,
      [siteId, name || null, email || null, phone || null, source, sourceId || null]
    )
  } catch (err) {
    console.error('leadsController.captureLead', err)
  }
}

// ── GET /dashboard/leads ──────────────────────────────────────────────────────
exports.index = async (req, res) => {
  const user = req.session.user

  const sites = await db.query(
    'SELECT id, title FROM ms_sites WHERE account_id = ?', [user.id]
  )
  const siteIds = sites.map(s => s.id)

  if (!siteIds.length) {
    return res.render('dashboard/leads.njk', {
      title: 'Leads CRM', user, sites, leads: [], allTags: [], filterTag: '', filterStage: '', filterSite: ''
    })
  }

  const filterTag   = (req.query.tag   || '').trim()
  const filterStage = (req.query.stage || '').trim()
  const filterSite  = parseInt(req.query.site_id) || ''

  let where = `WHERE l.site_id IN (${siteIds.map(() => '?').join(',')})`
  const params = [...siteIds]

  if (filterStage && STAGES.includes(filterStage)) {
    where += ' AND l.stage = ?'; params.push(filterStage)
  }
  if (filterSite) {
    where += ' AND l.site_id = ?'; params.push(filterSite)
  }

  const leads = await db.query(
    `SELECT l.*, s.title AS site_title
     FROM ms_leads l
     JOIN ms_sites s ON s.id = l.site_id
     ${where}
     ORDER BY l.created_at DESC`,
    params
  )

  // Filter by tag in JS (comma-separated field — simpler than SQL FIND_IN_SET)
  const filtered = filterTag
    ? leads.filter(l => l.tags && l.tags.split(',').map(t => t.trim()).includes(filterTag))
    : leads

  // Collect all unique tags across all leads for the filter UI
  const tagSet = new Set()
  leads.forEach(l => { if (l.tags) l.tags.split(',').forEach(t => { if (t.trim()) tagSet.add(t.trim()) }) })
  const allTags = [...tagSet].sort()

  res.render('dashboard/leads.njk', {
    title: 'Leads CRM',
    user, sites,
    leads: filtered,
    allTags,
    filterTag,
    filterStage,
    filterSite: filterSite || ''
  })
}

// ── POST /dashboard/leads — create manual lead ────────────────────────────────
exports.create = async (req, res) => {
  const user    = req.session.user
  const siteId  = parseInt(req.body.site_id) || 0

  const site = await db.first('SELECT id FROM ms_sites WHERE id = ? AND account_id = ?', [siteId, user.id])
  if (!site) return res.redirect('/dashboard/leads')

  const { name, email, phone, stage, tags, notes } = req.body

  await db.execute(
    `INSERT INTO ms_leads (site_id, name, email, phone, source, stage, tags, notes)
     VALUES (?,?,?,?,?,?,?,?)`,
    [
      siteId,
      (name  || '').slice(0, 255) || null,
      (email || '').slice(0, 255) || null,
      (phone || '').slice(0, 50)  || null,
      'manual',
      STAGES.includes(stage) ? stage : 'new',
      cleanTags(tags).slice(0, 500),
      (notes || '').slice(0, 5000)
    ]
  )

  res.redirect('/dashboard/leads')
}

// ── POST /dashboard/leads/:id/stage ──────────────────────────────────────────
exports.updateStage = async (req, res) => {
  const user  = req.session.user
  const id    = parseInt(req.params.id) || 0
  const stage = req.body.stage

  if (!STAGES.includes(stage)) return res.json({ ok: false, error: 'Invalid stage' })

  const lead = await db.first(
    `SELECT l.id FROM ms_leads l
     JOIN ms_sites s ON s.id = l.site_id
     WHERE l.id = ? AND s.account_id = ?`,
    [id, user.id]
  )
  if (!lead) return res.status(403).json({ ok: false })

  await db.execute(
    'UPDATE ms_leads SET stage = ?, updated_at = NOW() WHERE id = ?',
    [stage, id]
  )
  res.json({ ok: true, stage })
}

// ── POST /dashboard/leads/:id/tags ────────────────────────────────────────────
exports.updateTags = async (req, res) => {
  const user = req.session.user
  const id   = parseInt(req.params.id) || 0
  const tags = cleanTags(req.body.tags || '').slice(0, 500)

  const lead = await db.first(
    `SELECT l.id FROM ms_leads l
     JOIN ms_sites s ON s.id = l.site_id
     WHERE l.id = ? AND s.account_id = ?`,
    [id, user.id]
  )
  if (!lead) return res.status(403).json({ ok: false })

  await db.execute(
    'UPDATE ms_leads SET tags = ?, updated_at = NOW() WHERE id = ?',
    [tags, id]
  )
  res.json({ ok: true, tags })
}

// ── POST /dashboard/leads/:id/notes ──────────────────────────────────────────
exports.updateNotes = async (req, res) => {
  const user  = req.session.user
  const id    = parseInt(req.params.id) || 0
  const notes = (req.body.notes || '').slice(0, 5000)

  const lead = await db.first(
    `SELECT l.id FROM ms_leads l
     JOIN ms_sites s ON s.id = l.site_id
     WHERE l.id = ? AND s.account_id = ?`,
    [id, user.id]
  )
  if (!lead) return res.status(403).json({ ok: false })

  await db.execute(
    'UPDATE ms_leads SET notes = ?, updated_at = NOW() WHERE id = ?',
    [notes, id]
  )
  res.json({ ok: true })
}

// ── DELETE /dashboard/leads/:id ───────────────────────────────────────────────
exports.destroy = async (req, res) => {
  const user = req.session.user
  const id   = parseInt(req.params.id) || 0

  await db.execute(
    `DELETE l FROM ms_leads l
     JOIN ms_sites s ON s.id = l.site_id
     WHERE l.id = ? AND s.account_id = ?`,
    [id, user.id]
  )
  res.json({ ok: true })
}

// ── POST /dashboard/leads/import ──────────────────────────────────────────────
exports.importLeads = async (req, res) => {
  const user   = req.session.user
  const source = req.body.source // 'form' | 'booking' | 'chat'

  const sites = await db.query('SELECT id FROM ms_sites WHERE account_id = ?', [user.id])
  const siteIds = sites.map(s => s.id)
  if (!siteIds.length) return res.json({ ok: true, imported: 0 })

  let imported = 0

  if (source === 'form') {
    const forms = await db.query(
      `SELECT * FROM ms_forms WHERE account_id = ? AND site_id IS NOT NULL`,
      [user.id]
    )
    for (const form of forms) {
      const fields     = JSON.parse(form.fields || '[]')
      const nameField  = fields.find(f => /name/i.test(f.label))
      const emailField = fields.find(f => /email/i.test(f.label))
      const phoneField = fields.find(f => /phone|mobile/i.test(f.label))

      const entries = await db.query(
        'SELECT id, data FROM ms_form_entries WHERE form_id = ?', [form.id]
      )
      for (const entry of entries) {
        const data  = JSON.parse(entry.data || '{}')
        const name  = nameField  ? data[nameField.id]  || null : null
        const email = emailField ? data[emailField.id] || null : null
        const phone = phoneField ? data[phoneField.id] || null : null
        // Check if already exists
        const exists = await db.first(
          'SELECT id FROM ms_leads WHERE source = ? AND source_id = ?',
          ['form', entry.id]
        )
        if (!exists) {
          await db.execute(
            `INSERT INTO ms_leads (site_id, name, email, phone, source, source_id) VALUES (?,?,?,?,?,?)`,
            [form.site_id, name, email, phone, 'form', entry.id]
          )
          imported++
        }
      }
    }

  } else if (source === 'booking') {
    const ph = siteIds.map(() => '?').join(',')
    const bookings = await db.query(
      `SELECT id, site_id, booker_name, booker_email, booker_phone FROM ms_bookings WHERE site_id IN (${ph})`,
      siteIds
    )
    for (const b of bookings) {
      const exists = await db.first(
        'SELECT id FROM ms_leads WHERE source = ? AND source_id = ?',
        ['booking', b.id]
      )
      if (!exists) {
        await db.execute(
          `INSERT INTO ms_leads (site_id, name, email, phone, source, source_id) VALUES (?,?,?,?,?,?)`,
          [b.site_id, b.booker_name || null, b.booker_email || null, b.booker_phone || null, 'booking', b.id]
        )
        imported++
      }
    }

  } else if (source === 'chat') {
    const ph = siteIds.map(() => '?').join(',')
    const sessions = await db.query(
      `SELECT id, site_id, visitor_name, visitor_email, visitor_phone FROM ms_chat_sessions WHERE site_id IN (${ph})`,
      siteIds
    )
    for (const s of sessions) {
      const exists = await db.first(
        'SELECT id FROM ms_leads WHERE source = ? AND source_id = ?',
        ['chat', s.id]
      )
      if (!exists) {
        await db.execute(
          `INSERT INTO ms_leads (site_id, name, email, phone, source, source_id) VALUES (?,?,?,?,?,?)`,
          [s.site_id, s.visitor_name || null, s.visitor_email || null, s.visitor_phone || null, 'chat', s.id]
        )
        imported++
      }
    }

  } else {
    return res.json({ ok: false, error: 'Invalid source' })
  }

  res.json({ ok: true, imported })
}

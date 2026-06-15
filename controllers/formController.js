const { db } = require('../config/db')

// ── Helpers ───────────────────────────────────────────────────────────────────
async function getFormForUser(formId, userId) {
  return db.first(
    'SELECT * FROM ms_forms WHERE id = ? AND account_id = ?',
    [formId, userId]
  )
}

// ── List forms for a site (legacy — kept for per-site views) ─────────────────
exports.index = async (req, res) => {
  return res.redirect('/dashboard/forms')
}

// ── New form (account-level) ──────────────────────────────────────────────────
exports.newForm = async (req, res) => {
  const user = req.session.user
  res.render('dashboard/form-builder.njk', {
    title: 'New Form',
    user,
    form:     null,
    fields:   '[]',
    settings: '{}'
  })
}

// ── Create form ───────────────────────────────────────────────────────────────
exports.create = async (req, res) => {
  const user = req.session.user
  const { name, fields, settings } = req.body

  let fieldsJson, settingsJson
  try { fieldsJson   = JSON.parse(fields   || '[]') } catch { fieldsJson   = [] }
  try { settingsJson = JSON.parse(settings || '{}') } catch { settingsJson = {} }

  const formId = await db.lastId(
    'INSERT INTO ms_forms (account_id, site_id, name, fields, settings) VALUES (?,NULL,?,?,?)',
    [user.id, name || 'Untitled Form', JSON.stringify(fieldsJson), JSON.stringify(settingsJson)]
  )

  return res.json({ ok: true, id: formId })
}

// ── Edit form ─────────────────────────────────────────────────────────────────
exports.editForm = async (req, res) => {
  const user   = req.session.user
  const formId = parseInt(req.params.formId) || 0

  const form = await getFormForUser(formId, user.id)
  if (!form) return res.redirect('/dashboard/forms')

  res.render('dashboard/form-builder.njk', {
    title:    `Edit — ${form.name}`,
    user, form,
    fields:   form.fields   || '[]',
    settings: form.settings || '{}'
  })
}

// ── Update form ───────────────────────────────────────────────────────────────
exports.update = async (req, res) => {
  const user   = req.session.user
  const formId = parseInt(req.params.formId) || 0

  const form = await getFormForUser(formId, user.id)
  if (!form) return res.status(403).json({ ok: false })

  const { name, fields, settings } = req.body

  let fieldsJson, settingsJson
  try { fieldsJson   = JSON.parse(fields   || '[]') } catch { fieldsJson   = [] }
  try { settingsJson = JSON.parse(settings || '{}') } catch { settingsJson = {} }

  await db.execute(
    'UPDATE ms_forms SET name = ?, fields = ?, settings = ? WHERE id = ?',
    [name || form.name, JSON.stringify(fieldsJson), JSON.stringify(settingsJson), formId]
  )

  return res.json({ ok: true })
}

// ── Delete form ───────────────────────────────────────────────────────────────
exports.destroy = async (req, res) => {
  const user   = req.session.user
  const formId = parseInt(req.params.formId) || 0

  const form = await getFormForUser(formId, user.id)
  if (!form) return res.redirect('/dashboard/forms')

  await db.execute('DELETE FROM ms_forms WHERE id = ?', [formId])
  res.redirect('/dashboard/forms')
}

// ── Entries list ──────────────────────────────────────────────────────────────
exports.entries = async (req, res) => {
  const user   = req.session.user
  const formId = parseInt(req.params.formId) || 0

  const form = await getFormForUser(formId, user.id)
  if (!form) return res.redirect('/dashboard/forms')

  const entries = await db.query(
    'SELECT * FROM ms_form_entries WHERE form_id = ? ORDER BY created_at DESC',
    [formId]
  )

  const fields = JSON.parse(form.fields || '[]')
  const parsedEntries = entries.map(e => ({
    ...e,
    data: (() => { try { return JSON.parse(e.data) } catch { return {} } })()
  }))

  res.render('dashboard/form-entries.njk', {
    title: `Entries — ${form.name}`,
    user, form, fields,
    entries: parsedEntries
  })
}

// ── Delete single entry ───────────────────────────────────────────────────────
exports.deleteEntry = async (req, res) => {
  const user    = req.session.user
  const entryId = parseInt(req.params.entryId) || 0
  const formId  = parseInt(req.params.formId)  || 0

  const form = await getFormForUser(formId, user.id)
  if (!form) return res.status(403).json({ ok: false })

  await db.execute(
    'DELETE FROM ms_form_entries WHERE id = ? AND form_id = ?',
    [entryId, formId]
  )

  return res.json({ ok: true })
}

// ── Export entries as CSV ─────────────────────────────────────────────────────
exports.exportCsv = async (req, res) => {
  const user   = req.session.user
  const formId = parseInt(req.params.formId) || 0

  const form = await getFormForUser(formId, user.id)
  if (!form) return res.status(403).send('Forbidden')

  const entries = await db.query(
    'SELECT * FROM ms_form_entries WHERE form_id = ? ORDER BY created_at DESC',
    [formId]
  )

  const fields = JSON.parse(form.fields || '[]')
  const cols   = ['#', 'Date', 'IP', ...fields.map(f => f.label)]
  const escape = v => `"${String(v ?? '').replace(/"/g, '""')}"`

  const rows = entries.map((e, i) => {
    const data = (() => { try { return JSON.parse(e.data) } catch { return {} } })()
    return [
      i + 1,
      new Date(e.created_at).toLocaleString(),
      e.ip || '',
      ...fields.map(f => data[f.id] ?? '')
    ].map(escape).join(',')
  })

  const csv = [cols.map(escape).join(','), ...rows].join('\n')
  res.setHeader('Content-Type', 'text/csv')
  res.setHeader('Content-Disposition', `attachment; filename="form-${formId}-entries.csv"`)
  res.send(csv)
}

// ── PUBLIC: Submit a form (no auth) ──────────────────────────────────────────
exports.submit = async (req, res) => {
  const formId = parseInt(req.params.formId) || 0

  const form = await db.first('SELECT * FROM ms_forms WHERE id = ?', [formId])
  if (!form) return res.status(404).json({ ok: false, error: 'Form not found' })

  const fields  = JSON.parse(form.fields   || '[]')
  const setting = JSON.parse(form.settings || '{}')
  const body    = req.body || {}

  // Validate required fields
  for (const f of fields) {
    if (f.required && !body[f.id]) {
      return res.status(400).json({ ok: false, error: `"${f.label}" is required` })
    }
  }

  // Only save allowed field IDs
  const data = {}
  fields.forEach(f => { if (body[f.id] !== undefined) data[f.id] = String(body[f.id]).slice(0, 4000) })

  const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket.remoteAddress || null

  await db.execute(
    'INSERT INTO ms_form_entries (form_id, data, ip) VALUES (?,?,?)',
    [formId, JSON.stringify(data), ip]
  )

  return res.json({ ok: true, message: setting.success_message || 'Thank you for your submission!' })
}

// ── All forms — account-level (HubSpot-style) ────────────────────────────────
exports.allForms = async (req, res) => {
  const user = req.session.user

  const forms = await db.query(
    `SELECT f.*,
       (SELECT COUNT(*) FROM ms_form_entries e WHERE e.form_id = f.id) AS entry_count
     FROM ms_forms f
     WHERE f.account_id = ?
     ORDER BY f.created_at DESC`,
    [user.id]
  )

  res.render('dashboard/forms-all.njk', {
    title: 'Forms',
    user,
    forms
  })
}

// ── API: list all account forms (used by builder form_select dropdown) ────────
exports.apiList = async (req, res) => {
  const user  = req.session.user
  const forms = await db.query(
    'SELECT id, name FROM ms_forms WHERE account_id = ? ORDER BY name ASC',
    [user.id]
  )
  return res.json(forms)
}

// ── Used by themeManager/subdomain to load forms for rendering ────────────────
exports.loadFormsForAccount = async (accountId) => {
  const forms = await db.query('SELECT * FROM ms_forms WHERE account_id = ?', [accountId])
  const result = {}
  forms.forEach(f => {
    result[f.id] = {
      id:       f.id,
      name:     f.name,
      fields:   JSON.parse(f.fields   || '[]'),
      settings: JSON.parse(f.settings || '{}')
    }
  })
  return result
}

// ── Legacy alias (kept so old imports don't crash) ────────────────────────────
exports.loadFormsForSite = exports.loadFormsForAccount

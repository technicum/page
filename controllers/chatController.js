const crypto = require('crypto')
const { db } = require('../config/db')
const { captureLead } = require('./leadsController')

// ── Helpers ───────────────────────────────────────────────────────────────────
function makeToken() {
  return crypto.randomBytes(32).toString('hex')
}

// ── PUBLIC: Get chat settings for widget ─────────────────────────────────────
exports.widgetSettings = async (req, res) => {
  const siteId = parseInt(req.params.siteId) || 0
  const cfg = await db.first(
    'SELECT * FROM ms_chat_settings WHERE site_id = ?', [siteId]
  )
  if (!cfg || !cfg.enabled) return res.json({ enabled: false })
  res.json({
    enabled:         true,
    require_name:    !!cfg.require_name,
    require_email:   !!cfg.require_email,
    require_phone:   !!cfg.require_phone,
    welcome_message: cfg.welcome_message,
    offline_message: cfg.offline_message
  })
}

// ── PUBLIC: Start a chat session ──────────────────────────────────────────────
exports.startSession = async (req, res) => {
  const siteId = parseInt(req.body.site_id) || 0
  const { visitor_name, visitor_email, visitor_phone } = req.body

  const site = await db.first('SELECT id, account_id FROM ms_sites WHERE id = ?', [siteId])
  if (!site) return res.status(404).json({ ok: false, error: 'Site not found' })

  const cfg = await db.first('SELECT * FROM ms_chat_settings WHERE site_id = ?', [siteId])
  if (!cfg || !cfg.enabled) return res.status(403).json({ ok: false, error: 'Chat not enabled' })

  const token     = makeToken()
  const sessionId = await db.lastId(
    `INSERT INTO ms_chat_sessions (site_id, account_id, visitor_name, visitor_email, visitor_phone, token)
     VALUES (?,?,?,?,?,?)`,
    [siteId, site.account_id, visitor_name || null, visitor_email || null, visitor_phone || null, token]
  )

  // Send welcome message from vendor
  const welcome = cfg.welcome_message || 'Hi! How can we help you today?'
  await db.execute(
    'INSERT INTO ms_chat_messages (session_id, sender, message) VALUES (?,?,?)',
    [sessionId, 'vendor', welcome]
  )

  // Auto-capture lead from chat session
  captureLead({
    siteId:   siteId,
    name:     visitor_name  || null,
    email:    visitor_email || null,
    phone:    visitor_phone || null,
    source:   'chat',
    sourceId: sessionId
  })

  res.json({ ok: true, session_id: sessionId, token })
}

// ── PUBLIC: Visitor sends a message ──────────────────────────────────────────
exports.visitorSend = async (req, res) => {
  const { session_id, token, message } = req.body
  if (!message || !message.trim()) return res.status(400).json({ ok: false, error: 'Empty message' })

  const session = await db.first(
    'SELECT * FROM ms_chat_sessions WHERE id = ? AND token = ?',
    [parseInt(session_id) || 0, token]
  )
  if (!session) return res.status(403).json({ ok: false, error: 'Invalid session' })
  if (session.status === 'closed') return res.status(400).json({ ok: false, error: 'Chat is closed' })

  await db.execute(
    'INSERT INTO ms_chat_messages (session_id, sender, message) VALUES (?,?,?)',
    [session.id, 'visitor', message.trim().slice(0, 2000)]
  )
  await db.execute(
    'UPDATE ms_chat_sessions SET last_message_at = NOW(), vendor_read = 0 WHERE id = ?',
    [session.id]
  )

  res.json({ ok: true })
}

// ── PUBLIC: Visitor polls for new messages ────────────────────────────────────
exports.visitorPoll = async (req, res) => {
  const sessionId = parseInt(req.query.session_id) || 0
  const token     = req.query.token || ''
  const after     = parseInt(req.query.after) || 0

  const session = await db.first(
    'SELECT id, status FROM ms_chat_sessions WHERE id = ? AND token = ?',
    [sessionId, token]
  )
  if (!session) return res.status(403).json({ ok: false })

  const messages = await db.query(
    'SELECT id, sender, message, created_at FROM ms_chat_messages WHERE session_id = ? AND id > ? ORDER BY id ASC',
    [session.id, after]
  )

  res.json({ ok: true, messages, status: session.status })
}

// ── DASHBOARD: Chat inbox ─────────────────────────────────────────────────────
exports.inbox = async (req, res) => {
  const user   = req.session.user
  const filter = req.query.status || 'open'

  const sites = await db.query(
    'SELECT id, title, subdomain FROM ms_sites WHERE account_id = ?', [user.id]
  )

  const sessions = await db.query(
    `SELECT s.*,
       (SELECT COUNT(*) FROM ms_chat_messages m WHERE m.session_id = s.id AND m.sender = 'visitor' AND m.is_read = 0) AS unread_count,
       (SELECT message FROM ms_chat_messages m WHERE m.session_id = s.id ORDER BY m.id DESC LIMIT 1) AS last_message,
       si.title AS site_title, si.subdomain
     FROM ms_chat_sessions s
     JOIN ms_sites si ON si.id = s.site_id
     WHERE s.account_id = ? AND s.status = ?
     ORDER BY s.last_message_at DESC, s.created_at DESC`,
    [user.id, filter]
  )

  const unreadTotal = sessions.reduce((sum, s) => sum + (s.unread_count || 0), 0)

  res.render('dashboard/chat-inbox.njk', {
    title: 'Chat Inbox',
    user, sites, sessions, filter, unreadTotal
  })
}

// ── DASHBOARD: Poll inbox for new/updated sessions ────────────────────────────
exports.inboxPoll = async (req, res) => {
  const user  = req.session.user
  const after = parseInt(req.query.after) || 0

  const rows = await db.query(
    `SELECT s.id, s.visitor_name, s.status, s.last_message_at, s.vendor_read,
       (SELECT COUNT(*) FROM ms_chat_messages m WHERE m.session_id = s.id AND m.sender = 'visitor' AND m.is_read = 0) AS unread_count
     FROM ms_chat_sessions s
     WHERE s.account_id = ? AND (s.id > ? OR (s.vendor_read = 0 AND s.last_message_at > DATE_SUB(NOW(), INTERVAL 5 MINUTE)))
     ORDER BY s.last_message_at DESC`,
    [user.id, after]
  )

  const totalUnread = await db.first(
    `SELECT COUNT(*) as c FROM ms_chat_sessions WHERE account_id = ? AND vendor_read = 0 AND status = 'open'`,
    [user.id]
  )

  res.json({ ok: true, sessions: rows, total_unread: totalUnread ? totalUnread.c : 0 })
}

// ── DASHBOARD: Conversation view ──────────────────────────────────────────────
exports.conversation = async (req, res) => {
  const user      = req.session.user
  const sessionId = parseInt(req.params.sessionId) || 0

  const session = await db.first(
    `SELECT s.*, si.title AS site_title, si.subdomain
     FROM ms_chat_sessions s
     JOIN ms_sites si ON si.id = s.site_id
     WHERE s.id = ? AND s.account_id = ?`,
    [sessionId, user.id]
  )
  if (!session) return res.redirect('/dashboard/chat')

  // Mark all visitor messages as read
  await db.execute(
    `UPDATE ms_chat_messages SET is_read = 1 WHERE session_id = ? AND sender = 'visitor'`,
    [sessionId]
  )
  await db.execute(
    'UPDATE ms_chat_sessions SET vendor_read = 1 WHERE id = ?',
    [sessionId]
  )

  const messages = await db.query(
    'SELECT * FROM ms_chat_messages WHERE session_id = ? ORDER BY id ASC',
    [sessionId]
  )

  res.render('dashboard/chat-conversation.njk', {
    title: `Chat — ${session.visitor_name || 'Visitor'}`,
    user, session, messages
  })
}

// ── DASHBOARD: Poll for new messages in conversation ──────────────────────────
exports.conversationPoll = async (req, res) => {
  const user      = req.session.user
  const sessionId = parseInt(req.params.sessionId) || 0
  const after     = parseInt(req.query.after) || 0

  const session = await db.first(
    'SELECT id, status FROM ms_chat_sessions WHERE id = ? AND account_id = ?',
    [sessionId, user.id]
  )
  if (!session) return res.status(403).json({ ok: false })

  const messages = await db.query(
    'SELECT * FROM ms_chat_messages WHERE session_id = ? AND id > ? ORDER BY id ASC',
    [sessionId, after]
  )

  // Mark new visitor messages as read
  if (messages.some(m => m.sender === 'visitor')) {
    await db.execute(
      `UPDATE ms_chat_messages SET is_read = 1 WHERE session_id = ? AND sender = 'visitor' AND id > ?`,
      [sessionId, after]
    )
    await db.execute('UPDATE ms_chat_sessions SET vendor_read = 1 WHERE id = ?', [sessionId])
  }

  res.json({ ok: true, messages, status: session.status })
}

// ── DASHBOARD: Vendor sends a message ────────────────────────────────────────
exports.vendorSend = async (req, res) => {
  const user      = req.session.user
  const sessionId = parseInt(req.params.sessionId) || 0
  const { message } = req.body

  if (!message || !message.trim()) return res.status(400).json({ ok: false, error: 'Empty message' })

  const session = await db.first(
    'SELECT id, status FROM ms_chat_sessions WHERE id = ? AND account_id = ?',
    [sessionId, user.id]
  )
  if (!session) return res.status(403).json({ ok: false })
  if (session.status === 'closed') return res.status(400).json({ ok: false, error: 'Chat is closed' })

  const msgId = await db.lastId(
    'INSERT INTO ms_chat_messages (session_id, sender, message) VALUES (?,?,?)',
    [sessionId, 'vendor', message.trim().slice(0, 2000)]
  )
  await db.execute(
    'UPDATE ms_chat_sessions SET last_message_at = NOW() WHERE id = ?',
    [sessionId]
  )

  res.json({ ok: true, id: msgId })
}

// ── DASHBOARD: Close / reopen chat ────────────────────────────────────────────
exports.setStatus = async (req, res) => {
  const user      = req.session.user
  const sessionId = parseInt(req.params.sessionId) || 0
  const status    = req.body.status === 'open' ? 'open' : 'closed'

  await db.execute(
    'UPDATE ms_chat_sessions SET status = ? WHERE id = ? AND account_id = ?',
    [status, sessionId, user.id]
  )
  res.json({ ok: true, status })
}

// ── DASHBOARD: Chat settings ──────────────────────────────────────────────────
exports.settings = async (req, res) => {
  const user  = req.session.user
  const sites = await db.query(
    'SELECT id, title, subdomain FROM ms_sites WHERE account_id = ?', [user.id]
  )

  const cfgRows = await db.query(
    'SELECT * FROM ms_chat_settings WHERE account_id = ?', [user.id]
  )
  const cfgMap = {}
  cfgRows.forEach(r => { cfgMap[r.site_id] = r })

  res.render('dashboard/chat-settings.njk', {
    title: 'Chat Settings',
    user, sites, cfgMap
  })
}

exports.saveSettings = async (req, res) => {
  const user   = req.session.user
  const siteId = parseInt(req.body.site_id) || 0

  const site = await db.first('SELECT id FROM ms_sites WHERE id = ? AND account_id = ?', [siteId, user.id])
  if (!site) return res.redirect('/dashboard/chat/settings')

  const enabled       = req.body.enabled       === '1' ? 1 : 0
  const require_name  = req.body.require_name  === '1' ? 1 : 0
  const require_email = req.body.require_email === '1' ? 1 : 0
  const require_phone = req.body.require_phone === '1' ? 1 : 0
  const welcome       = (req.body.welcome_message || '').slice(0, 500)
  const offline       = (req.body.offline_message || '').slice(0, 500)

  await db.execute(
    `INSERT INTO ms_chat_settings (site_id, account_id, enabled, require_name, require_email, require_phone, welcome_message, offline_message)
     VALUES (?,?,?,?,?,?,?,?)
     ON DUPLICATE KEY UPDATE
       enabled=VALUES(enabled), require_name=VALUES(require_name), require_email=VALUES(require_email),
       require_phone=VALUES(require_phone), welcome_message=VALUES(welcome_message), offline_message=VALUES(offline_message)`,
    [siteId, user.id, enabled, require_name, require_email, require_phone, welcome, offline]
  )

  res.redirect('/dashboard/chat/settings?saved=1')
}

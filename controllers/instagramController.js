const { db }        = require('../config/db')
const axios         = require('axios')
const crypto        = require('crypto')
const { captureLead } = require('./leadsController')

// ── Config ────────────────────────────────────────────────────────────────────
// One Meta Developer App is shared across every PageZaper mini site (multi-tenant):
// each site owner connects their own Instagram Business account to it via OAuth.
// See /migrations/instagram.sql for the schema and the setup notes at the bottom
// of this file for what has to be done in the Meta Developer console before any
// of this can go live.
const GRAPH_VERSION   = process.env.META_GRAPH_VERSION || 'v23.0'
const GRAPH_BASE      = `https://graph.facebook.com/${GRAPH_VERSION}`
const APP_ID          = process.env.META_APP_ID || ''
const APP_SECRET      = process.env.META_APP_SECRET || ''
const VERIFY_TOKEN    = process.env.META_WEBHOOK_VERIFY_TOKEN || ''
const REDIRECT_URI    = `${process.env.APP_URL || 'https://pagezaper.com'}/dashboard/instagram/callback`

// Scopes for the classic "Facebook Login for Business" flow (requires the IG
// professional account to be linked to a Facebook Page). Meta also offers a
// page-less "Instagram API with Instagram Login" flow with different scope
// names (instagram_business_basic, instagram_business_manage_messages,
// instagram_business_manage_comments) via instagram.com/oauth/authorize --
// switch to that here if that's the product type set up in your Meta app.
const OAUTH_SCOPES = [
  'instagram_basic',
  'instagram_manage_comments',
  'instagram_manage_messages',
  'pages_show_list',
  'pages_read_engagement'
].join(',')

function metaConfigured() {
  return !!(APP_ID && APP_SECRET && VERIFY_TOKEN)
}

// ── Dashboard page ────────────────────────────────────────────────────────────
exports.index = async (req, res) => {
  const user = req.session.user

  const sites = await db.query(
    'SELECT id, title, subdomain FROM ms_sites WHERE account_id = ? AND parent_site_id IS NULL ORDER BY id ASC',
    [user.id]
  )

  const accounts = await db.query(
    `SELECT ia.*, s.title AS site_title
     FROM ms_instagram_accounts ia
     JOIN ms_sites s ON s.id = ia.site_id
     WHERE ia.account_id = ? AND ia.status != 'revoked'
     ORDER BY ia.connected_at DESC`,
    [user.id]
  )

  let rules = []
  let events = []
  if (accounts.length) {
    const igIds = accounts.map(a => a.id)
    const ph = igIds.map(() => '?').join(',')
    rules = await db.query(
      `SELECT * FROM ms_instagram_rules WHERE ig_account_id IN (${ph}) ORDER BY sort_order ASC, id ASC`,
      igIds
    )
    events = await db.query(
      `SELECT e.*, s.title AS site_title, r.name AS rule_name
       FROM ms_instagram_events e
       JOIN ms_sites s ON s.id = e.site_id
       LEFT JOIN ms_instagram_rules r ON r.id = e.rule_id
       WHERE e.ig_account_id IN (${ph})
       ORDER BY e.created_at DESC
       LIMIT 20`,
      igIds
    )
  }

  // Group rules under their account for easy template rendering
  const rulesByAccount = {}
  rules.forEach(r => {
    if (!rulesByAccount[r.ig_account_id]) rulesByAccount[r.ig_account_id] = []
    rulesByAccount[r.ig_account_id].push(r)
  })

  res.render('dashboard/instagram.njk', {
    title: 'Instagram Auto-DM',
    user,
    activePage: 'instagram',
    sites,
    accounts,
    rulesByAccount,
    events,
    metaConfigured: metaConfigured(),
    flash_success: req.flash('success'),
    flash_errors:  req.flash('errors')
  })
}

// ── OAuth: start connect ──────────────────────────────────────────────────────
exports.connectStart = async (req, res) => {
  if (!metaConfigured()) {
    req.flash('errors', 'Instagram isn\'t configured on this server yet (missing META_APP_ID/META_APP_SECRET/META_WEBHOOK_VERIFY_TOKEN). Contact support.')
    return res.redirect('/dashboard/instagram')
  }

  const user   = req.session.user
  const siteId = parseInt(req.query.site_id) || 0
  const site   = await db.first('SELECT id FROM ms_sites WHERE id = ? AND account_id = ?', [siteId, user.id])
  if (!site) {
    req.flash('errors', 'Choose a mini site to connect Instagram to.')
    return res.redirect('/dashboard/instagram')
  }

  // CSRF nonce + the target site travel through Meta's redirect in `state`
  const nonce = crypto.randomBytes(16).toString('hex')
  req.session.igOauthNonce = nonce
  const state = `${nonce}:${siteId}`

  const authUrl = `https://www.facebook.com/${GRAPH_VERSION}/dialog/oauth`
    + `?client_id=${encodeURIComponent(APP_ID)}`
    + `&redirect_uri=${encodeURIComponent(REDIRECT_URI)}`
    + `&state=${encodeURIComponent(state)}`
    + `&scope=${encodeURIComponent(OAUTH_SCOPES)}`

  res.redirect(authUrl)
}

// ── OAuth: callback ───────────────────────────────────────────────────────────
exports.connectCallback = async (req, res) => {
  const user = req.session.user

  try {
    if (req.query.error) {
      req.flash('errors', 'Instagram connection was cancelled or denied.')
      return res.redirect('/dashboard/instagram')
    }

    const { code, state } = req.query
    const [nonce, siteIdStr] = (state || '').split(':')
    const siteId = parseInt(siteIdStr) || 0

    if (!code || !nonce || nonce !== req.session.igOauthNonce || !siteId) {
      req.flash('errors', 'Instagram connection failed a security check — please try connecting again.')
      return res.redirect('/dashboard/instagram')
    }
    delete req.session.igOauthNonce

    const site = await db.first('SELECT id FROM ms_sites WHERE id = ? AND account_id = ?', [siteId, user.id])
    if (!site) {
      req.flash('errors', 'That mini site could not be found.')
      return res.redirect('/dashboard/instagram')
    }

    // 1) Exchange the auth code for a short-lived user token
    const tokenRes = await axios.get(`${GRAPH_BASE}/oauth/access_token`, {
      params: { client_id: APP_ID, redirect_uri: REDIRECT_URI, client_secret: APP_SECRET, code }
    })
    const shortLivedToken = tokenRes.data.access_token

    // 2) Exchange for a long-lived user token (~60 days)
    const longRes = await axios.get(`${GRAPH_BASE}/oauth/access_token`, {
      params: {
        grant_type:        'fb_exchange_token',
        client_id:         APP_ID,
        client_secret:      APP_SECRET,
        fb_exchange_token:  shortLivedToken
      }
    })
    const longLivedUserToken = longRes.data.access_token

    // 3) List the Facebook Pages this user manages
    const pagesRes = await axios.get(`${GRAPH_BASE}/me/accounts`, {
      params: { access_token: longLivedUserToken, fields: 'id,name,access_token' }
    })
    const pages = pagesRes.data.data || []

    let connected = 0
    for (const page of pages) {
      // 4) Does this Page have an Instagram Professional account linked?
      const pageDetail = await axios.get(`${GRAPH_BASE}/${page.id}`, {
        params: { fields: 'instagram_business_account', access_token: page.access_token }
      }).catch(() => null)

      const igAccount = pageDetail && pageDetail.data && pageDetail.data.instagram_business_account
      if (!igAccount || !igAccount.id) continue

      // 5) Fetch the IG username for display
      const igDetail = await axios.get(`${GRAPH_BASE}/${igAccount.id}`, {
        params: { fields: 'username', access_token: page.access_token }
      }).catch(() => null)
      const igUsername = igDetail && igDetail.data ? igDetail.data.username : ''

      await db.execute(
        `INSERT INTO ms_instagram_accounts (account_id, site_id, ig_user_id, ig_username, fb_page_id, access_token, status)
         VALUES (?, ?, ?, ?, ?, ?, 'active')
         ON DUPLICATE KEY UPDATE
           account_id = VALUES(account_id), site_id = VALUES(site_id),
           ig_username = VALUES(ig_username), fb_page_id = VALUES(fb_page_id),
           access_token = VALUES(access_token), status = 'active', last_error = ''`,
        [user.id, siteId, igAccount.id, igUsername || '', page.id, page.access_token]
      )
      connected++

      // 6) Subscribe this Page to comment webhooks so Meta actually calls us
      await axios.post(`${GRAPH_BASE}/${page.id}/subscribed_apps`, null, {
        params: { subscribed_fields: 'comments', access_token: page.access_token }
      }).catch(err => {
        console.error('instagram subscribe_apps failed', err.response ? err.response.data : err.message)
      })
    }

    if (!connected) {
      req.flash('errors', 'No Instagram Professional account was found on your Facebook Pages. Make sure your Instagram account is a Business/Creator account linked to a Facebook Page, then try again.')
      return res.redirect('/dashboard/instagram')
    }

    req.flash('success', connected === 1 ? 'Instagram account connected.' : `${connected} Instagram accounts connected.`)
    res.redirect('/dashboard/instagram')
  } catch (err) {
    console.error('instagram connectCallback', err.response ? err.response.data : err.message)
    req.flash('errors', 'Something went wrong connecting Instagram. Please try again.')
    res.redirect('/dashboard/instagram')
  }
}

// ── Disconnect ────────────────────────────────────────────────────────────────
exports.disconnect = async (req, res) => {
  const user = req.session.user
  const id   = parseInt(req.params.id) || 0

  const account = await db.first('SELECT * FROM ms_instagram_accounts WHERE id = ? AND account_id = ?', [id, user.id])
  if (!account) return res.redirect('/dashboard/instagram')

  // Best-effort: unsubscribe the Page from webhooks before dropping the connection
  if (account.fb_page_id) {
    await axios.delete(`${GRAPH_BASE}/${account.fb_page_id}/subscribed_apps`, {
      params: { access_token: account.access_token }
    }).catch(() => {})
  }

  await db.execute('UPDATE ms_instagram_accounts SET status = "revoked" WHERE id = ?', [id])
  req.flash('success', 'Instagram account disconnected.')
  res.redirect('/dashboard/instagram')
}

// ── Rules: create / update / delete ──────────────────────────────────────────
exports.createRule = async (req, res) => {
  const user = req.session.user
  const igAccountId = parseInt(req.body.ig_account_id) || 0

  const account = await db.first('SELECT * FROM ms_instagram_accounts WHERE id = ? AND account_id = ?', [igAccountId, user.id])
  if (!account) return res.redirect('/dashboard/instagram')

  const name       = (req.body.name || 'Rule').slice(0, 255)
  const keywords   = (req.body.keywords || '').slice(0, 500)
  const matchType  = req.body.match_type === 'all' ? 'all' : 'any'
  const publicReply = (req.body.public_reply || '').slice(0, 300)
  const dmMessage  = (req.body.dm_message || '').slice(0, 1000)

  if (!keywords.trim() || !dmMessage.trim()) {
    req.flash('errors', 'A rule needs at least one keyword and a DM message.')
    return res.redirect('/dashboard/instagram')
  }

  await db.execute(
    `INSERT INTO ms_instagram_rules (ig_account_id, site_id, name, keywords, match_type, public_reply, dm_message)
     VALUES (?,?,?,?,?,?,?)`,
    [igAccountId, account.site_id, name, keywords, matchType, publicReply, dmMessage]
  )
  req.flash('success', 'Rule added.')
  res.redirect('/dashboard/instagram')
}

exports.updateRule = async (req, res) => {
  const user = req.session.user
  const id   = parseInt(req.params.id) || 0

  const rule = await db.first(
    `SELECT r.* FROM ms_instagram_rules r
     JOIN ms_instagram_accounts a ON a.id = r.ig_account_id
     WHERE r.id = ? AND a.account_id = ?`,
    [id, user.id]
  )
  if (!rule) return res.redirect('/dashboard/instagram')

  if (req.body.toggle === '1') {
    await db.execute('UPDATE ms_instagram_rules SET is_active = NOT is_active WHERE id = ?', [id])
    return res.redirect('/dashboard/instagram')
  }

  const name        = (req.body.name || rule.name).slice(0, 255)
  const keywords     = (req.body.keywords || rule.keywords).slice(0, 500)
  const matchType    = req.body.match_type === 'all' ? 'all' : 'any'
  const publicReply  = (req.body.public_reply !== undefined ? req.body.public_reply : rule.public_reply).slice(0, 300)
  const dmMessage    = (req.body.dm_message || rule.dm_message).slice(0, 1000)

  await db.execute(
    `UPDATE ms_instagram_rules SET name=?, keywords=?, match_type=?, public_reply=?, dm_message=? WHERE id=?`,
    [name, keywords, matchType, publicReply, dmMessage, id]
  )
  req.flash('success', 'Rule updated.')
  res.redirect('/dashboard/instagram')
}

exports.deleteRule = async (req, res) => {
  const user = req.session.user
  const id   = parseInt(req.params.id) || 0

  await db.execute(
    `DELETE r FROM ms_instagram_rules r
     JOIN ms_instagram_accounts a ON a.id = r.ig_account_id
     WHERE r.id = ? AND a.account_id = ?`,
    [id, user.id]
  )
  req.flash('success', 'Rule deleted.')
  res.redirect('/dashboard/instagram')
}

// ── Webhook: Meta's verification handshake ───────────────────────────────────
exports.webhookVerify = (req, res) => {
  const mode      = req.query['hub.mode']
  const token     = req.query['hub.verify_token']
  const challenge = req.query['hub.challenge']

  if (mode === 'subscribe' && token && VERIFY_TOKEN && token === VERIFY_TOKEN) {
    return res.status(200).send(challenge)
  }
  res.sendStatus(403)
}

// ── Webhook: comment events ───────────────────────────────────────────────────
exports.webhookReceive = (req, res) => {
  // Ack fast so Meta doesn't retry the same payload while we're still working —
  // everything below happens after the response is already sent.
  res.sendStatus(200)

  if (!verifySignature(req)) {
    console.warn('instagram webhook: bad signature, ignoring payload')
    return
  }

  processWebhookPayload(req.body).catch(err => {
    console.error('instagram webhook processing failed', err.message)
  })
}

function verifySignature(req) {
  const signature = req.get('x-hub-signature-256')
  if (!signature || !req.rawBody || !APP_SECRET) return false
  const expected = 'sha256=' + crypto.createHmac('sha256', APP_SECRET).update(req.rawBody).digest('hex')
  try {
    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))
  } catch (e) {
    return false
  }
}

async function processWebhookPayload(body) {
  const entries = (body && body.entry) || []
  for (const entry of entries) {
    const igUserId = entry.id
    const account  = await db.first(
      "SELECT * FROM ms_instagram_accounts WHERE ig_user_id = ? AND status = 'active'",
      [igUserId]
    )
    if (!account) continue

    const changes = entry.changes || []
    for (const change of changes) {
      if (change.field !== 'comments') continue
      await handleComment(account, change.value || {})
    }
  }
}

async function handleComment(account, value) {
  const commentId   = value.id
  const mediaId     = value.media && value.media.id ? value.media.id : ''
  const text        = value.text || ''
  const commenterId = value.from && value.from.id ? value.from.id : ''
  const commenterUsername = value.from && value.from.username ? value.from.username : ''

  if (!commentId) return
  // Never reply to the business's own comments (e.g. the owner replying to a customer)
  if (commenterId && commenterId === account.ig_user_id) return

  // Idempotency — Meta retries webhooks; comment_id is unique so a re-delivery no-ops
  const already = await db.first('SELECT id FROM ms_instagram_events WHERE comment_id = ?', [commentId])
  if (already) return

  const baseEvent = {
    ig_account_id: account.id, site_id: account.site_id, comment_id: commentId,
    media_id: mediaId, commenter_ig_id: commenterId, commenter_username: commenterUsername,
    comment_text: text
  }

  // ── Compliance guardrails (Meta, 2026 rules) ──────────────────────────────
  // 200 automated DMs/hour per IG account, and at most 1 DM per commenter per 24h
  // from a comment trigger. Breaching either risks feature restriction or a ban,
  // so both are checked before ever calling the private-reply endpoint.
  const hourly = await db.first(
    `SELECT COUNT(*) AS c FROM ms_instagram_events
     WHERE ig_account_id = ? AND status = 'sent' AND created_at > (NOW() - INTERVAL 1 HOUR)`,
    [account.id]
  )
  if ((hourly && hourly.c) >= 200) {
    return logEvent({ ...baseEvent, status: 'skipped_rate_limit' })
  }

  if (commenterId) {
    const recent = await db.first(
      `SELECT COUNT(*) AS c FROM ms_instagram_events
       WHERE ig_account_id = ? AND commenter_ig_id = ? AND status = 'sent' AND created_at > (NOW() - INTERVAL 24 HOUR)`,
      [account.id, commenterId]
    )
    if ((recent && recent.c) >= 1) {
      return logEvent({ ...baseEvent, status: 'skipped_duplicate' })
    }
  }

  const rules = await db.query(
    'SELECT * FROM ms_instagram_rules WHERE ig_account_id = ? AND is_active = 1 ORDER BY sort_order ASC, id ASC',
    [account.id]
  )
  const rule = matchRule(rules, text)
  if (!rule) {
    return logEvent({ ...baseEvent, status: 'skipped_no_match' })
  }

  try {
    await axios.post(`${GRAPH_BASE}/${commentId}/private_replies`, null, {
      params: { message: rule.dm_message, access_token: account.access_token }
    })

    if (rule.public_reply && rule.public_reply.trim()) {
      await axios.post(`${GRAPH_BASE}/${commentId}/replies`, null, {
        params: { message: rule.public_reply, access_token: account.access_token }
      }).catch(err => console.error('instagram public reply failed', err.response ? err.response.data : err.message))
    }

    await db.execute('UPDATE ms_instagram_rules SET times_triggered = times_triggered + 1 WHERE id = ?', [rule.id])

    await logEvent({ ...baseEvent, rule_id: rule.id, dm_sent: 1, dm_message: rule.dm_message, status: 'sent' })

    await captureLead({
      siteId: account.site_id,
      name:   commenterUsername ? `@${commenterUsername}` : 'Instagram user',
      email:  null,
      phone:  null,
      source: 'instagram',
      sourceId: null,
      notes:  `Commented on Instagram: "${text.slice(0, 200)}"`
    })
  } catch (err) {
    const errMsg = err.response ? JSON.stringify(err.response.data).slice(0, 500) : err.message
    console.error('instagram private_replies failed', errMsg)
    await logEvent({ ...baseEvent, rule_id: rule.id, status: 'error', error: errMsg })

    // A token that stops working (revoked access, expired Page token) shows up here
    // as an auth error from Graph — flag the connection so the dashboard surfaces it
    // instead of silently failing on every future comment.
    if (err.response && [190, 200].includes(err.response.data && err.response.data.error && err.response.data.error.code)) {
      await db.execute("UPDATE ms_instagram_accounts SET status = 'error', last_error = ? WHERE id = ?", [errMsg, account.id])
    }
  }
}

function matchRule(rules, text) {
  const lowerText = (text || '').toLowerCase()
  for (const rule of rules) {
    const keywords = rule.keywords.split(',').map(k => k.trim().toLowerCase()).filter(Boolean)
    if (!keywords.length) continue
    const isMatch = rule.match_type === 'all'
      ? keywords.every(k => lowerText.includes(k))
      : keywords.some(k => lowerText.includes(k))
    if (isMatch) return rule
  }
  return null
}

async function logEvent(e) {
  try {
    await db.execute(
      `INSERT INTO ms_instagram_events
         (ig_account_id, site_id, rule_id, comment_id, media_id, commenter_ig_id, commenter_username, comment_text, dm_sent, dm_message, status, error)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`,
      [
        e.ig_account_id, e.site_id, e.rule_id || null, e.comment_id, e.media_id || '',
        e.commenter_ig_id || '', e.commenter_username || '', e.comment_text || '',
        e.dm_sent ? 1 : 0, e.dm_message || null, e.status, e.error || ''
      ]
    )
  } catch (err) {
    // Duplicate comment_id from a racing webhook retry — safe to ignore
    if (err.code !== 'ER_DUP_ENTRY') console.error('instagram logEvent failed', err.message)
  }
}

/*
  ── SETUP CHECKLIST (do this once, in the Meta Developer console) ──────────────

  1. Create a Meta Developer App at developers.facebook.com (type: Business).
  2. Add the "Instagram Graph API" product (via the linked-Page flow used here —
     if you use "Instagram API with Instagram Login" instead, the OAuth URLs and
     scope names above need to change, see the comment near OAUTH_SCOPES).
  3. In the app's Facebook Login settings, add this OAuth redirect URI:
       https://pagezaper.com/dashboard/instagram/callback
  4. In Webhooks, subscribe the app to the "Instagram" object, field "comments",
     with callback URL:
       https://pagezaper.com/webhooks/instagram
     and a verify token of your choosing (put it in META_WEBHOOK_VERIFY_TOKEN below).
  5. Add to .env:
       META_APP_ID=...
       META_APP_SECRET=...
       META_WEBHOOK_VERIFY_TOKEN=...   (any random string you invent — must match webhook config)
       META_GRAPH_VERSION=v23.0        (bump this every year or two as versions retire)
  6. Submit for App Review requesting instagram_manage_comments and
     instagram_manage_messages (a screen-recording demo of the connect + auto-DM
     flow is required). Business verification is also typically required for
     these permissions. Until this is approved, the connect flow above will only
     work for accounts added as Instagram Testers on the app (Roles > Instagram
     Testers) — good enough to pilot on your own account before going live.
*/

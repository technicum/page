const { db } = require('../config/db')

// ── Slot generation helpers ────────────────────────────────────────────────────
function toMin (t) {
  const [h, m] = String(t).split(':').map(Number)
  return h * 60 + m
}
function toTime (m) {
  return String(Math.floor(m / 60)).padStart(2, '0') + ':' + String(m % 60).padStart(2, '0') + ':00'
}
function toAmPm (m) {
  const h = Math.floor(m / 60), min = m % 60
  const ampm = h >= 12 ? 'PM' : 'AM'
  const hh = h % 12 || 12
  return hh + ':' + String(min).padStart(2, '0') + ' ' + ampm
}

function generateSlots (avail, durationMin, booked, dateStr) {
  const slots = []
  const start = toMin(avail.start_time)
  const end   = toMin(avail.end_time)

  const now     = new Date()
  const isToday = dateStr === now.toISOString().slice(0, 10)
  const nowMin  = now.getHours() * 60 + now.getMinutes() + 60 // 1-hour buffer

  for (let cur = start; cur + durationMin <= end; cur += durationMin) {
    if (isToday && cur <= nowMin) continue
    const slotEnd = cur + durationMin
    const taken = booked.some(b => {
      const bs = toMin(b.start_time), be = toMin(b.end_time)
      return cur < be && slotEnd > bs
    })
    if (!taken) slots.push({ time: toTime(cur), label: toAmPm(cur) })
  }
  return slots
}

// ── getSite — verify ownership ─────────────────────────────────────────────────
async function getSite (siteId, userId) {
  return db.first('SELECT * FROM ms_sites WHERE id = ? AND account_id = ?', [siteId, userId])
}

// ── Default availability (Mon–Fri 9–5) ────────────────────────────────────────
async function seedAvailability (siteId) {
  const rows = [
    [siteId, 0, '09:00:00', '17:00:00', 0], // Sun off
    [siteId, 1, '09:00:00', '17:00:00', 1],
    [siteId, 2, '09:00:00', '17:00:00', 1],
    [siteId, 3, '09:00:00', '17:00:00', 1],
    [siteId, 4, '09:00:00', '17:00:00', 1],
    [siteId, 5, '09:00:00', '17:00:00', 1],
    [siteId, 6, '09:00:00', '17:00:00', 0], // Sat off
  ]
  for (const [sid, dow, st, et, av] of rows) {
    await db.execute(
      `INSERT IGNORE INTO ms_booking_availability (site_id, day_of_week, start_time, end_time, is_available)
       VALUES (?, ?, ?, ?, ?)`,
      [sid, dow, st, et, av]
    )
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// DASHBOARD VIEWS
// ─────────────────────────────────────────────────────────────────────────────

// GET /dashboard/booking/:siteId — overview
exports.dashboard = async (req, res) => {
  try {
        const user = req.session.user
    const site = await getSite(req.params.siteId, user.id)
    if (!site) return res.status(404).send('Site not found')

    const today = new Date().toISOString().slice(0, 10)

    // Compute week bounds in JS to avoid complex SQL date functions
    const now = new Date()
    const dayOfWeek = now.getDay()
    const weekStart = new Date(now); weekStart.setDate(now.getDate() - dayOfWeek)
    const weekEnd   = new Date(now); weekEnd.setDate(now.getDate() + (6 - dayOfWeek))
    const wStart = weekStart.toISOString().slice(0, 10)
    const wEnd   = weekEnd.toISOString().slice(0, 10)

    const upcoming = await db.query(
      `SELECT b.*, e.name AS event_name, e.color
       FROM ms_bookings b
       JOIN ms_booking_events e ON b.event_id = e.id
       WHERE b.site_id = ? AND b.status = 'confirmed' AND b.booking_date >= ?
       ORDER BY b.booking_date, b.start_time LIMIT 20`,
      [site.id, today]
    )
    const totalRow = await db.first(
      `SELECT COUNT(*) AS c FROM ms_bookings WHERE site_id = ? AND status = 'confirmed'`,
      [site.id]
    )
    const todayRow = await db.first(
      `SELECT COUNT(*) AS c FROM ms_bookings WHERE site_id = ? AND status = 'confirmed' AND booking_date = ?`,
      [site.id, today]
    )
    const weekRow = await db.first(
      `SELECT COUNT(*) AS c FROM ms_bookings WHERE site_id = ? AND status = 'confirmed' AND booking_date BETWEEN ? AND ?`,
      [site.id, wStart, wEnd]
    )

    const stats = {
      total:       (totalRow && totalRow.c) || 0,
      today_count: (todayRow && todayRow.c) || 0,
      week_count:  (weekRow  && weekRow.c)  || 0
    }

    res.render('dashboard/booking.njk', {
      title: 'Booking — ' + site.title,
      user, site,
      upcoming: upcoming || [],
      stats
    })
  } catch (err) {
    console.error('booking.dashboard', err)
    res.status(500).send('Server error')
  }
}

// GET /dashboard/booking/:siteId/events — list event types
exports.events = async (req, res) => {
  try {
    const user = req.session.user
    const site = await getSite(req.params.siteId, user.id)
    if (!site) return res.status(404).send('Site not found')

    const events = await db.query(
      'SELECT * FROM ms_booking_events WHERE site_id = ? ORDER BY created_at',
      [site.id]
    )
    const edit = req.query.edit
      ? await db.first('SELECT * FROM ms_booking_events WHERE id = ? AND site_id = ?', [req.query.edit, site.id])
      : null

    res.render('dashboard/booking-events.njk', {
      title: 'Event Types — ' + site.title,
      user, site,
      events: events || [],
      edit: edit || null,
      saved: req.query.saved,
      deleted: req.query.deleted
    })
  } catch (err) {
    console.error('booking.events', err)
    res.status(500).send('Server error')
  }
}

// POST /dashboard/booking/:siteId/events/save
exports.saveEvent = async (req, res) => {
  try {
    const user = req.session.user
    const site = await getSite(req.params.siteId, user.id)
    if (!site) return res.status(403).json({ error: 'Forbidden' })

    const { id, name, duration, description, color, location, is_active } = req.body
    if (!name || !duration) return res.redirect(`/dashboard/booking/${site.id}/events`)

    if (id) {
      await db.execute(
        `UPDATE ms_booking_events SET name=?, duration=?, description=?, color=?, location=?, is_active=?
         WHERE id = ? AND site_id = ?`,
        [name, parseInt(duration), description || '', color || '#7c3aed', location || '', is_active ? 1 : 0, id, site.id]
      )
    } else {
      await db.execute(
        `INSERT INTO ms_booking_events (site_id, name, duration, description, color, location, is_active)
         VALUES (?, ?, ?, ?, ?, ?, 1)`,
        [site.id, name, parseInt(duration), description || '', color || '#7c3aed', location || '']
      )
    }
    res.redirect(`/dashboard/booking/${site.id}/events?saved=1`)
  } catch (err) {
    console.error('booking.saveEvent', err)
    res.status(500).send('Server error')
  }
}

// POST /dashboard/booking/:siteId/events/delete
exports.deleteEvent = async (req, res) => {
  try {
        const user = req.session.user
    const site = await getSite(req.params.siteId, user.id)
    if (!site) return res.status(403).send('Forbidden')

    const { id } = req.body
    await db.execute('DELETE FROM ms_booking_events WHERE id = ? AND site_id = ?', [id, site.id])
    res.redirect(`/dashboard/booking/${site.id}/events?deleted=1`)
  } catch (err) {
    console.error('booking.deleteEvent', err)
    res.status(500).send('Server error')
  }
}

// GET /dashboard/booking/:siteId/availability
exports.availability = async (req, res) => {
  try {
    const user = req.session.user
    const site = await getSite(req.params.siteId, user.id)
    if (!site) return res.status(404).send('Site not found')

    await seedAvailability(site.id)
    const rows = await db.query(
      'SELECT * FROM ms_booking_availability WHERE site_id = ? ORDER BY day_of_week',
      [site.id]
    )
    const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
    const days = rows.map(r => ({ ...r, day_name: DAY_NAMES[r.day_of_week] }))

    res.render('dashboard/booking-availability.njk', {
      title: 'Availability — ' + site.title,
      user, site,
      days,
      saved: req.query.saved
    })
  } catch (err) {
    console.error('booking.availability', err)
    res.status(500).send('Server error')
  }
}

// POST /dashboard/booking/:siteId/availability/save
exports.saveAvailability = async (req, res) => {
  try {
        const user = req.session.user
    const site = await getSite(req.params.siteId, user.id)
    if (!site) return res.status(403).send('Forbidden')

    const avail = req.body.avail || {} // avail[dow][on|start|end]
    for (let dow = 0; dow <= 6; dow++) {
      const row = avail[dow] || {}
      const is_available = row.on ? 1 : 0
      const start_time = row.start || '09:00'
      const end_time   = row.end   || '17:00'
      await db.execute(
        `INSERT INTO ms_booking_availability (site_id, day_of_week, start_time, end_time, is_available)
         VALUES (?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE start_time=VALUES(start_time), end_time=VALUES(end_time), is_available=VALUES(is_available)`,
        [site.id, dow, start_time, end_time, is_available]
      )
    }
    res.redirect(`/dashboard/booking/${site.id}/availability?saved=1`)
  } catch (err) {
    console.error('booking.saveAvailability', err)
    res.status(500).send('Server error')
  }
}

// GET /dashboard/booking/:siteId/list
exports.bookingList = async (req, res) => {
  try {
    const user = req.session.user
    const site = await getSite(req.params.siteId, user.id)
    if (!site) return res.status(404).send('Site not found')

    const filter = req.query.status || 'confirmed'
    const whereStatus = filter === 'all' ? '1=1' : 'b.status = ?'
    const params = filter === 'all' ? [site.id] : [site.id, filter]

    const bookings = await db.query(
      `SELECT b.*, e.name AS event_name, e.color, e.duration
       FROM ms_bookings b
       JOIN ms_booking_events e ON b.event_id = e.id
       WHERE b.site_id = ? AND ${whereStatus}
       ORDER BY b.booking_date DESC, b.start_time DESC LIMIT 100`,
      params
    )

    res.render('dashboard/booking-list.njk', {
      title: 'Bookings — ' + site.title,
      user, site,
      bookings: bookings || [],
      filter,
      cancelled: req.query.cancelled
    })
  } catch (err) {
    console.error('booking.bookingList', err)
    res.status(500).send('Server error')
  }
}

// POST /dashboard/booking/:siteId/cancel
exports.cancelBooking = async (req, res) => {
  try {
        const user = req.session.user
    const site = await getSite(req.params.siteId, user.id)
    if (!site) return res.status(403).send('Forbidden')

    const { id, status } = req.body
    const newStatus = status === 'confirmed' ? 'cancelled' : 'confirmed'
    await db.execute(
      'UPDATE ms_bookings SET status = ? WHERE id = ? AND site_id = ?',
      [newStatus, id, site.id]
    )
    res.redirect(`/dashboard/booking/${site.id}/list?cancelled=1`)
  } catch (err) {
    console.error('booking.cancelBooking', err)
    res.status(500).send('Server error')
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// PUBLIC API (no auth — uses subdomain)
// ─────────────────────────────────────────────────────────────────────────────

// GET /api/booking/:subdomain/events
exports.apiEvents = async (req, res) => {
  try {
const site = await db.first('SELECT id FROM ms_sites WHERE subdomain = ?', [req.params.subdomain])
    if (!site) return res.json([])

    const events = await db.query(
      `SELECT id, name, duration, description, color, location
       FROM ms_booking_events WHERE site_id = ? AND is_active = 1 ORDER BY created_at`,
      [site.id]
    )
    res.json(events || [])
  } catch (err) {
    console.error('booking.apiEvents', err)
    res.status(500).json({ error: 'Server error' })
  }
}

// GET /api/booking/:subdomain/slots/:eventId/:date  (date = YYYY-MM-DD)
exports.apiSlots = async (req, res) => {
  try {
const { subdomain, eventId, date } = req.params

    // Validate date
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return res.json([])
    const dt = new Date(date)
    if (isNaN(dt.getTime())) return res.json([])

    const site = await db.first('SELECT id FROM ms_sites WHERE subdomain = ?', [subdomain])
    if (!site) return res.json([])

    const event = await db.first(
      'SELECT * FROM ms_booking_events WHERE id = ? AND site_id = ? AND is_active = 1',
      [eventId, site.id]
    )
    if (!event) return res.json([])

    const dow = dt.getDay() // 0=Sun
    const avail = await db.first(
      'SELECT * FROM ms_booking_availability WHERE site_id = ? AND day_of_week = ? AND is_available = 1',
      [site.id, dow]
    )
    if (!avail) return res.json([]) // day not available

    const booked = await db.query(
      `SELECT start_time, end_time FROM ms_bookings
       WHERE site_id = ? AND booking_date = ? AND status = 'confirmed'`,
      [site.id, date]
    )

    const slots = generateSlots(avail, event.duration, booked || [], date)
    res.json(slots)
  } catch (err) {
    console.error('booking.apiSlots', err)
    res.status(500).json({ error: 'Server error' })
  }
}

// POST /api/booking/:subdomain/create
exports.apiCreate = async (req, res) => {
  try {
const { subdomain } = req.params
    const { event_id, booking_date, start_time, booker_name, booker_email, booker_phone, notes } = req.body

    // Basic validation
    if (!event_id || !booking_date || !start_time || !booker_name || !booker_email) {
      return res.json({ ok: false, error: 'Missing required fields.' })
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(booking_date)) {
      return res.json({ ok: false, error: 'Invalid date.' })
    }

    const site = await db.first('SELECT id FROM ms_sites WHERE subdomain = ?', [subdomain])
    if (!site) return res.json({ ok: false, error: 'Site not found.' })

    const event = await db.first(
      'SELECT * FROM ms_booking_events WHERE id = ? AND site_id = ? AND is_active = 1',
      [event_id, site.id]
    )
    if (!event) return res.json({ ok: false, error: 'Event type not found.' })

    const dt   = new Date(booking_date)
    const dow  = dt.getDay()
    const avail = await db.first(
      'SELECT * FROM ms_booking_availability WHERE site_id = ? AND day_of_week = ? AND is_available = 1',
      [site.id, dow]
    )
    if (!avail) return res.json({ ok: false, error: 'Not available on that day.' })

    // Calculate end time
    const startMin = toMin(start_time)
    const endMin   = startMin + event.duration
    const end_time = toTime(endMin)

    // Check for conflicts
    const conflict = await db.first(
      `SELECT id FROM ms_bookings
       WHERE site_id = ? AND booking_date = ? AND status = 'confirmed'
         AND start_time < ? AND end_time > ?`,
      [site.id, booking_date, end_time, start_time]
    )
    if (conflict) return res.json({ ok: false, error: 'That slot is no longer available.' })

    await db.execute(
      `INSERT INTO ms_bookings (site_id, event_id, booker_name, booker_email, booker_phone, booking_date, start_time, end_time, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [site.id, event_id, booker_name, booker_email, booker_phone || '', booking_date, start_time, end_time, notes || '']
    )

    res.json({ ok: true })
  } catch (err) {
    console.error('booking.apiCreate', err)
    res.status(500).json({ ok: false, error: 'Server error.' })
  }
}

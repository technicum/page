const mysql = require('mysql2/promise')
const fs    = require('fs')
const path  = require('path')
require('dotenv').config()

// ── Startup diagnostics ───────────────────────────────────────────────────────
console.log('\n========== DB CONFIG ==========')
console.log('DB_HOST :', process.env.DB_HOST  || '(not set)')
console.log('DB_USER :', process.env.DB_USER  || '(not set)')
console.log('DB_NAME :', process.env.DB_NAME  || '(not set)')
console.log('DB_PASS :', process.env.DB_PASS  ? `set (${process.env.DB_PASS.length} chars)` : '(not set)')
console.log('================================\n')

const pool = mysql.createPool({
  host:               process.env.DB_HOST,
  user:               process.env.DB_USER,
  password:           process.env.DB_PASS,
  database:           process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit:    10,
  charset:            'utf8mb4'
})

// ── Connection test + table check on startup ──────────────────────────────────
async function runStartupCheck() {
  let conn
  try {
    conn = await pool.getConnection()
    console.log('✅ DB connected successfully\n')

    const [timeRows] = await conn.query('SELECT NOW() as t')
    console.log('   Server time :', timeRows[0].t)

    // Check required tables
    const [tableRows] = await conn.query('SHOW TABLES')
    const tables = tableRows.map(r => Object.values(r)[0])
    console.log('   Tables found:', tables.join(', ') || '(none)')

    for (const tbl of ['ms_accounts', 'ms_sites']) {
      if (tables.includes(tbl)) {
        const [cols] = await conn.query(`DESCRIBE ${tbl}`)
        console.log(`   ${tbl}: ${cols.map(c => c.Field).join(', ')}`)
      } else {
        console.warn(`   ⚠️  MISSING TABLE: ${tbl} — run schema.sql in phpMyAdmin`)
      }
    }
    console.log('')
  } catch (err) {
    console.error('❌ DB CONNECTION FAILED')
    console.error('   Code   :', err.code)
    console.error('   Message:', err.message)
    if (err.code === 'ER_ACCESS_DENIED_ERROR') {
      console.error('   → Wrong username or password in .env')
    } else if (err.code === 'ER_BAD_DB_ERROR') {
      console.error('   → Database name does not exist')
    } else if (err.code === 'ECONNREFUSED') {
      console.error('   → DB_HOST is unreachable — check DB_HOST value')
    } else if (err.code === 'ENOTFOUND') {
      console.error('   → DB_HOST hostname cannot be resolved')
    }
    console.error('')
  } finally {
    if (conn) conn.release()
  }
}

runStartupCheck()

// ── Auto-run migration files ──────────────────────────────────────────────────
async function runMigrations() {
  const dir = path.join(__dirname, '..', 'migrations')
  if (!fs.existsSync(dir)) return
  const files = fs.readdirSync(dir).filter(f => f.endsWith('.sql')).sort()
  let conn
  try {
    conn = await pool.getConnection()
    for (const file of files) {
      const sql = fs.readFileSync(path.join(dir, file), 'utf8')
      const statements = sql.split(';').map(s => s.trim()).filter(Boolean)
      for (const stmt of statements) {
        try { await conn.query(stmt) } catch(e) {
          if (!e.message.includes('already exists') && e.code !== 'ER_DUP_KEYNAME') {
            console.warn(`[migration] ${file}: ${e.message}`)
          }
        }
      }
      console.log(`[migration] ✓ ${file}`)
    }
  } catch(e) {
    console.error('[migration] failed:', e.message)
  } finally {
    if (conn) conn.release()
  }
}
runMigrations()

// ── DB helper ─────────────────────────────────────────────────────────────────
const db = {
  async query(sql, params = []) {
    try {
      const [rows] = await pool.execute(sql, params)
      return rows
    } catch (err) {
      console.error('[DB query error]', err.code, err.message, '| SQL:', sql)
      throw err
    }
  },

  async first(sql, params = []) {
    const rows = await this.query(sql, params)
    return rows[0] || null
  },

  async execute(sql, params = []) {
    try {
      const [result] = await pool.execute(sql, params)
      return result
    } catch (err) {
      console.error('[DB execute error]', err.code, err.message, '| SQL:', sql)
      throw err
    }
  },

  async lastId(sql, params = []) {
    const result = await this.execute(sql, params)
    return result.insertId
  },

  // Expose pool for health check route
  async healthCheck() {
    const result = { connected: false, tables: [], missing: [], error: null }
    let conn
    try {
      conn = await pool.getConnection()
      result.connected = true
      const [timeRows] = await conn.query('SELECT NOW() as t')
      result.serverTime = timeRows[0].t
      const [tableRows] = await conn.query('SHOW TABLES')
      result.tables = tableRows.map(r => Object.values(r)[0])
      for (const tbl of ['ms_accounts', 'ms_sites']) {
        if (!result.tables.includes(tbl)) result.missing.push(tbl)
      }
    } catch (err) {
      result.error = { code: err.code, message: err.message }
    } finally {
      if (conn) conn.release()
    }
    return result
  }
}

module.exports = { pool, db }

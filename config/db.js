const mysql = require('mysql2/promise')
require('dotenv').config()

console.log('========== DB DEBUG ==========')
console.log('DB_HOST:', process.env.DB_HOST)
console.log('DB_USER:', process.env.DB_USER)
console.log('DB_NAME:', process.env.DB_NAME)
console.log('DB_PASS exists:', !!process.env.DB_PASS)
console.log('==============================')

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  charset: 'utf8mb4'
})

// Test connection on startup
;(async () => {
  try {
    const conn = await pool.getConnection()

    console.log('✅ DATABASE CONNECTED')

    const [rows] = await conn.query('SELECT NOW() as server_time')
    console.log('Server Time:', rows[0].server_time)

    conn.release()
  } catch (err) {
    console.error('❌ DATABASE CONNECTION FAILED')
    console.error('Code:', err.code)
    console.error('Message:', err.message)
    console.error(err)
  }
})()

const db = {
  async query(sql, params = []) {
    const [rows] = await pool.execute(sql, params)
    return rows
  },

  async first(sql, params = []) {
    const rows = await this.query(sql, params)
    return rows[0] || null
  },

  async execute(sql, params = []) {
    const [result] = await pool.execute(sql, params)
    return result
  },

  async lastId(sql, params = []) {
    const result = await this.execute(sql, params)
    return result.insertId
  }
}

module.exports = { pool, db }
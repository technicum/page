const mysql = require('mysql2/promise')
require('dotenv').config()

const pool = mysql.createPool({
  host:            process.env.DB_HOST,
  user:            process.env.DB_USER,
  password:        process.env.DB_PASS,
  database:        process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  charset:         'utf8mb4'
})

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

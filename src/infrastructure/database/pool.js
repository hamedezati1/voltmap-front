import mysql from 'mysql2/promise'
import { config } from '../../config/index.js'
import { logger } from '../logger.js'

/**
 * Connection Pool مرکزی MySQL/MariaDB.
 * - connectionLimit: حداکثر کانکشن هم‌زمان
 * - idleTimeout / connectTimeout: کنترل عمر و زمان گرفتن کانکشن
 * - API شبیه pg نگه داشته شده ({ rows }) تا Repository ها یکدست بمانند
 */
const rawPool = mysql.createPool({
  host: config.db.host,
  port: config.db.port,
  user: config.db.user,
  password: config.db.password,
  database: config.db.database,
  waitForConnections: true,
  connectionLimit: config.db.poolMax,
  maxIdle: config.db.poolMin,
  idleTimeout: config.db.idleTimeoutMs,
  connectTimeout: config.db.connectionTimeoutMs,
  timezone: 'Z',
  dateStrings: false,
  supportBigNumbers: true,
  namedPlaceholders: false,
  multipleStatements: true, // لازم برای اجرای فایل‌های migration
})

function wrapResult(result) {
  // execute/query برای SELECT آرایه ردیف برمی‌گرداند؛ برای INSERT/UPDATE/DELETE یک ResultSetHeader
  if (Array.isArray(result)) {
    return { rows: result, insertId: undefined, affectedRows: result.length }
  }
  return {
    rows: [],
    insertId: result.insertId,
    affectedRows: result.affectedRows,
  }
}

function wrapConnection(conn) {
  return {
    async query(sql, params = []) {
      const [result] = await conn.execute(sql, params)
      return wrapResult(result)
    },
    /** برای DDL / multi-statement (مثل migration) */
    async queryRaw(sql) {
      const [result] = await conn.query(sql)
      return wrapResult(result)
    },
    async beginTransaction() {
      await conn.beginTransaction()
    },
    async commit() {
      await conn.commit()
    },
    async rollback() {
      await conn.rollback()
    },
    release() {
      conn.release()
    },
  }
}

export const pool = {
  async query(sql, params = []) {
    const start = Date.now()
    const [result] = await rawPool.execute(sql, params)
    const duration = Date.now() - start
    if (duration > 200) {
      logger.warn('Slow query', { text: sql, duration })
    }
    return wrapResult(result)
  },
  async getConnection() {
    const conn = await rawPool.getConnection()
    return wrapConnection(conn)
  },
  async end() {
    await rawPool.end()
  },
}

/** اجرای یک کوئری ساده (بدون تراکنش) */
export async function query(text, params) {
  return pool.query(text, params)
}

/**
 * گرفتن یک client اختصاصی از pool برای اجرای تراکنش (BEGIN/COMMIT/ROLLBACK).
 * همیشه باید بعد از استفاده client.release() صدا زده بشه، حتی روی خطا.
 */
export async function getClient() {
  return pool.getConnection()
}

/** بستن Graceful همه‌ی کانکشن‌های pool — در graceful shutdown استفاده می‌شود */
export async function closePool() {
  await pool.end()
  logger.info('MySQL pool closed')
}

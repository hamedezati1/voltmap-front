import { randomUUID } from 'node:crypto'
import { pool } from '../../../infrastructure/database/pool.js'

/**
 * پیاده‌سازی MySQL مخزن OTP
 */
export class MyOtpRepository {
  constructor(executor = pool) {
    this.executor = executor
  }

  async create({ phone, codeHash, purpose, expiresAt }) {
    const id = randomUUID()
    await this.executor.query(
      `INSERT INTO otp_codes (id, phone, code_hash, purpose, expires_at)
       VALUES (?, ?, ?, ?, ?)`,
      [id, phone, codeHash, purpose, expiresAt]
    )
    return { id, phone, codeHash, purpose, expiresAt, attempts: 0 }
  }

  async findLatestValid(phone, purpose) {
    const { rows } = await this.executor.query(
      `SELECT * FROM otp_codes
       WHERE phone = ? AND purpose = ?
         AND consumed_at IS NULL
         AND expires_at > UTC_TIMESTAMP(6)
       ORDER BY created_at DESC
       LIMIT 1`,
      [phone, purpose]
    )
    return rows[0] ? mapRow(rows[0]) : null
  }

  async findLatest(phone) {
    const { rows } = await this.executor.query(
      `SELECT * FROM otp_codes
       WHERE phone = ?
       ORDER BY created_at DESC
       LIMIT 1`,
      [phone]
    )
    return rows[0] ? mapRow(rows[0]) : null
  }

  async incrementAttempts(id) {
    await this.executor.query(
      'UPDATE otp_codes SET attempts = attempts + 1 WHERE id = ?',
      [id]
    )
  }

  async consume(id) {
    await this.executor.query(
      'UPDATE otp_codes SET consumed_at = UTC_TIMESTAMP(6) WHERE id = ?',
      [id]
    )
  }

  async invalidateActive(phone) {
    await this.executor.query(
      `UPDATE otp_codes
       SET consumed_at = UTC_TIMESTAMP(6)
       WHERE phone = ? AND consumed_at IS NULL`,
      [phone]
    )
  }
}

function mapRow(row) {
  return {
    id: row.id,
    phone: row.phone,
    codeHash: row.code_hash,
    purpose: row.purpose,
    attempts: row.attempts,
    expiresAt: row.expires_at,
    consumedAt: row.consumed_at,
    createdAt: row.created_at,
  }
}

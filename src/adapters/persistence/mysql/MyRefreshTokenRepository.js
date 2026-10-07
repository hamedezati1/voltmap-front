import { randomUUID } from 'node:crypto'
import { pool } from '../../../infrastructure/database/pool.js'

function toMysqlDatetime(value) {
  const d = value instanceof Date ? value : new Date(value)
  return d.toISOString().slice(0, 23).replace('T', ' ')
}

export class MyRefreshTokenRepository {
  constructor(executor = pool) {
    this.executor = executor
  }

  async store(userId, tokenHash, expiresAt) {
    await this.executor.query(
      'INSERT INTO refresh_tokens (id, user_id, token_hash, expires_at) VALUES (?,?,?,?)',
      [randomUUID(), userId, tokenHash, toMysqlDatetime(expiresAt)]
    )
  }

  async findValid(tokenHash) {
    const { rows } = await this.executor.query(
      `SELECT * FROM refresh_tokens
       WHERE token_hash = ? AND revoked_at IS NULL AND expires_at > UTC_TIMESTAMP(6)`,
      [tokenHash]
    )
    return rows[0] ?? null
  }

  async revoke(tokenHash) {
    await this.executor.query(
      'UPDATE refresh_tokens SET revoked_at = UTC_TIMESTAMP(6) WHERE token_hash = ?',
      [tokenHash]
    )
  }

  async revokeAllForUser(userId) {
    await this.executor.query(
      'UPDATE refresh_tokens SET revoked_at = UTC_TIMESTAMP(6) WHERE user_id = ? AND revoked_at IS NULL',
      [userId]
    )
  }
}

import { randomUUID } from 'node:crypto'
import { pool } from '../../../infrastructure/database/pool.js'
import { User } from '../../../domain/entities/User.js'

function toEntity(row) {
  if (!row) return null
  return new User({
    id: row.id,
    name: row.name,
    email: row.email,
    phone: row.phone,
    passwordHash: row.password_hash,
    role: row.role,
    membership: row.membership,
    totalSessions: row.total_sessions,
    totalKwh: Number(row.total_kwh),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  })
}

/**
 * پیاده‌سازی MySQL مخزن کاربران.
 * `executor` می‌تواند pool باشد (کوئری معمولی) یا client داخل یک تراکنش (از UnitOfWork).
 */
export class MyUserRepository {
  constructor(executor = pool) {
    this.executor = executor
  }

  async create({ name, email, phone, passwordHash = null, role = 'user', membership = 'رایگان' }) {
    const id = randomUUID()
    await this.executor.query(
      `INSERT INTO users (id, name, email, phone, password_hash, role, membership)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [id, name, email ?? null, phone, passwordHash ?? null, role, membership]
    )
    return this.findById(id)
  }

  async findById(id) {
    const { rows } = await this.executor.query('SELECT * FROM users WHERE id = ?', [id])
    return toEntity(rows[0])
  }

  async findByEmail(email) {
    const { rows } = await this.executor.query('SELECT * FROM users WHERE email = ?', [email])
    return toEntity(rows[0])
  }

  async findByPhone(phone) {
    const { rows } = await this.executor.query('SELECT * FROM users WHERE phone = ?', [phone])
    return toEntity(rows[0])
  }

  async findByEmailOrPhone(identifier) {
    const { rows } = await this.executor.query(
      'SELECT * FROM users WHERE email = ? OR phone = ?',
      [identifier, identifier]
    )
    return toEntity(rows[0])
  }

  async updateMembership(id, membership) {
    await this.executor.query('UPDATE users SET membership = ? WHERE id = ?', [membership, id])
    return this.findById(id)
  }

  async updateProfile(id, changes) {
    const fields = []
    const values = []
    for (const [key, value] of Object.entries(changes)) {
      // phone هویت ورود است و از پروفایل تغییر نمی‌کند
      const column = { name: 'name', email: 'email' }[key]
      if (!column) continue
      fields.push(`${column} = ?`)
      values.push(value)
    }
    if (fields.length === 0) return this.findById(id)
    values.push(id)
    await this.executor.query(`UPDATE users SET ${fields.join(', ')} WHERE id = ?`, values)
    return this.findById(id)
  }

  async incrementUsageStats(id, { sessions = 0, kwh = 0 }) {
    await this.executor.query(
      `UPDATE users SET total_sessions = total_sessions + ?, total_kwh = total_kwh + ?
       WHERE id = ?`,
      [sessions, kwh, id]
    )
    return this.findById(id)
  }

  async list() {
    const { rows } = await this.executor.query('SELECT * FROM users ORDER BY created_at DESC')
    return rows.map(toEntity)
  }
}

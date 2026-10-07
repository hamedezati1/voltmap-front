import { randomUUID } from 'node:crypto'
import { pool } from '../../../infrastructure/database/pool.js'
import { Vehicle } from '../../../domain/entities/Vehicle.js'

function toEntity(row) {
  if (!row) return null
  return new Vehicle({
    id: row.id,
    userId: row.user_id,
    name: row.name,
    image: row.image,
    batteryLevel: row.battery_level,
    estimatedRange: row.estimated_range,
    connector: row.connector,
    year: row.year,
    isDefault: Boolean(row.is_default),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  })
}

export class MyVehicleRepository {
  constructor(executor = pool) {
    this.executor = executor
  }

  async findAllByUser(userId) {
    const { rows } = await this.executor.query(
      'SELECT * FROM vehicles WHERE user_id = ? ORDER BY created_at DESC',
      [userId]
    )
    return rows.map(toEntity)
  }

  async findById(id, userId) {
    const { rows } = await this.executor.query(
      'SELECT * FROM vehicles WHERE id = ? AND user_id = ?',
      [id, userId]
    )
    return toEntity(rows[0])
  }

  async create({ userId, name, image, batteryLevel, estimatedRange, connector, year, isDefault }) {
    const id = randomUUID()
    await this.executor.query(
      `INSERT INTO vehicles (id, user_id, name, image, battery_level, estimated_range, connector, year, is_default)
       VALUES (?,?,?,?,?,?,?,?,?)`,
      [id, userId, name, image ?? null, batteryLevel ?? null, estimatedRange ?? null, connector, year ?? null, isDefault ? 1 : 0]
    )
    return this.findById(id, userId)
  }

  async update(id, userId, changes) {
    const allowed = ['name', 'image', 'batteryLevel', 'estimatedRange', 'connector', 'year', 'isDefault']
    const columnMap = {
      name: 'name', image: 'image', batteryLevel: 'battery_level',
      estimatedRange: 'estimated_range', connector: 'connector', year: 'year', isDefault: 'is_default',
    }
    const fields = []
    const values = []
    for (const key of allowed) {
      if (changes[key] === undefined) continue
      fields.push(`${columnMap[key]} = ?`)
      values.push(key === 'isDefault' ? (changes[key] ? 1 : 0) : changes[key])
    }
    if (fields.length === 0) return this.findById(id, userId)
    values.push(id, userId)
    await this.executor.query(
      `UPDATE vehicles SET ${fields.join(', ')} WHERE id = ? AND user_id = ?`,
      values
    )
    return this.findById(id, userId)
  }

  async delete(id, userId) {
    await this.executor.query('DELETE FROM vehicles WHERE id = ? AND user_id = ?', [id, userId])
    return true
  }

  async clearDefault(userId) {
    await this.executor.query('UPDATE vehicles SET is_default = 0 WHERE user_id = ?', [userId])
  }
}

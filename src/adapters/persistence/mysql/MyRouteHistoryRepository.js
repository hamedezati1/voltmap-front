import { randomUUID } from 'node:crypto'
import { pool } from '../../../infrastructure/database/pool.js'

function parseJsonField(value) {
  if (value == null) return value
  if (typeof value === 'string') {
    try { return JSON.parse(value) } catch { return value }
  }
  return value
}

function mapRow(row) {
  if (!row) return null
  return {
    ...row,
    origin: parseJsonField(row.origin),
    destination: parseJsonField(row.destination),
    charging_stops: parseJsonField(row.charging_stops),
  }
}

export class MyRouteHistoryRepository {
  constructor(executor = pool) {
    this.executor = executor
  }

  async create({ userId, origin, destination, vehicleRange, connectorType, totalDistance, totalDuration, chargingStops }) {
    const id = randomUUID()
    await this.executor.query(
      `INSERT INTO route_history (id, user_id, origin, destination, vehicle_range, connector_type, total_distance, total_duration, charging_stops)
       VALUES (?,?,?,?,?,?,?,?,?)`,
      [
        id,
        userId,
        JSON.stringify(origin),
        JSON.stringify(destination),
        vehicleRange ?? null,
        connectorType ?? null,
        totalDistance ?? null,
        totalDuration ?? null,
        JSON.stringify(chargingStops ?? []),
      ]
    )
    const { rows } = await this.executor.query('SELECT * FROM route_history WHERE id = ?', [id])
    return mapRow(rows[0])
  }

  async findAllByUser(userId) {
    const { rows } = await this.executor.query(
      'SELECT * FROM route_history WHERE user_id = ? ORDER BY created_at DESC',
      [userId]
    )
    return rows.map(mapRow)
  }

  async findById(id, userId) {
    const { rows } = await this.executor.query(
      'SELECT * FROM route_history WHERE id = ? AND user_id = ?',
      [id, userId]
    )
    return mapRow(rows[0])
  }
}

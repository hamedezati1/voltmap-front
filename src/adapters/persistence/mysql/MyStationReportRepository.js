import { randomUUID } from 'node:crypto'
import { pool } from '../../../infrastructure/database/pool.js'
import { StationReport } from '../../../domain/entities/StationReport.js'

function toEntity(row) {
  if (!row) return null
  return new StationReport({
    id: row.id,
    userId: row.user_id,
    name: row.name,
    city: row.city,
    address: row.address,
    lat: row.lat,
    lng: row.lng,
    type: row.type,
    connector: row.connector,
    notes: row.notes,
    status: row.status,
    rejectReason: row.reject_reason,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  })
}

export class MyStationReportRepository {
  constructor(executor = pool) {
    this.executor = executor
  }

  async findAll(status) {
    const where = status ? 'WHERE status = ?' : ''
    const values = status ? [status] : []
    const { rows } = await this.executor.query(
      `SELECT * FROM station_reports ${where} ORDER BY created_at DESC`,
      values
    )
    return rows.map(toEntity)
  }

  async create({ userId, name, city, address, lat, lng, type, connector, notes }) {
    const id = randomUUID()
    await this.executor.query(
      `INSERT INTO station_reports (id, user_id, name, city, address, lat, lng, type, connector, notes)
       VALUES (?,?,?,?,?,?,?,?,?,?)`,
      [id, userId ?? null, name, city ?? null, address ?? null, lat ?? null, lng ?? null, type ?? null, connector ?? null, notes ?? null]
    )
    const { rows } = await this.executor.query('SELECT * FROM station_reports WHERE id = ?', [id])
    return toEntity(rows[0])
  }

  async updateStatus(id, status, rejectReason = null) {
    await this.executor.query(
      `UPDATE station_reports SET status = ?, reject_reason = ? WHERE id = ?`,
      [status, rejectReason, id]
    )
    const { rows } = await this.executor.query('SELECT * FROM station_reports WHERE id = ?', [id])
    return toEntity(rows[0])
  }

  async delete(id) {
    await this.executor.query('DELETE FROM station_reports WHERE id = ?', [id])
    return true
  }
}

import { pool } from '../../../infrastructure/database/pool.js'

const DEFAULT_WINDOW_MS = 30 * 60 * 1000 // ۳۰ دقیقه — مطابق منطق قبلی فرانت

export class MyCrowdReportRepository {
  constructor(executor = pool) {
    this.executor = executor
  }

  async add(stationId, type, userId = null) {
    await this.executor.query(
      'INSERT INTO station_crowd_reports (station_id, user_id, type) VALUES (?,?,?)',
      [stationId, userId, type]
    )
  }

  async getRecent(stationId, windowMs = DEFAULT_WINDOW_MS) {
    const { rows } = await this.executor.query(
      `SELECT * FROM station_crowd_reports
       WHERE station_id = ? AND created_at > (UTC_TIMESTAMP(6) - INTERVAL ? MICROSECOND)
       ORDER BY created_at DESC`,
      [stationId, windowMs * 1000]
    )
    return rows
  }

  async getStats(stationId, windowMs = DEFAULT_WINDOW_MS) {
    const recent = await this.getRecent(stationId, windowMs)
    const busyCount = recent.filter(r => r.type === 'busy').length
    const availableCount = recent.filter(r => r.type === 'available').length
    const { rows: totalRows } = await this.executor.query(
      'SELECT COUNT(*) AS total FROM station_crowd_reports WHERE station_id = ?',
      [stationId]
    )
    return {
      total: Number(totalRows[0].total),
      recent: recent.length,
      busyCount,
      availableCount,
    }
  }

  async getAllStats(windowMs = DEFAULT_WINDOW_MS) {
    const { rows } = await this.executor.query(
      `SELECT station_id,
              SUM(CASE WHEN created_at > (UTC_TIMESTAMP(6) - INTERVAL ? MICROSECOND) THEN 1 ELSE 0 END) AS recent,
              SUM(CASE WHEN type = 'busy' AND created_at > (UTC_TIMESTAMP(6) - INTERVAL ? MICROSECOND) THEN 1 ELSE 0 END) AS busy_count,
              SUM(CASE WHEN type = 'available' AND created_at > (UTC_TIMESTAMP(6) - INTERVAL ? MICROSECOND) THEN 1 ELSE 0 END) AS available_count,
              COUNT(*) AS total
       FROM station_crowd_reports
       GROUP BY station_id`,
      [windowMs * 1000, windowMs * 1000, windowMs * 1000]
    )
    return rows.map(r => ({
      stationId: r.station_id,
      total: Number(r.total),
      recent: Number(r.recent),
      busyCount: Number(r.busy_count),
      availableCount: Number(r.available_count),
    }))
  }
}

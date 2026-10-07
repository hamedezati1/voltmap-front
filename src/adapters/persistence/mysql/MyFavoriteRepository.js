import { pool } from '../../../infrastructure/database/pool.js'

export class MyFavoriteRepository {
  constructor(executor = pool) {
    this.executor = executor
  }

  async list(userId) {
    const { rows } = await this.executor.query(
      `SELECT s.* FROM user_favorites f
       JOIN stations s ON s.id = f.station_id
       WHERE f.user_id = ?
       ORDER BY f.created_at DESC`,
      [userId]
    )
    return rows
  }

  async add(userId, stationId) {
    await this.executor.query(
      `INSERT IGNORE INTO user_favorites (user_id, station_id) VALUES (?,?)`,
      [userId, stationId]
    )
    return true
  }

  async remove(userId, stationId) {
    await this.executor.query(
      'DELETE FROM user_favorites WHERE user_id = ? AND station_id = ?',
      [userId, stationId]
    )
    return true
  }

  async isFavorite(userId, stationId) {
    const { rows } = await this.executor.query(
      'SELECT 1 AS ok FROM user_favorites WHERE user_id = ? AND station_id = ?',
      [userId, stationId]
    )
    return rows.length > 0
  }
}

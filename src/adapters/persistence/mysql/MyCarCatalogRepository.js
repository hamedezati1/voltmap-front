import { pool } from '../../../infrastructure/database/pool.js'
import { CarCatalogItem } from '../../../domain/entities/CarCatalogItem.js'

function toEntity(row) {
  if (!row) return null
  return new CarCatalogItem({
    id: row.id,
    brand: row.brand,
    model: row.model,
    trim: row.trim,
    bodyType: row.body_type,
    batteryKwh: row.battery_kwh,
    rangeKm: row.range_km,
    connector: row.connector,
    maxDcKw: row.max_dc_kw,
    createdAt: row.created_at,
  })
}

export class MyCarCatalogRepository {
  constructor(executor = pool) {
    this.executor = executor
  }

  async findAll(filters = {}) {
    const { brand, bodyType, connector, search } = filters
    const clauses = []
    const values = []

    if (brand) {
      clauses.push('brand = ?')
      values.push(brand)
    }
    if (bodyType) {
      clauses.push('body_type = ?')
      values.push(bodyType)
    }
    if (connector) {
      clauses.push('connector = ?')
      values.push(connector)
    }
    if (search) {
      clauses.push('(brand LIKE ? OR model LIKE ? OR trim LIKE ?)')
      const term = `%${search}%`
      values.push(term, term, term)
    }

    const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : ''
    const { rows } = await this.executor.query(
      `SELECT * FROM car_catalog ${where}
       ORDER BY id ASC`,
      values
    )
    return rows.map(toEntity)
  }

  async findById(id) {
    const { rows } = await this.executor.query('SELECT * FROM car_catalog WHERE id = ?', [id])
    return toEntity(rows[0])
  }

  async upsertMany(cars) {
    for (const car of cars) {
      await this.executor.query(
        `INSERT INTO car_catalog
          (id, brand, model, trim, body_type, battery_kwh, range_km, connector, max_dc_kw)
         VALUES (?,?,?,?,?,?,?,?,?)
         ON DUPLICATE KEY UPDATE
           brand = VALUES(brand),
           model = VALUES(model),
           trim = VALUES(trim),
           body_type = VALUES(body_type),
           battery_kwh = VALUES(battery_kwh),
           range_km = VALUES(range_km),
           connector = VALUES(connector),
           max_dc_kw = VALUES(max_dc_kw)`,
        [
          car.id,
          car.brand,
          car.model,
          car.trim ?? null,
          car.bodyType,
          car.batteryKwh,
          car.rangeKm,
          car.connector,
          car.maxDcKw,
        ]
      )
    }
    return cars.length
  }
}

import { pool } from '../../../infrastructure/database/pool.js'
import { Station } from '../../../domain/entities/Station.js'

function toEntity(row) {
  if (!row) return null
  return new Station({
    id: row.id,
    code: row.code,
    name: row.name,
    operator: row.operator,
    province: row.province,
    city: row.city,
    district: row.district,
    address: row.address,
    lat: row.lat == null ? null : Number(row.lat),
    lng: row.lng == null ? null : Number(row.lng),
    acPorts: row.ac_ports,
    dcPorts: row.dc_ports,
    maxPower: row.max_power,
    connectors: row.connectors,
    parkingSpots: row.parking_spots,
    isFree: row.is_free,
    pricePerKwh: row.price_per_kwh,
    isActive: row.is_active,
    isVerified: row.is_verified,
    isOwnerStation: row.is_owner_station,
    hours: row.hours,
    phone: row.phone,
    image1: row.image1,
    image2: row.image2,
    image3: row.image3,
    description: row.description,
    dataUpdatedAt: row.data_updated_at,
    status: row.status,
    rating: Number(row.rating),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  })
}

const WRITE_FIELDS = [
  'code', 'name', 'operator', 'province', 'city', 'district', 'address',
  'lat', 'lng', 'ac_ports', 'dc_ports', 'max_power', 'connectors', 'parking_spots',
  'is_free', 'price_per_kwh', 'is_active', 'is_verified', 'is_owner_station', 'hours', 'phone',
  'image1', 'image2', 'image3', 'description', 'data_updated_at', 'status',
]

/** نگاشت camelCase API → snake_case DB */
function toDbChanges(changes) {
  const map = {
    code: 'code',
    name: 'name',
    operator: 'operator',
    province: 'province',
    city: 'city',
    district: 'district',
    address: 'address',
    lat: 'lat',
    lng: 'lng',
    acPorts: 'ac_ports',
    dcPorts: 'dc_ports',
    maxPower: 'max_power',
    connectors: 'connectors',
    connector: 'connectors',
    parkingSpots: 'parking_spots',
    isFree: 'is_free',
    pricePerKwh: 'price_per_kwh',
    price: 'price_per_kwh',
    isActive: 'is_active',
    isVerified: 'is_verified',
    isOwnerStation: 'is_owner_station',
    hours: 'hours',
    phone: 'phone',
    image1: 'image1',
    image2: 'image2',
    image3: 'image3',
    image: 'image1',
    description: 'description',
    dataUpdatedAt: 'data_updated_at',
    status: 'status',
    // سازگاری با فرم قدیمی ادمین
    power: 'max_power',
    ports: null, // handled specially
    type: null,
  }

  const out = {}
  for (const [key, value] of Object.entries(changes)) {
    if (value === undefined) continue
    const col = map[key]
    if (!col) continue
    if (key === 'isFree' || key === 'isActive' || key === 'isVerified' || key === 'isOwnerStation') {
      out[col] = value ? 1 : 0
    } else if (key === 'power' && typeof value === 'number') {
      out[col] = String(value)
    } else {
      out[col] = value
    }
  }

  // اگر فقط type/ports قدیمی آمده باشد، ac/dc را حدس بزن
  if (changes.type && changes.acPorts === undefined && changes.dcPorts === undefined) {
    const ports = Number(changes.ports) || 1
    if (changes.type === 'DC') {
      out.dc_ports = ports
      out.ac_ports = 0
    } else if (changes.type === 'AC') {
      out.ac_ports = ports
      out.dc_ports = 0
    } else if (changes.type === 'AC/DC') {
      const half = Math.max(1, Math.floor(ports / 2))
      out.ac_ports = half
      out.dc_ports = Math.max(1, ports - half)
    }
  }

  return out
}

export class MyStationRepository {
  constructor(executor = pool) {
    this.executor = executor
  }

  async findAll(filters = {}) {
    const { search, type, status, city, province, operator } = filters
    const clauses = []
    const values = []

    if (search) {
      clauses.push('(name LIKE ? OR city LIKE ? OR address LIKE ? OR code LIKE ? OR operator LIKE ? OR province LIKE ?)')
      const term = `%${search}%`
      values.push(term, term, term, term, term, term)
    }
    if (status) {
      clauses.push('status = ?')
      values.push(status)
    }
    if (city) {
      clauses.push('city = ?')
      values.push(city)
    }
    if (province) {
      clauses.push('province = ?')
      values.push(province)
    }
    if (operator) {
      clauses.push('operator = ?')
      values.push(operator)
    }
    if (type === 'AC') {
      clauses.push('ac_ports > 0 AND dc_ports = 0')
    } else if (type === 'DC') {
      clauses.push('dc_ports > 0 AND ac_ports = 0')
    } else if (type === 'AC/DC') {
      clauses.push('ac_ports > 0 AND dc_ports > 0')
    }

    const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : ''
    const { rows } = await this.executor.query(
      `SELECT * FROM stations ${where} ORDER BY created_at DESC`,
      values
    )
    return rows.map(toEntity)
  }

  async findById(id) {
    const { rows } = await this.executor.query('SELECT * FROM stations WHERE id = ?', [id])
    return toEntity(rows[0])
  }

  async create(station) {
    const db = toDbChanges(station)
    if (!db.code) {
      db.code = `ST${Date.now().toString(36).toUpperCase()}`
    }
    if (db.is_active === undefined) db.is_active = 1
    if (db.status === undefined) db.status = 'available'
    if (db.ac_ports === undefined) db.ac_ports = 0
    if (db.dc_ports === undefined) db.dc_ports = 0
    if (db.is_free === undefined) db.is_free = 0
    if (db.is_verified === undefined) db.is_verified = 0
    if (db.is_owner_station === undefined) db.is_owner_station = 0

    const cols = WRITE_FIELDS.filter((c) => db[c] !== undefined)
    const placeholders = cols.map(() => '?').join(',')
    const values = cols.map((c) => db[c])
    const result = await this.executor.query(
      `INSERT INTO stations (${cols.join(',')}) VALUES (${placeholders})`,
      values
    )
    return this.findById(result.insertId)
  }

  async update(id, changes) {
    const db = toDbChanges(changes)
    const fields = []
    const values = []
    for (const col of WRITE_FIELDS) {
      if (db[col] === undefined) continue
      fields.push(`${col} = ?`)
      values.push(db[col])
    }
    if (fields.length === 0) return this.findById(id)
    values.push(id)
    await this.executor.query(`UPDATE stations SET ${fields.join(', ')} WHERE id = ?`, values)
    return this.findById(id)
  }

  async delete(id) {
    await this.executor.query('DELETE FROM stations WHERE id = ?', [id])
    return true
  }

  async addReview(stationId, { userId, userName, text, rating }) {
    const result = await this.executor.query(
      `INSERT INTO station_reviews (station_id, user_id, user_name, text, rating)
       VALUES (?,?,?,?,?)`,
      [stationId, userId ?? null, userName, text, rating]
    )
    await this.executor.query(
      `UPDATE stations
       SET rating = COALESCE((
         SELECT ROUND(AVG(rating), 1) FROM station_reviews WHERE station_id = ?
       ), 0)
       WHERE id = ?`,
      [stationId, stationId]
    )
    const { rows } = await this.executor.query('SELECT * FROM station_reviews WHERE id = ?', [result.insertId])
    return rows[0]
  }

  async deleteReview(stationId, reviewId) {
    const result = await this.executor.query(
      'DELETE FROM station_reviews WHERE id = ? AND station_id = ?',
      [reviewId, stationId]
    )
    if (!result.affectedRows) return false
    await this.executor.query(
      `UPDATE stations
       SET rating = COALESCE((
         SELECT ROUND(AVG(rating), 1) FROM station_reviews WHERE station_id = ?
       ), 0)
       WHERE id = ?`,
      [stationId, stationId]
    )
    return true
  }

  async listReviewsByStation(stationId) {
    const { rows } = await this.executor.query(
      'SELECT * FROM station_reviews WHERE station_id = ? ORDER BY created_at DESC',
      [stationId]
    )
    return rows
  }

  async listAllReviews() {
    const { rows } = await this.executor.query(`
      SELECT r.*, s.name AS station_name
      FROM station_reviews r
      JOIN stations s ON s.id = r.station_id
      ORDER BY r.created_at DESC
    `)
    return rows
  }
}

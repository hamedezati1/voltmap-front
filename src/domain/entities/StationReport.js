export const STATION_REPORT_STATUS = ['pending', 'approved', 'rejected']

export class StationReport {
  constructor({ id, userId, name, city, address, lat, lng, type, connector, notes, status, rejectReason, createdAt, updatedAt }) {
    this.id = id
    this.userId = userId ?? null
    this.name = name
    this.city = city
    this.address = address
    this.lat = lat
    this.lng = lng
    this.type = type
    this.connector = connector
    this.notes = notes ?? null
    this.status = status || 'pending'
    this.rejectReason = rejectReason ?? null
    this.createdAt = createdAt
    this.updatedAt = updatedAt
  }
}

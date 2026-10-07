export class Vehicle {
  constructor({ id, userId, name, image, batteryLevel, estimatedRange, connector, year, isDefault, createdAt, updatedAt }) {
    this.id = id
    this.userId = userId
    this.name = name
    this.image = image ?? null
    this.batteryLevel = batteryLevel
    this.estimatedRange = estimatedRange
    this.connector = connector
    this.year = year
    this.isDefault = !!isDefault
    this.createdAt = createdAt
    this.updatedAt = updatedAt
  }
}

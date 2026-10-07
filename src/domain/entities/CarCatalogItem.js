export class CarCatalogItem {
  constructor({
    id,
    brand,
    model,
    trim,
    bodyType,
    batteryKwh,
    rangeKm,
    connector,
    maxDcKw,
    createdAt,
  }) {
    this.id = id
    this.brand = brand
    this.model = model
    this.trim = trim ?? null
    this.bodyType = bodyType
    this.batteryKwh = batteryKwh
    this.rangeKm = rangeKm
    this.connector = connector
    this.maxDcKw = maxDcKw
    this.createdAt = createdAt
  }

  /** نام نمایشی برای UI / ثبت خودرو کاربر */
  get displayName() {
    const parts = [this.brand, this.model]
    if (this.trim) parts.push(this.trim)
    return parts.join(' ')
  }
}

export const STATION_STATUS = ['available', 'busy', 'waiting', 'offline']
export const STATION_TYPE = ['AC', 'DC', 'AC/DC']

/** استخراج بزرگ‌ترین عدد توان از رشته‌هایی مثل "60-7.4" یا "7.4، 11+11 کیلووات" */
export function parseMaxPowerKw(maxPower) {
  if (maxPower == null || maxPower === '') return 0
  if (typeof maxPower === 'number' && Number.isFinite(maxPower)) return maxPower
  const nums = String(maxPower).match(/(\d+(?:\.\d+)?)/g)
  if (!nums?.length) return 0
  return Math.max(...nums.map(Number))
}

export function deriveStationType(acPorts = 0, dcPorts = 0) {
  const ac = Number(acPorts) || 0
  const dc = Number(dcPorts) || 0
  if (ac > 0 && dc > 0) return 'AC/DC'
  if (dc > 0) return 'DC'
  if (ac > 0) return 'AC'
  return 'AC'
}

export function formatStationPrice({ isFree, pricePerKwh }) {
  if (isFree) return 'رایگان'
  if (pricePerKwh == null || pricePerKwh === '' || pricePerKwh === '0') return null
  return `${pricePerKwh} تومان/kWh`
}

export class Station {
  constructor(props) {
    this.id = props.id
    this.code = props.code
    this.name = props.name
    this.operator = props.operator ?? null
    this.province = props.province ?? null
    this.city = props.city
    this.district = props.district ?? null
    this.address = props.address
    this.lat = props.lat
    this.lng = props.lng
    this.acPorts = props.acPorts ?? 0
    this.dcPorts = props.dcPorts ?? 0
    this.maxPower = props.maxPower ?? null
    this.connectors = props.connectors ?? null
    this.parkingSpots = props.parkingSpots ?? null
    this.isFree = Boolean(props.isFree)
    this.pricePerKwh = props.pricePerKwh ?? null
    this.isActive = props.isActive !== false && props.isActive !== 0
    this.isVerified = Boolean(props.isVerified)
    this.isOwnerStation = Boolean(props.isOwnerStation)
    this.hours = props.hours ?? null
    this.phone = props.phone ?? null
    this.image1 = props.image1 ?? null
    this.image2 = props.image2 ?? null
    this.image3 = props.image3 ?? null
    this.description = props.description ?? null
    this.dataUpdatedAt = props.dataUpdatedAt ?? null
    this.status = props.status || 'available'
    this.rating = props.rating ?? 0
    this.createdAt = props.createdAt
    this.updatedAt = props.updatedAt

    // فیلدهای مشتق‌شده برای سازگاری با فرانت / مسیریابی
    this.type = deriveStationType(this.acPorts, this.dcPorts)
    this.connector = this.connectors
    this.power = parseMaxPowerKw(this.maxPower)
    this.ports = (Number(this.acPorts) || 0) + (Number(this.dcPorts) || 0)
    this.price = formatStationPrice({ isFree: this.isFree, pricePerKwh: this.pricePerKwh })
    this.image = this.image1
  }

  static assertValidStatus(status) {
    if (!STATION_STATUS.includes(status)) {
      throw new Error(`وضعیت نامعتبر: ${status}`)
    }
  }
}

/**
 * نرمال‌سازی شکل دادهٔ ایستگاه/نظر تا با UI فرانت سازگار باشد.
 * بک‌اند review را با user_name برمی‌گرداند؛ UI فیلد user می‌خواهد.
 */
export function normalizeReview(review) {
  if (!review) return review
  return {
    id: review.id,
    user: review.user ?? review.userName ?? review.user_name ?? 'کاربر',
    text: review.text,
    rating: Number(review.rating),
    stationId: review.stationId ?? review.station_id,
    stationName: review.stationName ?? review.station_name,
    createdAt: review.createdAt ?? review.created_at,
  }
}

function toNum(v, fallback = null) {
  if (v === undefined || v === null || v === '') return fallback
  const n = Number(v)
  return Number.isFinite(n) ? n : fallback
}

export function normalizeStation(station) {
  if (!station) return station
  const reviews = Array.isArray(station.reviews)
    ? station.reviews.map(normalizeReview)
    : []

  const acPorts = toNum(station.acPorts ?? station.ac_ports, 0) ?? 0
  const dcPorts = toNum(station.dcPorts ?? station.dc_ports, 0) ?? 0
  const connectors = station.connectors ?? station.connector ?? null
  const maxPower = station.maxPower ?? station.max_power ?? null
  const power = toNum(station.power, null) ?? (() => {
    const nums = String(maxPower || '').match(/(\d+(?:\.\d+)?)/g)
    return nums?.length ? Math.max(...nums.map(Number)) : 0
  })()
  const ports = toNum(station.ports, null) ?? (acPorts + dcPorts)
  const type = station.type || (
    acPorts > 0 && dcPorts > 0 ? 'AC/DC' : dcPorts > 0 ? 'DC' : 'AC'
  )
  const isFree = Boolean(station.isFree ?? station.is_free)
  const pricePerKwh = station.pricePerKwh ?? station.price_per_kwh ?? null
  const price = station.price ?? (isFree ? 'رایگان' : (pricePerKwh && pricePerKwh !== '0' ? `${pricePerKwh} تومان/kWh` : null))
  const image1 = station.image1 ?? station.image ?? null

  return {
    ...station,
    id: Number(station.id),
    code: station.code ?? null,
    operator: station.operator ?? null,
    province: station.province ?? null,
    district: station.district ?? null,
    lat: toNum(station.lat, null),
    lng: toNum(station.lng, null),
    acPorts,
    dcPorts,
    maxPower,
    connectors,
    connector: connectors,
    parkingSpots: station.parkingSpots ?? station.parking_spots ?? null,
    isFree,
    pricePerKwh,
    isActive: station.isActive !== false && station.is_active !== 0 && station.isActive !== 0,
    isVerified: Boolean(station.isVerified ?? station.is_verified),
    hours: station.hours ?? null,
    phone: station.phone ?? null,
    image1,
    image2: station.image2 ?? null,
    image3: station.image3 ?? null,
    image: image1,
    description: station.description ?? null,
    dataUpdatedAt: station.dataUpdatedAt ?? station.data_updated_at ?? null,
    type,
    power,
    ports,
    price,
    rating: toNum(station.rating, 0) ?? 0,
    reviews,
  }
}

export function normalizeStations(list) {
  return Array.isArray(list) ? list.map(normalizeStation) : []
}

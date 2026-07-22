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

export function normalizeStation(station) {
  if (!station) return station
  const reviews = Array.isArray(station.reviews)
    ? station.reviews.map(normalizeReview)
    : []
  return {
    ...station,
    id: Number(station.id),
    lat: Number(station.lat),
    lng: Number(station.lng),
    power: Number(station.power),
    ports: Number(station.ports),
    rating: Number(station.rating ?? 0),
    reviews,
  }
}

export function normalizeStations(list) {
  return Array.isArray(list) ? list.map(normalizeStation) : []
}

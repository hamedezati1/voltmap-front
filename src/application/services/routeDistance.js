import { AppError } from '../../domain/errors/AppError.js'

function haversine(lat1, lon1, lat2, lon2) {
  const R = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLon = ((lon2 - lon1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

/** اضافهٔ مسیر اگر از ایستگاه رد شویم، نسبت به خط مستقیم مبدا تا مقصد. */
function straightDeviation(station, origin, destination) {
  const direct = haversine(origin.lat, origin.lng, destination.lat, destination.lng)
  const via =
    haversine(origin.lat, origin.lng, station.lat, station.lng) +
    haversine(station.lat, station.lng, destination.lat, destination.lng)
  return Math.max(0, via - direct)
}

function isSamePoint(a, b) {
  return Math.abs(Number(a.lat) - Number(b.lat)) < 1e-5 && Math.abs(Number(a.lng) - Number(b.lng)) < 1e-5
}

function projectSegment(point, a, b) {
  const lat0 = (((a.lat + b.lat) / 2) * Math.PI) / 180
  const kx = Math.cos(lat0) * 111.32
  const ky = 110.574
  const bx = (b.lng - a.lng) * kx
  const by = (b.lat - a.lat) * ky
  const px = (point.lng - a.lng) * kx
  const py = (point.lat - a.lat) * ky
  const len2 = bx * bx + by * by
  let t = 0
  if (len2 > 1e-12) {
    t = (px * bx + py * by) / len2
    if (t < 0) t = 0
    else if (t > 1) t = 1
  }
  const alongKm = t * Math.hypot(bx, by)
  const deviationKm = Math.hypot(px - t * bx, py - t * by)
  return { alongKm, deviationKm }
}

function buildProfile(coordinates, distanceKm) {
  const points = coordinates.map((point) => ({
    lat: Number(point.lat),
    lng: Number(point.lng),
  }))
  const cum = [0]
  for (let i = 1; i < points.length; i += 1) {
    cum.push(cum[i - 1] + haversine(points[i - 1].lat, points[i - 1].lng, points[i].lat, points[i].lng))
  }
  const polylineKm = cum[cum.length - 1]
  const scale = polylineKm > 0.001 ? distanceKm / polylineKm : 1
  return { points, cum, scale, distanceKm }
}

function projectOnRoute(point, profile) {
  let best = { alongKm: 0, deviationKm: Infinity }
  for (let i = 0; i < profile.points.length - 1; i += 1) {
    const hit = projectSegment(point, profile.points[i], profile.points[i + 1])
    if (hit.deviationKm < best.deviationKm) {
      best = {
        alongKm: (profile.cum[i] + hit.alongKm) * profile.scale,
        deviationKm: hit.deviationKm,
      }
    }
  }
  return best
}

function usableDrivingRoute(drivingRoute) {
  return (
    Number.isFinite(drivingRoute?.distanceKm) &&
    drivingRoute.distanceKm >= 0 &&
    Array.isArray(drivingRoute.coordinates) &&
    drivingRoute.coordinates.length >= 2
  )
}

/**
 * فاصلهٔ برنامه‌ریزی سفر.
 * با drivingRoute، کیلومترها طول جاده است (همان عددی که مسیریاب نشان می‌دهد).
 * بدون آن، رفتار قبلی (خط مستقیم) حفظ می‌شود.
 */
export function createRouteDistance(origin, destination, drivingRoute = null) {
  if (!drivingRoute) {
    const totalDist = haversine(origin.lat, origin.lng, destination.lat, destination.lng)
    return {
      totalDist,
      between(a, b) {
        return haversine(a.lat, a.lng, b.lat, b.lng)
      },
      deviation(station) {
        return straightDeviation(station, origin, destination)
      },
      progress(point) {
        return haversine(origin.lat, origin.lng, point.lat, point.lng)
      },
    }
  }

  if (!usableDrivingRoute(drivingRoute)) {
    throw new AppError('مسیر رانندگی نامعتبر است', 'ROUTING_FAILED')
  }

  const profile = buildProfile(drivingRoute.coordinates, drivingRoute.distanceKm)
  const cache = new Map()
  const originLoc = { alongKm: 0, deviationKm: 0 }
  const destLoc = { alongKm: profile.distanceKm, deviationKm: 0 }

  function locate(point) {
    if (isSamePoint(point, origin)) return originLoc
    if (isSamePoint(point, destination)) return destLoc
    const key = `${Number(point.lat).toFixed(6)},${Number(point.lng).toFixed(6)}`
    const cached = cache.get(key)
    if (cached) return cached
    const hit = projectOnRoute(point, profile)
    cache.set(key, hit)
    return hit
  }

  return {
    totalDist: profile.distanceKm,
    between(a, b) {
      const from = locate(a)
      const to = locate(b)
      return Math.abs(to.alongKm - from.alongKm) + from.deviationKm + to.deviationKm
    },
    deviation(station) {
      return locate(station).deviationKm
    },
    progress(point) {
      return locate(point).alongKm
    },
  }
}

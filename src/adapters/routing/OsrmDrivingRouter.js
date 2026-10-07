import { DrivingRouter } from '../../application/ports/services/DrivingRouter.js'
import { AppError } from '../../domain/errors/AppError.js'
import { logger } from '../../infrastructure/logger.js'

/**
 * فاصلهٔ رانندگی از OSRM (شبکهٔ جادهٔ OpenStreetMap).
 * distance بر حسب متر است و همان طول مسیر ماشین است، نه خط مستقیم.
 */
export class OsrmDrivingRouter extends DrivingRouter {
  constructor({ baseUrl, timeoutMs, fetchImpl } = {}) {
    super()
    this.baseUrl = (baseUrl || 'https://router.project-osrm.org').replace(/\/$/, '')
    this.timeoutMs = timeoutMs || 8000
    this.fetchImpl = fetchImpl || fetch
  }

  async route(origin, destination) {
    const path = `${Number(origin.lng)},${Number(origin.lat)};${Number(destination.lng)},${Number(destination.lat)}`
    const url = `${this.baseUrl}/route/v1/driving/${path}?overview=full&geometries=geojson&alternatives=false&steps=false`

    let response
    try {
      response = await this.fetchImpl(url, { signal: AbortSignal.timeout(this.timeoutMs) })
    } catch (err) {
      logger.error('OSRM network error', { error: err.message })
      throw new AppError('محاسبه فاصله رانندگی ممکن نشد. کمی بعد دوباره تلاش کنید', 'ROUTING_FAILED')
    }

    let data
    try {
      data = await response.json()
    } catch (err) {
      logger.error('OSRM invalid response', { error: err.message, httpStatus: response.status })
      throw new AppError('محاسبه فاصله رانندگی ممکن نشد. کمی بعد دوباره تلاش کنید', 'ROUTING_FAILED')
    }

    if (!response.ok || data?.code !== 'Ok' || !data.routes?.[0]) {
      logger.error('OSRM route failed', { httpStatus: response.status, code: data?.code })
      const message =
        data?.code === 'NoRoute'
          ? 'مسیر رانندگی بین این دو نقطه پیدا نشد'
          : 'محاسبه فاصله رانندگی ممکن نشد. کمی بعد دوباره تلاش کنید'
      throw new AppError(message, 'ROUTING_FAILED')
    }

    const driving = data.routes[0]
    const coordinates = (driving.geometry?.coordinates || []).map(([lng, lat]) => ({
      lat: Number(lat),
      lng: Number(lng),
    }))
    if (!Number.isFinite(driving.distance) || coordinates.length < 2) {
      logger.error('OSRM route missing distance', { code: data.code })
      throw new AppError('محاسبه فاصله رانندگی ممکن نشد. کمی بعد دوباره تلاش کنید', 'ROUTING_FAILED')
    }

    return {
      distanceKm: driving.distance / 1000,
      durationMin: Number(driving.duration) / 60,
      coordinates,
    }
  }
}

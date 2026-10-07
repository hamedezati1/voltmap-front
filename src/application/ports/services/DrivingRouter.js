/**
 * Port فاصله و شکل مسیر رانندگی بین دو نقطه.
 * پیاده‌سازی فعلی: OsrmDrivingRouter
 */
export class DrivingRouter {
  /**
   * @returns {Promise<{ distanceKm: number, durationMin: number, coordinates: Array<{lat: number, lng: number}> }>}
   */
  async route(_origin, _destination) {
    throw new Error('Not implemented')
  }
}

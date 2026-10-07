/**
 * Smart Routes API
 *
 * Endpoints (backend):
 *   POST   /routes/plan           — برنامه‌ریزی مسیر با توقف‌های شارژ
 *   GET    /routes/history        — تاریخچه مسیرها
 *   GET    /routes/:id            — جزئیات یک مسیر
 */
import { apiClient, USE_MOCK } from './client'

export async function planRoute({ origin, destination, vehicleRange, batteryPct, connector }) {
  if (USE_MOCK) {
    await new Promise(r => setTimeout(r, 600))
    return {
      id: 'mock-route-1',
      origin,
      destination,
      feasible: false,
      totalDist: 0,
      stops: [],
      finalBattery: 0,
      warnings: [],
      totalCost: 0,
      totalChargeTime: 0,
      message: 'محاسبه مسیر فقط با بک‌اند واقعی انجام می‌شود',
    }
  }
  return apiClient('/routes/plan', {
    method: 'POST',
    body: { origin, destination, vehicleRange, batteryPct, connector },
  })
}

export async function fetchRouteHistory() {
  if (USE_MOCK) {
    await new Promise(r => setTimeout(r, 300))
    return []
  }
  return apiClient('/routes/history')
}

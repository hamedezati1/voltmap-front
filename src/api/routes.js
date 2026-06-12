/**
 * Smart Routes API
 *
 * Endpoints (backend):
 *   POST   /routes/plan           — برنامه‌ریزی مسیر با توقف‌های شارژ
 *   GET    /routes/history        — تاریخچه مسیرها
 *   GET    /routes/:id            — جزئیات یک مسیر
 */
import { apiClient, USE_MOCK } from './client'

export async function planRoute({ origin, destination, vehicleRange, connectorType }) {
  if (USE_MOCK) {
    await new Promise(r => setTimeout(r, 600))
    return {
      id: 'mock-route-1',
      origin,
      destination,
      totalDistance: 420,
      totalDuration: 285,
      chargingStops: [],
      message: 'این بخش به زودی فعال می‌شود',
    }
  }
  return apiClient('/routes/plan', {
    method: 'POST',
    body: { origin, destination, vehicleRange, connectorType },
  })
}

export async function fetchRouteHistory() {
  if (USE_MOCK) {
    await new Promise(r => setTimeout(r, 300))
    return []
  }
  return apiClient('/routes/history')
}

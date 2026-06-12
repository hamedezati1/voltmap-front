/**
 * Admin API
 *
 * Endpoints (backend):
 *   GET    /admin/dashboard       — آمار کلی داشبورد
 *   GET    /admin/reviews         — همه نظرات
 *   GET    /admin/reports/usage   — نمودار استفاده
 */
import { apiClient, USE_MOCK } from './client'
import { mockStations } from '../mocks/stations'

export async function fetchDashboardStats() {
  if (USE_MOCK) {
    await new Promise(r => setTimeout(r, 300))
    const stations = await mockStations.getAll()
    const allReviews = stations.flatMap(s =>
      s.reviews.map(r => ({ ...r, stationName: s.name, stationId: s.id }))
    )
    return {
      totalStations: stations.length,
      available: stations.filter(s => s.status === 'available').length,
      busy: stations.filter(s => s.status === 'busy').length,
      waiting: stations.filter(s => s.status === 'waiting').length,
      offline: stations.filter(s => s.status === 'offline').length,
      totalReviews: allReviews.length,
      usageChart: {
        labels: ['۱۸ خرداد', '۱۹', '۲۰', '۲۱', '۲۲', '۲۳', '۲۴'],
        values: [120, 145, 130, 190, 175, 220, 180],
      },
    }
  }
  return apiClient('/admin/dashboard')
}

export async function fetchAllReviews() {
  if (USE_MOCK) {
    const stations = await mockStations.getAll()
    return stations.flatMap(s =>
      s.reviews.map(r => ({ ...r, stationName: s.name, stationId: s.id }))
    )
  }
  return apiClient('/admin/reviews')
}

export async function fetchUsageReport(days = 7) {
  if (USE_MOCK) {
    await new Promise(r => setTimeout(r, 300))
    return {
      labels: ['۱۸ خرداد', '۱۹', '۲۰', '۲۱', '۲۲', '۲۳', '۲۴'],
      values: [120, 145, 130, 190, 175, 220, 180],
    }
  }
  return apiClient(`/admin/reports/usage?days=${days}`)
}

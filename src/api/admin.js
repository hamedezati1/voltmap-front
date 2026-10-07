/**
 * Admin API
 *
 * Endpoints (backend):
 *   GET    /admin/dashboard
 *   GET    /admin/reviews
 *   DELETE /admin/stations/:stationId/reviews/:reviewId
 *   GET    /admin/reports/usage?days=
 *   GET    /admin/users
 *   PATCH  /admin/users/:userId/membership
 */
import { apiClient, USE_MOCK } from './client'
import { normalizeReview } from './normalize'
import { mockStations } from '../mocks/stations'
import { updateUserMembership as mockUpdateMembership, getStoredSession } from '../mocks/auth'

const USERS_KEY = 'voltmap_users'

function readMockUsers() {
  try {
    const raw = localStorage.getItem(USERS_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

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
    }
  }
  return apiClient('/admin/dashboard')
}

export async function fetchAllReviews() {
  if (USE_MOCK) {
    const stations = await mockStations.getAll()
    return stations.flatMap(s =>
      s.reviews.map(r => normalizeReview({ ...r, stationName: s.name, stationId: s.id }))
    )
  }
  const list = await apiClient('/admin/reviews')
  return Array.isArray(list) ? list.map(normalizeReview) : []
}

export async function deleteStationReview(stationId, reviewId) {
  if (USE_MOCK) {
    const stations = await mockStations.getAll()
    const station = stations.find((s) => Number(s.id) === Number(stationId))
    if (!station) throw new Error('ایستگاه یافت نشد')
    const reviews = (station.reviews || []).filter((r) => Number(r.id) !== Number(reviewId))
    if (reviews.length === (station.reviews || []).length) throw new Error('نظر این ایستگاه یافت نشد')
    const rating = reviews.length
      ? Math.round((reviews.reduce((sum, r) => sum + Number(r.rating || 0), 0) / reviews.length) * 10) / 10
      : 0
    await mockStations.update(station.id, { reviews, rating })
    return { stationId: Number(stationId), reviewId: Number(reviewId), rating }
  }
  return apiClient(`/admin/stations/${stationId}/reviews/${reviewId}`, { method: 'DELETE' })
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

export async function fetchUsers() {
  if (USE_MOCK) {
    await new Promise(r => setTimeout(r, 200))
    return readMockUsers().map(({ password, ...u }) => u)
  }
  return apiClient('/admin/users')
}

export async function updateUserMembership(userId, membership) {
  if (USE_MOCK) {
    mockUpdateMembership(userId, membership)
    return readMockUsers().find(u => u.id === userId) ?? null
  }
  return apiClient(`/admin/users/${userId}/membership`, {
    method: 'PATCH',
    body: { membership },
  })
}

/** حذف کاربر فقط در حالت mock پشتیبانی می‌شود (بک‌اند endpoint ندارد) */
export async function deleteUser(userId) {
  if (USE_MOCK) {
    const updated = readMockUsers().filter(u => u.id !== userId)
    localStorage.setItem(USERS_KEY, JSON.stringify(updated))
    const session = getStoredSession()
    if (session?.user?.id === userId) {
      localStorage.removeItem('voltmap_session')
    }
    return true
  }
  throw new Error('حذف کاربر در بک‌اند هنوز پیاده‌سازی نشده است')
}

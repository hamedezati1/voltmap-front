/**
 * Profile API
 *
 * Endpoints (backend):
 *   GET    /profile                  — پروفایل کاربر جاری
 *   PATCH  /profile                  — ویرایش پروفایل
 *   GET    /profile/favorites         — ایستگاه‌های مورد علاقه (با جزئیات کامل)
 *   POST   /profile/favorites/:id    — افزودن به علاقه‌مندی‌ها
 *   DELETE /profile/favorites/:id    — حذف از علاقه‌مندی‌ها
 */
import { apiClient, USE_MOCK } from './client'
import { mockProfile } from '../mocks/profile'
import { mockStations } from '../mocks/stations'
import { getStoredSession } from '../mocks/auth'

function currentUserId() {
  const session = getStoredSession()
  return session?.user?.id ?? null
}

export async function fetchProfile() {
  if (USE_MOCK) {
    const session = getStoredSession()
    const userId = session?.user?.id ?? null
    const stored = await mockProfile.get(userId)
    // اطلاعات اصلی کاربر از session میاد، بقیه از profile store
    return {
      name: session?.user?.name ?? '',
      email: session?.user?.email ?? '',
      phone: session?.user?.phone ?? '',
      // membership اول از session (که ادمین آپدیت می‌کنه) خونده می‌شه
      // TODO: وقتی به دیتابیس وصل شد، از GET /profile/membership بگیر
      membership: session?.user?.membership ?? stored.membership ?? 'رایگان',
      totalSessions: stored.totalSessions ?? 0,
      totalKwh: stored.totalKwh ?? 0,
      favoriteStationIds: stored.favoriteStationIds ?? [],
    }
  }
  return apiClient('/profile')
}

export async function updateProfile(data) {
  if (USE_MOCK) {
    const userId = currentUserId()
    return mockProfile.update(userId, data)
  }
  return apiClient('/profile', { method: 'PATCH', body: data })
}

/** لیست ایستگاه‌های مورد علاقه با جزئیات کامل (سینک با stations store) */
export async function fetchFavoriteStations() {
  if (USE_MOCK) {
    const userId = currentUserId()
    const profile = await mockProfile.get(userId)
    const ids = profile.favoriteStationIds ?? []
    if (ids.length === 0) return []
    const allStations = await mockStations.getAll()
    return allStations.filter(s => ids.includes(s.id))
  }
  return apiClient('/profile/favorites')
}

export async function addFavoriteStation(stationId) {
  if (USE_MOCK) {
    const userId = currentUserId()
    await mockProfile.addFavorite(userId, stationId)
    return true
  }
  return apiClient(`/profile/favorites/${stationId}`, { method: 'POST' })
}

export async function removeFavoriteStation(stationId) {
  if (USE_MOCK) {
    const userId = currentUserId()
    await mockProfile.removeFavorite(userId, stationId)
    return true
  }
  return apiClient(`/profile/favorites/${stationId}`, { method: 'DELETE' })
}

export function isFavoriteStation(stationId) {
  const userId = currentUserId()
  return mockProfile.isFavorite(userId, stationId)
}

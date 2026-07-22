/**
 * Profile API
 *
 * Endpoints (backend):
 *   GET    /profile
 *   PATCH  /profile
 *   GET    /profile/favorites
 *   POST   /profile/favorites/:id
 *   DELETE /profile/favorites/:id
 */
import { apiClient, USE_MOCK } from './client'
import { normalizeStations } from './normalize'
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
    return {
      name: session?.user?.name ?? '',
      email: session?.user?.email ?? '',
      phone: session?.user?.phone ?? '',
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

export async function fetchFavoriteStations() {
  if (USE_MOCK) {
    const userId = currentUserId()
    const profile = await mockProfile.get(userId)
    const ids = profile.favoriteStationIds ?? []
    if (ids.length === 0) return []
    const allStations = await mockStations.getAll()
    return normalizeStations(allStations.filter(s => ids.includes(s.id)))
  }
  const list = await apiClient('/profile/favorites')
  return normalizeStations(list)
}

export async function addFavoriteStation(stationId) {
  if (USE_MOCK) {
    const userId = currentUserId()
    await mockProfile.addFavorite(userId, stationId)
    return true
  }
  await apiClient(`/profile/favorites/${stationId}`, { method: 'POST' })
  return true
}

export async function removeFavoriteStation(stationId) {
  if (USE_MOCK) {
    const userId = currentUserId()
    await mockProfile.removeFavorite(userId, stationId)
    return true
  }
  await apiClient(`/profile/favorites/${stationId}`, { method: 'DELETE' })
  return true
}

/**
 * بررسی علاقه‌مندی — در حالت real از لیست favorites استفاده می‌شود.
 * برای سازگاری با کد قبلی، هم sync (فقط mock) و هم async قابل استفاده است.
 */
export async function isFavoriteStation(stationId) {
  if (USE_MOCK) {
    const userId = currentUserId()
    return mockProfile.isFavorite(userId, stationId)
  }
  const favorites = await fetchFavoriteStations()
  return favorites.some(s => Number(s.id) === Number(stationId))
}

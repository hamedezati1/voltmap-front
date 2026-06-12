/**
 * Profile API
 *
 * Endpoints (backend):
 *   GET    /profile               — پروفایل کاربر جاری
 *   PATCH  /profile               — ویرایش پروفایل
 *   GET    /profile/favorites     — ایستگاه‌های مورد علاقه
 *   POST   /profile/favorites/:id — افزودن به علاقه‌مندی‌ها
 *   DELETE /profile/favorites/:id — حذف از علاقه‌مندی‌ها
 */
import { apiClient, USE_MOCK } from './client'
import { MOCK_PROFILE } from '../mocks/profile'

export async function fetchProfile() {
  if (USE_MOCK) {
    await new Promise(r => setTimeout(r, 400))
    return { ...MOCK_PROFILE }
  }
  return apiClient('/profile')
}

export async function updateProfile(data) {
  if (USE_MOCK) {
    await new Promise(r => setTimeout(r, 300))
    return { ...MOCK_PROFILE, ...data }
  }
  return apiClient('/profile', { method: 'PATCH', body: data })
}

export async function fetchFavoriteStations() {
  if (USE_MOCK) {
    const profile = await fetchProfile()
    return profile.favoriteStations
  }
  return apiClient('/profile/favorites')
}

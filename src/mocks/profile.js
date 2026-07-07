/**
 * Mock Profile Store
 * مشابه mocks/stations.js — داده در localStorage نگه می‌داره
 * کلید: voltmap_profile_<userId>   (هر کاربر پروفایل جداگانه)
 */

const DEFAULT_PROFILE = {
  membership: 'رایگان',
  totalSessions: 0,
  totalKwh: 0,
  favoriteStationIds: [],   // آرایه‌ای از id های ایستگاه
}

function getKey(userId) {
  return `voltmap_profile_${userId || 'guest'}`
}

function readProfile(userId) {
  try {
    const raw = localStorage.getItem(getKey(userId))
    return raw ? JSON.parse(raw) : { ...DEFAULT_PROFILE }
  } catch {
    return { ...DEFAULT_PROFILE }
  }
}

function writeProfile(userId, data) {
  try {
    localStorage.setItem(getKey(userId), JSON.stringify(data))
  } catch {
    // ignore
  }
}

function delay(ms = 300) {
  return new Promise(r => setTimeout(r, ms))
}

export const mockProfile = {
  async get(userId) {
    await delay()
    return readProfile(userId)
  },

  async update(userId, data) {
    await delay()
    const current = readProfile(userId)
    const updated = { ...current, ...data }
    writeProfile(userId, updated)
    return updated
  },

  async addFavorite(userId, stationId) {
    await delay(200)
    const profile = readProfile(userId)
    const ids = profile.favoriteStationIds || []
    if (!ids.includes(stationId)) {
      const updated = { ...profile, favoriteStationIds: [...ids, stationId] }
      writeProfile(userId, updated)
      return updated
    }
    return profile
  },

  async removeFavorite(userId, stationId) {
    await delay(200)
    const profile = readProfile(userId)
    const updated = {
      ...profile,
      favoriteStationIds: (profile.favoriteStationIds || []).filter(id => id !== stationId),
    }
    writeProfile(userId, updated)
    return updated
  },

  isFavorite(userId, stationId) {
    const profile = readProfile(userId)
    return (profile.favoriteStationIds || []).includes(stationId)
  },
}

// برای سازگاری با import قدیمی
export const MOCK_PROFILE = DEFAULT_PROFILE

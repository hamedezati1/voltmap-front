/**
 * Stations API
 *
 * Endpoints (backend):
 *   GET    /stations              — لیست ایستگاه‌ها (+ query: search, type, status, city, province, operator)
 *   GET    /stations/:id          — جزئیات یک ایستگاه
 *   POST   /stations              — ایجاد (admin)
 *   PATCH  /stations/:id          — ویرایش (admin)
 *   DELETE /stations/:id          — حذف (admin)
 *   POST   /stations/:id/reviews  — ثبت نظر (نام از حساب کاربر)
 *   PATCH  /stations/:id/status   — تغییر وضعیت
 *   POST   /stations/:id/crowd-report
 *   GET    /stations/:id/crowd-reports
 *   GET    /stations/crowd-reports/summary
 */
import { apiClient, USE_MOCK } from './client'
import { normalizeStation, normalizeStations } from './normalize'
import { mockStations, crowdReports } from '../mocks/stations'
import { getStoredSession } from '../mocks/auth'

/** فقط فیلدهای تعریف‌شده را می‌فرستد (مناسب PATCH جزئی) */
function toStationPayload(data) {
  const out = {}
  const keys = [
    'code', 'name', 'operator', 'province', 'city', 'district', 'address',
    'lat', 'lng', 'acPorts', 'dcPorts', 'maxPower', 'connectors', 'parkingSpots',
    'isFree', 'pricePerKwh', 'isActive', 'isVerified', 'isOwnerStation', 'hours', 'phone',
    'image1', 'image2', 'image3', 'description', 'dataUpdatedAt', 'status',
    // سازگاری با فرم قدیمی
    'type', 'connector', 'power', 'ports', 'price', 'image',
  ]
  for (const key of keys) {
    if (data[key] === undefined) continue
    if (key === 'lat' || key === 'lng' || key === 'power' || key === 'ports' || key === 'acPorts' || key === 'dcPorts') {
      out[key] = data[key] === null || data[key] === '' ? null : Number(data[key])
    } else {
      out[key] = data[key]
    }
  }
  return out
}

export async function fetchStations(params = {}) {
  if (USE_MOCK) {
    let list = await mockStations.getAll()
    const { search, type, status, city } = params
    if (search) {
      const q = search.toLowerCase()
      list = list.filter(s =>
        s.name.includes(q) || s.city.includes(q) || s.address.includes(q)
      )
    }
    if (type) list = list.filter(s => s.type.includes(type))
    if (status) list = list.filter(s => s.status === status)
    if (city) list = list.filter(s => s.city === city)
    return normalizeStations(list)
  }
  const cleaned = Object.fromEntries(
    Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== '')
  )
  const query = new URLSearchParams(cleaned).toString()
  const list = await apiClient(`/stations${query ? `?${query}` : ''}`)
  return normalizeStations(list)
}

export async function fetchStationById(id) {
  if (USE_MOCK) return normalizeStation(await mockStations.getById(id))
  return normalizeStation(await apiClient(`/stations/${id}`))
}

/** یک ایستگاه ساخته‌شده را برمی‌گرداند (نه کل لیست) */
export async function createStation(data) {
  if (USE_MOCK) return normalizeStation(await mockStations.create(data))
  return normalizeStation(await apiClient('/stations', {
    method: 'POST',
    body: toStationPayload(data),
  }))
}

/** ایستگاه به‌روزشده را برمی‌گرداند */
export async function updateStation(id, changes) {
  if (USE_MOCK) return normalizeStation(await mockStations.update(id, changes))
  return normalizeStation(await apiClient(`/stations/${id}`, {
    method: 'PATCH',
    body: toStationPayload(changes),
  }))
}

export async function deleteStation(id) {
  if (USE_MOCK) {
    await mockStations.delete(id)
    return true
  }
  await apiClient(`/stations/${id}`, { method: 'DELETE' })
  return true
}

/**
 * ثبت نظر — نام را بک‌اند از حساب کاربر می‌خواند.
 * body: { text, rating }
 */
export async function addStationReview(stationId, review) {
  const payload = { text: review.text, rating: Number(review.rating) }

  if (USE_MOCK) {
    const session = getStoredSession()
    const userName = session?.user?.name || session?.user?.phone || 'کاربر'
    const list = await mockStations.addReview(stationId, {
      user: userName,
      text: payload.text,
      rating: payload.rating,
    })
    const station = list.find(s => Number(s.id) === Number(stationId))
    return normalizeStation(station)
  }
  return normalizeStation(await apiClient(`/stations/${stationId}/reviews`, {
    method: 'POST',
    body: payload,
  }))
}

export async function updateStationStatus(id, status) {
  if (USE_MOCK) {
    return normalizeStation(await mockStations.update(id, { status }))
  }
  return normalizeStation(await apiClient(`/stations/${id}/status`, {
    method: 'PATCH',
    body: { status },
  }))
}

export async function submitCrowdReport(stationId, type) {
  if (USE_MOCK) {
    const computedStatus = crowdReports.addReport(stationId, type)
    if (computedStatus) {
      await mockStations.update(stationId, { status: computedStatus })
      return { status: computedStatus, updated: true }
    }
    return { status: null, updated: false }
  }
  return apiClient(`/stations/${stationId}/crowd-report`, {
    method: 'POST',
    body: { type },
  })
}

export async function getCrowdStats(stationId) {
  if (USE_MOCK) return crowdReports.getStats(stationId)
  return apiClient(`/stations/${stationId}/crowd-reports`)
}

export async function getAllCrowdStats() {
  if (USE_MOCK) return crowdReports.getAllStats()
  return apiClient('/stations/crowd-reports/summary')
}

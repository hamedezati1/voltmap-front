/**
 * Stations API
 *
 * Endpoints (backend):
 *   GET    /stations              — لیست ایستگاه‌ها (+ query: search, type, status, city)
 *   GET    /stations/:id          — جزئیات یک ایستگاه
 *   POST   /stations              — ایجاد (admin)
 *   PATCH  /stations/:id          — ویرایش (admin)
 *   DELETE /stations/:id          — حذف (admin)
 *   POST   /stations/:id/reviews  — ثبت نظر
 *   PATCH  /stations/:id/status   — تغییر وضعیت
 *   POST   /stations/:id/crowd-report
 *   GET    /stations/:id/crowd-reports
 *   GET    /stations/crowd-reports/summary
 */
import { apiClient, USE_MOCK } from './client'
import { normalizeStation, normalizeStations } from './normalize'
import { mockStations, crowdReports } from '../mocks/stations'

/** فقط فیلدهای تعریف‌شده را می‌فرستد (مناسب PATCH جزئی) */
function toStationPayload(data) {
  const out = {}
  if (data.name !== undefined) out.name = data.name
  if (data.city !== undefined) out.city = data.city
  if (data.address !== undefined) out.address = data.address
  if (data.lat !== undefined) out.lat = Number(data.lat)
  if (data.lng !== undefined) out.lng = Number(data.lng)
  if (data.type !== undefined) out.type = data.type
  if (data.connector !== undefined) out.connector = data.connector
  if (data.power !== undefined) out.power = Number(data.power)
  if (data.ports !== undefined) out.ports = Number(data.ports)
  if (data.status !== undefined) out.status = data.status
  if (data.price !== undefined) out.price = data.price
  if (data.hours !== undefined) out.hours = data.hours
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
 * ثبت نظر — همیشه ایستگاه به‌روزشده را برمی‌گرداند
 * body بک‌اند: { userName, text, rating }
 */
export async function addStationReview(stationId, review) {
  const userName = review.userName ?? review.user ?? 'کاربر ناشناس'
  const payload = { userName, text: review.text, rating: Number(review.rating) }

  if (USE_MOCK) {
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

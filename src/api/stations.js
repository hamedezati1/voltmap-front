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
 */
import { apiClient, USE_MOCK } from './client'
import { mockStations, crowdReports } from '../mocks/stations'

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
    return list
  }
  const query = new URLSearchParams(params).toString()
  return apiClient(`/stations${query ? `?${query}` : ''}`)
}

export async function fetchStationById(id) {
  if (USE_MOCK) return mockStations.getById(id)
  return apiClient(`/stations/${id}`)
}

export async function createStation(data) {
  if (USE_MOCK) {
    await mockStations.create(data)
    return mockStations.getAll()
  }
  return apiClient('/stations', { method: 'POST', body: data })
}

export async function updateStation(id, changes) {
  if (USE_MOCK) {
    await mockStations.update(id, changes)
    return mockStations.getAll()
  }
  return apiClient(`/stations/${id}`, { method: 'PATCH', body: changes })
}

export async function deleteStation(id) {
  if (USE_MOCK) return mockStations.delete(id)
  return apiClient(`/stations/${id}`, { method: 'DELETE' })
}

export async function addStationReview(stationId, review) {
  if (USE_MOCK) return mockStations.addReview(stationId, review)
  return apiClient(`/stations/${stationId}/reviews`, { method: 'POST', body: review })
}

export async function updateStationStatus(id, status) {
  if (USE_MOCK) {
    await mockStations.update(id, { status })
    return mockStations.getAll()
  }
  return apiClient(`/stations/${id}/status`, { method: 'PATCH', body: { status } })
}

// ─── گزارش وضعیت شلوغی از کاربران ────────────────────────────────────────
// TODO: وقتی به دیتابیس وصل شد، این توابع باید به endpoint‌های واقعی وصل شوند


/**
 * ثبت گزارش حضور کاربر در ایستگاه
 * @param {number} stationId - شناسه ایستگاه
 * @param {'busy'|'available'} type - نوع گزارش
 * TODO: POST /stations/:id/crowd-report
 */
export async function submitCrowdReport(stationId, type) {
  if (USE_MOCK) {
    const computedStatus = crowdReports.addReport(stationId, type)
    // اگه به حد نصاب رسید وضعیت ایستگاه رو آپدیت کن
    if (computedStatus) {
      await mockStations.update(stationId, { status: computedStatus })
      return { status: computedStatus, updated: true }
    }
    return { status: null, updated: false }
  }
  return apiClient(`/stations/${stationId}/crowd-report`, { method: 'POST', body: { type } })
}

/**
 * دریافت آمار گزارش‌های یک ایستگاه (برای ادمین)
 * TODO: GET /stations/:id/crowd-reports
 */
export function getCrowdStats(stationId) {
  if (USE_MOCK) return crowdReports.getStats(stationId)
  return apiClient(`/stations/${stationId}/crowd-reports`)
}

/**
 * دریافت خلاصه گزارش‌های همه ایستگاه‌ها (برای داشبورد ادمین)
 * TODO: GET /stations/crowd-reports/summary
 */
export function getAllCrowdStats() {
  if (USE_MOCK) return crowdReports.getAllStats()
  return apiClient('/stations/crowd-reports/summary')
}

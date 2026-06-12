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
import { mockStations } from '../mocks/stations'

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

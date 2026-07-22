/**
 * Station Reports API
 *
 * Endpoints (backend):
 *   POST   /station-reports
 *   GET    /station-reports?status=
 *   PATCH  /station-reports/:id/approve
 *   PATCH  /station-reports/:id/reject
 *   DELETE /station-reports/:id
 */
import { apiClient, USE_MOCK } from './client'
import { mockStationReports } from '../mocks/stationReportsmoks'

/** فقط فیلدهای مجاز بک‌اند را می‌فرستد */
function toReportPayload(data) {
  return {
    name: data.name,
    city: data.city || undefined,
    address: data.address || undefined,
    lat: data.lat !== undefined && data.lat !== '' ? Number(data.lat) : undefined,
    lng: data.lng !== undefined && data.lng !== '' ? Number(data.lng) : undefined,
    type: data.type === 'AC' || data.type === 'DC' ? data.type : undefined,
    connector: data.connector || undefined,
    notes: data.notes ?? data.ownerNote ?? undefined,
  }
}

export async function fetchStationReports(status) {
  if (USE_MOCK) return mockStationReports.getAll()
  const query = status ? `?status=${encodeURIComponent(status)}` : ''
  return apiClient(`/station-reports${query}`)
}

export async function submitStationReport(data) {
  if (USE_MOCK) return mockStationReports.create(data)
  return apiClient('/station-reports', {
    method: 'POST',
    body: toReportPayload(data),
  })
}

export async function approveStationReport(id) {
  if (USE_MOCK) return mockStationReports.approve(id)
  return apiClient(`/station-reports/${id}/approve`, { method: 'PATCH' })
}

export async function rejectStationReport(id, reason) {
  if (USE_MOCK) return mockStationReports.reject(id, reason)
  return apiClient(`/station-reports/${id}/reject`, {
    method: 'PATCH',
    body: { reason },
  })
}

export async function deleteStationReport(id) {
  if (USE_MOCK) return mockStationReports.remove(id)
  await apiClient(`/station-reports/${id}`, { method: 'DELETE' })
  return true
}

/**
 * Station Reports API
 *
 * TODO: وقتی به دیتابیس وصل شد، endpoint های واقعی:
 *   POST   /station-reports          — ثبت گزارش ایستگاه جدید توسط کاربر
 *   GET    /station-reports?status=  — لیست برای ادمین
 *   PATCH  /station-reports/:id      — تأیید یا رد توسط ادمین
 *   DELETE /station-reports/:id      — حذف
 */
import { apiClient, USE_MOCK } from './client'
import { mockStationReports } from '../mocks/stationReportsmoks'

export async function fetchStationReports() {
  if (USE_MOCK) return mockStationReports.getAll()
  return apiClient('/station-reports')
}

export async function submitStationReport(data) {
  if (USE_MOCK) return mockStationReports.create(data)
  return apiClient('/station-reports', { method: 'POST', body: data })
}

export async function approveStationReport(id) {
  if (USE_MOCK) return mockStationReports.approve(id)
  return apiClient(`/station-reports/${id}/approve`, { method: 'PATCH' })
}

export async function rejectStationReport(id, reason) {
  if (USE_MOCK) return mockStationReports.reject(id, reason)
  return apiClient(`/station-reports/${id}/reject`, { method: 'PATCH', body: { reason } })
}

export async function deleteStationReport(id) {
  if (USE_MOCK) return mockStationReports.remove(id)
  return apiClient(`/station-reports/${id}`, { method: 'DELETE' })
}

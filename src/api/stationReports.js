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
import { normalizeStation } from './normalize'
import { mockStationReports } from '../mocks/stationReportsmoks'
import { mockStations } from '../mocks/stations'

/**
 * فقط فیلدهای مجاز بک‌اند را می‌فرستد.
 * ایستگاه عمومی برای هر عضویت مجاز است؛ isHome را بک‌اند فقط با اشتراک پرو می‌پذیرد.
 */
function toReportPayload(data) {
  const isFree = Boolean(data.isFree) || data.price === 'رایگان'
  return {
    name: data.name,
    city: data.city || undefined,
    address: data.address || undefined,
    lat: data.lat !== undefined && data.lat !== '' ? Number(data.lat) : undefined,
    lng: data.lng !== undefined && data.lng !== '' ? Number(data.lng) : undefined,
    type: data.type || undefined,
    connector: data.connector || undefined,
    notes: data.notes ?? data.ownerNote ?? undefined,
    hours: data.hours || undefined,
    power: data.power === '' || data.power === undefined ? undefined : Number(data.power),
    ports: data.ports === '' || data.ports === undefined ? undefined : Number(data.ports),
    price: isFree ? null : (data.price == null ? undefined : String(data.price)),
    isFree,
    isHome: Boolean(data.isHome),
    image: data.image || null,
  }
}

export function normalizeStationReport(report) {
  if (!report) return report
  const { station, ...rest } = report
  return {
    ...rest,
    isHome: Boolean(rest.isHome ?? rest.is_home),
    isFree: Boolean(rest.isFree ?? rest.is_free),
    power: rest.power == null || rest.power === '' ? rest.power : Number(rest.power),
    ports: rest.ports == null || rest.ports === '' ? rest.ports : Number(rest.ports),
    reporterName: rest.reporterName ?? rest.reporter_name ?? null,
    reporterMembership: rest.reporterMembership ?? rest.reporter_membership ?? null,
    createdAt: rest.createdAt ?? rest.created_at ?? null,
    rejectReason: rest.rejectReason ?? rest.reject_reason ?? null,
    notes: rest.notes ?? rest.ownerNote ?? null,
    ...(station ? { station: normalizeStation(station) } : {}),
  }
}

export async function fetchStationReports(status, kind) {
  if (USE_MOCK) {
    const list = await mockStationReports.getAll()
    return list
      .filter((report) => !status || report.status === status)
      .filter((report) => !kind || (kind === 'home' ? report.isHome : !report.isHome))
      .map(normalizeStationReport)
  }
  const params = new URLSearchParams()
  if (status) params.set('status', status)
  if (kind) params.set('kind', kind)
  const query = params.toString()
  const list = await apiClient(`/station-reports${query ? `?${query}` : ''}`)
  return Array.isArray(list) ? list.map(normalizeStationReport) : []
}

function reportToStation(report) {
  const type = report.type === 'DC' ? 'DC' : report.type === 'AC/DC' ? 'AC/DC' : 'AC'
  const ports = Number(report.ports) || 1
  const priceText = String(report.price ?? '').trim()
  const isFree = Boolean(report.isFree) || priceText === 'رایگان'
  const isHome = Boolean(report.isHome)
  return {
    name: report.name,
    city: report.city || 'نامشخص',
    address: report.address || 'نامشخص',
    lat: report.lat ?? 35.6892,
    lng: report.lng ?? 51.389,
    type,
    connector: report.connector || 'Type2',
    connectors: report.connector || 'Type2',
    power: report.power || 22,
    maxPower: String(report.power || 22),
    ports,
    acPorts: type === 'DC' ? 0 : type === 'AC/DC' ? Math.max(1, Math.floor(ports / 2)) : ports,
    dcPorts: type === 'AC' ? 0 : type === 'AC/DC' ? Math.max(1, ports - Math.floor(ports / 2)) : ports,
    status: 'available',
    isFree,
    pricePerKwh: isFree ? null : priceText || null,
    hours: report.hours || '۲۴ ساعته',
    description: report.notes || report.ownerNote || null,
    image: report.image || null,
    isHomeStation: isHome,
    isOwnerStation: isHome,
    ownerName: report.reporterName || null,
    ownerId: report.reportedBy ?? report.userId ?? null,
  }
}

export async function submitStationReport(data) {
  if (USE_MOCK) return normalizeStationReport(await mockStationReports.create(data))
  return normalizeStationReport(await apiClient('/station-reports', {
    method: 'POST',
    body: toReportPayload(data),
  }))
}

export async function approveStationReport(id) {
  if (USE_MOCK) {
    const report = normalizeStationReport(await mockStationReports.approve(id))
    const station = normalizeStation(await mockStations.create(reportToStation(report)))
    return { ...report, station }
  }
  return normalizeStationReport(await apiClient(`/station-reports/${id}/approve`, { method: 'PATCH' }))
}

export async function rejectStationReport(id, reason) {
  if (USE_MOCK) return normalizeStationReport(await mockStationReports.reject(id, reason))
  return normalizeStationReport(await apiClient(`/station-reports/${id}/reject`, {
    method: 'PATCH',
    body: { reason },
  }))
}

export async function deleteStationReport(id) {
  if (USE_MOCK) return mockStationReports.remove(id)
  await apiClient(`/station-reports/${id}`, { method: 'DELETE' })
  return true
}

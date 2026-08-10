/**
 * Vehicles API
 */
import { apiClient, USE_MOCK } from './client'
import { MOCK_VEHICLES } from '../mocks/vehicles'

let mockVehiclesStore = [...MOCK_VEHICLES]

function toVehiclePayload(data) {
  const payload = {}
  if (data.catalogCarId != null && data.catalogCarId !== '') {
    payload.catalogCarId = Number(data.catalogCarId)
  }
  if (data.name) payload.name = data.name
  if (data.connector) payload.connector = data.connector
  if (data.image && typeof data.image === 'string' && data.image.startsWith('http')) {
    payload.image = data.image
  } else if (data.image === null) {
    payload.image = null
  }
  if (data.batteryLevel !== undefined && data.batteryLevel !== null && data.batteryLevel !== '') {
    payload.batteryLevel = Number(data.batteryLevel)
  }
  if (data.estimatedRange !== undefined && data.estimatedRange !== null && Number(data.estimatedRange) > 0) {
    payload.estimatedRange = Number(data.estimatedRange)
  }
  if (data.year !== undefined && data.year !== null && data.year !== '') {
    payload.year = Number(data.year)
  }
  if (data.isDefault !== undefined) payload.isDefault = Boolean(data.isDefault)
  return payload
}

export async function fetchVehicles() {
  if (USE_MOCK) {
    await new Promise(r => setTimeout(r, 400))
    return [...mockVehiclesStore]
  }
  return apiClient('/vehicles')
}

export async function fetchVehicleById(id) {
  if (USE_MOCK) {
    await new Promise(r => setTimeout(r, 300))
    return mockVehiclesStore.find(v => String(v.id) === String(id)) || null
  }
  return apiClient(`/vehicles/${id}`)
}

export async function addVehicle(data) {
  if (USE_MOCK) {
    await new Promise(r => setTimeout(r, 500))
    const newVehicle = {
      id: `veh_${Date.now()}`,
      image: null,
      isDefault: mockVehiclesStore.length === 0,
      name: data.name,
      connector: data.connector,
      batteryLevel: data.batteryLevel ?? null,
      estimatedRange: data.estimatedRange ?? null,
      year: data.year ?? null,
    }
    mockVehiclesStore = [...mockVehiclesStore, newVehicle]
    return newVehicle
  }
  return apiClient('/vehicles', { method: 'POST', body: toVehiclePayload(data) })
}

export async function updateVehicle(id, data) {
  if (USE_MOCK) {
    await new Promise(r => setTimeout(r, 300))
    mockVehiclesStore = mockVehiclesStore.map(v =>
      String(v.id) === String(id) ? { ...v, ...data } : v
    )
    return mockVehiclesStore.find(v => String(v.id) === String(id))
  }
  return apiClient(`/vehicles/${id}`, { method: 'PATCH', body: toVehiclePayload(data) })
}

export async function deleteVehicle(id) {
  if (USE_MOCK) {
    await new Promise(r => setTimeout(r, 400))
    mockVehiclesStore = mockVehiclesStore.filter(v => String(v.id) !== String(id))
    return true
  }
  await apiClient(`/vehicles/${id}`, { method: 'DELETE' })
  return true
}

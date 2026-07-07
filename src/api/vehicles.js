/**
 * Vehicles API
 *
 * Endpoints (backend):
 *   GET    /vehicles          — لیست خودروهای کاربر
 *   GET    /vehicles/:id      — جزئیات یک خودرو
 *   POST   /vehicles          — افزودن خودروی جدید
 *   PATCH  /vehicles/:id      — ویرایش خودرو
 *   DELETE /vehicles/:id      — حذف خودرو
 */
import { apiClient, USE_MOCK } from './client'
import { MOCK_VEHICLES } from '../mocks/vehicles'

// کپی محلی برای شبیه‌سازی state سرور در حالت mock
let mockVehiclesStore = [...MOCK_VEHICLES]

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
      ...data,
    }
    mockVehiclesStore = [...mockVehiclesStore, newVehicle]
    return newVehicle
  }
  return apiClient('/vehicles', { method: 'POST', body: data })
}

export async function updateVehicle(id, data) {
  if (USE_MOCK) {
    await new Promise(r => setTimeout(r, 300))
    mockVehiclesStore = mockVehiclesStore.map(v =>
      String(v.id) === String(id) ? { ...v, ...data } : v
    )
    return mockVehiclesStore.find(v => String(v.id) === String(id))
  }
  return apiClient(`/vehicles/${id}`, { method: 'PATCH', body: data })
}

export async function deleteVehicle(id) {
  if (USE_MOCK) {
    await new Promise(r => setTimeout(r, 400))
    mockVehiclesStore = mockVehiclesStore.filter(v => String(v.id) !== String(id))
    return true
  }
  return apiClient(`/vehicles/${id}`, { method: 'DELETE' })
}

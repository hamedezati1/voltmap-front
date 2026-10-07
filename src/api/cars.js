/**
 * Car catalog API — لیست خودروهای برقی ایران از بک‌اند
 */
import { apiClient, USE_MOCK } from './client'
import mockCars from '../mocks/electric_cars.json'

export async function fetchCars(params = {}) {
  if (USE_MOCK) {
    await new Promise((r) => setTimeout(r, 250))
    let list = [...mockCars]
    if (params.brand) list = list.filter((c) => c.brand === params.brand)
    if (params.bodyType) list = list.filter((c) => c.bodyType === params.bodyType)
    if (params.connector) list = list.filter((c) => c.connector === params.connector)
    if (params.search) {
      const q = String(params.search).toLowerCase()
      list = list.filter(
        (c) =>
          c.brand.toLowerCase().includes(q) ||
          c.model.toLowerCase().includes(q) ||
          (c.trim && String(c.trim).toLowerCase().includes(q))
      )
    }
    return list.map((c) => ({
      ...c,
      displayName: [c.brand, c.model, c.trim].filter(Boolean).join(' '),
    }))
  }

  const query = new URLSearchParams()
  if (params.brand) query.set('brand', params.brand)
  if (params.bodyType) query.set('bodyType', params.bodyType)
  if (params.connector) query.set('connector', params.connector)
  if (params.search) query.set('search', params.search)
  const qs = query.toString()
  return apiClient(`/cars${qs ? `?${qs}` : ''}`, { skipAuth: true })
}

export async function fetchCarById(id) {
  if (USE_MOCK) {
    await new Promise((r) => setTimeout(r, 150))
    const car = mockCars.find((c) => Number(c.id) === Number(id))
    if (!car) return null
    return {
      ...car,
      displayName: [car.brand, car.model, car.trim].filter(Boolean).join(' '),
    }
  }
  return apiClient(`/cars/${id}`, { skipAuth: true })
}

export async function fetchCarBrands() {
  if (USE_MOCK) {
    await new Promise((r) => setTimeout(r, 100))
    return [...new Set(mockCars.map((c) => c.brand))].sort((a, b) => a.localeCompare(b))
  }
  return apiClient('/cars/brands', { skipAuth: true })
}

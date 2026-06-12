import { SEED_STATIONS } from '../mocks/seedStations'

const STORAGE_KEY = 'voltmap_stations'

function readStations() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) return JSON.parse(stored)
  } catch {
    // ignore
  }
  writeStations(SEED_STATIONS)
  return SEED_STATIONS
}

function writeStations(stations) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stations))
  } catch {
    // ignore
  }
}

function delay(ms = 300) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

export const mockStations = {
  async getAll() {
    await delay()
    return readStations()
  },

  async getById(id) {
    await delay()
    return readStations().find(s => s.id === Number(id)) ?? null
  },

  async create(station) {
    await delay()
    const stations = readStations()
    const newStation = {
      ...station,
      id: Date.now(),
      rating: 0,
      reviews: [],
    }
    const updated = [newStation, ...stations]
    writeStations(updated)
    return newStation
  },

  async update(id, changes) {
    await delay()
    const stations = readStations()
    const updated = stations.map(s => (s.id === id ? { ...s, ...changes } : s))
    writeStations(updated)
    return updated.find(s => s.id === id) ?? null
  },

  async delete(id) {
    await delay()
    const updated = readStations().filter(s => s.id !== id)
    writeStations(updated)
    return updated
  },

  async addReview(stationId, review) {
    await delay()
    const stations = readStations()
    const updated = stations.map(s => {
      if (s.id !== stationId) return s
      const reviews = [...s.reviews, review]
      const rating = Math.round((reviews.reduce((a, r) => a + r.rating, 0) / reviews.length) * 10) / 10
      return { ...s, reviews, rating }
    })
    writeStations(updated)
    return updated
  },
}

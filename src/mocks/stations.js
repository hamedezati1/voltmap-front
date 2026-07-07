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

// ─── گزارش وضعیت کاربری ────────────────────────────────────────────────────
// TODO: وقتی به دیتابیس وصل شد، این گزارش‌ها باید در جدول station_crowd_reports ذخیره شوند
// هر گزارش شامل: stationId، نوع (available/busy)، timestamp، و userId (اختیاری)

const CROWD_KEY = 'voltmap_crowd_reports'
const REPORT_WINDOW_MS = 30 * 60 * 1000  // پنجره زمانی: ۳۰ دقیقه اخیر برای محاسبه میانگین
const MIN_REPORTS = 2  // حداقل تعداد گزارش برای تأثیرگذاری روی وضعیت

function readCrowdReports() {
  try {
    const raw = localStorage.getItem(CROWD_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch { return {} }
}

function writeCrowdReports(data) {
  try { localStorage.setItem(CROWD_KEY, JSON.stringify(data)) } catch {}
}

export const crowdReports = {
  // ثبت گزارش جدید از کاربر
  // TODO: POST /stations/:id/crowd-report
  addReport(stationId, type) {
    const all = readCrowdReports()
    if (!all[stationId]) all[stationId] = []
    all[stationId].push({ type, ts: Date.now() })
    writeCrowdReports(all)
    return this.computeStatus(stationId, all[stationId])
  },

  // الگوریتم تعیین وضعیت بر اساس گزارش‌های کاربران
  // منطق: در پنجره ۳۰ دقیقه اخیر، اگه ≥ MIN_REPORTS گزارش باشه
  //       و اکثریت (>۵۰٪) بگن شلوغه → busy، وگرنه → available
  // TODO: GET /stations/:id/crowd-status
  computeStatus(stationId, reports) {
    if (!reports || reports.length === 0) return null
    const cutoff = Date.now() - REPORT_WINDOW_MS
    const recent = reports.filter(r => r.ts > cutoff)
    if (recent.length < MIN_REPORTS) return null
    const busyCount = recent.filter(r => r.type === 'busy').length
    const ratio = busyCount / recent.length
    return ratio > 0.5 ? 'busy' : 'available'
  },

  // دریافت وضعیت محاسبه‌شده برای یک ایستگاه
  getStatus(stationId) {
    const all = readCrowdReports()
    return this.computeStatus(stationId, all[stationId])
  },

  // آمار گزارش‌های یک ایستگاه (برای نمایش در ادمین)
  // TODO: GET /stations/:id/crowd-reports
  getStats(stationId) {
    const all = readCrowdReports()
    const reports = all[stationId] || []
    const cutoff = Date.now() - REPORT_WINDOW_MS
    const recent = reports.filter(r => r.ts > cutoff)
    return {
      total: reports.length,
      recent: recent.length,
      busyCount: recent.filter(r => r.type === 'busy').length,
      availableCount: recent.filter(r => r.type === 'available').length,
      computedStatus: this.computeStatus(stationId, reports),
    }
  },

  // دریافت آمار همه ایستگاه‌ها (برای داشبورد ادمین)
  // TODO: GET /stations/crowd-reports/summary
  getAllStats() {
    const all = readCrowdReports()
    return Object.entries(all).map(([id, reports]) => ({
      stationId: Number(id),
      ...this.getStats(Number(id)),
    }))
  },
}

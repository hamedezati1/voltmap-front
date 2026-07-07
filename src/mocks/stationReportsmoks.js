/**
 * Station Reports Mock Store
 * گزارش‌های ایستگاه جدید توسط کاربران در localStorage ذخیره می‌شن
 * کلید: voltmap_station_reports
 *
 * TODO: وقتی به دیتابیس وصل شد:
 *   POST   /station-reports          — ثبت گزارش
 *   GET    /station-reports          — لیست برای ادمین
 *   PATCH  /station-reports/:id      — تأیید / رد
 */

const KEY = 'voltmap_station_reports'

function read() {
  try { return JSON.parse(localStorage.getItem(KEY) || '[]') }
  catch { return [] }
}

function write(data) {
  try { localStorage.setItem(KEY, JSON.stringify(data)) } catch {}
}

const delay = (ms = 350) => new Promise(r => setTimeout(r, ms))

export const mockStationReports = {
  async getAll() {
    await delay()
    return read().sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
  },

  async create(data) {
    await delay(500)
    const list = read()
    const item = {
      id: `sr_${Date.now()}`,
      ...data,
      status: 'pending',   // pending | approved | rejected
      createdAt: new Date().toISOString(),
    }
    write([item, ...list])
    return item
  },

  async approve(id) {
    await delay(400)
    const list = read().map(r => r.id === id ? { ...r, status: 'approved' } : r)
    write(list)
    return list.find(r => r.id === id)
  },

  async reject(id, reason = '') {
    await delay(400)
    const list = read().map(r => r.id === id ? { ...r, status: 'rejected', rejectReason: reason } : r)
    write(list)
    return list.find(r => r.id === id)
  },

  async remove(id) {
    await delay(300)
    write(read().filter(r => r.id !== id))
    return true
  },
}

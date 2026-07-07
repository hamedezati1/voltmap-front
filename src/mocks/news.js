/**
 * News Mock Store
 * اخبار در localStorage ذخیره می‌شن
 * کلید: voltmap_news
 */

const STORAGE_KEY = 'voltmap_news'

const SEED_NEWS = [
  {
    id: 1,
    title: 'افتتاح ایستگاه شارژ جدید در تهران',
    body: 'ولت‌مپ با افتخار از افتتاح جدیدترین ایستگاه شارژ سریع خود در منطقه ونک تهران خبر می‌دهد. این ایستگاه مجهز به ۶ پورت DC با توان ۱۲۰ کیلووات است.',
    image: null,
    category: 'ایستگاه',
    publishedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    pinned: true,
  },
  {
    id: 2,
    title: 'به‌روزرسانی اپلیکیشن ولت‌مپ - نسخه ۲.۰',
    body: 'نسخه جدید ولت‌مپ با قابلیت‌های جدید شامل مسیریابی هوشمند، فیلتر پیشرفته و رابط تاریک منتشر شد.',
    image: null,
    category: 'شرکت',
    publishedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    pinned: false,
  },
]

function readNews() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : initNews()
  } catch {
    return initNews()
  }
}

function initNews() {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(SEED_NEWS)) } catch {}
  return SEED_NEWS
}

function writeNews(list) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(list)) } catch {}
}

const delay = (ms = 300) => new Promise(r => setTimeout(r, ms))

export const mockNews = {
  async getAll() {
    await delay()
    return readNews().sort((a, b) => {
      if (a.pinned && !b.pinned) return -1
      if (!a.pinned && b.pinned) return 1
      return new Date(b.publishedAt) - new Date(a.publishedAt)
    })
  },

  async create(data) {
    await delay(400)
    const list = readNews()
    const item = { ...data, id: Date.now(), publishedAt: new Date().toISOString() }
    writeNews([item, ...list])
    return item
  },

  async update(id, data) {
    await delay(300)
    const list = readNews().map(n => n.id === id ? { ...n, ...data } : n)
    writeNews(list)
    return list.find(n => n.id === id)
  },

  async remove(id) {
    await delay(300)
    const list = readNews().filter(n => n.id !== id)
    writeNews(list)
    return true
  },
}

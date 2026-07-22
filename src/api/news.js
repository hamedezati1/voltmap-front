/**
 * News API
 */
import { apiClient, USE_MOCK } from './client'
import { mockNews } from '../mocks/news'

/** بک‌اند فقط URL معتبر برای image قبول می‌کند؛ data URL را حذف می‌کنیم */
function toNewsPayload(data) {
  const payload = {
    title: data.title,
    body: data.body,
    category: data.category,
    pinned: data.pinned,
  }
  if (data.image && typeof data.image === 'string' && data.image.startsWith('http')) {
    payload.image = data.image
  } else if (data.image === null) {
    payload.image = null
  }
  return payload
}

export async function fetchNews() {
  if (USE_MOCK) return mockNews.getAll()
  return apiClient('/news')
}

export async function createNews(data) {
  if (USE_MOCK) return mockNews.create(data)
  return apiClient('/news', { method: 'POST', body: toNewsPayload(data) })
}

export async function updateNews(id, data) {
  if (USE_MOCK) return mockNews.update(id, data)
  return apiClient(`/news/${id}`, { method: 'PATCH', body: toNewsPayload(data) })
}

export async function deleteNews(id) {
  if (USE_MOCK) return mockNews.remove(id)
  await apiClient(`/news/${id}`, { method: 'DELETE' })
  return true
}

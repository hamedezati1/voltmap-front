/**
 * News API
 *
 * Endpoints (backend):
 *   GET    /news          — لیست اخبار
 *   POST   /news          — ایجاد خبر (admin)
 *   PATCH  /news/:id      — ویرایش خبر (admin)
 *   DELETE /news/:id      — حذف خبر (admin)
 */
import { apiClient, USE_MOCK } from './client'
import { mockNews } from '../mocks/news'

export async function fetchNews() {
  if (USE_MOCK) return mockNews.getAll()
  return apiClient('/news')
}

export async function createNews(data) {
  if (USE_MOCK) return mockNews.create(data)
  return apiClient('/news', { method: 'POST', body: data })
}

export async function updateNews(id, data) {
  if (USE_MOCK) return mockNews.update(id, data)
  return apiClient(`/news/${id}`, { method: 'PATCH', body: data })
}

export async function deleteNews(id) {
  if (USE_MOCK) return mockNews.remove(id)
  return apiClient(`/news/${id}`, { method: 'DELETE' })
}

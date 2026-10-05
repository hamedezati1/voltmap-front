/**
 * API configuration
 *
 * VITE_USE_MOCK=true  → داده از mock/localStorage
 * VITE_USE_MOCK=false → درخواست به VITE_API_BASE_URL (بک‌اند واقعی)
 */
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api'
export const USE_MOCK = import.meta.env.VITE_USE_MOCK !== 'false'

/** پایهٔ نمایش عکس‌ها. در دیتابیس فقط مسیر نسبی ذخیره می‌شود. */
export const STORAGE_BASE_URL = (
  import.meta.env.VITE_STORAGE_BASE_URL ||
  `${API_BASE_URL.replace(/\/api\/?$/, '')}/uploads`
).replace(/\/$/, '')

/** مسیر نسبی استوریج را به آدرس قابل نمایش تبدیل می‌کند. لینک کامل را دست نمی‌زند. */
export function storageUrl(value) {
  if (!value || typeof value !== 'string') return ''
  if (/^(https?:|data:|blob:)/i.test(value)) return value
  return `${STORAGE_BASE_URL}/${value.replace(/^\//, '')}`
}

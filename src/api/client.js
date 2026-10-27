import { API_BASE_URL } from './config'
import {
  ACCESS_TOKEN_KEY,
  getAccessToken,
  setAccessToken,
  setStoredUser,
  clearStoredSession,
  readPersistedAccessToken,
  getStoredUser,
} from './tokenStore'
import { notifyApiError } from './toastMiddleware'

export class ApiError extends Error {
  constructor(message, status, data) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.data = data
  }
}

let csrfToken = null
let refreshPromise = null

const REFRESH_LOCK_KEY = 'voltmap_refresh_lock'
const TAB_ID = `${Date.now()}-${Math.random().toString(36).slice(2)}`

function extractErrorMessage(data, status) {
  return (
    data?.error?.message ||
    data?.message ||
    (Array.isArray(data?.error?.details) && data.error.details[0]?.message) ||
    `Request failed: ${status}`
  )
}

async function parseJsonSafe(response) {
  try {
    return await response.json()
  } catch {
    return null
  }
}

function throwApiError(message, status, data, showToast) {
  const error = new ApiError(message, status, data)
  notifyApiError(error, showToast)
  throw error
}

/** CSRF برای مسیرهایی که به کوکی refresh متکی‌اند (refresh / logout) */
export async function fetchCsrfToken({ showToast = true } = {}) {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/csrf-token`, {
      method: 'GET',
      credentials: 'include',
    })
    if (!response.ok) {
      const data = await parseJsonSafe(response)
      throwApiError(extractErrorMessage(data, response.status), response.status, data, showToast)
    }
    const data = await response.json()
    csrfToken = data.csrfToken
    return csrfToken
  } catch (err) {
    if (err instanceof ApiError) throw err
    const error = new ApiError(err.message || 'خطا در برقراری ارتباط با سرور', 0, null)
    notifyApiError(error, showToast)
    throw error
  }
}

async function ensureCsrfToken(showToast = true) {
  if (!csrfToken) await fetchCsrfToken({ showToast })
  return csrfToken
}

function readRefreshLock() {
  try {
    const raw = localStorage.getItem(REFRESH_LOCK_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function writeRefreshLock() {
  try {
    localStorage.setItem(REFRESH_LOCK_KEY, JSON.stringify({ owner: TAB_ID, at: Date.now() }))
  } catch {
    // حالت خصوصی
  }
}

function clearRefreshLockIfMine() {
  try {
    const lock = readRefreshLock()
    if (!lock || lock.owner === TAB_ID) localStorage.removeItem(REFRESH_LOCK_KEY)
  } catch {
    // ignore
  }
}

function waitForPeerToken(previous, timeoutMs = 8000) {
  const current = readPersistedAccessToken()
  if (current && current !== previous) return Promise.resolve(current)

  return new Promise((resolve) => {
    const finish = (token) => {
      window.removeEventListener('storage', onStorage)
      clearTimeout(timer)
      resolve(token)
    }
    const onStorage = (event) => {
      if (event.key === ACCESS_TOKEN_KEY && event.newValue && event.newValue !== previous) {
        finish(event.newValue)
      }
    }
    const timer = setTimeout(() => finish(null), timeoutMs)
    window.addEventListener('storage', onStorage)
  })
}

function sessionFromToken(token) {
  setAccessToken(token)
  return { token, user: getStoredUser() }
}

/** اگر تب دیگری همین الان در حال تمدید است، توکن تازهٔ او را برمی‌داریم. */
async function adoptPeerRefresh(previous) {
  const lock = readRefreshLock()
  if (!lock || lock.owner === TAB_ID || Date.now() - Number(lock.at) > 10000) return null
  const newer = await waitForPeerToken(previous)
  if (!newer) return null
  return sessionFromToken(newer)
}

function postRefresh(csrf) {
  return fetch(`${API_BASE_URL}/auth/refresh`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      'X-CSRF-Token': csrf,
    },
  })
}

async function requestRefresh(showToast) {
  const previous = readPersistedAccessToken()
  let csrf = await ensureCsrfToken(showToast)
  let response = await postRefresh(csrf)

  // CSRF قدیمی یک‌بار با توکن تازه تکرار می‌شود؛ خطای شبکه نشست را پاک نمی‌کند.
  if (response.status === 403) {
    csrfToken = null
    csrf = await fetchCsrfToken({ showToast: false })
    response = await postRefresh(csrf)
  }

  if (!response.ok) {
    const data = await parseJsonSafe(response)
    if (response.status === 401 || response.status === 403) {
      const newer = readPersistedAccessToken()
      if (newer && newer !== previous) return sessionFromToken(newer)
      clearStoredSession()
      csrfToken = null
    }
    console.warn('[auth] refresh rejected', response.status)
    throwApiError(extractErrorMessage(data, response.status), response.status, data, showToast)
  }

  const data = await response.json()
  if (!data?.token) {
    console.warn('[auth] refresh rejected', response.status, 'missing token')
    throwApiError('پاسخ تمدید نشست ناقص است', response.status, data, showToast)
  }
  setAccessToken(data.token)
  if (data.user) setStoredUser(data.user)
  return data
}

/**
 * تمدید access token از روی refresh cookie.
 * درخواست‌های موازی داخل یک تب، و تب‌های هم‌زمان، یک refresh مشترک می‌گیرند.
 */
export async function refreshAccessToken({ showToast = false } = {}) {
  if (refreshPromise) return refreshPromise

  refreshPromise = (async () => {
    const previous = readPersistedAccessToken()
    const adopted = await adoptPeerRefresh(previous)
    if (adopted) return adopted

    writeRefreshLock()
    try {
      return await requestRefresh(showToast)
    } catch (err) {
      if (err instanceof ApiError) throw err
      const error = new ApiError(err.message || 'خطا در برقراری ارتباط با سرور', 0, null)
      notifyApiError(error, showToast)
      throw error
    } finally {
      clearRefreshLockIfMine()
    }
  })().finally(() => {
    refreshPromise = null
  })

  return refreshPromise
}

/**
 * HTTP client با میدل‌ور toast:
 * - showToast: پیش‌فرض true — خطای بک‌اند را toast می‌کند
 * - showToast: false — بدون toast (کنترل دستی در صفحه)
 */
export async function apiClient(path, options = {}) {
  const {
    method = 'GET',
    body,
    formData,
    headers = {},
    skipAuth = false,
    skipRefresh = false,
    csrf = false,
    showToast = true,
  } = options

  const isForm = formData instanceof FormData
  const reqHeaders = { ...headers }
  if (!isForm) reqHeaders['Content-Type'] = 'application/json'

  if (!skipAuth) {
    const token = getAccessToken()
    if (token) reqHeaders.Authorization = `Bearer ${token}`
  }

  if (csrf) {
    const token = await ensureCsrfToken(showToast)
    reqHeaders['X-CSRF-Token'] = token
  }

  const config = {
    method,
    headers: reqHeaders,
    credentials: 'include',
  }

  if (isForm) config.body = formData
  else if (body !== undefined) config.body = JSON.stringify(body)

  try {
    let response = await fetch(`${API_BASE_URL}${path}`, config)

    // access token منقضی → یک‌بار refresh و تکرار
    if (response.status === 401 && !skipAuth && !skipRefresh && path !== '/auth/refresh') {
      try {
        await refreshAccessToken({ showToast: false })
        const retryHeaders = { ...reqHeaders }
        const newToken = getAccessToken()
        if (newToken) retryHeaders.Authorization = `Bearer ${newToken}`
        response = await fetch(`${API_BASE_URL}${path}`, {
          ...config,
          headers: retryHeaders,
        })
      } catch {
        // refresh شکست خورد؛ همان ۴۰۱ اصلی را برمی‌گردانیم
      }
    }

    if (!response.ok) {
      const data = await parseJsonSafe(response)
      throwApiError(extractErrorMessage(data, response.status), response.status, data, showToast)
    }

    if (response.status === 204) return null
    return response.json()
  } catch (err) {
    if (err instanceof ApiError) throw err
    const error = new ApiError(err.message || 'خطا در برقراری ارتباط با سرور', 0, null)
    notifyApiError(error, showToast)
    throw error
  }
}

export { USE_MOCK } from './config'

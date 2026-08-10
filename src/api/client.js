import { API_BASE_URL } from './config'
import { getAccessToken, setAccessToken, clearAccessToken } from './tokenStore'
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

/**
 * تمدید access token از روی refresh cookie.
 * درخواست‌های موازی یک بار refresh مشترک می‌گیرند.
 */
export async function refreshAccessToken({ showToast = false } = {}) {
  if (refreshPromise) return refreshPromise

  refreshPromise = (async () => {
    try {
      const token = await ensureCsrfToken(showToast)
      const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': token,
        },
      })

      if (!response.ok) {
        clearAccessToken()
        csrfToken = null
        const data = await parseJsonSafe(response)
        throwApiError(extractErrorMessage(data, response.status), response.status, data, showToast)
      }

      const data = await response.json()
      setAccessToken(data.token)
      return data
    } catch (err) {
      if (err instanceof ApiError) throw err
      const error = new ApiError(err.message || 'خطا در برقراری ارتباط با سرور', 0, null)
      notifyApiError(error, showToast)
      throw error
    } finally {
      refreshPromise = null
    }
  })()

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
    headers = {},
    skipAuth = false,
    skipRefresh = false,
    csrf = false,
    showToast = true,
  } = options

  const reqHeaders = {
    'Content-Type': 'application/json',
    ...headers,
  }

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

  if (body !== undefined) {
    config.body = JSON.stringify(body)
  }

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

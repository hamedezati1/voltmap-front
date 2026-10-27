import { API_BASE_URL } from './config'
import {
  getAccessToken,
  setAccessToken,
  setStoredUser,
  getStoredUser,
  clearStoredSession,
  syncAccessTokenFromStorage,
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

/** وقتی نشست قطعاً از بین رفته (refresh token رد شد) UI از این طریق باخبر می‌شود */
export const SESSION_EXPIRED_EVENT = 'voltmap:session-expired'
const REFRESH_LOCK_NAME = 'voltmap-auth-refresh'

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
const isAuthRejection = (err) =>
  err instanceof ApiError && (err.status === 401 || err.status === 403)

/**
 * refresh بین تب‌ها هم نباید هم‌زمان اجرا شود (با rotation، دومی refresh token باطل‌شده می‌فرستد).
 * Web Locks فقط در HTTPS/localhost هست؛ در غیر این صورت بدون قفل ادامه می‌دهیم.
 */
function withRefreshLock(fn) {
  if (typeof navigator !== 'undefined' && navigator.locks?.request) {
    return navigator.locks.request(REFRESH_LOCK_NAME, fn)
  }
  return fn()
}

function expireSession(err) {
  clearStoredSession()
  csrfToken = null
  // برای دیباگ روی سرور: دلیل دقیق خروج در کنسول دیده شود
  console.warn('[auth] refresh rejected → session cleared', err?.status, err?.message)
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event(SESSION_EXPIRED_EVENT))
  }
}

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
      cache: 'no-store',
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
 * یک تلاش (یا دو تلاش) واقعی برای تمدید توکن.
 * - 401/403 فقط بعد از تلاش دوم (با CSRF تازه و کوکی فعلی مرورگر) «نشست مرده» حساب می‌شود.
 * - خطای شبکه / 5xx / 429 هرگز نشست را پاک نمی‌کند.
 */
async function performRefresh(showToast) {
  let lastErr = null

  for (let attempt = 0; attempt < 2; attempt += 1) {
    if (attempt > 0) {
      csrfToken = null
      await sleep(350)
    }

    try {
      const token = await ensureCsrfToken(false)
      const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: 'POST',
        credentials: 'include',
        cache: 'no-store',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': token,
        },
      })
      const data = await parseJsonSafe(response)

      if (response.ok) {
        const newToken = data?.token || data?.accessToken
        if (!newToken) {
          // پاسخ ۲۰۰ ولی بدون توکن: نشست قبلی را خراب نکن
          throw new ApiError('پاسخ تمدید نشست نامعتبر است', 502, data)
        }
        setAccessToken(newToken)
        if (data.user) setStoredUser(data.user)
        return { ...data, token: newToken }
      }

      lastErr = new ApiError(extractErrorMessage(data, response.status), response.status, data)
    } catch (err) {
      lastErr =
        err instanceof ApiError
          ? err
          : new ApiError(err.message || 'خطا در برقراری ارتباط با سرور', 0, null)
    }

    if (!isAuthRejection(lastErr)) break
  }

  if (isAuthRejection(lastErr)) expireSession(lastErr)
  notifyApiError(lastErr, showToast)
  throw lastErr
}

/**
 * تمدید access token از روی refresh cookie.
 * درخواست‌های موازی (در یک تب با promise مشترک، بین تب‌ها با Web Locks) فقط یک بار refresh می‌گیرند.
 */
export function refreshAccessToken({ showToast = false } = {}) {
  if (refreshPromise) return refreshPromise

  const tokenAtCall = getAccessToken()

  refreshPromise = withRefreshLock(async () => {
    // وقتی منتظر قفل بودیم شاید تب دیگری همین الان توکن را تمدید کرده باشد
    const latest = syncAccessTokenFromStorage()
    const storedUser = getStoredUser()
    if (latest && latest !== tokenAtCall && storedUser) {
      return { token: latest, user: storedUser }
    }
    return performRefresh(showToast)
  }).finally(() => {
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

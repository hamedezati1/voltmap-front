import { API_BASE_URL } from './config'
import { getAccessToken, setAccessToken, clearAccessToken } from './tokenStore'

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

/** CSRF برای مسیرهایی که به کوکی refresh متکی‌اند (refresh / logout) */
export async function fetchCsrfToken() {
  const response = await fetch(`${API_BASE_URL}/auth/csrf-token`, {
    method: 'GET',
    credentials: 'include',
  })
  if (!response.ok) {
    const data = await parseJsonSafe(response)
    throw new ApiError(extractErrorMessage(data, response.status), response.status, data)
  }
  const data = await response.json()
  csrfToken = data.csrfToken
  return csrfToken
}

async function ensureCsrfToken() {
  if (!csrfToken) await fetchCsrfToken()
  return csrfToken
}

/**
 * تمدید access token از روی refresh cookie.
 * درخواست‌های موازی یک بار refresh مشترک می‌گیرند.
 */
export async function refreshAccessToken() {
  if (refreshPromise) return refreshPromise

  refreshPromise = (async () => {
    try {
      const token = await ensureCsrfToken()
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
        throw new ApiError(extractErrorMessage(data, response.status), response.status, data)
      }

      const data = await response.json()
      setAccessToken(data.token)
      return data
    } finally {
      refreshPromise = null
    }
  })()

  return refreshPromise
}

/**
 * HTTP client با:
 * - credentials: include (کوکی refresh)
 * - Authorization: Bearer
 * - ریترای خودکار بعد از ۴۰۱ با /auth/refresh
 */
export async function apiClient(path, options = {}) {
  const {
    method = 'GET',
    body,
    headers = {},
    skipAuth = false,
    skipRefresh = false,
    csrf = false,
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
    const token = await ensureCsrfToken()
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

  let response = await fetch(`${API_BASE_URL}${path}`, config)

  // access token منقضی → یک‌بار refresh و تکرار
  if (response.status === 401 && !skipAuth && !skipRefresh && path !== '/auth/refresh') {
    try {
      await refreshAccessToken()
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
    throw new ApiError(extractErrorMessage(data, response.status), response.status, data)
  }

  if (response.status === 204) return null
  return response.json()
}

export { USE_MOCK } from './config'

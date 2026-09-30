/**
 * Auth API — ورود / ثبت‌نام با OTP
 *
 * Endpoints:
 *   GET  /auth/csrf-token
 *   POST /auth/otp/request  — { phone, purpose }
 *   POST /auth/otp/verify   — { phone, code, purpose, name? }
 *   POST /auth/refresh
 *   POST /auth/logout
 *   GET  /auth/me
 */
import { apiClient, ApiError, USE_MOCK, refreshAccessToken } from './client'
import { getAccessToken, setAccessToken, getStoredUser, setStoredUser, clearStoredSession } from './tokenStore'
import { notifyApiError } from './toastMiddleware'
import { mockAuth } from '../mocks/auth'

function applySession(session) {
  if (session?.token) setAccessToken(session.token)
  if (session?.user) setStoredUser(session.user)
  return session
}

async function withMockToast(fn, showToast) {
  try {
    return await fn()
  } catch (err) {
    notifyApiError(err, showToast)
    throw err
  }
}

export async function requestOtp({ phone, purpose }, { showToast = true } = {}) {
  if (USE_MOCK) {
    return withMockToast(() => mockAuth.requestOtp({ phone, purpose }), showToast)
  }
  return apiClient('/auth/otp/request', {
    method: 'POST',
    body: { phone, purpose },
    skipAuth: true,
    skipRefresh: true,
    showToast,
  })
}

export async function verifyOtp(payload, { showToast = true } = {}) {
  if (USE_MOCK) {
    return withMockToast(() => mockAuth.verifyOtp(payload), showToast)
  }
  const session = await apiClient('/auth/otp/verify', {
    method: 'POST',
    body: payload,
    skipAuth: true,
    skipRefresh: true,
    showToast,
  })
  return applySession(session)
}

export async function logout({ showToast = true } = {}) {
  if (USE_MOCK) return mockAuth.logout()
  try {
    await apiClient('/auth/logout', {
      method: 'POST',
      csrf: true,
      skipAuth: true,
      skipRefresh: true,
      showToast,
    })
  } finally {
    clearStoredSession()
  }
}

export async function getSession() {
  if (USE_MOCK) return mockAuth.getSession()

  const token = getAccessToken()
  const storedUser = getStoredUser()

  // توکن ذخیره‌شده هنوز معتبر است → refresh نزن تا نشست بی‌دلیل revoke نشود.
  if (token) {
    try {
      const user = await fetchCurrentUser({ showToast: false, skipRefresh: true })
      if (user) {
        setStoredUser(user)
        return { token: getAccessToken(), user }
      }
    } catch (err) {
      const unauthorized = err instanceof ApiError && err.status === 401
      if (!unauthorized && storedUser) return { token, user: storedUser }
    }
  }

  try {
    const session = await refreshAccessToken({ showToast: false })
    return applySession(session)
  } catch (err) {
    const unauthorized = err instanceof ApiError && (err.status === 401 || err.status === 403)
    if (unauthorized) {
      clearStoredSession()
      return null
    }
    if (token && storedUser) return { token, user: storedUser }
    return null
  }
}

export async function fetchCurrentUser({ showToast = true, skipRefresh = false } = {}) {
  if (USE_MOCK) {
    const session = mockAuth.getSession()
    return session?.user ?? null
  }
  const data = await apiClient('/auth/me', { showToast, skipRefresh })
  return data?.user ?? null
}

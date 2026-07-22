/**
 * Auth API
 *
 * Endpoints (backend):
 *   GET    /auth/csrf-token  — توکن CSRF
 *   POST   /auth/login       — ورود
 *   POST   /auth/register    — ثبت‌نام
 *   POST   /auth/refresh     — تمدید access token (کوکی + CSRF)
 *   POST   /auth/logout      — خروج (کوکی + CSRF)
 *   GET    /auth/me          — کاربر جاری
 */
import { apiClient, USE_MOCK, refreshAccessToken } from './client'
import { setAccessToken, clearAccessToken } from './tokenStore'
import { mockAuth } from '../mocks/auth'

function applySession(session) {
  if (session?.token) setAccessToken(session.token)
  return session
}

export async function login(credentials) {
  if (USE_MOCK) return mockAuth.login(credentials)
  const session = await apiClient('/auth/login', {
    method: 'POST',
    body: credentials,
    skipAuth: true,
    skipRefresh: true,
  })
  return applySession(session)
}

export async function register(data) {
  if (USE_MOCK) return mockAuth.register(data)
  const session = await apiClient('/auth/register', {
    method: 'POST',
    body: data,
    skipAuth: true,
    skipRefresh: true,
  })
  return applySession(session)
}

export async function logout() {
  if (USE_MOCK) return mockAuth.logout()
  try {
    await apiClient('/auth/logout', {
      method: 'POST',
      csrf: true,
      skipAuth: true,
      skipRefresh: true,
    })
  } finally {
    clearAccessToken()
  }
}

/**
 * بازیابی نشست:
 * - mock: از localStorage
 * - real: اول refresh از کوکی، در صورت نیاز /auth/me
 */
export async function getSession() {
  if (USE_MOCK) return mockAuth.getSession()

  try {
    const session = await refreshAccessToken()
    return applySession(session)
  } catch {
    clearAccessToken()
    return null
  }
}

export async function fetchCurrentUser() {
  if (USE_MOCK) {
    const session = mockAuth.getSession()
    return session?.user ?? null
  }
  const data = await apiClient('/auth/me')
  return data?.user ?? null
}

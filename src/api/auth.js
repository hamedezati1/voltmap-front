/**
 * Auth API
 *
 * Endpoints (backend):
 *   POST   /auth/login       — ورود
 *   POST   /auth/register    — ثبت‌نام
 *   POST   /auth/logout      — خروج
 *   GET    /auth/me          — کاربر جاری
 */
import { apiClient, USE_MOCK } from './client'
import { mockAuth } from '../mocks/auth'

export async function login(credentials) {
  if (USE_MOCK) return mockAuth.login(credentials)
  return apiClient('/auth/login', { method: 'POST', body: credentials })
}

export async function register(data) {
  if (USE_MOCK) return mockAuth.register(data)
  return apiClient('/auth/register', { method: 'POST', body: data })
}

export async function logout() {
  if (USE_MOCK) return mockAuth.logout()
  return apiClient('/auth/logout', { method: 'POST' })
}

export async function getSession() {
  if (USE_MOCK) return mockAuth.getSession()
  return apiClient('/auth/me')
}

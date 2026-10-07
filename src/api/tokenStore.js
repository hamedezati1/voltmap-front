/**
 * Access token باید بعد از بستن اپ (مخصوصاً روی گوشی) باقی بماند.
 * حافظهٔ جاوااسکریپت با بستن وب‌ویو پاک می‌شود؛ localStorage نه.
 */
const ACCESS_TOKEN_KEY = 'voltmap_access_token'
const AUTH_USER_KEY = 'voltmap_auth_user'

function readToken() {
  try {
    return localStorage.getItem(ACCESS_TOKEN_KEY)
  } catch {
    return null
  }
}

function readJson(key) {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

let accessToken = readToken()

export function getAccessToken() {
  return accessToken
}

export function setAccessToken(token) {
  accessToken = token || null
  try {
    if (accessToken) localStorage.setItem(ACCESS_TOKEN_KEY, accessToken)
    else localStorage.removeItem(ACCESS_TOKEN_KEY)
  } catch {
    // حالت خصوصی یا پر بودن حافظه
  }
}

export function clearAccessToken() {
  accessToken = null
  try {
    localStorage.removeItem(ACCESS_TOKEN_KEY)
  } catch {
    // ignore
  }
}

export function getStoredUser() {
  return readJson(AUTH_USER_KEY)
}

export function setStoredUser(user) {
  try {
    if (user) localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user))
    else localStorage.removeItem(AUTH_USER_KEY)
  } catch {
    // ignore
  }
}

export function clearStoredSession() {
  clearAccessToken()
  try {
    localStorage.removeItem(AUTH_USER_KEY)
  } catch {
    // ignore
  }
}

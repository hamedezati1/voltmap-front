/**
 * Access token در حافظه (نه localStorage) — مطابق توصیه‌ی بک‌اند.
 * AuthContext بعد از verifyOtp/refresh این مقدار را ست می‌کند.
 */
let accessToken = null

export function getAccessToken() {
  return accessToken
}

export function setAccessToken(token) {
  accessToken = token || null
}

export function clearAccessToken() {
  accessToken = null
}

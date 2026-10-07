/** نرمال‌سازی شماره موبایل ایران به فرم 09xxxxxxxxx */
export function normalizeIranPhone(raw) {
  let phone = String(raw ?? '').trim().replace(/[\s\-()]/g, '')
  if (phone.startsWith('+98')) phone = `0${phone.slice(3)}`
  else if (phone.startsWith('98') && phone.length === 12) phone = `0${phone.slice(2)}`
  else if (phone.startsWith('9') && phone.length === 10) phone = `0${phone}`
  return phone
}

export function isValidIranMobile(phone) {
  return /^09\d{9}$/.test(phone)
}

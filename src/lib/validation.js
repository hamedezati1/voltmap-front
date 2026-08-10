/**
 * قوانین اعتبارسنجی فرانت — مطابق schema های بک‌اند (OTP).
 */

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const IRAN_MOBILE_RE = /^09\d{9}$/

function isFilled(value) {
  return value !== undefined && value !== null && String(value).trim() !== ''
}

export function normalizePhone(raw) {
  let phone = String(raw ?? '').trim().replace(/[\s\-()]/g, '')
  if (phone.startsWith('+98')) phone = `0${phone.slice(3)}`
  else if (phone.startsWith('98') && phone.length === 12) phone = `0${phone.slice(2)}`
  else if (phone.startsWith('9') && phone.length === 10) phone = `0${phone}`
  return phone
}

export function validatePhone(phone) {
  const normalized = normalizePhone(phone)
  if (!IRAN_MOBILE_RE.test(normalized)) {
    return 'شماره موبایل معتبر نیست (مثال: 09123456789)'
  }
  return null
}

export function validateOtpCode(code) {
  const value = String(code ?? '').trim()
  if (!/^\d{4,8}$/.test(value)) return 'کد تأیید باید ۴ تا ۸ رقم باشد'
  return null
}

/** درخواست OTP — مرحله‌ی شماره */
export function validateOtpRequest({ phone, name, purpose }) {
  const errors = {}
  const phoneError = validatePhone(phone)
  if (phoneError) errors.phone = phoneError

  if (purpose === 'register') {
    const trimmedName = (name ?? '').trim()
    if (trimmedName.length < 2) errors.name = 'نام باید حداقل ۲ کاراکتر باشد'
    else if (trimmedName.length > 100) errors.name = 'نام نباید بیشتر از ۱۰۰ کاراکتر باشد'
  }

  return { ok: Object.keys(errors).length === 0, errors }
}

/** تأیید OTP */
export function validateOtpVerify({ phone, code, name, purpose }) {
  const base = validateOtpRequest({ phone, name, purpose })
  const errors = { ...base.errors }
  const codeError = validateOtpCode(code)
  if (codeError) errors.code = codeError
  return { ok: Object.keys(errors).length === 0, errors }
}

/** پروفایل — updateProfileSchema (phone از این مسیر عوض نمی‌شود) */
export function validateProfile({ name, email }) {
  const errors = {}
  const trimmedName = (name ?? '').trim()
  const trimmedEmail = (email ?? '').trim()

  if (isFilled(name)) {
    if (trimmedName.length < 2) errors.name = 'نام باید حداقل ۲ کاراکتر باشد'
    else if (trimmedName.length > 100) errors.name = 'نام نباید بیشتر از ۱۰۰ کاراکتر باشد'
  }

  if (isFilled(email)) {
    if (!EMAIL_RE.test(trimmedEmail)) errors.email = 'فرمت ایمیل معتبر نیست'
  }

  return { ok: Object.keys(errors).length === 0, errors }
}

/** خودرو — vehicleSchema */
export function validateVehicle({ catalogCarId, name, connector, batteryLevel, estimatedRange, year }) {
  const errors = {}

  if (!isFilled(catalogCarId)) {
    const trimmedName = (name ?? '').trim()
    if (!trimmedName) errors.catalogCarId = 'لطفاً خودرو را از لیست انتخاب کنید'
    else if (trimmedName.length > 120) errors.name = 'نام خودرو نباید بیشتر از ۱۲۰ کاراکتر باشد'
    if (!isFilled(connector)) errors.connector = 'نوع کانکتور الزامی است'
  }

  if (isFilled(batteryLevel)) {
    const n = Number(batteryLevel)
    if (!Number.isInteger(n) || n < 0 || n > 100) {
      errors.batteryLevel = 'درصد باتری باید عدد صحیح بین ۰ تا ۱۰۰ باشد'
    }
  }

  if (isFilled(estimatedRange)) {
    const n = Number(estimatedRange)
    if (!Number.isInteger(n) || n <= 0) {
      errors.estimatedRange = 'برد تقریبی باید عدد صحیح مثبت باشد'
    }
  }

  if (isFilled(year)) {
    const n = Number(year)
    if (!Number.isInteger(n) || n < 1370 || n > 1500) {
      errors.year = 'سال ساخت باید بین ۱۳۷۰ تا ۱۵۰۰ باشد'
    }
  }

  return { ok: Object.keys(errors).length === 0, errors }
}

/** گزارش ایستگاه */
export function validateStationReport({ name, notes, ownerNote, type }) {
  const errors = {}
  const trimmedName = (name ?? '').trim()
  const note = notes ?? ownerNote ?? ''

  if (trimmedName.length < 2) errors.name = 'نام ایستگاه باید حداقل ۲ کاراکتر باشد'

  if (note && String(note).length > 1000) {
    errors.notes = 'توضیحات نباید بیشتر از ۱۰۰۰ کاراکتر باشد'
  }

  if (isFilled(type) && type !== 'AC' && type !== 'DC') {
    // بک‌اند فقط AC و DC می‌پذیرد
  }

  return { ok: Object.keys(errors).length === 0, errors }
}

export function inputErrorClass(hasError) {
  return hasError ? 'border-red-400 focus:border-red-400' : ''
}

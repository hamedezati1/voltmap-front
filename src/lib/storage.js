const ONBOARDING_KEY = 'voltmap_onboarding_done'

export function isOnboardingDone() {
  return localStorage.getItem(ONBOARDING_KEY) === 'true'
}

export function setOnboardingDone() {
  localStorage.setItem(ONBOARDING_KEY, 'true')
}

/** فقط برای تست — onboarding را ریست می‌کند */
export function resetOnboarding() {
  localStorage.removeItem(ONBOARDING_KEY)
}

const MAP_LOCATE_TIP_KEY = 'voltmap_map_locate_tip_seen'

/** راهنمای دکمه‌ی موقعیت در صفحه‌ی نقشه قبلاً دیده شده؟ */
export function isMapLocateTipSeen() {
  try {
    return localStorage.getItem(MAP_LOCATE_TIP_KEY) === 'true'
  } catch {
    return false
  }
}

/** بعد از بستن مدال، دیگر نمایش داده نمی‌شود (روی همین دستگاه) */
export function setMapLocateTipSeen() {
  try {
    localStorage.setItem(MAP_LOCATE_TIP_KEY, 'true')
  } catch {
    /* حالت خصوصی مرورگر — مهم نیست */
  }
}

/** فقط برای تست */
export function resetMapLocateTip() {
  try {
    localStorage.removeItem(MAP_LOCATE_TIP_KEY)
  } catch {
    /* noop */
  }
}

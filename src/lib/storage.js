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

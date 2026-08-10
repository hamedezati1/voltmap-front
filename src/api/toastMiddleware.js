import { toast } from 'react-toastify'

/**
 * میدل‌ور نمایش toast برای لایه API.
 * همه‌ی ریکوست‌های apiClient از اینجا عبور می‌کنند.
 *
 * @param {boolean} showToast — پیش‌فرض true؛ با false توست نشان داده نمی‌شود
 */
export function notifyApiError(error, showToast = true) {
  if (!showToast || !error) return

  const message =
    error?.message ||
    error?.data?.error?.message ||
    error?.data?.message ||
    'خطایی رخ داد. لطفاً دوباره تلاش کنید.'

  toast.error(message, {
    toastId: `api-error-${error?.status || 'unknown'}-${message}`,
  })
}

export function notifyApiSuccess(message, showToast = true) {
  if (!showToast || !message) return
  toast.success(message)
}

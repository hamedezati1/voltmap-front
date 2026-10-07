/**
 * شروع پرداخت اشتراک طلایی.
 *
 * الان درگاه واقعی نداریم؛ کاربر به صفحهٔ جایگزین می‌رود.
 * وقتی درگاه آماده شد فقط بدنهٔ این تابع را عوض کن (مثلاً redirect به زرین‌پال).
 *
 * @param {{ navigate: Function, returnTo?: string }} options
 */
export function startGoldPayment({ navigate, returnTo = '/trip' } = {}) {
  // TODO: اتصال به درگاه واقعی
  // مثال:
  // const { paymentUrl } = await apiClient('/payments/gold', { method: 'POST' })
  // window.location.href = paymentUrl

  if (typeof navigate === 'function') {
    navigate('/trip/upgrade', { state: { returnTo } })
    return
  }
  window.location.assign('/trip/upgrade')
}

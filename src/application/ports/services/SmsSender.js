/**
 * Port ارسال پیامک — پیاده‌سازی‌ها: SmsIrSender، ConsoleSmsSender (dev)
 */
export class SmsSender {
  /**
   * @param {string} phone شماره موبایل ۱۱ رقمی (مثل 09123456789)
   * @param {string} code کد OTP
   */
  async sendOtp(_phone, _code) {
    throw new Error('Not implemented')
  }
}

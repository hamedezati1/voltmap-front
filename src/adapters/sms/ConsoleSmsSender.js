import { SmsSender } from '../../application/ports/services/SmsSender.js'
import { logger } from '../../infrastructure/logger.js'

/**
 * برای توسعه محلی وقتی sms.ir فعال نیست — کد OTP را در لاگ چاپ می‌کند.
 */
export class ConsoleSmsSender extends SmsSender {
  async sendOtp(phone, code) {
    logger.info(`[DEV SMS] OTP for ${phone}: ${code}`)
    return true
  }
}

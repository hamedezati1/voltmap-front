import rateLimit from 'express-rate-limit'
import { config } from '../../../config/index.js'

/**
 * محدودکننده‌ی نرخ درخواست (Rate Limiting) — روی همه‌ی مسیرها اعمال می‌شه.
 * جلوگیری از brute-force، DoS ساده و سوءاستفاده از API.
 */
export const globalRateLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.max,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: { code: 'RATE_LIMITED', message: 'تعداد درخواست‌ها بیش از حد مجاز است، کمی صبر کنید' } },
})

/** محدودیت سخت‌گیرانه‌تر روی مسیرهای حساس احراز هویت (جلوگیری از brute-force رمز عبور) */
export const authRateLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.authMax,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: { code: 'RATE_LIMITED', message: 'تلاش بیش از حد برای ورود/ثبت‌نام، کمی صبر کنید' } },
})

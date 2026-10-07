import { UnauthorizedError, ForbiddenError } from '../../../domain/errors/AppError.js'

/**
 * میدل‌ور احراز هویت — Bearer access token را از هدر Authorization می‌خواند و verify می‌کند.
 * نتیجه (userId, role) روی req.auth قرار می‌گیرد تا کنترلرها بهش دسترسی داشته باشن.
 */
export function authenticate(tokenService) {
  return function (req, res, next) {
    const header = req.get('authorization') || ''
    const [scheme, token] = header.split(' ')
    if (scheme !== 'Bearer' || !token) {
      return next(new UnauthorizedError('توکن احراز هویت ارسال نشده است'))
    }
    try {
      const payload = tokenService.verifyAccessToken(token)
      req.auth = { userId: payload.sub, role: payload.role }
      next()
    } catch (err) {
      next(err)
    }
  }
}

/** نسخه‌ی اختیاری: اگه توکن بود verify می‌کنه، وگرنه بدون خطا عبور می‌کنه (برای مسیرهای عمومی) */
export function optionalAuthenticate(tokenService) {
  return function (req, res, next) {
    const header = req.get('authorization') || ''
    const [scheme, token] = header.split(' ')
    if (scheme !== 'Bearer' || !token) return next()
    try {
      const payload = tokenService.verifyAccessToken(token)
      req.auth = { userId: payload.sub, role: payload.role }
    } catch {
      // توکن نامعتبر در مسیر عمومی رو نادیده می‌گیریم
    }
    next()
  }
}

export function requireAdmin(req, res, next) {
  if (req.auth?.role !== 'admin') {
    return next(new ForbiddenError('دسترسی فقط برای ادمین مجاز است'))
  }
  next()
}

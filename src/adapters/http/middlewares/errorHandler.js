import { AppError } from '../../../domain/errors/AppError.js'
import { logger } from '../../../infrastructure/logger.js'

const STATUS_BY_CODE = {
  VALIDATION_ERROR: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  SMS_SEND_FAILED: 502,
  ROUTING_FAILED: 502,
}

/**
 * میدل‌ور مرکزی خطا — همه‌ی خطاهای دامنه (AppError) رو به status code مناسب HTTP نگاشت می‌کنه.
 * جزئیات خطاهای غیرمنتظره (باگ‌ها) هرگز مستقیم به کلاینت درز نمی‌کنن (جلوگیری از افشای اطلاعات داخلی - OWASP).
 */
// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, next) {
  if (err instanceof AppError) {
    const status = STATUS_BY_CODE[err.code] || 400
    return res.status(status).json({
      error: { code: err.code, message: err.message, details: err.details ?? undefined },
    })
  }

  if (err?.type === 'entity.parse.failed') {
    return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'بدنه‌ی JSON نامعتبر است' } })
  }

  if (err?.code === 'EBADCSRFTOKEN') {
    return res.status(403).json({ error: { code: 'FORBIDDEN', message: 'CSRF token نامعتبر است' } })
  }

  logger.error('Unhandled error', { error: err.message, stack: err.stack })
  return res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'خطای داخلی سرور رخ داد' } })
}

export function notFoundHandler(req, res) {
  res.status(404).json({ error: { code: 'NOT_FOUND', message: `مسیر ${req.originalUrl} یافت نشد` } })
}

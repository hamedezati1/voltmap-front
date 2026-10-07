/**
 * پایه‌ی همه‌ی خطاهای دامنه/اپلیکیشن.
 * لایه‌ی HTTP این خطاها رو به status code مناسب نگاشت می‌کنه (errorHandler.js)
 * دامنه هیچ وابستگی‌ای به Express یا HTTP نداره.
 */
export class AppError extends Error {
  constructor(message, code = 'APP_ERROR') {
    super(message)
    this.name = this.constructor.name
    this.code = code
  }
}

export class ValidationError extends AppError {
  constructor(message = 'داده‌های ارسالی نامعتبر است', details = null) {
    super(message, 'VALIDATION_ERROR')
    this.details = details
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'مورد درخواستی یافت نشد') {
    super(message, 'NOT_FOUND')
  }
}

export class ConflictError extends AppError {
  constructor(message = 'تداخل داده‌ای رخ داده است') {
    super(message, 'CONFLICT')
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'احراز هویت نامعتبر است') {
    super(message, 'UNAUTHORIZED')
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'دسترسی غیرمجاز') {
    super(message, 'FORBIDDEN')
  }
}

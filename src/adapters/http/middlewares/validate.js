import { ValidationError } from '../../../domain/errors/AppError.js'

/**
 * ولیدیشن ورودی با zod — جلوگیری از داده‌ی نامعتبر/مخرب قبل از رسیدن به لایه‌ی Application.
 * این یکی از خطوط دفاعی OWASP در برابر injection و mass-assignment است؛
 * فقط فیلدهایی که schema تعریف کرده وارد سیستم می‌شن، بقیه‌ی بدنه دور ریخته می‌شه.
 */
export function validateBody(schema) {
  return function (req, res, next) {
    const result = schema.safeParse(req.body)
    if (!result.success) {
      return next(new ValidationError('داده‌های ارسالی نامعتبر است', result.error.flatten()))
    }
    req.body = result.data
    next()
  }
}

export function validateQuery(schema) {
  return function (req, res, next) {
    const result = schema.safeParse(req.query)
    if (!result.success) {
      return next(new ValidationError('پارامترهای query نامعتبر است', result.error.flatten()))
    }
    req.query = result.data
    next()
  }
}

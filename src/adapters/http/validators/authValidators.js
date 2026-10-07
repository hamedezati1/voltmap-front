import { z } from 'zod'
import { isValidIranMobile, normalizeIranPhone } from '../../../domain/phone.js'

const phoneSchema = z
  .string()
  .min(10)
  .max(15)
  .transform((v) => normalizeIranPhone(v))
  .refine((v) => isValidIranMobile(v), { message: 'شماره موبایل معتبر نیست (مثال: 09123456789)' })

export const requestOtpSchema = z.object({
  phone: phoneSchema,
  purpose: z.enum(['login', 'register']),
})

export const verifyOtpSchema = z
  .object({
    phone: phoneSchema,
    code: z.string().regex(/^\d{4,8}$/, 'کد تأیید باید ۴ تا ۸ رقم باشد'),
    purpose: z.enum(['login', 'register']),
    name: z.string().min(2).max(100).optional(),
  })
  .superRefine((data, ctx) => {
    if (data.purpose === 'register' && !(data.name && data.name.trim().length >= 2)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'نام برای ثبت‌نام الزامی است',
        path: ['name'],
      })
    }
  })

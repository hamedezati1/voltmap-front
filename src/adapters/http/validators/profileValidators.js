import { z } from 'zod'

export const updateProfileSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  email: z.string().email().optional(),
  // شماره موبایل هویت ورود است و از این مسیر قابل تغییر نیست
})

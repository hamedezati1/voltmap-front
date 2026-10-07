import { z } from 'zod'

export const newsSchema = z.object({
  title: z.string().min(2).max(200),
  body: z.string().min(2),
  image: z.string().url().nullable().optional(),
  category: z.string().optional(),
  pinned: z.boolean().optional(),
})

export const updateNewsSchema = newsSchema.partial()

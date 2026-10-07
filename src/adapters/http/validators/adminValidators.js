import { z } from 'zod'

export const membershipSchema = z.object({
  membership: z.string().min(1),
})

import { z } from 'zod'

export const stationReportSchema = z.object({
  name: z.string().min(2),
  city: z.string().optional(),
  address: z.string().optional(),
  lat: z.number().optional(),
  lng: z.number().optional(),
  type: z.enum(['AC', 'DC']).optional(),
  connector: z.string().optional(),
  notes: z.string().max(1000).optional(),
})

export const rejectReportSchema = z.object({
  reason: z.string().max(500).optional(),
})

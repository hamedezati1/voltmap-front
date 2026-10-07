import { z } from 'zod'

const pointSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  name: z.string().optional(),
  label: z.string().optional(),
})

export const planRouteSchema = z.object({
  origin: pointSchema,
  destination: pointSchema,
  vehicleRange: z.number().positive().optional(),
  batteryPct: z.number().min(1).max(100).optional(),
  connector: z.string().optional(),
  connectorType: z.string().optional(),
})

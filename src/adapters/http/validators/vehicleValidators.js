import { z } from 'zod'

export const vehicleSchema = z.object({
  catalogCarId: z.number().int().positive().optional(),
  name: z.string().min(1).max(120).optional(),
  image: z.string().url().nullable().optional(),
  batteryLevel: z.number().int().min(0).max(100).optional(),
  estimatedRange: z.number().int().positive().optional(),
  connector: z.string().min(1).optional(),
  year: z.number().int().min(1370).max(1500).optional(),
  isDefault: z.boolean().optional(),
}).refine(
  (data) => data.catalogCarId != null || (data.name && data.connector),
  { message: 'یا catalogCarId بفرستید یا name و connector را وارد کنید' }
)

export const updateVehicleSchema = z.object({
  name: z.string().min(1).max(120).optional(),
  image: z.string().url().nullable().optional(),
  batteryLevel: z.number().int().min(0).max(100).optional(),
  estimatedRange: z.number().int().positive().optional(),
  connector: z.string().min(1).optional(),
  year: z.number().int().min(1370).max(1500).optional(),
  isDefault: z.boolean().optional(),
})

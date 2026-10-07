import { z } from 'zod'

export const stationQuerySchema = z.object({
  search: z.string().optional(),
  type: z.enum(['AC', 'DC', 'AC/DC']).optional(),
  status: z.enum(['available', 'busy', 'waiting', 'offline']).optional(),
  city: z.string().optional(),
  province: z.string().optional(),
  operator: z.string().optional(),
})

const boolish = z.union([z.boolean(), z.number().int().min(0).max(1)]).optional()

const stationFields = {
  code: z.string().min(1).max(32).optional(),
  name: z.string().min(2),
  operator: z.string().optional().nullable(),
  province: z.string().optional().nullable(),
  city: z.string().min(1),
  district: z.string().optional().nullable(),
  address: z.string().min(1),
  lat: z.number().min(-90).max(90).optional().nullable(),
  lng: z.number().min(-180).max(180).optional().nullable(),
  acPorts: z.number().int().min(0).optional(),
  dcPorts: z.number().int().min(0).optional(),
  maxPower: z.union([z.string(), z.number()]).optional().nullable(),
  connectors: z.string().optional().nullable(),
  parkingSpots: z.string().optional().nullable(),
  isFree: boolish,
  pricePerKwh: z.string().optional().nullable(),
  isActive: boolish,
  isVerified: boolish,
  isOwnerStation: boolish,
  hours: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  image1: z.string().optional().nullable(),
  image2: z.string().optional().nullable(),
  image3: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  dataUpdatedAt: z.string().optional().nullable(),
  status: z.enum(['available', 'busy', 'waiting', 'offline']).optional(),
  // سازگاری با فرم قدیمی ادمین
  type: z.enum(['AC', 'DC', 'AC/DC']).optional(),
  connector: z.string().optional(),
  power: z.union([z.number(), z.string()]).optional(),
  ports: z.number().int().positive().optional(),
  price: z.string().optional().nullable(),
  image: z.string().optional().nullable(),
}

const stationObjectSchema = z.object(stationFields)

export const createStationSchema = stationObjectSchema.superRefine((data, ctx) => {
  const hasPorts = data.acPorts !== undefined || data.dcPorts !== undefined
  const hasLegacy = data.type !== undefined || data.ports !== undefined
  if (!hasPorts && !hasLegacy) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'تعداد پورت AC/DC یا type الزامی است',
      path: ['acPorts'],
    })
  }
})

// ZodEffects (خروجی superRefine) متد partial ندارد → از خود object استفاده می‌کنیم
export const updateStationSchema = stationObjectSchema.partial()

export const reviewSchema = z.object({
  text: z.string().min(1).max(1000),
  rating: z.number().int().min(1).max(5),
})

export const statusSchema = z.object({
  status: z.enum(['available', 'busy', 'waiting', 'offline']),
})

export const crowdReportSchema = z.object({
  type: z.enum(['available', 'busy']),
})

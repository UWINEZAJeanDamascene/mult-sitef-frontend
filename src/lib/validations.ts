import { z } from 'zod'

export const siteRecordSchema = z.object({
  site_id: z.string().min(1, 'Site is required'),
  material_id: z.string().optional(),
  materialName: z.string().min(1, 'Material is required'),
  quantityReceived: z.coerce.number({
    required_error: 'Quantity received is required',
    invalid_type_error: 'Quantity must be a number',
  }).positive('Quantity received must be greater than 0'),
  quantityUsed: z.coerce.number({
    invalid_type_error: 'Quantity must be a number',
  }).min(0, 'Quantity used cannot be negative').default(0),
  date: z.string().min(1, 'Date is required'),
  notes: z.string().optional(),
}).refine((data) => {
  return data.quantityUsed <= data.quantityReceived
}, {
  message: 'Quantity used cannot exceed quantity received',
  path: ['quantityUsed'],
})

export type SiteRecordFormData = z.infer<typeof siteRecordSchema>

// Date range filter schema
export const dateRangeSchema = z.object({
  startDate: z.string().optional(),
  endDate: z.string().optional(),
}).refine((data) => {
  if (data.startDate && data.endDate) {
    return new Date(data.startDate) <= new Date(data.endDate)
  }
  return true
}, {
  message: 'End date must be after start date',
  path: ['endDate'],
})

export type DateRangeFilter = z.infer<typeof dateRangeSchema>

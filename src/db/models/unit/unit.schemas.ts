import { z } from 'zod'

export const unitSchema = z.object({
    id: z.string().uuid(),
    ucumCode: z.string().min(1),
    title: z.string().min(1),
    valueType: z.enum(['number', 'select', 'text']).optional(),
    options: z.array(z.string()).optional(),
    unitType: z.enum(['mass', 'molar', 'international', 'volume', 'length', 'other']).optional(),
    approved: z.boolean(),
    createdAt: z.coerce.date(),
    updatedAt: z.coerce.date(),
})

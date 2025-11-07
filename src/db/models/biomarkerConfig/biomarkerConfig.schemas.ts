import { z } from 'zod'

import { baseEntitySchema } from '@/db/schemas/base.schemas'

const rangeSchema = z.object({
    min: z.number().optional(),
    max: z.number().optional(),
}).refine(data => {
    if (data.min !== undefined && data.max !== undefined) {
        return data.min < data.max
    }
    return true
}, {
    message: 'Min must be less than max',
})

export const biomarkerConfigSchema = baseEntitySchema.extend({
    name: z.string().min(1).max(100),
    originalName: z.string().optional(),
    description: z.string().optional(),
    normalRange: rangeSchema.optional(),
    targetRange: rangeSchema.optional(),
    ucumCode: z.string().optional(),
    molecularWeight: z.number().positive().optional(),
    approved: z.boolean(),
    order: z.number().optional(),
})

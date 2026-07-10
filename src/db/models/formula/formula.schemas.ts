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

export const formulaVariableSchema = z.object({
    key: z.string().min(1),
    biomarkerId: z.string().uuid(),
})

export const formulaSchema = baseEntitySchema.extend({
    name: z.string().min(1).max(100),
    description: z.string().max(500).optional(),
    expression: z.string().min(1).max(1000),
    variables: z.array(formulaVariableSchema),
    unitLabel: z.string().max(50).optional(),
    normalRange: rangeSchema.optional(),
    targetRange: rangeSchema.optional(),
    order: z.number().optional(),
})

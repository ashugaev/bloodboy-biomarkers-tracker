import { z } from 'zod'

import { baseEntitySchema } from '@/db/schemas/base.schemas'

export const verifiedConversionMethodSchema = z.enum(['ucum', 'molecular-weight', 'conversion-factor', 'simple-math', 'special-formula'])

export const verifiedConversionSchema = baseEntitySchema.extend({
    biomarkerName: z.string().min(1),
    sourceUnit: z.string().min(1),
    targetUnit: z.string().min(1),
    conversionMethod: verifiedConversionMethodSchema,
    molecularWeight: z.number().positive().optional(),
    conversionFactor: z.number().positive().optional(),
})

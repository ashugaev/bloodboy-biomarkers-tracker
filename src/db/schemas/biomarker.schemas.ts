import { z } from 'zod'

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

const baseEntitySchema = z.object({
    id: z.string().uuid(),
    userId: z.string().uuid(),
    createdAt: z.coerce.date(),
    updatedAt: z.coerce.date(),
})

const biomarkerMetadataSchema = z.object({
    name: z.string().min(1).max(100),
    description: z.string().optional(),
})

const biomarkerRangesSchema = z.object({
    normalRange: rangeSchema.optional(),
    criticalRange: rangeSchema.optional(),
    targetRange: rangeSchema.optional(),
})

export const biomarkerConfigSchema = baseEntitySchema
    .merge(biomarkerMetadataSchema)
    .merge(biomarkerRangesSchema)
    .extend({
        ucumCode: z.string().optional(),
        approved: z.boolean(),
    })

const recordNotesSchema = z.object({
    notes: z.string().optional(),
    doctorNotes: z.string().optional(),
})

export const biomarkerRecordSchema = baseEntitySchema
    .merge(recordNotesSchema)
    .extend({
        biomarkerId: z.string().uuid(),
        documentId: z.string().uuid().optional(),
        value: z.number().optional(),
        ucumCode: z.string().optional(),
        approved: z.boolean(),
        latest: z.boolean(),
        order: z.number().optional(),
    })

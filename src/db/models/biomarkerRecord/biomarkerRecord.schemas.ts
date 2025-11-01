import { z } from 'zod'

import { baseEntitySchema } from '@/db/schemas/base.schemas'

export const biomarkerRecordSchema = baseEntitySchema.extend({
    biomarkerId: z.string().uuid(),
    documentId: z.string().uuid().optional(),
    value: z.number().optional(),
    textValue: z.string().optional(),
    ucumCode: z.string().optional(),
    originalName: z.string().optional(),
    notes: z.string().optional(),
    doctorNotes: z.string().optional(),
    approved: z.boolean(),
    latest: z.boolean(),
    order: z.number().optional(),
    page: z.number().optional(),
})

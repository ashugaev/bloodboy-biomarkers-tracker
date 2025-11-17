import { z } from 'zod'

import { baseEntitySchema } from '@/db/schemas/base.schemas'

export const blockedMergeSchema = baseEntitySchema.extend({
    biomarkerName: z.string(),
    sourceUnits: z.array(z.string()),
    targetUnits: z.array(z.string()),
})


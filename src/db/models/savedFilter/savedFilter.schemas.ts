import { z } from 'zod'

import { baseEntitySchema } from '@/db/schemas/base.schemas'

export const savedFilterSchema = baseEntitySchema.extend({
    name: z.string().min(1).max(100),
    color: z.enum(['magenta', 'red', 'volcano', 'orange', 'gold', 'lime', 'green', 'cyan', 'blue', 'geekblue', 'purple']),
    documentId: z.array(z.string().uuid()).optional(),
    biomarkerIds: z.array(z.string().uuid()).optional(),
    outOfRange: z.enum(['normal', 'target']).optional(),
})

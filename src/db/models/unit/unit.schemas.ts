import { z } from 'zod'

export const unitSchema = z.object({
    ucumCode: z.string().min(1),
    title: z.string().min(1),
    approved: z.boolean(),
    createdAt: z.coerce.date(),
    updatedAt: z.coerce.date(),
})

import { z } from 'zod'

export const baseEntitySchema = z.object({
    id: z.string().uuid(),
    userId: z.string().uuid(),
    createdAt: z.coerce.date(),
    updatedAt: z.coerce.date(),
})

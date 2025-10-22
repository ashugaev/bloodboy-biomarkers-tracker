import { z } from 'zod'

const baseEntitySchema = z.object({
    id: z.string().uuid(),
    createdAt: z.coerce.date(),
    updatedAt: z.coerce.date(),
})

export const userSchema = baseEntitySchema.extend({
    name: z.string().optional(),
    email: z.string().email().optional(),
})

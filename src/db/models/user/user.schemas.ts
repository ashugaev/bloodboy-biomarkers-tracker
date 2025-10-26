import { z } from 'zod'

export const userSchema = z.object({
    id: z.string().uuid(),
    createdAt: z.coerce.date(),
    updatedAt: z.coerce.date(),
    name: z.string().optional(),
    email: z.string().email().optional(),
})

import { v4 as uuidv4 } from 'uuid'

import { getCurrentUserId } from '@/db/models/user'
import { BaseEntity } from '@/db/types/base.types'

export const createBaseEntity = async (): Promise<BaseEntity> => {
    const now = new Date()
    const userId = await getCurrentUserId()
    return {
        id: uuidv4(),
        userId,
        createdAt: now,
        updatedAt: now,
    }
}

import { v4 as uuidv4 } from 'uuid'

import { getCurrentUserId } from '@/db/models/user'
import { db } from '@/db/services/db.service'

import { addBlockedMerge } from './blockedMerge.hooks'
import { DEFAULT_BLOCKED_MERGES } from './blockedMerge.initial'
import { BlockedMerge } from './blockedMerge.types'

export const createBlockedMergeKey = (biomarkerName: string, sourceUnit: string, targetUnit: string): string => {
    return `${biomarkerName}|${sourceUnit}|${targetUnit}`
}

export const addBlockedMergePair = async (biomarkerName: string, sourceUnits: string[], targetUnits: string[]) => {
    await addBlockedMerge({
        biomarkerName,
        sourceUnits,
        targetUnits,
    })
}

export const preloadBlockedMerges = async (): Promise<void> => {
    const existingBlockedMerges = await db.blockedMerges.toArray()

    if (existingBlockedMerges.length > 0) {
        return
    }

    const now = new Date()
    const userId = await getCurrentUserId()

    const blockedMerges: BlockedMerge[] = DEFAULT_BLOCKED_MERGES.map(merge => ({
        id: uuidv4(),
        userId,
        biomarkerName: merge.biomarkerName,
        sourceUnits: merge.sourceUnits,
        targetUnits: merge.targetUnits,
        createdAt: now,
        updatedAt: now,
    }))

    await db.blockedMerges.bulkAdd(blockedMerges)
}


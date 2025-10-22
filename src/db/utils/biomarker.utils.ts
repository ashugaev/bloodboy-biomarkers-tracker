import { v4 as uuidv4 } from 'uuid'

import { getCurrentUserId } from '../hooks/useUser'
import { BiomarkerConfig, BiomarkerRecord } from '../types/biomarker.types'

const createBaseEntity = async () => {
    const now = new Date()
    const userId = await getCurrentUserId()
    return {
        id: uuidv4(),
        userId,
        createdAt: now,
        updatedAt: now,
    }
}

export const createBiomarkerConfig = async (
    partial: Partial<BiomarkerConfig>,
): Promise<BiomarkerConfig> => {
    return {
        ...await createBaseEntity(),
        ...partial,
    } as BiomarkerConfig
}

export const createBiomarkerRecord = async (
    partial: Partial<BiomarkerRecord>,
): Promise<BiomarkerRecord> => {
    const now = new Date()
    return {
        ...await createBaseEntity(),
        testDate: now,
        approved: false,
        latest: true,
        ...partial,
    } as BiomarkerRecord
}

import { createBaseEntity } from '@/db/utils/entity.utils'

import { BiomarkerRecord } from './biomarkerRecord.types'

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

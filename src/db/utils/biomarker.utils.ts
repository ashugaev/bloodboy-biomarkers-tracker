import { v4 as uuidv4 } from 'uuid'

import { BiomarkerType, Unit, BiomarkerConfig, BiomarkerRecord } from '../types/biomarker.types'

const createBaseEntity = () => {
    const now = new Date()
    return {
        id: uuidv4(),
        createdAt: now,
        updatedAt: now,
    }
}

export const createBiomarkerConfig = (
    partial: Partial<BiomarkerConfig>,
): BiomarkerConfig => {
    return {
        ...createBaseEntity(),
        type: BiomarkerType.GLUCOSE,
        name: '',
        unit: Unit.MG_DL,
        normalRange: {
            min: 0,
            max: 100,
        },
        enabled: true,
        ...partial,
    }
}

export const createBiomarkerRecord = (
    partial: Partial<BiomarkerRecord>,
): BiomarkerRecord => {
    const now = new Date()
    return {
        ...createBaseEntity(),
        biomarkerId: '',
        value: 0,
        unit: Unit.MG_DL,
        testDate: now,
        ...partial,
    }
}

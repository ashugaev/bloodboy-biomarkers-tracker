import { v4 as uuidv4 } from 'uuid'

import { getCurrentUserId } from '@/db/models/user'
// eslint-disable-next-line no-restricted-imports
import { db } from '@/db/services/db.service'

import { BIOMARKER_CONFIGS } from './biomarkerConfig.initial'
import { BiomarkerConfig } from './biomarkerConfig.types'

export const preloadBiomarkerConfigs = async (): Promise<void> => {
    const existingConfigs = await db.biomarkerConfigs.toArray()

    if (existingConfigs.length > 0) {
        return
    }

    const now = new Date()
    const userId = await getCurrentUserId()

    const configs: BiomarkerConfig[] = BIOMARKER_CONFIGS.map(config => ({
        id: uuidv4(),
        userId,
        name: config.name,
        ucumCode: config.ucumCode,
        normalRange: config.normalRange,
        description: config.description,
        order: config.order,
        isDefault: config.isDefault,
        approved: true,
        createdAt: now,
        updatedAt: now,
    }))

    await db.biomarkerConfigs.bulkAdd(configs)
}

export const isValueNormal = (
    value: number,
    config: BiomarkerConfig,
): boolean => {
    if (!config.normalRange?.min || !config.normalRange?.max) return false
    return value >= config.normalRange.min && value <= config.normalRange.max
}

export const isValueLow = (
    value: number,
    config: BiomarkerConfig,
): boolean => {
    if (!config.normalRange?.min) return false
    return value < config.normalRange.min
}

export const isValueHigh = (
    value: number,
    config: BiomarkerConfig,
): boolean => {
    if (!config.normalRange?.max) return false
    return value > config.normalRange.max
}

export const getValueStatus = (
    value: number,
    config: BiomarkerConfig,
): 'low' | 'normal' | 'high' => {
    if (isValueLow(value, config)) return 'low'
    if (isValueHigh(value, config)) return 'high'
    return 'normal'
}

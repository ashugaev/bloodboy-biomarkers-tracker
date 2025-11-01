import { v4 as uuidv4 } from 'uuid'

import { UNIT_CONFIGS } from '@/constants/units'
// eslint-disable-next-line no-restricted-imports
import { db } from '@/db/services/db.service'

import { Unit } from './unit.types'

export const preloadUnits = async (): Promise<void> => {
    const existingUnits = await db.units.toArray()

    if (existingUnits.length > 0) {
        return
    }

    const now = new Date()
    const units: Unit[] = UNIT_CONFIGS.map(config => ({
        id: uuidv4(),
        ucumCode: config.ucum,
        title: config.title,
        valueType: config.valueType,
        options: config.options,
        approved: true,
        createdAt: now,
        updatedAt: now,
    }))

    await db.units.bulkAdd(units)
}

export const getUnitTitle = async (ucumCode?: string): Promise<string | undefined> => {
    if (!ucumCode) return undefined
    const unit = await db.units.where('ucumCode').equals(ucumCode).first()
    return unit?.title
}

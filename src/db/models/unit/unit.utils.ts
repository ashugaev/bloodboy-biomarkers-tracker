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
        ucumCode: config.ucum,
        title: config.title,
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

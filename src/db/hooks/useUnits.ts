import { useLiveQuery } from 'dexie-react-hooks'

import { db } from '../services/db.service'
import { Unit } from '../types'

export const useUnits = () => {
    const units = useLiveQuery(async () => {
        return await db.units.toArray()
    }, [])

    return {
        units: units ?? [],
        loading: units === undefined,
    }
}

export const useUnit = (ucumCode?: string) => {
    const unit = useLiveQuery(
        async () => {
            if (!ucumCode) return null
            return await db.units.where('ucumCode').equals(ucumCode).first() ?? null
        },
        [ucumCode],
    )

    return {
        unit,
        loading: unit === undefined,
    }
}

export const addUnit = async (unit: Unit): Promise<string> => {
    return await db.units.add(unit)
}

export const updateUnit = async (ucumCode: string, updates: Partial<Unit>): Promise<void> => {
    await db.units.update(ucumCode, {
        ...updates,
        updatedAt: new Date(),
    })
}

export const deleteUnit = async (ucumCode: string): Promise<void> => {
    await db.units.delete(ucumCode)
}

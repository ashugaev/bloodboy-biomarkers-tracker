import { useLiveQuery } from 'dexie-react-hooks'

import { db } from '../services/db.service'
import { BiomarkerConfig } from '../types'

export const useBiomarkerConfigs = (approvedOnly: boolean = true) => {
    const configs = useLiveQuery(
        async () => {
            const query = db.biomarkerConfigs.toCollection()

            if (approvedOnly) {
                const allConfigs = await query.toArray()
                return allConfigs.filter(c => c.approved).sort((a, b) => (a.order ?? Infinity) - (b.order ?? Infinity))
            }

            return (await db.biomarkerConfigs.toArray()).sort((a, b) => (a.order ?? Infinity) - (b.order ?? Infinity))
        },
        [approvedOnly],
    )

    return {
        configs: configs ?? [],
        loading: configs === undefined,
    }
}

export const useBiomarkerConfig = (id?: string) => {
    const config = useLiveQuery(
        async () => {
            if (!id) return null
            return await db.biomarkerConfigs.get(id) ?? null
        },
        [id],
    )

    return {
        config,
        loading: config === undefined,
    }
}

export const addBiomarkerConfig = async (config: BiomarkerConfig): Promise<string> => {
    return await db.biomarkerConfigs.add(config)
}

export const updateBiomarkerConfig = async (id: string, updates: Partial<BiomarkerConfig>): Promise<void> => {
    await db.biomarkerConfigs.update(id, {
        ...updates,
        updatedAt: new Date(),
    })
}

export const deleteBiomarkerConfig = async (id: string): Promise<void> => {
    await db.biomarkerConfigs.delete(id)
}

import { useLiveQuery } from 'dexie-react-hooks'

import { db } from '../services/db.service'
import { BiomarkerConfig, BiomarkerType } from '../types'

export const useBiomarkerConfigs = (enabledOnly: boolean = false) => {
    const configs = useLiveQuery(
        async () => {
            if (enabledOnly) {
                return await db.biomarkerConfigs
                    .where('enabled')
                    .equals(1)
                    .toArray()
            }
            return await db.biomarkerConfigs.toArray()
        },
        [enabledOnly],
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

export const useBiomarkerConfigByType = (type?: BiomarkerType) => {
    const config = useLiveQuery(
        async () => {
            if (!type) return null
            return await db.biomarkerConfigs
                .where('type')
                .equals(type)
                .first() ?? null
        },
        [type],
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

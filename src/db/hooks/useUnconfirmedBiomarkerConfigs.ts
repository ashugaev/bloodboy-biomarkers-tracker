import { useLiveQuery } from 'dexie-react-hooks'

import { db } from '../services/db.service'

export const useUnconfirmedBiomarkerConfigs = () => {
    const unconfirmedConfigs = useLiveQuery(
        async () => {
            const configs = await db.biomarkerConfigs
                .orderBy('createdAt')
                .reverse()
                .filter(config => !config.approved)
                .toArray()
            return configs.sort((a, b) => (a.order ?? Infinity) - (b.order ?? Infinity))
        },
        [],
    )

    return {
        unconfirmedConfigs: unconfirmedConfigs ?? [],
        loading: unconfirmedConfigs === undefined,
    }
}

import { useLiveQuery } from 'dexie-react-hooks'

import { db } from '../services/db.service'

export const useUnconfirmedBiomarkerConfigs = () => {
    const unconfirmedConfigs = useLiveQuery(
        async () => {
            return await db.biomarkerConfigs
                .orderBy('createdAt')
                .reverse()
                .filter(config => !config.approved)
                .toArray()
        },
        [],
    )

    return {
        unconfirmedConfigs: unconfirmedConfigs ?? [],
        loading: unconfirmedConfigs === undefined,
    }
}

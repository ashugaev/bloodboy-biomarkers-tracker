import { useLiveQuery } from 'dexie-react-hooks'

import { db } from '../services/db.service'

export const useUnconfirmedBiomarkerRecords = () => {
    const unconfirmedRecords = useLiveQuery(
        async () => {
            return await db.biomarkerRecords
                .orderBy('createdAt')
                .reverse()
                .filter(record => !record.approved)
                .toArray()
        },
        [],
    )

    return {
        unconfirmedRecords: unconfirmedRecords ?? [],
        loading: unconfirmedRecords === undefined,
    }
}

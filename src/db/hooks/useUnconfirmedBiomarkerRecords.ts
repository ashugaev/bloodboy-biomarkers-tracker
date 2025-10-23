import { useLiveQuery } from 'dexie-react-hooks'

import { db } from '../services/db.service'

export const useUnconfirmedBiomarkerRecords = () => {
    const unconfirmedRecords = useLiveQuery(
        async () => {
            const records = await db.biomarkerRecords
                .orderBy('createdAt')
                .reverse()
                .filter(record => !record.approved)
                .toArray()
            return records.sort((a, b) => (a.order ?? Infinity) - (b.order ?? Infinity))
        },
        [],
    )

    return {
        unconfirmedRecords: unconfirmedRecords ?? [],
        loading: unconfirmedRecords === undefined,
    }
}

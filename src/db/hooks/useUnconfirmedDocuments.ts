import { useLiveQuery } from 'dexie-react-hooks'

import { db } from '../services/db.service'

export const useUnconfirmedDocuments = () => {
    const unconfirmedDocuments = useLiveQuery(
        async () => {
            return await db.uploadedFiles
                .orderBy('uploadDate')
                .reverse()
                .filter(doc => !doc.approved)
                .toArray()
        },
        [],
    )

    return {
        unconfirmedDocuments: unconfirmedDocuments ?? [],
        loading: unconfirmedDocuments === undefined,
    }
}

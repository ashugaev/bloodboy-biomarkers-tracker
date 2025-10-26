import { useCallback } from 'react'

import { db } from '@/db/services/db.service'

export const useCancelUnapproved = () => {
    const cancelAll = useCallback(async () => {
        const [unapprovedConfigs, unapprovedRecords, unapprovedDocuments] = await Promise.all([
            db.biomarkerConfigs.filter(item => !item.approved).toArray(),
            db.biomarkerRecords.filter(item => !item.approved).toArray(),
            db.uploadedFiles.filter(item => !item.approved).toArray(),
        ])

        const configIds = unapprovedConfigs.map(item => item.id)
        const recordIds = unapprovedRecords.map(item => item.id)
        const documentIds = unapprovedDocuments.map(item => item.id)

        await Promise.all([
            configIds.length > 0 ? db.biomarkerConfigs.bulkDelete(configIds) : Promise.resolve(),
            recordIds.length > 0 ? db.biomarkerRecords.bulkDelete(recordIds) : Promise.resolve(),
            documentIds.length > 0 ? db.uploadedFiles.bulkDelete(documentIds) : Promise.resolve(),
        ])
    }, [])

    return { cancelAll }
}

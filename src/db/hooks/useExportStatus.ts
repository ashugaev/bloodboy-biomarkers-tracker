import { useLiveQuery } from 'dexie-react-hooks'

// eslint-disable-next-line no-restricted-imports
import { db } from '@/db/services/db.service'
import {
    getLastExportedAt,
    getLatestUserDataUpdatedAt,
} from '@/db/utils/exportStatus.utils'

interface ExportStatus {
    hasUnexportedChanges: boolean
    lastExportedAt: Date | null
}

export const useExportStatus = () => {
    const status = useLiveQuery<ExportStatus>(async () => {
        const [settings, latestUpdatedAt] = await Promise.all([
            db.appSettings.limit(1).first(),
            getLatestUserDataUpdatedAt(),
        ])

        const lastExportedAt = getLastExportedAt(settings)

        if (!latestUpdatedAt) {
            return {
                hasUnexportedChanges: false,
                lastExportedAt,
            }
        }

        if (!lastExportedAt) {
            return {
                hasUnexportedChanges: true,
                lastExportedAt: null,
            }
        }

        return {
            hasUnexportedChanges: latestUpdatedAt.getTime() > lastExportedAt.getTime(),
            lastExportedAt,
        }
    }, [])

    return {
        hasUnexportedChanges: status?.hasUnexportedChanges ?? false,
        lastExportedAt: status?.lastExportedAt ?? null,
        loading: status === undefined,
    }
}

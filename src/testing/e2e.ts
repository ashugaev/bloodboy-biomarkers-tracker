import { v4 as uuidv4 } from 'uuid'

import { MAIN_SETTINGS_ID } from '@/constants'
import { preloadBiomarkerConfigs } from '@/db/models/biomarkerConfig'
import { preloadBlockedMerges } from '@/db/models/blockedMerge'
import { DocumentType } from '@/db/models/document'
import { preloadUnits } from '@/db/models/unit'
import { getCurrentUserId } from '@/db/models/user'
// eslint-disable-next-line no-restricted-imports
import { db } from '@/db/services/db.service'

declare global {
    interface Window {
        // eslint-disable-next-line @typescript-eslint/naming-convention
        __bloodboyE2E?: {
            reset: () => Promise<void>
            seedExactFileDuplicateScenario: (fileHash: string) => Promise<void>
            seedGoogleDriveAutoSyncScenario: () => Promise<void>
        }
    }
}

const clearDatabase = async () => {
    await db.transaction(
        'rw',
        [
            db.appSettings,
            db.biomarkerRecords,
            db.biomarkerConfigs,
            db.blockedMerges,
            db.savedFilters,
            db.units,
            db.uploadedFiles,
            db.users,
            db.verifiedConversions,
        ],
        async () => {
            await Promise.all([
                db.appSettings.clear(),
                db.biomarkerRecords.clear(),
                db.biomarkerConfigs.clear(),
                db.blockedMerges.clear(),
                db.savedFilters.clear(),
                db.units.clear(),
                db.uploadedFiles.clear(),
                db.users.clear(),
                db.verifiedConversions.clear(),
            ])
        },
    )
}

const ensureBaseData = async () => {
    await getCurrentUserId()
    await preloadUnits()
    await preloadBiomarkerConfigs()
    await preloadBlockedMerges()

    const now = new Date()

    await db.appSettings.put({
        id: MAIN_SETTINGS_ID,
        openaiApiKey: 'e2e-test-key',
        createdAt: now,
        updatedAt: now,
    })
}

const seedExactFileDuplicateScenario = async (fileHash: string) => {
    await clearDatabase()
    await ensureBaseData()

    const userId = await getCurrentUserId()
    const now = new Date('2026-04-26T12:00:00.000Z')

    await db.uploadedFiles.add({
        id: uuidv4(),
        userId,
        fileName: 'exact-duplicate.pdf',
        originalName: 'exact-duplicate.pdf',
        fileSize: 512,
        mimeType: 'application/pdf',
        fileHash,
        type: DocumentType.PDF,
        approved: true,
        uploadDate: now,
        notes: '',
        createdAt: now,
        updatedAt: now,
    })
}

const seedGoogleDriveAutoSyncScenario = async () => {
    await clearDatabase()
    await ensureBaseData()

    const now = new Date('2026-04-26T12:00:00.000Z')

    await db.appSettings.update(MAIN_SETTINGS_ID, {
        googleDriveBackup: {
            enabled: true,
            lastBackupAt: now,
            connectedAt: now,
        },
        updatedAt: now,
    })

    window.localStorage.removeItem('bloodboy.googleDrive.accessToken')
}

export const registerE2EHelpers = () => {
    if (!import.meta.env.DEV || typeof window === 'undefined') {
        return
    }

    window.__bloodboyE2E = {
        reset: async () => {
            await clearDatabase()
            await ensureBaseData()
        },
        seedExactFileDuplicateScenario,
        seedGoogleDriveAutoSyncScenario,
    }
}

import { Dexie, EntityTable } from 'dexie'

import { AppSettings, BiomarkerConfig, BiomarkerRecord, Unit, UploadedDocument, User } from '../types'

let currentUserId: string | null = null

export const setCurrentUserId = (userId: string) => {
    currentUserId = userId
}

export const getCurrentUserIdSync = (): string | null => {
    return currentUserId
}

class BloodTestDatabase extends Dexie {
    biomarkerConfigs!: EntityTable<BiomarkerConfig, 'id'>
    biomarkerRecords!: EntityTable<BiomarkerRecord, 'id'>
    uploadedFiles!: EntityTable<UploadedDocument, 'id'>
    appSettings!: EntityTable<AppSettings, 'id'>
    users!: EntityTable<User, 'id'>
    units!: EntityTable<Unit, 'ucumCode'>

    constructor () {
        super('blood-test-db')

        this.version(1).stores({
            biomarkerConfigs: 'id, userId, approved, createdAt, updatedAt',
            biomarkerRecords: 'id, userId, biomarkerId, documentId, approved, latest, createdAt, updatedAt',
            uploadedFiles: 'id, userId, type, approved, uploadDate, createdAt, updatedAt',
            appSettings: 'id, createdAt, updatedAt',
            users: 'id, createdAt, updatedAt',
        })

        this.version(2).stores({
            biomarkerConfigs: 'id, userId, approved, createdAt, updatedAt',
            biomarkerRecords: 'id, userId, biomarkerId, documentId, approved, latest, createdAt, updatedAt',
            uploadedFiles: 'id, userId, type, approved, uploadDate, createdAt, updatedAt',
            appSettings: 'id, createdAt, updatedAt',
            users: 'id, createdAt, updatedAt',
            units: 'ucumCode, approved, createdAt, updatedAt',
        })

        const tablesWithUserId = [
            this.biomarkerConfigs,
            this.biomarkerRecords,
            this.uploadedFiles,
        ]

        tablesWithUserId.forEach(table => {
            table.hook('reading', obj => {
                const userId = getCurrentUserIdSync()
                return userId && obj.userId !== userId ? undefined : obj
            })
        })
    }
}

export const db = new BloodTestDatabase()

import { Dexie, EntityTable } from 'dexie'

import { DB_NAME } from '@/constants'
import { AppSettings } from '@/db/models/appSettings'
import { BiomarkerConfig } from '@/db/models/biomarkerConfig'
import { BiomarkerRecord } from '@/db/models/biomarkerRecord'
import { UploadedDocument } from '@/db/models/document'
import { SavedFilter } from '@/db/models/savedFilter'
import { Unit } from '@/db/models/unit'
import { User } from '@/db/models/user'
import { VerifiedConversion } from '@/db/models/verifiedConversion'

let currentUserId: string | null = null
let isImporting = false

export const setCurrentUserId = (userId: string) => {
    currentUserId = userId
}

export const getCurrentUserIdSync = (): string | null => {
    return currentUserId
}

export const setIsImporting = (value: boolean) => {
    isImporting = value
}

export const getIsImporting = (): boolean => {
    return isImporting
}

class BloodTestDatabase extends Dexie {
    biomarkerConfigs!: EntityTable<BiomarkerConfig, 'id'>
    biomarkerRecords!: EntityTable<BiomarkerRecord, 'id'>
    uploadedFiles!: EntityTable<UploadedDocument, 'id'>
    appSettings!: EntityTable<AppSettings, 'id'>
    users!: EntityTable<User, 'id'>
    units!: EntityTable<Unit, 'id'>
    savedFilters!: EntityTable<SavedFilter, 'id'>
    verifiedConversions!: EntityTable<VerifiedConversion, 'id'>

    constructor () {
        super(DB_NAME)

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

        this.version(3).stores({
            biomarkerConfigs: 'id, userId, approved, createdAt, updatedAt',
            biomarkerRecords: 'id, userId, biomarkerId, documentId, approved, latest, createdAt, updatedAt',
            uploadedFiles: 'id, userId, type, approved, uploadDate, createdAt, updatedAt',
            appSettings: 'id, createdAt, updatedAt',
            users: 'id, createdAt, updatedAt',
            units: null,
        })

        this.version(4).stores({
            biomarkerConfigs: 'id, userId, approved, createdAt, updatedAt',
            biomarkerRecords: 'id, userId, biomarkerId, documentId, approved, latest, createdAt, updatedAt',
            uploadedFiles: 'id, userId, type, approved, uploadDate, createdAt, updatedAt',
            appSettings: 'id, createdAt, updatedAt',
            users: 'id, createdAt, updatedAt',
            units: 'id, ucumCode, approved, createdAt, updatedAt',
        })

        this.version(5).stores({
            biomarkerConfigs: 'id, userId, approved, createdAt, updatedAt',
            biomarkerRecords: 'id, userId, biomarkerId, documentId, approved, latest, createdAt, updatedAt',
            uploadedFiles: 'id, userId, type, approved, uploadDate, createdAt, updatedAt',
            appSettings: 'id, createdAt, updatedAt',
            users: 'id, createdAt, updatedAt',
            units: 'id, ucumCode, approved, createdAt, updatedAt',
            savedFilters: 'id, userId, createdAt, updatedAt',
        })

        this.version(6).stores({
            biomarkerConfigs: 'id, userId, approved, createdAt, updatedAt',
            biomarkerRecords: 'id, userId, biomarkerId, documentId, approved, latest, createdAt, updatedAt',
            uploadedFiles: 'id, userId, type, approved, uploadDate, createdAt, updatedAt',
            appSettings: 'id, createdAt, updatedAt',
            users: 'id, createdAt, updatedAt',
            units: 'id, ucumCode, approved, createdAt, updatedAt',
            savedFilters: 'id, userId, createdAt, updatedAt',
            verifiedConversions: 'id, userId, biomarkerName, sourceUnit, targetUnit, createdAt, updatedAt',
        })

        // Disabled until user switch is implemented
        // const tablesWithUserId = [
        //     this.biomarkerConfigs,
        //     this.biomarkerRecords,
        //     this.uploadedFiles,
        //     this.savedFilters,
        //     this.verifiedConversions,
        // ]
        // tablesWithUserId.forEach(table => {
        //     table.hook('reading', obj => {
        //         const userId = getCurrentUserIdSync()
        //         return userId && obj.userId !== userId ? undefined : obj
        //     })
        // })
    }
}

export const db = new BloodTestDatabase()

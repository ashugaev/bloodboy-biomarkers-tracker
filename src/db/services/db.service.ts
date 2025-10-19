import { Dexie, EntityTable } from 'dexie'

import { AppSettings, BiomarkerConfig, BiomarkerRecord, UploadedDocument } from '../types'

class BloodTestDatabase extends Dexie {
    biomarkerConfigs!: EntityTable<BiomarkerConfig, 'id'>
    biomarkerRecords!: EntityTable<BiomarkerRecord, 'id'>
    uploadedFiles!: EntityTable<UploadedDocument, 'id'>
    appSettings!: EntityTable<AppSettings, 'id'>

    constructor () {
        super('blood-test-db')

        this.version(1).stores({
            biomarkerConfigs: 'id, type, enabled, createdAt, updatedAt',
            biomarkerRecords: 'id, biomarkerId, documentId, testDate, approved, latest, createdAt, updatedAt',
            uploadedFiles: 'id, type, status, uploadDate, createdAt, updatedAt',
            appSettings: 'id, createdAt, updatedAt',
        })
    }
}

export const db = new BloodTestDatabase()

import { Dexie, EntityTable } from 'dexie'

import { BiomarkerConfig, BiomarkerRecord, UploadedDocument } from '../types'

class BloodTestDatabase extends Dexie {
    biomarkerConfigs!: EntityTable<BiomarkerConfig, 'id'>
    biomarkerRecords!: EntityTable<BiomarkerRecord, 'id'>
    uploadedFiles!: EntityTable<UploadedDocument, 'id'>

    constructor () {
        super('blood-test-db')

        this.version(1).stores({
            biomarkerConfigs: 'id, type, enabled, createdAt, updatedAt',
            biomarkerRecords: 'id, biomarkerId, documentId, testDate, createdAt, updatedAt',
            documents: 'id, type, status, uploadDate, createdAt, updatedAt',
        })

        this.version(2).stores({
            biomarkerConfigs: 'id, type, enabled, createdAt, updatedAt',
            biomarkerRecords: 'id, biomarkerId, documentId, testDate, createdAt, updatedAt',
            uploadedFiles: 'id, type, status, uploadDate, createdAt, updatedAt',
            documents: null,
        }).upgrade(async tx => {
            const oldDocuments = await tx.table('documents').toArray()
            await tx.table('uploadedFiles').bulkAdd(oldDocuments)
        })
    }
}

export const db = new BloodTestDatabase()

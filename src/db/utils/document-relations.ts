import { db } from '../services'
import { BiomarkerRecord, UploadedDocument } from '../types'

export const getRecordsByDocument = async (
    documentId: string,
): Promise<BiomarkerRecord[]> => {
    return await db.biomarkerRecords
        .where('documentId')
        .equals(documentId)
        .toArray()
}

export const getDocumentForRecord = async (
    record: BiomarkerRecord,
): Promise<UploadedDocument | null> => {
    if (!record.documentId) return null
    return await db.uploadedFiles.get(record.documentId) ?? null
}

export const linkRecordToDocument = async (
    recordId: string,
    documentId: string,
): Promise<void> => {
    await db.biomarkerRecords.update(recordId, {
        documentId,
        updatedAt: new Date(),
    })
}

export const unlinkRecordFromDocument = async (
    recordId: string,
): Promise<void> => {
    await db.biomarkerRecords.update(recordId, {
        documentId: undefined,
        updatedAt: new Date(),
    })
}

export const getDocumentStats = async (
    documentId: string,
): Promise<{
    totalRecords: number
    biomarkerTypes: Set<string>
}> => {
    const records = await getRecordsByDocument(documentId)
    const biomarkerIds = new Set(records.map(r => r.biomarkerId))

    return {
        totalRecords: records.length,
        biomarkerTypes: biomarkerIds,
    }
}

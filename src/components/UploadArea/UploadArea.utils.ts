import { BiomarkerRecord } from '@/db/models/biomarkerRecord'
import { UploadedDocument } from '@/db/models/document'

export const createRecordKey = (
    record: Pick<BiomarkerRecord, 'biomarkerId' | 'value' | 'ucumCode'>,
    testDate?: Date,
): string => {
    return `${record.value}:${record.ucumCode}:${testDate?.getTime() ?? ''}`
}

export const createDocumentKey = (doc: Pick<UploadedDocument, 'fileName' | 'fileSize'>): string => {
    return `${doc.fileName}:${doc.fileSize}`
}

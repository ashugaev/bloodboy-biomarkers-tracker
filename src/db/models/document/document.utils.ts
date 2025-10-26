import { createBaseEntity } from '@/db/utils/entity.utils'

import { UploadedDocument, DocumentType } from './document.types'

export const createDocument = async (
    partial: Partial<UploadedDocument>,
): Promise<UploadedDocument> => {
    const now = new Date()
    return {
        ...await createBaseEntity(),
        fileName: '',
        originalName: '',
        fileSize: 0,
        mimeType: '',
        type: DocumentType.PDF,
        approved: false,
        uploadDate: now,
        ...partial,
    }
}

export const getDocumentTypeFromMimeType = (_mimeType: string): DocumentType => {
    return DocumentType.PDF
}

export const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'

    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))

    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`
}

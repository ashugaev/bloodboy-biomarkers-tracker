import { v4 as uuidv4 } from 'uuid'

import { UploadedDocument, DocumentType, DocumentStatus } from '../types/document.types'

const createBaseEntity = () => {
    const now = new Date()
    return {
        id: uuidv4(),
        createdAt: now,
        updatedAt: now,
    }
}

export const createDocument = (
    partial: Partial<UploadedDocument>,
): UploadedDocument => {
    const now = new Date()
    return {
        ...createBaseEntity(),
        fileName: '',
        originalName: '',
        fileSize: 0,
        mimeType: '',
        type: DocumentType.PDF,
        status: DocumentStatus.UPLOADED,
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

export const getDocumentStatusColor = (status: DocumentStatus): string => {
    const colors: Record<DocumentStatus, string> = {
        [DocumentStatus.UPLOADED]: 'text-blue-600',
        [DocumentStatus.PROCESSING]: 'text-yellow-600',
        [DocumentStatus.PROCESSED]: 'text-green-600',
        [DocumentStatus.ERROR]: 'text-red-600',
    }
    return colors[status]
}

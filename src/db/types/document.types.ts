import { BaseEntity } from './biomarker.types'

export enum DocumentType {
    PDF = 'pdf',
}

export interface FileMetadata {
    fileName: string
    originalName: string
    fileSize: number
    mimeType: string
}

export interface DocumentMetadata {
    lab?: string
    testDate?: Date
    doctorName?: string
    notes?: string
}

export interface UploadedDocument extends BaseEntity, FileMetadata, DocumentMetadata {
    type: DocumentType
    approved: boolean
    uploadDate: Date
    fileData?: ArrayBuffer
    thumbnailPath?: string
    extractedText?: string
}

export interface DocumentStats {
    totalDocuments: number
    totalSize: number
    byType: Record<DocumentType, number>
}

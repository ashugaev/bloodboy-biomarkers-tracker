import { BaseEntity } from './biomarker.types'

export enum DocumentType {
    PDF = 'pdf',
}

export enum DocumentStatus {
    UPLOADED = 'uploaded',
    PROCESSING = 'processing',
    PROCESSED = 'processed',
    ERROR = 'error',
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
    status: DocumentStatus
    uploadDate: Date
    filePath?: string
    thumbnailPath?: string
    extractedText?: string
}

export interface DocumentStats {
    totalDocuments: number
    totalSize: number
    byType: Record<DocumentType, number>
    byStatus: Record<DocumentStatus, number>
}

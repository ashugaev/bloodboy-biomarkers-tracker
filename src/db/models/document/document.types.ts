import { BaseEntity } from '@/db/types/base.types'

export enum DocumentType {
    PDF = 'pdf',
}

export interface UploadedDocument extends BaseEntity {
    fileName: string
    originalName: string
    fileSize: number
    mimeType: string
    lab?: string
    testDate?: Date
    doctorName?: string
    notes?: string
    type: DocumentType
    approved: boolean
    uploadDate: Date
    fileData?: ArrayBuffer
    thumbnailPath?: string
    extractedText?: string
}

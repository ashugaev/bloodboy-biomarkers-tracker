import { z } from 'zod'

import { DocumentType, DocumentStatus } from '../types/document.types'

const baseEntitySchema = z.object({
    id: z.string().uuid(),
    createdAt: z.coerce.date(),
    updatedAt: z.coerce.date(),
})

const fileMetadataSchema = z.object({
    fileName: z.string().min(1),
    originalName: z.string().min(1),
    fileSize: z.number().positive(),
    mimeType: z.string().min(1),
})

const documentMetadataSchema = z.object({
    lab: z.string().optional(),
    testDate: z.coerce.date().optional(),
    doctorName: z.string().optional(),
    notes: z.string().optional(),
})

export const uploadedDocumentSchema = baseEntitySchema
    .merge(fileMetadataSchema)
    .merge(documentMetadataSchema)
    .extend({
        type: z.nativeEnum(DocumentType),
        status: z.nativeEnum(DocumentStatus),
        uploadDate: z.coerce.date(),
        filePath: z.string().optional(),
        thumbnailPath: z.string().optional(),
        extractedText: z.string().optional(),
    })

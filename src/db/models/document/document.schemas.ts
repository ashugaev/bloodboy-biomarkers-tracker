import { z } from 'zod'

import { baseEntitySchema } from '@/db/schemas/base.schemas'

import { DocumentType } from './document.types'

export const uploadedDocumentSchema = baseEntitySchema.extend({
    fileName: z.string().min(1),
    originalName: z.string().min(1),
    fileSize: z.number().positive(),
    mimeType: z.string().min(1),
    lab: z.string().optional(),
    testDate: z.coerce.date().optional(),
    doctorName: z.string().optional(),
    notes: z.string().optional(),
    type: z.nativeEnum(DocumentType),
    approved: z.boolean(),
    uploadDate: z.coerce.date(),
    fileData: z.instanceof(ArrayBuffer).optional(),
    thumbnailPath: z.string().optional(),
    extractedText: z.string().optional(),
    approvedPages: z.array(z.number()).optional(),
    totalPages: z.number().positive().optional(),
})

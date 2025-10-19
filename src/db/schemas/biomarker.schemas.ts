import { z } from 'zod'

import { BiomarkerType, Unit } from '../types/biomarker.types'
import { isUnitValidForBiomarker } from '../utils/biomarker-units'

const rangeSchema = z.object({
    min: z.number(),
    max: z.number(),
}).refine(data => data.min < data.max, {
    message: 'Min must be less than max',
})

const baseEntitySchema = z.object({
    id: z.string().uuid(),
    userId: z.string().uuid(),
    createdAt: z.coerce.date(),
    updatedAt: z.coerce.date(),
})

const biomarkerMetadataSchema = z.object({
    name: z.string().min(1).max(100),
    description: z.string().optional(),
})

const biomarkerRangesSchema = z.object({
    normalRange: rangeSchema,
    criticalRange: rangeSchema.optional(),
})

export const biomarkerConfigSchema = baseEntitySchema
    .merge(biomarkerMetadataSchema)
    .merge(biomarkerRangesSchema)
    .extend({
        type: z.nativeEnum(BiomarkerType),
        unit: z.nativeEnum(Unit),
        enabled: z.boolean(),
    })
    .refine(
        data => isUnitValidForBiomarker(data.type, data.unit),
        {
            message: 'Unit is not valid for this biomarker type',
            path: ['unit'],
        },
    )

const testMetadataSchema = z.object({
    testDate: z.coerce.date(),
    lab: z.string().optional(),
})

const recordNotesSchema = z.object({
    notes: z.string().optional(),
    doctorNotes: z.string().optional(),
})

export const biomarkerRecordSchema = baseEntitySchema
    .merge(testMetadataSchema)
    .merge(recordNotesSchema)
    .extend({
        biomarkerId: z.string().uuid(),
        documentId: z.string().uuid().optional(),
        value: z.number(),
        unit: z.nativeEnum(Unit),
    })

export const createBiomarkerRecordSchema = (biomarkerType: BiomarkerType) =>
    biomarkerRecordSchema.refine(
        data => isUnitValidForBiomarker(biomarkerType, data.unit),
        {
            message: `Unit is not valid for biomarker type ${biomarkerType}`,
            path: ['unit'],
        },
    )

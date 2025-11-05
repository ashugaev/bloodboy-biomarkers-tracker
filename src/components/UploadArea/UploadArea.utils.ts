import { v4 as uuidv4 } from 'uuid'

import { BiomarkerConfig } from '@/db/models/biomarkerConfig'
import { BiomarkerRecord } from '@/db/models/biomarkerRecord'
import { UploadedDocument } from '@/db/models/document'
import { ExtractedBiomarker } from '@/openai'

export const createRecordKey = (
    record: Pick<BiomarkerRecord, 'biomarkerId' | 'value' | 'textValue' | 'ucumCode'>,
    testDate?: Date,
): string => {
    const valueKey = record.textValue ?? record.value ?? ''
    return `${valueKey}:${record.ucumCode}:${testDate?.getTime() ?? ''}`
}

export const createDocumentKey = (doc: Pick<UploadedDocument, 'fileName' | 'fileSize'>): string => {
    return `${doc.fileName}:${doc.fileSize}`
}

export interface CreateRecordsFromExtractedBiomarkersParams {
    biomarkers: ExtractedBiomarker[]
    configs: BiomarkerConfig[]
    documentId: string
    userId: string
    newConfigIds?: Record<string, string>
}

export const createRecordsFromExtractedBiomarkers = ({
    biomarkers,
    configs,
    documentId,
    userId,
    newConfigIds = {},
}: CreateRecordsFromExtractedBiomarkersParams): BiomarkerRecord[] => {
    const now = new Date()

    return biomarkers
        .map(biomarker => {
            const name = biomarker.name ?? ''
            const ucum = biomarker.ucumCode ?? ''
            const key = `${name}|${ucum}`
            const existingConfig = configs.find(c => {
                const configName = c.name ?? ''
                const configUcum = c.ucumCode ?? ''
                return configName === name && configUcum === ucum
            })
            const biomarkerId = existingConfig?.id ?? newConfigIds[key]

            if (!biomarkerId) {
                return null
            }

            return {
                id: uuidv4(),
                userId,
                biomarkerId,
                documentId,
                value: biomarker.value ?? undefined,
                textValue: biomarker.textValue ?? undefined,
                ucumCode: biomarker.ucumCode ?? '',
                originalName: biomarker.originalName ?? undefined,
                approved: false,
                latest: true,
                order: biomarker.order ?? undefined,
                page: biomarker.page ?? undefined,
                createdAt: now,
                updatedAt: now,
            }
        })
        .filter((record): record is NonNullable<typeof record> => record !== null)
}

import { v4 as uuidv4 } from 'uuid'

import { BiomarkerConfig } from '@/db/models/biomarkerConfig'
import { BiomarkerRecord } from '@/db/models/biomarkerRecord'
import { UploadedDocument } from '@/db/models/document'
import { VerifiedConversion } from '@/db/models/verifiedConversion'
import { ExtractedBiomarker } from '@/openai'
import { convertUniversal, ConversionConfig } from '@/utils/ucum'

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
    verifiedConversions?: VerifiedConversion[]
}

export const createRecordsFromExtractedBiomarkers = async ({
    biomarkers,
    configs,
    documentId,
    userId,
    newConfigIds = {},
    verifiedConversions = [],
}: CreateRecordsFromExtractedBiomarkersParams): Promise<BiomarkerRecord[]> => {
    const now = new Date()

    const records = await Promise.all(
        biomarkers.map((biomarker) => {
            const name = biomarker.name ?? ''
            const ucum = biomarker.ucumCode ?? ''
            const key = `${name}|${ucum}`

            const targetConfig = configs.find(c => {
                const configName = c.name ?? ''
                const configUcum = c.ucumCode ?? ''
                return configName === name && configUcum === ucum
            })
            let biomarkerId = targetConfig?.id ?? newConfigIds[key]
            let finalValue = biomarker.value ?? undefined
            let finalUcum = ucum
            const originalValue = biomarker.value ?? undefined
            const originalUnit = ucum

            if (ucum && finalValue !== undefined) {
                const verifiedConversion = verifiedConversions.find(vc =>
                    vc.biomarkerName.toLowerCase().trim() === name.toLowerCase().trim() &&
                    vc.sourceUnit === ucum,
                )

                if (verifiedConversion) {
                    const targetConfigKey = `${name}|${verifiedConversion.targetUnit}`
                    const targetConfigForConversion = configs.find(c => {
                        const configName = c.name ?? ''
                        const configUcum = c.ucumCode ?? ''
                        return configName === name && configUcum === verifiedConversion.targetUnit
                    })
                    const targetBiomarkerId = targetConfigForConversion?.id ?? newConfigIds[targetConfigKey]

                    if (targetBiomarkerId) {
                        const conversionConfig: ConversionConfig = {
                            biomarkerName: name,
                        }

                        if (verifiedConversion.molecularWeight) {
                            conversionConfig.molecularWeight = verifiedConversion.molecularWeight
                        }
                        if (verifiedConversion.conversionFactor) {
                            conversionConfig.conversionFactor = verifiedConversion.conversionFactor
                        }

                        const conversionResult = convertUniversal(
                            finalValue,
                            ucum,
                            verifiedConversion.targetUnit,
                            conversionConfig,
                        )

                        if (conversionResult.method !== 'failed' && conversionResult.method === verifiedConversion.conversionMethod) {
                            biomarkerId = targetBiomarkerId
                            finalValue = Math.round(conversionResult.value * 100) / 100
                            finalUcum = verifiedConversion.targetUnit
                        }
                    }
                }
            }

            if (!biomarkerId) {
                return null
            }

            return {
                id: uuidv4(),
                userId,
                biomarkerId,
                documentId,
                value: finalValue,
                textValue: biomarker.textValue ?? undefined,
                ucumCode: finalUcum,
                originalValue: originalValue !== finalValue ? originalValue : undefined,
                originalUnit: originalUnit !== finalUcum ? originalUnit : undefined,
                originalName: biomarker.originalName ?? undefined,
                approved: false,
                latest: true,
                order: biomarker.order ?? undefined,
                page: biomarker.page ?? undefined,
                createdAt: now,
                updatedAt: now,
            }
        }),
    )

    return records.filter((record): record is NonNullable<typeof record> => record !== null)
}

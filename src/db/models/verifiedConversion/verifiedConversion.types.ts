import { BaseEntity } from '@/db/types/base.types'
import { ConversionMethod } from '@/utils/ucum'

export type VerifiedConversionMethod = Exclude<ConversionMethod, 'failed'>

export interface VerifiedConversion extends BaseEntity {
    biomarkerName: string
    sourceUnit: string
    targetUnit: string
    conversionMethod: VerifiedConversionMethod
    molecularWeight?: number
    conversionFactor?: number
}

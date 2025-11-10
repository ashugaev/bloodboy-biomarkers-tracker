import { BiomarkerConfig } from '@/db/models/biomarkerConfig'
import { BiomarkerRecord } from '@/db/models/biomarkerRecord'
import { ConversionResult } from '@/utils/ucum'

export interface MergeableBiomarker {
    name: string
    configs: BiomarkerConfig[]
    recordsCount: number
}

export interface ConfigMergeInfo {
    config: BiomarkerConfig
    records: BiomarkerRecord[]
    recordsCount: number
    isTarget: boolean
    selected: boolean
}

export interface RecordConversionInfo {
    record: BiomarkerRecord
    config: BiomarkerConfig
    originalValue: number | undefined
    originalUnit: string
    convertedValue: number | undefined
    conversionResult: ConversionResult
}

export interface UnitStats {
    unit: string
    recordsCount: number
}

export interface MergePreview {
    biomarkerName: string
    targetUnit: string
    configs: ConfigMergeInfo[]
    records: RecordConversionInfo[]
    unitStats: UnitStats[]
    hasErrors: boolean
    failedConversions: Array<{
        recordId: string
        originalUnit: string
        targetUnit: string
        error: string
    }>
}

export enum ConversionStatus {
    NoConversion = 'no-conversion',
    Converted = 'converted',
    Failed = 'failed',
    Na = 'na',
}

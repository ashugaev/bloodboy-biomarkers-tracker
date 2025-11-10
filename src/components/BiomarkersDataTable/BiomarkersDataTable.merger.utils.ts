import { BiomarkerConfig } from '@/db/models/biomarkerConfig'
import { BiomarkerRecord } from '@/db/models/biomarkerRecord'
import { convertUniversal, ConversionConfig } from '@/utils/ucum'

import { ConfigMergeInfo, MergeableBiomarker, MergePreview, RecordConversionInfo, UnitStats } from './BiomarkersDataTable.merger.types'

const isExcludedUnit = (unit: string | undefined | null): boolean => {
    if (!unit) return false
    if (unit === '1') return true
    return /^\{.+\}$/.test(unit)
}

export const findMergeableBiomarkers = (
    configs: BiomarkerConfig[],
    records: BiomarkerRecord[],
): MergeableBiomarker[] => {
    const approvedConfigs = configs.filter(c => c.approved)
    const approvedRecords = records.filter(r => r.approved)

    const groupedByName = new Map<string, BiomarkerConfig[]>()

    for (const config of approvedConfigs) {
        const normalizedName = config.name.toLowerCase().trim()
        const existing = groupedByName.get(normalizedName) ?? []
        existing.push(config)
        groupedByName.set(normalizedName, existing)
    }

    const mergeable: MergeableBiomarker[] = []

    for (const [, configsGroup] of groupedByName.entries()) {
        if (configsGroup.length < 2) continue

        const configsWithoutExcluded = configsGroup.filter(c => !isExcludedUnit(c.ucumCode))
        if (configsWithoutExcluded.length < 2) continue

        const configsWithRecords = configsWithoutExcluded.filter(config =>
            approvedRecords.some(r => r.biomarkerId === config.id),
        )
        if (configsWithRecords.length < 2) continue

        const uniqueUnits = new Set(configsWithRecords.map(c => c.ucumCode).filter((u): u is string => !!u))
        if (uniqueUnits.size < 2) continue

        const recordsCount = approvedRecords.filter(r =>
            configsWithRecords.some(c => c.id === r.biomarkerId),
        ).length

        if (recordsCount === 0) continue

        mergeable.push({
            name: configsWithRecords[0].name,
            configs: configsWithRecords,
            recordsCount,
        })
    }

    return mergeable
}

export const getMostPopularUnit = (configs: BiomarkerConfig[], records: BiomarkerRecord[]): string | null => {
    const unitCounts = new Map<string, number>()

    for (const config of configs) {
        if (!config.ucumCode || isExcludedUnit(config.ucumCode)) continue
        const count = records.filter(r => r.biomarkerId === config.id).length
        const current = unitCounts.get(config.ucumCode) ?? 0
        unitCounts.set(config.ucumCode, current + count)
    }

    if (unitCounts.size === 0) return null

    let maxCount = 0
    let popularUnit: string | null = null

    for (const [unit, count] of unitCounts.entries()) {
        if (count > maxCount) {
            maxCount = count
            popularUnit = unit
        }
    }

    return popularUnit
}

export const createMergePreview = (
    biomarkerName: string,
    configs: BiomarkerConfig[],
    records: BiomarkerRecord[],
    targetUnit: string,
): MergePreview => {
    const configsWithoutExcluded = configs.filter(c => !isExcludedUnit(c.ucumCode))
    const recordsByConfig = new Map<string, BiomarkerRecord[]>()

    for (const record of records) {
        const existing = recordsByConfig.get(record.biomarkerId) ?? []
        existing.push(record)
        recordsByConfig.set(record.biomarkerId, existing)
    }

    const configInfos: ConfigMergeInfo[] = configsWithoutExcluded
        .map(config => {
            const configRecords = recordsByConfig.get(config.id) ?? []
            return {
                config,
                records: configRecords,
                recordsCount: configRecords.length,
                isTarget: config.ucumCode === targetUnit,
                selected: true,
            }
        })
        .filter(c => c.recordsCount > 0)

    const targetConfig = configInfos.find(c => c.isTarget)
    if (targetConfig) {
        targetConfig.selected = true
    }

    const unitStats: UnitStats[] = []
    const unitCounts = new Map<string, number>()

    for (const config of configsWithoutExcluded) {
        if (!config.ucumCode || isExcludedUnit(config.ucumCode)) continue
        const count = recordsByConfig.get(config.id)?.length ?? 0
        const current = unitCounts.get(config.ucumCode) ?? 0
        unitCounts.set(config.ucumCode, current + count)
    }

    for (const [unit, count] of unitCounts.entries()) {
        unitStats.push({
            unit,
            recordsCount: count,
        })
    }

    const recordInfos: RecordConversionInfo[] = []
    const failedConversions: MergePreview['failedConversions'] = []

    for (const configInfo of configInfos) {
        const config = configInfo.config
        const conversionConfig: ConversionConfig = {
            biomarkerName,
        }

        if (config.molecularWeight) {
            conversionConfig.molecularWeight = config.molecularWeight
        }
        if (config.conversionFactor) {
            conversionConfig.conversionFactor = config.conversionFactor
        }

        for (const record of configInfo.records) {
            const originalUnit = config.ucumCode ?? ''
            const originalValue = record.value

            if (originalValue === undefined) {
                recordInfos.push({
                    record,
                    config,
                    originalValue: undefined,
                    originalUnit,
                    convertedValue: undefined,
                    conversionResult: {
                        value: NaN,
                        method: 'failed',
                        error: 'Value not defined',
                    },
                })
                continue
            }

            if (originalUnit === targetUnit) {
                recordInfos.push({
                    record,
                    config,
                    originalValue,
                    originalUnit,
                    convertedValue: originalValue,
                    conversionResult: {
                        value: originalValue,
                        method: 'ucum',
                    },
                })
                continue
            }

            const conversionResult = convertUniversal(
                originalValue,
                originalUnit,
                targetUnit,
                conversionConfig,
            )

            if (conversionResult.method === 'failed') {
                failedConversions.push({
                    recordId: record.id,
                    originalUnit,
                    targetUnit,
                    error: conversionResult.error ?? 'Conversion failed',
                })
            }

            recordInfos.push({
                record,
                config,
                originalValue,
                originalUnit,
                convertedValue: conversionResult.method === 'failed' ? undefined : conversionResult.value,
                conversionResult,
            })
        }
    }

    return {
        biomarkerName,
        targetUnit,
        configs: configInfos,
        records: recordInfos,
        unitStats,
        hasErrors: failedConversions.length > 0,
        failedConversions,
    }
}

export const getConversionStatus = (info: RecordConversionInfo, targetUnit: string): string => {
    if (info.originalValue === undefined) {
        return 'na'
    }
    if (info.originalUnit === targetUnit) {
        return 'no-conversion'
    }
    if (info.conversionResult.method === 'failed') {
        return 'failed'
    }
    return 'converted'
}

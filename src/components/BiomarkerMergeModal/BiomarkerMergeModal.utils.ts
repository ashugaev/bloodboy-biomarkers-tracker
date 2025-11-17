import { createMergePreview, getMostPopularUnit } from '@/components/BiomarkersDataTable/BiomarkersDataTable.merger.utils'
import { BiomarkerConfig } from '@/db/models/biomarkerConfig'
import { BiomarkerRecord } from '@/db/models/biomarkerRecord'
import { createBlockedMergeKey, useBlockedMerges } from '@/db/models/blockedMerge'
import { createVerifiedConversionKey, useVerifiedConversions } from '@/db/models/verifiedConversion'
import { verifiedConversionsConfig } from '@/utils/ucum/verifiedConversions.config'

export const buildVerifiedConversionsMap = (verifiedConversions: ReturnType<typeof useVerifiedConversions>['data']) => {
    const map = new Map<string, boolean>()

    const config = verifiedConversionsConfig

    for (const vc of config.verifiedConversions) {
        for (const sourceUnit of vc.sourceUnits) {
            for (const targetUnit of vc.targetUnits) {
                const key = createVerifiedConversionKey(vc.biomarkerName, sourceUnit, targetUnit)
                map.set(key, true)
            }
        }
    }

    if (verifiedConversions) {
        for (const vc of verifiedConversions) {
            const key = createVerifiedConversionKey(vc.biomarkerName, vc.sourceUnit, vc.targetUnit)
            map.set(key, true)
        }
    }

    return map
}

export const buildBlockedMergesMap = (blockedMerges: ReturnType<typeof useBlockedMerges>['data']) => {
    const map = new Map<string, boolean>()

    if (blockedMerges) {
        for (const bm of blockedMerges) {
            for (const sourceUnit of bm.sourceUnits) {
                for (const targetUnit of bm.targetUnits) {
                    const key = createBlockedMergeKey(bm.biomarkerName, sourceUnit, targetUnit)
                    map.set(key, true)
                    const reverseKey = createBlockedMergeKey(bm.biomarkerName, targetUnit, sourceUnit)
                    map.set(reverseKey, true)
                }
            }
        }
    }

    return map
}

export const isConversionBlocked = (
    biomarkerName: string,
    sourceUnit: string,
    targetUnit: string,
    blockedMergesMap: Map<string, boolean>,
): boolean => {
    const key = createBlockedMergeKey(biomarkerName, sourceUnit, targetUnit)
    return blockedMergesMap.has(key)
}

export const getBestTargetUnit = (
    biomarkerName: string,
    configs: BiomarkerConfig[],
    records: BiomarkerRecord[],
    blockedMergesMap: Map<string, boolean>,
): string | null => {
    const preferredTarget = getMostPopularUnit(configs, records)
    
    const possibleTargetUnits = [...new Set(
        configs
            .filter(c => records.some(r => r.biomarkerId === c.id))
            .map(c => c.ucumCode)
            .filter((u): u is string => Boolean(u))
    )]
    
    if (preferredTarget && possibleTargetUnits.includes(preferredTarget)) {
        possibleTargetUnits.splice(possibleTargetUnits.indexOf(preferredTarget), 1)
        possibleTargetUnits.unshift(preferredTarget)
    }
    
    for (const targetUnit of possibleTargetUnits) {
        const availableConfigs = configs.filter(config => {
            const configRecords = records.filter(r => r.biomarkerId === config.id)
            if (configRecords.length === 0) return false
            
            const configUnit = config.ucumCode
            if (!configUnit || configUnit === targetUnit) return true
            
            return !isConversionBlocked(biomarkerName, configUnit, targetUnit, blockedMergesMap)
        })
        
        if (availableConfigs.length >= 2) {
            return targetUnit
        }
    }
    
    return preferredTarget ?? possibleTargetUnits[0] ?? null
}

export const isBiomarkerBlocked = (
    biomarkerName: string,
    configs: Array<{ ucumCode?: string }>,
    blockedMergesMap: Map<string, boolean>,
): boolean => {
    const units = configs
        .map(c => c.ucumCode)
        .filter((unit): unit is string => Boolean(unit))

    for (let i = 0; i < units.length; i++) {
        for (let j = i + 1; j < units.length; j++) {
            const sourceUnit = units[i]
            const targetUnit = units[j]
            if (isConversionBlocked(biomarkerName, sourceUnit, targetUnit, blockedMergesMap)) {
                return true
            }
        }
    }

    return false
}

export const isBiomarkerFullyVerified = (
    biomarker: { name: string, configs: BiomarkerConfig[] },
    records: BiomarkerRecord[],
    verifiedConversionsMap: Map<string, boolean>,
): boolean => {
    const biomarkerRecords = records.filter(r =>
        biomarker.configs.some(c => c.id === r.biomarkerId) && r.approved,
    )

    if (biomarkerRecords.length === 0) return false

    const targetUnit = getMostPopularUnit(biomarker.configs, biomarkerRecords) ?? biomarker.configs[0]?.ucumCode ?? ''
    if (!targetUnit) return false

    const preview = createMergePreview(biomarker.name, biomarker.configs, biomarkerRecords, targetUnit)

    if (preview.hasErrors && preview.failedConversions.length > 0) {
        return false
    }

    const selectedConfigs = preview.configs.filter(c => c.selected && c.recordsCount > 0)
    if (selectedConfigs.length < 2) return false

    const sourceUnits = selectedConfigs
        .filter(c => !c.isTarget && c.config.ucumCode !== targetUnit)
        .map(c => c.config.ucumCode)
        .filter((unit): unit is string => Boolean(unit))

    if (sourceUnits.length === 0) return false

    return sourceUnits.every(sourceUnit => {
        const key = createVerifiedConversionKey(biomarker.name, sourceUnit, targetUnit)
        return verifiedConversionsMap.has(key)
    })
}

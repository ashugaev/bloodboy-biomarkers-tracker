import { createMergePreview, getMostPopularUnit } from '@/components/BiomarkersDataTable/BiomarkersDataTable.merger.utils'
import { BiomarkerConfig } from '@/db/models/biomarkerConfig'
import { BiomarkerRecord } from '@/db/models/biomarkerRecord'
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

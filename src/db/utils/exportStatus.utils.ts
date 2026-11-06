import { UNIT_CONFIGS } from '@/constants/units'
import { AppSettings } from '@/db/models/appSettings'
import { BiomarkerConfig } from '@/db/models/biomarkerConfig'
import { BlockedMerge, DEFAULT_BLOCKED_MERGES } from '@/db/models/blockedMerge'
import { Unit } from '@/db/models/unit'
// eslint-disable-next-line no-restricted-imports
import { db } from '@/db/services/db.service'

interface TrackedEntity {
    createdAt: Date
    updatedAt: Date
}

const DEFAULT_UNIT_CODES = new Set(UNIT_CONFIGS.map(config => config.ucum))
const DEFAULT_BLOCKED_MERGE_KEYS = new Set(
    DEFAULT_BLOCKED_MERGES.map(merge => {
        const sourceUnits = [...merge.sourceUnits].sort().join(',')
        const targetUnits = [...merge.targetUnits].sort().join(',')

        return `${merge.biomarkerName}|${sourceUnits}|${targetUnits}`
    }),
)

const isModified = (item: TrackedEntity): boolean => {
    return item.updatedAt.getTime() > item.createdAt.getTime()
}

const getBlockedMergeKey = (merge: BlockedMerge): string => {
    const sourceUnits = [...merge.sourceUnits].sort().join(',')
    const targetUnits = [...merge.targetUnits].sort().join(',')

    return `${merge.biomarkerName}|${sourceUnits}|${targetUnits}`
}

const isUserConfig = (config: BiomarkerConfig): boolean => !config.isDefault || isModified(config)

const isUserUnit = (unit: Unit): boolean => !DEFAULT_UNIT_CODES.has(unit.ucumCode) || isModified(unit)

const isUserBlockedMerge = (merge: BlockedMerge): boolean => {
    return !DEFAULT_BLOCKED_MERGE_KEYS.has(getBlockedMergeKey(merge)) || isModified(merge)
}

export const getLatestUpdatedAt = (items: Array<TrackedEntity | undefined>): Date | null => {
    const timestamps = items
        .map(item => item?.updatedAt?.getTime())
        .filter((value): value is number => value != null)

    if (timestamps.length === 0) {
        return null
    }

    return new Date(Math.max(...timestamps))
}

export const getLastExportedAt = (settings: AppSettings | undefined): Date | null => {
    return settings?.lastExportedAt ?? null
}

export const getLatestUserConfig = (configs: BiomarkerConfig[]): BiomarkerConfig | undefined => {
    return configs
        .filter(isUserConfig)
        .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())[0]
}

export const getLatestUserUnit = (units: Unit[]): Unit | undefined => {
    return units
        .filter(isUserUnit)
        .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())[0]
}

export const getLatestUserBlockedMerge = (blockedMerges: BlockedMerge[]): BlockedMerge | undefined => {
    return blockedMerges
        .filter(isUserBlockedMerge)
        .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())[0]
}

export const getLatestUserDataUpdatedAt = async (): Promise<Date | null> => {
    const [
        configs,
        latestRecord,
        latestDocument,
        units,
        latestFilter,
        latestConversion,
        blockedMerges,
    ] = await Promise.all([
        db.biomarkerConfigs.toArray(),
        db.biomarkerRecords.orderBy('updatedAt').last(),
        db.uploadedFiles.orderBy('updatedAt').last(),
        db.units.toArray(),
        db.savedFilters.orderBy('updatedAt').last(),
        db.verifiedConversions.orderBy('updatedAt').last(),
        db.blockedMerges.toArray(),
    ])

    return getLatestUpdatedAt([
        getLatestUserConfig(configs),
        latestRecord,
        latestDocument,
        getLatestUserUnit(units),
        latestFilter,
        latestConversion,
        getLatestUserBlockedMerge(blockedMerges),
    ])
}

export const getUserDataFingerprint = async (): Promise<string | null> => {
    const [
        latestUpdatedAt,
        configs,
        recordsCount,
        documentsCount,
        units,
        filtersCount,
        conversionsCount,
        blockedMerges,
    ] = await Promise.all([
        getLatestUserDataUpdatedAt(),
        db.biomarkerConfigs.toArray(),
        db.biomarkerRecords.count(),
        db.uploadedFiles.count(),
        db.units.toArray(),
        db.savedFilters.count(),
        db.verifiedConversions.count(),
        db.blockedMerges.toArray(),
    ])
    const counts = [
        configs.filter(isUserConfig).length,
        recordsCount,
        documentsCount,
        units.filter(isUserUnit).length,
        filtersCount,
        conversionsCount,
        blockedMerges.filter(isUserBlockedMerge).length,
    ]

    if (!latestUpdatedAt && counts.every(count => count === 0)) {
        return null
    }

    return [latestUpdatedAt?.toISOString() ?? 'none', ...counts].join('|')
}

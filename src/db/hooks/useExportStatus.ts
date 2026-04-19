import { useLiveQuery } from 'dexie-react-hooks'

import { UNIT_CONFIGS } from '@/constants/units'
import { AppSettings } from '@/db/models/appSettings'
import { BiomarkerConfig } from '@/db/models/biomarkerConfig'
import { BlockedMerge, DEFAULT_BLOCKED_MERGES } from '@/db/models/blockedMerge'
import { Unit } from '@/db/models/unit'
// eslint-disable-next-line no-restricted-imports
import { db } from '@/db/services/db.service'

interface ExportStatus {
    hasUnexportedChanges: boolean
    lastExportedAt: Date | null
}

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

const getLatestUpdatedAt = (items: Array<TrackedEntity | undefined>): Date | null => {
    const timestamps = items
        .map(item => item?.updatedAt?.getTime())
        .filter((value): value is number => value != null)

    if (timestamps.length === 0) {
        return null
    }

    return new Date(Math.max(...timestamps))
}

const getLastExportedAt = (settings: AppSettings | undefined): Date | null => {
    return settings?.lastExportedAt ?? null
}

const getLatestUserConfig = (configs: BiomarkerConfig[]): BiomarkerConfig | undefined => {
    return configs
        .filter(config => !config.isDefault || isModified(config))
        .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())[0]
}

const getLatestUserUnit = (units: Unit[]): Unit | undefined => {
    return units
        .filter(unit => !DEFAULT_UNIT_CODES.has(unit.ucumCode) || isModified(unit))
        .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())[0]
}

const getBlockedMergeKey = (merge: BlockedMerge): string => {
    const sourceUnits = [...merge.sourceUnits].sort().join(',')
    const targetUnits = [...merge.targetUnits].sort().join(',')

    return `${merge.biomarkerName}|${sourceUnits}|${targetUnits}`
}

const getLatestUserBlockedMerge = (blockedMerges: BlockedMerge[]): BlockedMerge | undefined => {
    return blockedMerges
        .filter(merge => !DEFAULT_BLOCKED_MERGE_KEYS.has(getBlockedMergeKey(merge)) || isModified(merge))
        .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())[0]
}

export const useExportStatus = () => {
    const status = useLiveQuery<ExportStatus>(async () => {
        const [
            settings,
            configs,
            latestRecord,
            latestDocument,
            units,
            latestFilter,
            latestConversion,
            blockedMerges,
        ] = await Promise.all([
            db.appSettings.limit(1).first(),
            db.biomarkerConfigs.toArray(),
            db.biomarkerRecords.orderBy('updatedAt').last(),
            db.uploadedFiles.orderBy('updatedAt').last(),
            db.units.toArray(),
            db.savedFilters.orderBy('updatedAt').last(),
            db.verifiedConversions.orderBy('updatedAt').last(),
            db.blockedMerges.toArray(),
        ])

        const lastExportedAt = getLastExportedAt(settings)
        const latestConfig = getLatestUserConfig(configs)
        const latestUnit = getLatestUserUnit(units)
        const latestBlockedMerge = getLatestUserBlockedMerge(blockedMerges)
        const latestUpdatedAt = getLatestUpdatedAt([
            latestConfig,
            latestRecord,
            latestDocument,
            latestUnit,
            latestFilter,
            latestConversion,
            latestBlockedMerge,
        ])

        if (!latestUpdatedAt) {
            return {
                hasUnexportedChanges: false,
                lastExportedAt,
            }
        }

        if (!lastExportedAt) {
            return {
                hasUnexportedChanges: true,
                lastExportedAt: null,
            }
        }

        return {
            hasUnexportedChanges: latestUpdatedAt.getTime() > lastExportedAt.getTime(),
            lastExportedAt,
        }
    }, [])

    return {
        hasUnexportedChanges: status?.hasUnexportedChanges ?? false,
        lastExportedAt: status?.lastExportedAt ?? null,
        loading: status === undefined,
    }
}

import { RangeType } from '@/components/BiomarkersDataTableFilters'
import { BiomarkerRecord } from '@/db/models/biomarkerRecord'

import { BiomarkerRowData } from './BiomarkersDataTable.types'

interface FilterConditions {
    documentId?: string[]
    biomarkerIds?: string[]
    outOfRange?: RangeType
}

export const matchesFilter = (
    row: BiomarkerRowData,
    filter: FilterConditions,
    records: BiomarkerRecord[],
): boolean => {
    if (filter.biomarkerIds && filter.biomarkerIds.length > 0) {
        if (!filter.biomarkerIds.includes(row.id)) {
            return false
        }
    }

    if (filter.documentId && filter.documentId.length > 0) {
        const biomarkerRecords = records.filter(r => r.biomarkerId === row.id)
        const hasMatchingDocuments = biomarkerRecords.some(r =>
            r.documentId && filter.documentId?.includes(r.documentId),
        )
        if (!hasMatchingDocuments) {
            return false
        }
    }

    if (filter.outOfRange) {
        if (typeof row.stats.lastValue !== 'number') {
            return false
        }

        const value = row.stats.lastValue
        if (filter.outOfRange === RangeType.NORMAL) {
            const isOutsideNormal =
                (row.normalRange?.min !== undefined && value < row.normalRange.min) ||
                (row.normalRange?.max !== undefined && value > row.normalRange.max)
            if (!isOutsideNormal) {
                return false
            }
        }
        if (filter.outOfRange === RangeType.TARGET) {
            const isOutsideTarget =
                (row.targetRange?.min !== undefined && value < row.targetRange.min) ||
                (row.targetRange?.max !== undefined && value > row.targetRange.max)
            if (!isOutsideTarget) {
                return false
            }
        }
    }

    return true
}

export const matchesOutOfRangeFilter = (
    row: BiomarkerRowData,
    outOfRange?: RangeType,
): boolean => {
    if (!outOfRange) {
        return true
    }

    if (typeof row.stats.lastValue !== 'number') {
        return false
    }

    const value = row.stats.lastValue
    if (outOfRange === RangeType.NORMAL) {
        const isOutsideNormal =
            (row.normalRange?.min !== undefined && value < row.normalRange.min) ||
            (row.normalRange?.max !== undefined && value > row.normalRange.max)
        return isOutsideNormal
    }
    if (outOfRange === RangeType.TARGET) {
        const isOutsideTarget =
            (row.targetRange?.min !== undefined && value < row.targetRange.min) ||
            (row.targetRange?.max !== undefined && value > row.targetRange.max)
        return isOutsideTarget
    }

    return true
}

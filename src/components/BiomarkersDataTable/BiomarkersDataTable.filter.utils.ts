import { RangeType } from '@/components/BiomarkersDataTableFilters'
import { BiomarkerRecord } from '@/db/models/biomarkerRecord'
import { UploadedDocument } from '@/db/models/document'

import { BiomarkerRowData } from './BiomarkersDataTable.types'

interface FilterConditions {
    documentId?: string[]
    biomarkerIds?: string[]
    outOfRange?: RangeType
    outOfRangeHistory?: RangeType
    hasAnomaly?: number
}

export const matchesFilter = (
    row: BiomarkerRowData,
    filter: FilterConditions,
    records: BiomarkerRecord[],
    documents: UploadedDocument[] = [],
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

    if (filter.outOfRangeHistory) {
        const biomarkerRecords = records.filter(r => r.biomarkerId === row.id)
        const allValues = biomarkerRecords
            .map(r => r.value)
            .filter((v): v is number => v !== undefined)

        if (allValues.length === 0) {
            return false
        }

        const hasOutOfRange = allValues.some(value => {
            if (filter.outOfRangeHistory === RangeType.NORMAL) {
                return (row.normalRange?.min !== undefined && value < row.normalRange.min) ||
                    (row.normalRange?.max !== undefined && value > row.normalRange.max)
            }
            if (filter.outOfRangeHistory === RangeType.TARGET) {
                return (row.targetRange?.min !== undefined && value < row.targetRange.min) ||
                    (row.targetRange?.max !== undefined && value > row.targetRange.max)
            }
            return false
        })

        if (!hasOutOfRange) {
            return false
        }
    }

    if (filter.hasAnomaly !== undefined) {
        const hasAnomaly = checkHasAnomaly(row.id, records, filter.hasAnomaly, documents)
        if (!hasAnomaly) {
            return false
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

export const matchesOutOfRangeHistoryFilter = (
    row: BiomarkerRowData,
    outOfRangeHistory?: RangeType,
    records: BiomarkerRecord[] = [],
): boolean => {
    if (!outOfRangeHistory) {
        return true
    }

    const biomarkerRecords = records.filter(r => r.biomarkerId === row.id)
    const allValues = biomarkerRecords
        .map(r => r.value)
        .filter((v): v is number => v !== undefined)

    if (allValues.length === 0) {
        return false
    }

    return allValues.some(value => {
        if (outOfRangeHistory === RangeType.NORMAL) {
            return (row.normalRange?.min !== undefined && value < row.normalRange.min) ||
                (row.normalRange?.max !== undefined && value > row.normalRange.max)
        }
        if (outOfRangeHistory === RangeType.TARGET) {
            return (row.targetRange?.min !== undefined && value < row.targetRange.min) ||
                (row.targetRange?.max !== undefined && value > row.targetRange.max)
        }
        return false
    })
}

export const checkHasAnomaly = (
    biomarkerId: string,
    records: BiomarkerRecord[],
    thresholdPercent: number,
    documents: UploadedDocument[] = [],
): boolean => {
    const biomarkerRecords = records.filter(r => r.biomarkerId === biomarkerId)
    const sortedRecords = biomarkerRecords
        .map(record => {
            const document = documents.find(d => d.id === record.documentId)
            return {
                record,
                date: document?.testDate,
                timestamp: document?.testDate?.getTime() ?? 0,
            }
        })
        .filter(item => item.record.value !== undefined)
        .sort((a, b) => a.timestamp - b.timestamp)

    if (sortedRecords.length < 2) {
        return false
    }

    const threshold = thresholdPercent / 100

    for (let i = 1; i < sortedRecords.length; i++) {
        const prevValue = sortedRecords[i - 1].record.value
        const currValue = sortedRecords[i].record.value

        if (prevValue === undefined || currValue === undefined || prevValue === 0) {
            continue
        }

        const changePercent = Math.abs((currValue - prevValue) / prevValue)

        if (changePercent >= threshold) {
            return true
        }
    }

    return false
}

export const matchesHasAnomalyFilter = (
    row: BiomarkerRowData,
    thresholdPercent?: number,
    records: BiomarkerRecord[] = [],
    documents: UploadedDocument[] = [],
): boolean => {
    if (thresholdPercent === undefined) {
        return true
    }

    return checkHasAnomaly(row.id, records, thresholdPercent, documents)
}

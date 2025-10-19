import { BiomarkerRecord, BiomarkerStats } from '../types/biomarker.types'

export const calculateStats = (
    biomarkerId: string,
    records: BiomarkerRecord[],
): BiomarkerStats | null => {
    if (records.length === 0) return null

    const sortedRecords = [...records].sort(
        (a, b) => b.testDate.getTime() - a.testDate.getTime(),
    )

    const values = records.map(r => r.value)
    const sum = values.reduce((acc, val) => acc + val, 0)

    return {
        biomarkerId,
        min: Math.min(...values),
        max: Math.max(...values),
        avg: sum / values.length,
        lastValue: sortedRecords[0].value,
        lastTestDate: sortedRecords[0].testDate,
        totalRecords: records.length,
    }
}

export const calculateTrend = (
    records: BiomarkerRecord[],
    windowSize: number = 3,
): 'increasing' | 'decreasing' | 'stable' | null => {
    if (records.length < windowSize) return null

    const sortedRecords = [...records]
        .sort((a, b) => a.testDate.getTime() - b.testDate.getTime())
        .slice(-windowSize)

    const values = sortedRecords.map(r => r.value)
    const firstValue = values[0]
    const lastValue = values[values.length - 1]

    const changePercent = ((lastValue - firstValue) / firstValue) * 100

    if (Math.abs(changePercent) < 5) return 'stable'
    return changePercent > 0 ? 'increasing' : 'decreasing'
}

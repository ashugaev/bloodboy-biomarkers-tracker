import { BiomarkerConfig } from '@/db/models/biomarkerConfig'

export interface BiomarkerStats {
    lastMeasurement?: number
    maxResult?: number
    minResult?: number
}

export interface HistoryDataPoint {
    value: number
    date: string
}

export interface BiomarkerRowData extends BiomarkerConfig {
    unitTitle?: string
    history: HistoryDataPoint[]
    stats: BiomarkerStats
    hasRecords: boolean
}

export interface BiomarkersDataTableProps {
    className?: string
}

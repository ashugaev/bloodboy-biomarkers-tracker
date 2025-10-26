import { BiomarkerConfig } from '@/db/models/biomarkerConfig'

export interface BiomarkerStats {
    lastMeasurement?: number
    maxResult?: number
    minResult?: number
}

export interface BiomarkerRowData extends BiomarkerConfig {
    unitTitle?: string
    history: number[]
    stats: BiomarkerStats
}

export interface BiomarkersDataTableProps {
    className?: string
}

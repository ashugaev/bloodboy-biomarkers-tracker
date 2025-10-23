import { BiomarkerConfig } from '@/db/types'

export interface BiomarkerStats {
    lastMeasurement?: number
    maxResult?: number
    minResult?: number
}

export interface BiomarkerRowData extends BiomarkerConfig {
    stats: BiomarkerStats
}

export interface BiomarkersDataTableProps {
    className?: string
}


import { Range } from '@/db/types'

export interface BiomarkerChartProps {
    biomarkerId: string
    biomarkerName: string
    normalRange?: Range
    targetRange?: Range
    className?: string
}

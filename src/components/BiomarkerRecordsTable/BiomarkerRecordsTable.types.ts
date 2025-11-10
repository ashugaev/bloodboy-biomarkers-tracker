import { BiomarkerRecord } from '@/db/models/biomarkerRecord'
import { Range } from '@/db/types'

export interface BiomarkerRecordRowData extends BiomarkerRecord {
    unitTitle?: string
    date?: Date
    lab?: string
    name?: string
}

export interface BiomarkerRecordsTableProps {
    biomarkerId: string
    biomarkerName: string
    normalRange?: Range
    targetRange?: Range
    className?: string
}

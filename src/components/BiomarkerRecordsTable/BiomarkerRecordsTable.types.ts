import { BiomarkerRecord, Range } from '@/db/types'

export interface BiomarkerRecordRowData extends BiomarkerRecord {
    date?: Date
}

export interface BiomarkerRecordsTableProps {
    biomarkerId: string
    biomarkerName: string
    normalRange?: Range
    targetRange?: Range
    className?: string
}

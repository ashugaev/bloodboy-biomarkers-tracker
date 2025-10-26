import { BiomarkerRecord } from '@/db/models/biomarkerRecord'

export interface BiomarkerRecordsConfirmationProps {
    records: BiomarkerRecord[]
    className?: string
}

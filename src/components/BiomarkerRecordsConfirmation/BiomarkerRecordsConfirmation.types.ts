import { BiomarkerRecord } from '@/db/models/biomarkerRecord'

export interface BiomarkerRecordsConfirmationProps {
    records: BiomarkerRecord[]
    documentId?: string
    className?: string
    onPageChange?: (page: number) => void
}

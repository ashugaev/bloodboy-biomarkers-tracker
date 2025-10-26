import { BiomarkerRecord } from '@/db/models/biomarkerRecord'

export const createRecordKey = (record: Pick<BiomarkerRecord, 'value' | 'ucumCode' | 'createdAt'>): string => {
    return `${record.value}:${record.ucumCode}:${record.createdAt.getTime()}`
}

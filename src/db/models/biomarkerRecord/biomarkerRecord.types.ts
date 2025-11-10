import { BaseEntity } from '@/db/types/base.types'

export interface BiomarkerRecord extends BaseEntity {
    biomarkerId: string
    documentId?: string
    value?: number
    textValue?: string
    ucumCode: string
    originalName?: string
    originalValue?: number
    originalUnit?: string
    notes?: string
    doctorNotes?: string
    approved: boolean
    latest: boolean
    order?: number
    page?: number
}

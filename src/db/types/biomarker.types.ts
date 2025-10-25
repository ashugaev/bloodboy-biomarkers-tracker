export interface BaseEntity {
    id: string
    userId: string
    createdAt: Date
    updatedAt: Date
}

export interface Range {
    min?: number
    max?: number
}

export interface BiomarkerMetadata {
    name: string
    description?: string
}

export interface BiomarkerRanges {
    normalRange?: Range
    criticalRange?: Range
    targetRange?: Range
}

export interface BiomarkerConfig extends BaseEntity, BiomarkerMetadata, BiomarkerRanges {
    ucumCode?: string
    approved: boolean
    order?: number
}

export interface RecordNotes {
    notes?: string
    doctorNotes?: string
}

export interface BiomarkerRecord extends BaseEntity, RecordNotes {
    biomarkerId: string
    documentId?: string
    value?: number
    ucumCode: string
    approved: boolean
    latest: boolean
    order?: number
}

export interface BiomarkerStats {
    biomarkerId: string
    min: number
    max: number
    avg: number
    lastValue: number
    lastTestDate: Date
    totalRecords: number
}

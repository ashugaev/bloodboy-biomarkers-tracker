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

export enum Unit {
    MG_DL = 'mg/dL',
    MG_L = 'mg/L',
    MMOL_L = 'mmol/L',
    UMOL_L = 'μmol/L',
    NMOL_L = 'nmol/L',
    G_DL = 'g/dL',
    G_L = 'g/L',
    UG_DL = 'μg/dL',
    UG_L = 'μg/L',
    UG_ML = 'μg/mL',
    CELLS_UL = 'cells/μL',
    K_UL = 'K/μL',
    M_UL = 'M/μL',
    U_L = 'U/L',
    IU_L = 'IU/L',
    UIU_ML = 'μIU/mL',
    MIU_L = 'mIU/L',
    MIU_ML = 'mIU/mL',
    NG_ML = 'ng/mL',
    NG_DL = 'ng/dL',
    PG_ML = 'pg/mL',
    PG_DL = 'pg/dL',
    PG = 'pg',
    PMOL_L = 'pmol/L',
    MEQ_L = 'mEq/L',
    FL = 'fL',
    PERCENT = '%',
    RATIO = 'ratio',
    INDEX = 'index',
    SCORE = 'score',
    SECONDS = 'sec',
    MM_HR = 'mm/hr',
    COPIES_ML = 'copies/mL',
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
    unit?: Unit
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
    unit: Unit
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

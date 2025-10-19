export interface BaseEntity {
    id: string
    createdAt: Date
    updatedAt: Date
}

export interface Range {
    min: number
    max: number
}

export enum BiomarkerType {
    GLUCOSE = 'glucose',
    CHOLESTEROL_TOTAL = 'cholesterol_total',
    CHOLESTEROL_HDL = 'cholesterol_hdl',
    CHOLESTEROL_LDL = 'cholesterol_ldl',
    TRIGLYCERIDES = 'triglycerides',
    HEMOGLOBIN = 'hemoglobin',
    HEMATOCRIT = 'hematocrit',
    WHITE_BLOOD_CELLS = 'white_blood_cells',
    RED_BLOOD_CELLS = 'red_blood_cells',
    PLATELETS = 'platelets',
    CREATININE = 'creatinine',
    ALT = 'alt',
    AST = 'ast',
    VITAMIN_D = 'vitamin_d',
    VITAMIN_B12 = 'vitamin_b12',
    IRON = 'iron',
    FERRITIN = 'ferritin',
    TSH = 'tsh',
    T3 = 't3',
    T4 = 't4',
}

export enum Unit {
    MG_DL = 'mg/dL',
    MMOL_L = 'mmol/L',
    NMOL_L = 'nmol/L',
    G_DL = 'g/dL',
    G_L = 'g/L',
    CELLS_UL = 'cells/μL',
    K_UL = 'K/μL',
    M_UL = 'M/μL',
    U_L = 'U/L',
    NG_ML = 'ng/mL',
    PG_ML = 'pg/mL',
    MIU_L = 'mIU/L',
    PMOL_L = 'pmol/L',
    PERCENT = '%',
}

export const BIOMARKER_UNITS_MAP: Record<BiomarkerType, Unit[]> = {
    [BiomarkerType.GLUCOSE]: [Unit.MG_DL, Unit.MMOL_L],
    [BiomarkerType.CHOLESTEROL_TOTAL]: [Unit.MG_DL, Unit.MMOL_L],
    [BiomarkerType.CHOLESTEROL_HDL]: [Unit.MG_DL, Unit.MMOL_L],
    [BiomarkerType.CHOLESTEROL_LDL]: [Unit.MG_DL, Unit.MMOL_L],
    [BiomarkerType.TRIGLYCERIDES]: [Unit.MG_DL, Unit.MMOL_L],
    [BiomarkerType.HEMOGLOBIN]: [Unit.G_DL, Unit.G_L],
    [BiomarkerType.HEMATOCRIT]: [Unit.PERCENT],
    [BiomarkerType.WHITE_BLOOD_CELLS]: [Unit.K_UL, Unit.CELLS_UL],
    [BiomarkerType.RED_BLOOD_CELLS]: [Unit.M_UL, Unit.CELLS_UL],
    [BiomarkerType.PLATELETS]: [Unit.K_UL, Unit.CELLS_UL],
    [BiomarkerType.CREATININE]: [Unit.MG_DL, Unit.MMOL_L],
    [BiomarkerType.ALT]: [Unit.U_L],
    [BiomarkerType.AST]: [Unit.U_L],
    [BiomarkerType.VITAMIN_D]: [Unit.NG_ML, Unit.NMOL_L],
    [BiomarkerType.VITAMIN_B12]: [Unit.PG_ML, Unit.PMOL_L],
    [BiomarkerType.IRON]: [Unit.MG_DL, Unit.MMOL_L],
    [BiomarkerType.FERRITIN]: [Unit.NG_ML],
    [BiomarkerType.TSH]: [Unit.MIU_L],
    [BiomarkerType.T3]: [Unit.NG_ML, Unit.PMOL_L],
    [BiomarkerType.T4]: [Unit.NG_ML, Unit.PMOL_L],
}

export interface BiomarkerMetadata {
    name: string
    description?: string
}

export interface BiomarkerRanges {
    normalRange: Range
    criticalRange?: Range
}

export interface BiomarkerConfig extends BaseEntity, BiomarkerMetadata, BiomarkerRanges {
    type: BiomarkerType
    unit: Unit
    enabled: boolean
}

export interface TestMetadata {
    testDate: Date
    lab?: string
}

export interface RecordNotes {
    notes?: string
    doctorNotes?: string
}

export interface BiomarkerRecord extends BaseEntity, TestMetadata, RecordNotes {
    biomarkerId: string
    documentId?: string
    value: number
    unit: Unit
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

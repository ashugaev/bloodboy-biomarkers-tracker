export interface UnitConfig {
    title: string
    ucum: string
    valueType?: 'number' | 'select' | 'text'
    options?: string[]
}

export const UNIT_CONFIGS: UnitConfig[] = [
    {
        title: 'mg/dL',
        ucum: 'mg/dL',
    },
    {
        title: 'mg/L',
        ucum: 'mg/L',
    },
    {
        title: 'mmol/L',
        ucum: 'mmol/L',
    },
    {
        title: 'μmol/L',
        ucum: 'umol/L',
    },
    {
        title: 'nmol/L',
        ucum: 'nmol/L',
    },
    {
        title: 'pmol/L',
        ucum: 'pmol/L',
    },
    {
        title: 'g/dL',
        ucum: 'g/dL',
    },
    {
        title: 'g/L',
        ucum: 'g/L',
    },
    {
        title: 'μg/dL',
        ucum: 'ug/dL',
    },
    {
        title: 'μg/L',
        ucum: 'ug/L',
    },
    {
        title: 'μg/mL',
        ucum: 'ug/mL',
    },
    {
        title: 'cells/μL',
        ucum: '{cells}/uL',
    },
    {
        title: 'K/μL',
        ucum: '10*3/uL',
    },
    {
        title: 'M/μL',
        ucum: '10*6/uL',
    },
    {
        title: 'U/L',
        ucum: 'U/L',
    },
    {
        title: 'IU/L',
        ucum: '[iU]/L',
    },
    {
        title: 'μIU/mL',
        ucum: 'u[iU]/mL',
    },
    {
        title: 'mIU/L',
        ucum: 'm[iU]/L',
    },
    {
        title: 'mIU/mL',
        ucum: 'm[iU]/mL',
    },
    {
        title: 'ng/mL',
        ucum: 'ng/mL',
    },
    {
        title: 'ng/dL',
        ucum: 'ng/dL',
    },
    {
        title: 'pg/mL',
        ucum: 'pg/mL',
    },
    {
        title: 'pg/dL',
        ucum: 'pg/dL',
    },
    {
        title: 'pg',
        ucum: 'pg',
    },
    {
        title: 'mEq/L',
        ucum: 'meq/L',
    },
    {
        title: 'fL',
        ucum: 'fL',
    },
    {
        title: '%',
        ucum: '%',
    },
    {
        title: 'ratio',
        ucum: '{ratio}',
    },
    {
        title: 'index',
        ucum: '{index}',
    },
    {
        title: 'score',
        ucum: '{score}',
    },
    {
        title: 'sec',
        ucum: 's',
    },
    {
        title: 'mm/hr',
        ucum: 'mm/h',
    },
    {
        title: 'copies/mL',
        ucum: '{copies}/mL',
    },
    {
        title: 'Reactive / Nonreactive',
        ucum: '{reactive}',
        valueType: 'select',
        options: ['Reactive', 'Nonreactive'],
    },
    {
        title: 'Positive / Negative',
        ucum: '{positive}',
        valueType: 'select',
        options: ['Positive', 'Negative'],
    },
    {
        title: 'Detected / Not Detected',
        ucum: '{detected}',
        valueType: 'select',
        options: ['Detected', 'Not Detected'],
    },
    {
        title: 'Note',
        ucum: '{note}',
        valueType: 'text',
    },
    {
        title: 'No Unit',
        ucum: '{no_unit}',
    },
]

export const COMMON_UCUM_UNITS = UNIT_CONFIGS.map(u => u.ucum)

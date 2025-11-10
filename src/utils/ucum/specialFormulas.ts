export interface SpecialFormula {
    analyte: string
    fromUnit: string
    toUnit: string
    convert: (from: number) => number
    source: string
}

export const specialFormulas: SpecialFormula[] = [
    {
        analyte: 'HbA1c',
        fromUnit: 'mmol/mol',
        toUnit: '%',
        convert: (from: number) => 0.09148 * from + 2.152,
        source: 'IFCC–NGSP master equation',
    },
    {
        analyte: 'Glucose',
        fromUnit: 'mmol/L',
        toUnit: 'mg/dL',
        convert: (from: number) => from * 18.0182,
        source: 'ISO 15197 / standard biochemistry conversion',
    },
    {
        analyte: 'Cholesterol',
        fromUnit: 'mmol/L',
        toUnit: 'mg/dL',
        convert: (from: number) => from * 38.67,
        source: 'CDC Lipid Standardization Program',
    },
    {
        analyte: 'Triglycerides',
        fromUnit: 'mmol/L',
        toUnit: 'mg/dL',
        convert: (from: number) => from * 88.57,
        source: 'CDC Lipid Standardization Program',
    },
    {
        analyte: 'Creatinine',
        fromUnit: 'µmol/L',
        toUnit: 'mg/dL',
        convert: (from: number) => from / 88.4,
        source: 'IDMS traceability standard',
    },
    {
        analyte: 'Urea (BUN)',
        fromUnit: 'mmol/L',
        toUnit: 'mg/dL',
        convert: (from: number) => from * 2.801,
        source: 'clinical chemistry standard',
    },
    {
        analyte: 'Iron',
        fromUnit: 'µmol/L',
        toUnit: 'µg/dL',
        convert: (from: number) => from * 5.585,
        source: 'standard molar-mass conversion',
    },
    {
        analyte: 'Zinc',
        fromUnit: 'µmol/L',
        toUnit: 'µg/dL',
        convert: (from: number) => from * 6.54,
        source: 'atomic mass 65.38 g/mol',
    },
    {
        analyte: 'Calcium',
        fromUnit: 'mmol/L',
        toUnit: 'mg/dL',
        convert: (from: number) => from * 4.0,
        source: 'atomic mass 40.08 g/mol',
    },
    {
        analyte: 'Phosphate',
        fromUnit: 'mmol/L',
        toUnit: 'mg/dL',
        convert: (from: number) => from * 3.097,
        source: 'molecular weight 95 g/mol',
    },
]

const normalizeUnit = (ucum: string): string => {
    return ucum.toLowerCase().replace(/\s/g, '').replace(/µ/g, 'u').replace(/μ/g, 'u')
}

export const findSpecialFormula = (
    biomarkerName: string,
    fromUnit: string,
    toUnit: string,
): SpecialFormula | null => {
    const normalizedFrom = normalizeUnit(fromUnit)
    const normalizedTo = normalizeUnit(toUnit)

    for (const formula of specialFormulas) {
        const normalizedFormulaFrom = normalizeUnit(formula.fromUnit)
        const normalizedFormulaTo = normalizeUnit(formula.toUnit)

        const nameMatch = formula.analyte.toLowerCase() === biomarkerName.toLowerCase() ||
            biomarkerName.toLowerCase().includes(formula.analyte.toLowerCase()) ||
            formula.analyte.toLowerCase().includes(biomarkerName.toLowerCase())

        if (nameMatch && normalizedFormulaFrom === normalizedFrom && normalizedFormulaTo === normalizedTo) {
            return formula
        }
    }

    return null
}

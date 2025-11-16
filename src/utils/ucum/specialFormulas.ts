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
        analyte: 'LDL Cholesterol',
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
        analyte: 'Creatinine',
        fromUnit: 'mg/dL',
        toUnit: 'µmol/L',
        convert: (from: number) => from * 88.4,
        source: 'IDMS traceability standard (inverse)',
    },
    {
        analyte: 'Urea',
        fromUnit: 'mmol/L',
        toUnit: 'mg/dL',
        convert: (from: number) => from * 6.006,
        source: 'clinical chemistry standard',
    },
    {
        analyte: 'Urea',
        fromUnit: 'mg/dL',
        toUnit: 'mmol/L',
        convert: (from: number) => from / 6.006,
        source: 'clinical chemistry standard (inverse)',
    },
    {
        analyte: 'Blood Urea Nitrogen',
        fromUnit: 'mmol/L',
        toUnit: 'mg/dL',
        convert: (from: number) => from * 2.8,
        source: 'clinical chemistry standard',
    },
    {
        analyte: 'Blood Urea Nitrogen',
        fromUnit: 'mg/dL',
        toUnit: 'mmol/L',
        convert: (from: number) => from / 2.8,
        source: 'clinical chemistry standard (inverse)',
    },
    {
        analyte: 'Iron',
        fromUnit: 'µmol/L',
        toUnit: 'µg/dL',
        convert: (from: number) => from * 5.585,
        source: 'standard molar-mass conversion',
    },
    {
        analyte: 'Iron',
        fromUnit: 'µg/dL',
        toUnit: 'µmol/L',
        convert: (from: number) => from / 5.585,
        source: 'standard molar-mass conversion (inverse)',
    },
    {
        analyte: 'Zinc',
        fromUnit: 'µg/dL',
        toUnit: 'µmol/L',
        convert: (from: number) => from * 0.153,
        source: 'atomic mass 65.38 g/mol',
    },
    {
        analyte: 'Zinc',
        fromUnit: 'µmol/L',
        toUnit: 'µg/dL',
        convert: (from: number) => from / 0.153,
        source: 'atomic mass 65.38 g/mol (inverse)',
    },
    {
        analyte: 'Calcium',
        fromUnit: 'mmol/L',
        toUnit: 'mg/dL',
        convert: (from: number) => from * 4.01,
        source: 'atomic mass 40.08 g/mol',
    },
    {
        analyte: 'Ionized Calcium',
        fromUnit: 'mmol/L',
        toUnit: 'mg/dL',
        convert: (from: number) => from * 4.0,
        source: 'atomic mass 40.078 g/mol',
    },
    {
        analyte: 'Phosphate',
        fromUnit: 'mmol/L',
        toUnit: 'mg/dL',
        convert: (from: number) => from * 3.097,
        source: 'molecular weight 95 g/mol',
    },
    {
        analyte: 'Vitamin D',
        fromUnit: 'nmol/L',
        toUnit: 'ng/mL',
        convert: (from: number) => from / 2.5,
        source: 'standard conversion factor 2.5',
    },
    {
        analyte: 'Vitamin D',
        fromUnit: 'ng/mL',
        toUnit: 'nmol/L',
        convert: (from: number) => from * 2.5,
        source: 'standard conversion factor 2.5 (inverse)',
    },
    {
        analyte: 'TIBC',
        fromUnit: 'µg/dL',
        toUnit: 'µmol/L',
        convert: (from: number) => from * 0.179,
        source: 'atomic mass Fe 55.845 g/mol',
    },
    {
        analyte: 'UIBC',
        fromUnit: 'µg/dL',
        toUnit: 'µmol/L',
        convert: (from: number) => from * 0.179,
        source: 'atomic mass Fe 55.845 g/mol',
    },
    {
        analyte: 'Copper',
        fromUnit: 'µmol/L',
        toUnit: 'µg/dL',
        convert: (from: number) => from * 6.355,
        source: 'atomic mass Cu 63.55 g/mol',
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
    const normalizedBiomarkerName = biomarkerName.toLowerCase()

    for (const formula of specialFormulas) {
        const normalizedFormulaFrom = normalizeUnit(formula.fromUnit)
        const normalizedFormulaTo = normalizeUnit(formula.toUnit)
        const formulaAnalyteLower = formula.analyte.toLowerCase()

        if (
            formulaAnalyteLower === normalizedBiomarkerName &&
            normalizedFormulaFrom === normalizedFrom &&
            normalizedFormulaTo === normalizedTo
        ) {
            return formula
        }
    }

    return null
}

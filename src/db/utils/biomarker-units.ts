import { BiomarkerType, Unit, BIOMARKER_UNITS_MAP } from '../types/biomarker.types'

export const getAvailableUnits = (biomarkerType: BiomarkerType): Unit[] => {
    return BIOMARKER_UNITS_MAP[biomarkerType] || []
}

export const isUnitValidForBiomarker = (
    biomarkerType: BiomarkerType,
    unit: Unit,
): boolean => {
    const availableUnits = getAvailableUnits(biomarkerType)
    return availableUnits.includes(unit)
}

export const getDefaultUnit = (biomarkerType: BiomarkerType): Unit | undefined => {
    const units = getAvailableUnits(biomarkerType)
    return units[0]
}

export const convertUnit = (
    value: number,
    fromUnit: Unit,
    toUnit: Unit,
    biomarkerType: BiomarkerType,
): number | null => {
    if (!isUnitValidForBiomarker(biomarkerType, fromUnit)) return null
    if (!isUnitValidForBiomarker(biomarkerType, toUnit)) return null
    if (fromUnit === toUnit) return value

    const conversionFactors: Record<string, number> = {
        [`${Unit.MG_DL}-${Unit.MMOL_L}-${BiomarkerType.GLUCOSE}`]: 0.0555,
        [`${Unit.MMOL_L}-${Unit.MG_DL}-${BiomarkerType.GLUCOSE}`]: 18.0,

        [`${Unit.MG_DL}-${Unit.MMOL_L}-${BiomarkerType.CHOLESTEROL_TOTAL}`]: 0.0259,
        [`${Unit.MMOL_L}-${Unit.MG_DL}-${BiomarkerType.CHOLESTEROL_TOTAL}`]: 38.67,

        [`${Unit.MG_DL}-${Unit.MMOL_L}-${BiomarkerType.CHOLESTEROL_HDL}`]: 0.0259,
        [`${Unit.MMOL_L}-${Unit.MG_DL}-${BiomarkerType.CHOLESTEROL_HDL}`]: 38.67,

        [`${Unit.MG_DL}-${Unit.MMOL_L}-${BiomarkerType.CHOLESTEROL_LDL}`]: 0.0259,
        [`${Unit.MMOL_L}-${Unit.MG_DL}-${BiomarkerType.CHOLESTEROL_LDL}`]: 38.67,

        [`${Unit.MG_DL}-${Unit.MMOL_L}-${BiomarkerType.TRIGLYCERIDES}`]: 0.0113,
        [`${Unit.MMOL_L}-${Unit.MG_DL}-${BiomarkerType.TRIGLYCERIDES}`]: 88.5,

        [`${Unit.G_DL}-${Unit.G_L}-${BiomarkerType.HEMOGLOBIN}`]: 10,
        [`${Unit.G_L}-${Unit.G_DL}-${BiomarkerType.HEMOGLOBIN}`]: 0.1,

        [`${Unit.NG_ML}-${Unit.NMOL_L}-${BiomarkerType.VITAMIN_D}`]: 2.5,
        [`${Unit.NMOL_L}-${Unit.NG_ML}-${BiomarkerType.VITAMIN_D}`]: 0.4,

        [`${Unit.PG_ML}-${Unit.PMOL_L}-${BiomarkerType.VITAMIN_B12}`]: 0.738,
        [`${Unit.PMOL_L}-${Unit.PG_ML}-${BiomarkerType.VITAMIN_B12}`]: 1.355,
    }

    const key = `${fromUnit}-${toUnit}-${biomarkerType}`
    const factor = conversionFactors[key]

    if (!factor) return null

    return Number((value * factor).toFixed(2))
}

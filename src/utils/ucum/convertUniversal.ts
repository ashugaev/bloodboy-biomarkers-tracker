import { canConvert } from './canConvert'
import { getConversionFactor } from './conversionFactors'
import { convertUnitValue } from './convert'
import { convertWithMolecularWeight } from './convertWithMolecularWeight'
import { getMolecularWeight } from './molecularWeights'
import { findSpecialFormula } from './specialFormulas'
import { normalizeUnitForUcum } from './unitNormalization.config'
import { isInternationalUnit, isMassUnit, isMolarUnit } from './unitType'

export interface ConversionConfig {
    molecularWeight?: number
    conversionFactor?: number
    biomarkerName?: string
}

export type ConversionMethod = 'ucum' | 'molecular-weight' | 'conversion-factor' | 'simple-math' | 'special-formula' | 'failed'

export interface ConversionResult {
    value: number
    method: ConversionMethod
    error?: string
}

const normalizeUnit = (ucum: string): string => {
    return ucum.toLowerCase().replace(/\s/g, '')
}

const convertWithFactor = (
    value: number,
    from: string,
    to: string,
    factor: number,
): number | null => {
    const normalizedFrom = normalizeUnit(from)
    const normalizedTo = normalizeUnit(to)

    const fromIsMass = isMassUnit(from)
    const fromIsMiuL = normalizedFrom.includes('miu/l') || normalizedFrom.includes('m[iu]/l')
    const fromIsIuL = normalizedFrom.includes('[iu]/l') && !normalizedFrom.includes('m[iu]/l')
    const fromIsIu = fromIsMiuL || fromIsIuL

    const toIsMass = isMassUnit(to)
    const toIsMiuL = normalizedTo.includes('miu/l') || normalizedTo.includes('m[iu]/l')
    const toIsIuL = normalizedTo.includes('[iu]/l') && !normalizedTo.includes('m[iu]/l')
    const toIsIu = toIsMiuL || toIsIuL

    if (fromIsMass && toIsIu) {
        const valueInMiuL = value * factor
        if (toIsIuL) {
            return valueInMiuL * 1000
        }
        return valueInMiuL
    }

    if (fromIsIu && toIsMass) {
        let valueInMiuL = value
        if (fromIsIuL) {
            valueInMiuL = value / 1000
        }
        return valueInMiuL / factor
    }

    return null
}

const convertSimpleMath = (
    value: number,
    from: string,
    to: string,
): number | null => {
    const normalizedFrom = normalizeUnit(from)
    const normalizedTo = normalizeUnit(to)

    const fromMiuL = normalizedFrom.includes('miu/l') || normalizedFrom.includes('m[iu]/l')
    const fromMiuMl = normalizedFrom.includes('miu/ml') || normalizedFrom.includes('m[iu]/ml')
    const fromIuL = normalizedFrom.includes('[iu]/l') && !normalizedFrom.includes('miu')
    const fromUiuMl = normalizedFrom.includes('u[iu]/ml')
    const toMiuL = normalizedTo.includes('miu/l') || normalizedTo.includes('m[iu]/l')
    const toMiuMl = normalizedTo.includes('miu/ml') || normalizedTo.includes('m[iu]/ml')
    const toIuL = normalizedTo.includes('[iu]/l') && !normalizedTo.includes('miu')
    const toUiuMl = normalizedTo.includes('u[iu]/ml')

    if (fromMiuMl && toIuL) {
        return value
    }
    if (fromIuL && toMiuMl) {
        return value
    }
    if (fromMiuL && toIuL) {
        return value / 1000
    }
    if (fromIuL && toMiuL) {
        return value * 1000
    }
    if (fromUiuMl && toMiuL) {
        return value * 1000
    }
    if (fromMiuL && toUiuMl) {
        return value / 1000
    }
    if (fromUiuMl && toIuL) {
        return value * 1000000
    }
    if (fromIuL && toUiuMl) {
        return value / 1000000
    }

    const fromIsMass = isMassUnit(from)
    const toIsMass = isMassUnit(to)
    if (fromIsMass && toIsMass) {
        const fromIsNgDl = normalizedFrom.includes('ng/dl')
        const toIsNgDl = normalizedTo.includes('ng/dl')
        const fromIsUgMl = normalizedFrom.includes('ug/ml')
        const toIsUgMl = normalizedTo.includes('ug/ml')
        const fromIsUgDl = normalizedFrom.includes('ug/dl')
        const toIsUgDl = normalizedTo.includes('ug/dl')
        const fromIsUgL = normalizedFrom.includes('ug/l')
        const toIsUgL = normalizedTo.includes('ug/l')

        if (fromIsNgDl && toIsUgL) {
            return value * 0.01
        }
        if (fromIsUgL && toIsNgDl) {
            return value * 100
        }

        if (fromIsUgMl && toIsUgDl) {
            return value * 0.01
        }
        if (fromIsUgDl && toIsUgMl) {
            return value * 100
        }
        if (fromIsUgMl && toIsUgL) {
            return value * 1000
        }
        if (fromIsUgL && toIsUgMl) {
            return value * 0.001
        }
        if (fromIsUgDl && toIsUgL) {
            return value * 10
        }
        if (fromIsUgL && toIsUgDl) {
            return value * 0.1
        }
    }

    const fromMeqL = normalizedFrom === 'meq/l'
    const toMeqL = normalizedTo === 'meq/l'
    const fromMmolL = isMolarUnit(from) && normalizedFrom.includes('mmol/l')
    const toMmolL = isMolarUnit(to) && normalizedTo.includes('mmol/l')

    if ((fromMeqL && toMmolL) || (fromMmolL && toMeqL)) {
        return value
    }

    return null
}

export const convertUniversal = (
    value: number,
    from: string,
    to: string,
    config?: ConversionConfig,
): ConversionResult => {
    if (from === to) {
        return {
            value,
            method: 'ucum',
        }
    }

    if (config?.biomarkerName) {
        const specialFormula = findSpecialFormula(config.biomarkerName, from, to)
        if (specialFormula) {
            const converted = specialFormula.convert(value)
            return {
                value: converted,
                method: 'special-formula',
            }
        }
    }

    const fromIsMass = isMassUnit(from)
    const toIsMass = isMassUnit(to)
    const fromIsMolar = isMolarUnit(from)
    const toIsMolar = isMolarUnit(to)
    const fromIsIu = isInternationalUnit(from)
    const toIsIu = isInternationalUnit(to)

    const needsMolecularWeight = (fromIsMass && toIsMolar) || (fromIsMolar && toIsMass)
    const needsConversionFactor = (fromIsMass && toIsIu) || (fromIsIu && toIsMass)

    if (needsMolecularWeight) {
        const molecularWeight = config?.molecularWeight ?? (config?.biomarkerName ? getMolecularWeight(config.biomarkerName) : undefined)

        if (!molecularWeight) {
            const error = `Molecular weight required for conversion from ${from} to ${to}. ${config?.biomarkerName ? `Biomarker "${config.biomarkerName}" not found in molecular weights database.` : 'Please provide molecularWeight in config.'}`
            return {
                value: NaN,
                method: 'failed',
                error,
            }
        }

        try {
            const converted = convertWithMolecularWeight(
                value,
                from,
                to,
                molecularWeight,
            )
            return {
                value: converted,
                method: 'molecular-weight',
            }
        } catch (error) {
            return {
                value: NaN,
                method: 'failed',
                error: error instanceof Error ? error.message : `Molecular weight conversion failed: ${String(error)}`,
            }
        }
    }

    if (needsConversionFactor) {
        const conversionFactor = config?.conversionFactor ?? (config?.biomarkerName ? getConversionFactor(config.biomarkerName) : undefined)

        if (!conversionFactor) {
            const error = config?.biomarkerName
                ? `Conversion factor required for conversion from ${from} to ${to}. Biomarker '${config.biomarkerName}' not found in conversion factors database.`
                : `Conversion factor required for conversion from ${from} to ${to}. Please provide conversionFactor in config.`
            return {
                value: NaN,
                method: 'failed',
                error,
            }
        }

        const converted = convertWithFactor(value, from, to, conversionFactor)
        if (converted !== null) {
            return {
                value: converted,
                method: 'conversion-factor',
            }
        }
        return {
            value: NaN,
            method: 'failed',
            error: `Conversion factor conversion failed for ${from} to ${to}`,
        }
    }

    if (!needsMolecularWeight && !needsConversionFactor) {
        try {
            const normalizedFrom = normalizeUnitForUcum(from)
            const normalizedTo = normalizeUnitForUcum(to)
            if (canConvert(normalizedFrom, normalizedTo)) {
                const converted = convertUnitValue(value, normalizedFrom, normalizedTo)
                return {
                    value: converted,
                    method: 'ucum',
                }
            }
        } catch {
            // UCUM conversion failed, continue to next method
        }
    }

    const simpleMathConverted = convertSimpleMath(value, from, to)
    if (simpleMathConverted !== null) {
        return {
            value: simpleMathConverted,
            method: 'simple-math',
        }
    }

    return {
        value: NaN,
        method: 'failed',
        error: `Cannot convert ${from} to ${to} with available methods`,
    }
}

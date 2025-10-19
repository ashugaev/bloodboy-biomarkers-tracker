import { BiomarkerConfig } from '../types/biomarker.types'

export const isValueNormal = (
    value: number,
    config: BiomarkerConfig,
): boolean => {
    return value >= config.normalRange.min && value <= config.normalRange.max
}

export const isValueCritical = (
    value: number,
    config: BiomarkerConfig,
): boolean => {
    if (!config.criticalRange) return false
    return value < config.criticalRange.min || value > config.criticalRange.max
}

export const isValueLow = (
    value: number,
    config: BiomarkerConfig,
): boolean => {
    return value < config.normalRange.min
}

export const isValueHigh = (
    value: number,
    config: BiomarkerConfig,
): boolean => {
    return value > config.normalRange.max
}

export const getValueStatus = (
    value: number,
    config: BiomarkerConfig,
): 'critical' | 'low' | 'normal' | 'high' => {
    if (isValueCritical(value, config)) return 'critical'
    if (isValueLow(value, config)) return 'low'
    if (isValueHigh(value, config)) return 'high'
    return 'normal'
}

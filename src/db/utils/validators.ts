import { z } from 'zod'

import { extractedBiomarkerSchema } from '@/openai/biomarkers'

import { BiomarkerConfig } from '../types/biomarker.types'

export const isValueNormal = (
    value: number,
    config: BiomarkerConfig,
): boolean => {
    if (!config.normalRange?.min || !config.normalRange?.max) return false
    return value >= config.normalRange.min && value <= config.normalRange.max
}

export const isValueCritical = (
    value: number,
    config: BiomarkerConfig,
): boolean => {
    if (!config.criticalRange?.min || !config.criticalRange?.max) return false
    return value < config.criticalRange.min || value > config.criticalRange.max
}

export const isValueLow = (
    value: number,
    config: BiomarkerConfig,
): boolean => {
    if (!config.normalRange?.min) return false
    return value < config.normalRange.min
}

export const isValueHigh = (
    value: number,
    config: BiomarkerConfig,
): boolean => {
    if (!config.normalRange?.max) return false
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

export const validateExtractedBiomarkers = (biomarkers: unknown): boolean => {
    try {
        z.array(extractedBiomarkerSchema).parse(biomarkers)
        return true
    } catch {
        return false
    }
}

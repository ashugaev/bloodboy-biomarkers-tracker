import { Range } from '@/db/types/range.types'

export interface RangeValidationResult {
    isValid: boolean
    errors: string[]
}

export const validateRanges = (
    normalRange?: Range,
    targetRange?: Range,
): RangeValidationResult => {
    const errors: string[] = []

    if (normalRange?.min !== undefined && normalRange?.max !== undefined) {
        if (normalRange.min > normalRange.max) {
            errors.push('Normal Max must be greater than or equal to Normal Min')
        }
    }

    if (targetRange?.min !== undefined && targetRange?.max !== undefined) {
        if (targetRange.min > targetRange.max) {
            errors.push('Optimal Max must be greater than or equal to Optimal Min')
        }
    }

    return {
        isValid: errors.length === 0,
        errors,
    }
}

export const isRangeInvalid = (
    normalRange?: Range,
    targetRange?: Range,
): boolean => {
    return !validateRanges(normalRange, targetRange).isValid
}

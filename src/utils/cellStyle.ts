import { CellClassParams, CellStyle } from '@ag-grid-community/core'

import { COLORS } from '@/constants/colors'
import { Range } from '@/db/types'

export const getInvalidCellStyle = <T>(
    params: CellClassParams<T>,
    isInvalid: (data: T | undefined) => boolean,
): CellStyle | null => {
    if (!params.data || !isInvalid(params.data)) {
        return {
            backgroundColor: 'transparent',
        }
    }

    return {
        backgroundColor: COLORS.INVALID_CELL_BG,
    }
}

export const getRangeCellStyle = (
    value: number | undefined,
    normalRange?: Range,
    targetRange?: Range,
): Record<string, string> => {
    if (value === undefined) {
        return {
            backgroundColor: COLORS.INVALID_CELL_BG,
        }
    }

    const isOutsideNormal =
        (normalRange?.min !== undefined && value < normalRange.min) ||
        (normalRange?.max !== undefined && value > normalRange.max)

    const isOutsideTarget =
        (targetRange?.min !== undefined && value < targetRange.min) ||
        (targetRange?.max !== undefined && value > targetRange.max)

    if (isOutsideNormal) {
        return { backgroundColor: COLORS.OUT_OF_NORMAL_BG }
    }

    if (isOutsideTarget) {
        return { backgroundColor: COLORS.OUT_OF_TARGET_BG }
    }

    return {
        backgroundColor: 'transparent',
    }
}

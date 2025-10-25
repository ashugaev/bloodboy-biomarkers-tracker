import { CellClassParams, CellStyle } from '@ag-grid-community/core'

import { COLORS } from '@/constants/colors'
import { Range } from '@/db/types'

export const getInvalidCellStyle = <T>(
    params: CellClassParams<T>,
    isInvalid: (data: T | undefined) => boolean,
): CellStyle | null => {
    if (!params.data || !isInvalid(params.data)) {
        return null
    }

    return {
        backgroundColor: COLORS.INVALID_CELL_BG,
        border: `1px solid ${COLORS.INVALID_CELL_BORDER}`,
    }
}

export const getRangeCellStyle = (
    value: number | undefined,
    normalRange?: Range,
    targetRange?: Range,
): Record<string, string> => {
    if (value === undefined) return {}

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

    return {}
}

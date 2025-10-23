import { CellClassParams, CellStyle } from '@ag-grid-community/core'

import { COLORS } from '@/constants/colors'

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

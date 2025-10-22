import { CellClassParams, CellStyle } from '@ag-grid-community/core'

const invalidCellBackgroundColor = '#fee2e2'
const invalidCellBorderColor = '#fca5a5'

export const getInvalidCellStyle = <T>(
    params: CellClassParams<T>,
    isInvalid: (data: T | undefined) => boolean,
): CellStyle | null => {
    if (!params.data || !isInvalid(params.data)) {
        return null
    }

    return {
        backgroundColor: invalidCellBackgroundColor,
        border: `1px solid ${invalidCellBorderColor}`,
    }
}

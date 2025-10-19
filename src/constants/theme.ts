import { ThemeConfig } from 'antd'

import { COLORS } from './colors'

export const themeConfig: ThemeConfig = {
    token: {
        colorPrimary: COLORS.PRIMARY,
        colorSuccess: COLORS.SUCCESS,
        colorWarning: COLORS.WARNING,
        colorError: COLORS.ERROR,
        borderRadius: 4,
        fontSize: 14,
        fontFamily: '-apple-system, blinkmacsystemfont, "Segoe UI", roboto, "Helvetica Neue", arial, sans-serif',
    },
}

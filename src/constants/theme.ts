import { ThemeConfig } from 'antd'

import { COLORS } from './colors'

export const themeConfig: ThemeConfig = {
    token: {
        colorPrimary: COLORS.PRIMARY,
        colorSuccess: COLORS.SUCCESS,
        colorWarning: COLORS.WARNING,
        colorError: COLORS.ERROR,
        colorText: COLORS.GRAY_900,
        colorTextSecondary: COLORS.GRAY_600,
        colorTextTertiary: COLORS.GRAY_500,
        colorBorder: COLORS.GRAY_200,
        colorBgContainer: '#ffffff',
        colorBgLayout: COLORS.GRAY_50,
        borderRadius: 8,
        borderRadiusLG: 12,
        borderRadiusSM: 6,
        fontSize: 14,
        fontFamily: '-apple-system, blinkmacsystemfont, "Segoe UI", roboto, "Helvetica Neue", arial, "Noto Sans", sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji"',
    },
    components: {
        Button: {
            controlHeight: 40,
            controlHeightLG: 48,
            controlHeightSM: 32,
            borderRadiusLG: 9999,
            borderRadius: 4,
            borderRadiusSM: 8,
            primaryShadow: 'none',
        },
        Input: {
            controlHeight: 40,
            borderRadius: 4,
        },
        Select: {
            controlHeight: 40,
            borderRadius: 4,
        },
        Card: {
            borderRadiusLG: 4,
        },
        Modal: {
            borderRadiusLG: 4,
        },
        Tooltip: {
            borderRadius: 4,
        },
    },
}

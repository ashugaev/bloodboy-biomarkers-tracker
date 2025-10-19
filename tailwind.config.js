import { COLORS } from './src/constants/colors'

/** @type {import('tailwindcss').Config} */
export default {
    content: [
        './index.html',
        './src/**/*.{js,ts,jsx,tsx}',
    ],
    theme: {
        extend: {
            colors: {
                primary: COLORS.PRIMARY,
                success: COLORS.SUCCESS,
                warning: COLORS.WARNING,
                error: COLORS.ERROR,
            },
        },
    },
    plugins: [],
}


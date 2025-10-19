import { sentryVitePlugin } from '@sentry/vite-plugin'
import react from '@vitejs/plugin-react'
import dotenv from 'dotenv'
import {
    defineConfig,
    loadEnv,
} from 'vite'
import svgr from 'vite-plugin-svgr'
import tsconfigPaths from 'vite-tsconfig-paths'

dotenv.config()

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, process.cwd(), '')
    const isProd = env.VITE_ENVIRONMENT === 'production'

    return {
        define: { 'process.env': process.env },
        base: '/',
        plugins: [
            react(),
            tsconfigPaths(),
            sentryVitePlugin({
                authToken: process.env.SENTRY_AUTH_TOKEN,
                org: process.env.SENTRY_ORG,
                project: process.env.SENTRY_PROJECT,
                telemetry: false,
                sourcemaps: {
                    assets: './dist/**',
                    filesToDeleteAfterUpload: ['./dist/**/*.map'],
                },
            }),
            svgr({
                svgrOptions: {
                    plugins: ['@svgr/plugin-svgo', '@svgr/plugin-jsx'],
                    svgoConfig: {
                        floatPrecision: 2,
                        multipass: true,
                        plugins: [
                            'cleanupAttrs',
                            'removeDimensions',
                            'removeXMLNS',
                            'removeViewBox',
                            {
                                name: 'convertColors',
                                params: { currentColor: true },
                            },
                        ],
                    },
                },
            }),
        ],
        optimizeDeps: {
            include: ['dexie', 'dexie-react-hooks'],
        },
        server: {
            port: 5173,
            open: true,
        },
        build: {
            sourcemap: true,
        },
        css: { devSourcemap: !isProd },
    }
})


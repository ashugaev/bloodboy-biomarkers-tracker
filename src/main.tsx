import { StrictMode } from 'react'

import '@ant-design/v5-patch-for-react-19'
import posthog from 'posthog-js'
import { PostHogProvider, PostHogErrorBoundary } from 'posthog-js/react'
import { createRoot } from 'react-dom/client'

import { App } from './App'
import { config } from './config'
import { preloadBiomarkerConfigs } from './db/models/biomarkerConfig'
import { preloadUnits } from './db/models/unit'
import { getCurrentUserId } from './db/models/user'

import './index.css'

const posthogOptions = {
    api_host: config.posthogHost,
    defaults: '2025-05-24' as const,
    capture_pageview: false,
    capture_pageleave: true,
    loaded: (ph: typeof posthog) => {
        if (ph) {
            window.onerror = (_message, source, lineno, colno, error) => {
                if (error) {
                    ph.captureException(error, {
                        type: 'window.onerror',
                        source: String(source).split('/').pop(),
                        lineno,
                        colno,
                    })
                }
            }

            window.onunhandledrejection = (event) => {
                if (event.reason instanceof Error) {
                    ph.captureException(event.reason, {
                        type: 'unhandledrejection',
                    })
                }
            }

            const originalError = console.error
            console.error = (...args) => {
                originalError(...args)
                if (args.length > 0) {
                    const error = args.find(arg => arg instanceof Error)
                    if (error) {
                        ph.captureException(error, {
                            source: 'console.error',
                        })
                    }
                }
            }
        }
    },
}

const rootElement = document.getElementById('root')

if (rootElement) {
    getCurrentUserId()
        .then(() => preloadUnits())
        .then(() => preloadBiomarkerConfigs())
        .then(() => {
            const posthogKey = config.posthogKey
            if (!posthogKey) {
                console.warn('PostHog API key is not set')
            }

            createRoot(rootElement).render(
                <StrictMode>
                    {posthogKey ? (
                        <PostHogProvider apiKey={posthogKey} options={posthogOptions}>
                            <PostHogErrorBoundary>
                                <App/>
                            </PostHogErrorBoundary>
                        </PostHogProvider>
                    ) : (
                        <App/>
                    )}
                </StrictMode>,
            )
        })
        .catch((error: Error) => {
            console.error('Failed to initialize:', error)
        })
}

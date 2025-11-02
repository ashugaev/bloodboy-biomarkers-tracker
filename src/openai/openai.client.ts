import { useCallback, useEffect, useMemo, useState } from 'react'

import { App } from 'antd'
import OpenAI from 'openai'
import posthog from 'posthog-js'

import { deleteAppSettings, useAppSettings } from '@/db/models/appSettings'

export const useOpenAI = () => {
    const { message } = App.useApp()
    const { data: settings, loading } = useAppSettings()
    const apiKey = settings[0]?.openaiApiKey
    const [minLoadingTime, setMinLoadingTime] = useState(true)

    // Minimum loading time to prevent blinking of the component
    useEffect(() => {
        const timer = setTimeout(() => {
            setMinLoadingTime(false)
        }, 200)
        return () => { clearTimeout(timer) }
    }, [])

    const resetApiKey = useCallback(async () => {
        if (settings[0]) {
            await deleteAppSettings(settings[0].id)
        }
    }, [settings])

    const client = useMemo(() => {
        if (!apiKey) return null

        const openaiClient = new OpenAI({
            apiKey,
            dangerouslyAllowBrowser: true,
        })

        return {
            chat: {
                completions: {
                    create: async (...args: Parameters<typeof openaiClient.chat.completions.create>): Promise<Awaited<ReturnType<typeof openaiClient.chat.completions.create>>> => {
                        try {
                            return await openaiClient.chat.completions.create(...args)
                        } catch (error: unknown) {
                            const err = error as { status?: number, message?: string }
                            try {
                                posthog.capture('openai_api_error', {
                                    status: err.status,
                                    errorType: err.status === 401 ? 'invalid_api_key' : 'api_error',
                                })
                            } catch {
                                // PostHog not initialized yet
                            }
                            if (err.status === 401) {
                                void message.error('Invalid API key')
                                void resetApiKey()
                            } else {
                                void message.error(`OpenAI API error: ${err.message ?? 'Unknown error'}`)
                            }
                            throw error
                        }
                    },
                },
            },
        }
    }, [apiKey, resetApiKey, message])

    return {
        client,
        hasApiKey: !!apiKey,
        loading: loading || minLoadingTime,
    }
}

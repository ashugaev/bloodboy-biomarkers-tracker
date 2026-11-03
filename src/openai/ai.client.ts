import { useCallback, useEffect, useMemo, useState } from 'react'

import { App } from 'antd'
import posthog from 'posthog-js'

import { updateAppSettings, useAppSettings } from '@/db/models/appSettings'

import { AI_PROVIDERS, AiProvider, DEFAULT_AI_PROVIDER, VisionJsonRequest } from './ai.types'
import { createAnthropicJsonCompletion } from './anthropic.client'
import { createOpenAIJsonCompletion } from './openai.client'

const API_KEY_FIELDS = {
    openai: 'openaiApiKey',
    anthropic: 'anthropicApiKey',
} as const satisfies Record<AiProvider, string>

export const useAiClient = () => {
    const { message } = App.useApp()
    const { data: settings, loading } = useAppSettings()
    const currentSettings = settings[0]
    const provider = currentSettings?.aiProvider ?? DEFAULT_AI_PROVIDER
    const apiKey = currentSettings?.[API_KEY_FIELDS[provider]]
    const settingsId = currentSettings?.id
    const [minLoadingTime, setMinLoadingTime] = useState(true)

    // Minimum loading time to prevent blinking of the component
    useEffect(() => {
        const timer = setTimeout(() => {
            setMinLoadingTime(false)
        }, 200)
        return () => { clearTimeout(timer) }
    }, [])

    const resetApiKey = useCallback(async () => {
        if (!settingsId) return
        await updateAppSettings(settingsId, {
            [API_KEY_FIELDS[provider]]: '',
            updatedAt: new Date(),
        })
    }, [settingsId, provider])

    const completeJson = useCallback(async (request: VisionJsonRequest): Promise<string | null> => {
        if (!apiKey) return null

        try {
            return provider === 'anthropic'
                ? await createAnthropicJsonCompletion(apiKey, request)
                : await createOpenAIJsonCompletion(apiKey, request)
        } catch (error: unknown) {
            const err = error as { status?: number, message?: string }
            try {
                posthog.capture(provider === 'anthropic' ? 'anthropic_api_error' : 'openai_api_error', {
                    status: err.status,
                    errorType: err.status === 401 ? 'invalid_api_key' : 'api_error',
                })
            } catch {
                // PostHog not initialized yet
            }
            if (err.status === 401) {
                void message.error(`Invalid ${AI_PROVIDERS[provider].label} API key`)
                void resetApiKey()
            } else {
                void message.error(`${AI_PROVIDERS[provider].label} API error: ${err.message ?? 'Unknown error'}`)
            }
            throw error
        }
    }, [apiKey, provider, resetApiKey, message])

    const client = useMemo(() => (apiKey ? { completeJson } : null), [apiKey, completeJson])

    return {
        client,
        provider,
        hasApiKey: !!apiKey,
        loading: loading || minLoadingTime,
    }
}

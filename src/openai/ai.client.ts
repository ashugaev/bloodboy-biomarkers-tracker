import { useCallback, useEffect, useMemo, useState } from 'react'

import { App } from 'antd'
import posthog from 'posthog-js'

import { AI_API_KEY_FIELDS, updateAppSettings, useAppSettings } from '@/db/models/appSettings'

import {
    AI_PROVIDERS,
    AiProvider,
    getAiApiKey,
    getAiModel,
    getAiProvider,
    ResolvedVisionJsonRequest,
    VisionJsonRequest,
} from './ai.types'
import { isInvalidApiKeyError } from './ai.utils'
import { createAnthropicJsonCompletion } from './anthropic.client'
import { createGeminiJsonCompletion } from './gemini.client'
import { createOpenAIJsonCompletion, createOpenRouterJsonCompletion } from './openai.client'

const AI_COMPLETIONS: Record<AiProvider, (apiKey: string, request: ResolvedVisionJsonRequest) => Promise<string | null>> = {
    openai: createOpenAIJsonCompletion,
    anthropic: createAnthropicJsonCompletion,
    openrouter: createOpenRouterJsonCompletion,
    gemini: createGeminiJsonCompletion,
}

export const useAiClient = () => {
    const { message } = App.useApp()
    const { data: settings, loading } = useAppSettings()
    const currentSettings = settings[0]
    const provider = getAiProvider(currentSettings)
    const apiKey = getAiApiKey(currentSettings, provider)
    const model = getAiModel(currentSettings, provider)
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
            [AI_API_KEY_FIELDS[provider]]: '',
            updatedAt: new Date(),
        })
    }, [settingsId, provider])

    const completeJson = useCallback(async (request: VisionJsonRequest): Promise<string | null> => {
        if (!apiKey) return null

        const label = AI_PROVIDERS[provider].label
        try {
            return await AI_COMPLETIONS[provider](apiKey, {
                ...request,
                model: request.model ?? model,
            })
        } catch (error: unknown) {
            const err = error as { status?: number, message?: string }
            const invalidKey = isInvalidApiKeyError(err)
            try {
                posthog.capture(`${provider}_api_error`, {
                    model,
                    status: err.status,
                    errorType: invalidKey ? 'invalid_api_key' : 'api_error',
                })
            } catch {
                // PostHog not initialized yet
            }
            if (invalidKey) {
                void message.error(`Invalid ${label} API key`)
                void resetApiKey()
            } else {
                void message.error(`${label} API error: ${err.message ?? 'Unknown error'}`)
            }
            throw error
        }
    }, [apiKey, provider, model, resetApiKey, message])

    const client = useMemo(() => (apiKey ? { completeJson } : null), [apiKey, completeJson])

    return {
        client,
        provider,
        model,
        hasApiKey: !!apiKey,
        loading: loading || minLoadingTime,
    }
}

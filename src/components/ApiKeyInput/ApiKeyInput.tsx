import { useEffect, useState } from 'react'

import { Button, Input, Segmented } from 'antd'
import { usePostHog } from 'posthog-js/react'

import { MAIN_SETTINGS_ID } from '@/constants'
import { addAppSettings, AppSettings, updateAppSettings, useAppSettings } from '@/db/models/appSettings'
import { AI_PROVIDERS, AiProvider, DEFAULT_AI_PROVIDER } from '@/openai'
import { captureEvent, clearPreservedAiKeys, readPreservedAiKeys } from '@/utils'

import { ApiKeyInputProps } from './ApiKeyInput.types'

const PROVIDER_OPTIONS = (Object.keys(AI_PROVIDERS) as AiProvider[]).map(provider => ({
    label: AI_PROVIDERS[provider].label,
    value: provider,
}))

const getApiKey = (settings: AppSettings | undefined, provider: AiProvider) => (
    provider === 'anthropic' ? settings?.anthropicApiKey : settings?.openaiApiKey
)

const saveSettings = async (currentSettings: AppSettings | undefined, changes: Partial<AppSettings>) => {
    if (currentSettings) {
        await updateAppSettings(MAIN_SETTINGS_ID, {
            ...changes,
            updatedAt: new Date(),
        })
        return
    }

    await addAppSettings({
        id: MAIN_SETTINGS_ID,
        openaiApiKey: '',
        ...changes,
        createdAt: new Date(),
        updatedAt: new Date(),
    })
}

export const ApiKeyInput = (props: ApiKeyInputProps) => {
    const { className, onSaved } = props
    const posthog = usePostHog()
    const [apiKeyInput, setApiKeyInput] = useState('')
    const { data: settings, loading } = useAppSettings()

    const currentSettings = settings[0]
    const activeProvider = currentSettings?.aiProvider ?? DEFAULT_AI_PROVIDER
    const [selectedProvider, setSelectedProvider] = useState<AiProvider | null>(null)
    const provider = selectedProvider ?? activeProvider
    const providerInfo = AI_PROVIDERS[provider]
    const savedKey = getApiKey(currentSettings, provider)

    useEffect(() => {
        if (loading) return

        const preservedKeys = readPreservedAiKeys()
        if (!preservedKeys) return
        if (currentSettings?.openaiApiKey || currentSettings?.anthropicApiKey) {
            clearPreservedAiKeys()
            return
        }

        const restoreSettings = async () => {
            await saveSettings(currentSettings, preservedKeys)
            clearPreservedAiKeys()
        }
        void restoreSettings()
    }, [currentSettings, loading])

    const handleSaveApiKey = async () => {
        const apiKey = apiKeyInput.trim()
        if (!apiKey) return

        await saveSettings(currentSettings, {
            aiProvider: provider,
            ...(provider === 'anthropic' ? { anthropicApiKey: apiKey } : { openaiApiKey: apiKey }),
        })
        captureEvent(posthog, savedKey ? 'api_key_updated' : 'api_key_saved', { provider })

        setApiKeyInput('')
        onSaved?.()
    }

    const handleUseSavedKey = async () => {
        await saveSettings(currentSettings, { aiProvider: provider })
        captureEvent(posthog, 'ai_provider_switched', { provider })
        onSaved?.()
    }

    return (
        <div className={`bg-white p-6 rounded border border-gray-100 ${className ?? ''}`}>
            <h3 className='text-lg font-medium mb-3'>AI API Key</h3>
            <Segmented
                block
                className='mb-4'
                options={PROVIDER_OPTIONS}
                value={provider}
                onChange={(value) => {
                    setSelectedProvider(value)
                    setApiKeyInput('')
                }}
            />
            <p className='text-sm text-gray-600 mb-2'>
                Stored locally in your browser
            </p>
            <p className='text-sm text-gray-600 mb-4'>
                Get your {providerInfo.label} API key at{' '}
                <a
                    href={providerInfo.keyUrl}
                    target='_blank'
                    rel='noopener noreferrer'
                    className='text-blue-600 hover:text-blue-800 underline'
                    onClick={() => {
                        captureEvent(posthog, `${provider}_api_keys_link_clicked`)
                    }}
                >
                    {providerInfo.keyUrlLabel}
                </a>
            </p>
            <div className='flex gap-2'>
                <Input.Password
                    aria-label={`${providerInfo.label} API key`}
                    placeholder={savedKey ? 'Saved. Enter a new key to replace' : providerInfo.keyPlaceholder}
                    value={apiKeyInput}
                    onChange={(e) => { setApiKeyInput(e.target.value) }}
                    onPressEnter={() => { void handleSaveApiKey() }}
                />
                <Button type='primary' onClick={() => { void handleSaveApiKey() }}>
                    Save
                </Button>
            </div>
            {savedKey && provider !== activeProvider && (
                <Button
                    className='mt-3'
                    onClick={() => { void handleUseSavedKey() }}
                >
                    Use saved {providerInfo.label} key
                </Button>
            )}
        </div>
    )
}

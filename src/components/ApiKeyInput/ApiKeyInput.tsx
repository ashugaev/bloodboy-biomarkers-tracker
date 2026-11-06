import { useEffect, useState } from 'react'

import { AutoComplete, Button, Input, Select } from 'antd'
import { usePostHog } from 'posthog-js/react'

import { MAIN_SETTINGS_ID } from '@/constants'
import { addAppSettings, AI_API_KEY_FIELDS, AppSettings, updateAppSettings, useAppSettings } from '@/db/models/appSettings'
import { AI_PROVIDER_ORDER, AI_PROVIDERS, AiProvider, getAiApiKey, getAiModel, getAiProvider } from '@/openai'
import { captureEvent, clearPreservedAiKeys, readPreservedAiKeys } from '@/utils'

import { ApiKeyInputProps } from './ApiKeyInput.types'

const PROVIDER_OPTIONS = AI_PROVIDER_ORDER.map(provider => ({
    label: AI_PROVIDERS[provider].label,
    value: provider,
}))

const hasAnyApiKey = (settings?: AppSettings) => AI_PROVIDER_ORDER.some(provider => !!getAiApiKey(settings, provider))

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
    const [modelInput, setModelInput] = useState<string | null>(null)
    const { data: settings, loading } = useAppSettings()

    const currentSettings = settings[0]
    const activeProvider = getAiProvider(currentSettings)
    const [selectedProvider, setSelectedProvider] = useState<AiProvider | null>(null)
    const provider = selectedProvider ?? activeProvider
    const providerInfo = AI_PROVIDERS[provider]
    const savedKey = getAiApiKey(currentSettings, provider)
    const model = modelInput ?? getAiModel(currentSettings, provider)

    useEffect(() => {
        if (loading) return

        const preservedKeys = readPreservedAiKeys()
        if (!preservedKeys) return
        if (hasAnyApiKey(currentSettings)) {
            clearPreservedAiKeys()
            return
        }

        const restoreSettings = async () => {
            await saveSettings(currentSettings, preservedKeys)
            clearPreservedAiKeys()
        }
        void restoreSettings()
    }, [currentSettings, loading])

    const handleSave = async () => {
        const apiKey = apiKeyInput.trim()
        if (!apiKey && !savedKey) return

        const selectedModel = model.trim() || providerInfo.defaultModel
        await saveSettings(currentSettings, {
            aiProvider: provider,
            aiModels: {
                ...currentSettings?.aiModels,
                [provider]: selectedModel,
            },
            ...(apiKey ? { [AI_API_KEY_FIELDS[provider]]: apiKey } : {}),
        })
        if (apiKey) {
            captureEvent(posthog, savedKey ? 'api_key_updated' : 'api_key_saved', { provider })
        }
        captureEvent(posthog, 'ai_settings_saved', {
            provider,
            model: selectedModel,
        })

        setApiKeyInput('')
        setModelInput(null)
        onSaved?.()
    }

    return (
        <div className={`bg-white p-6 rounded border border-gray-100 ${className ?? ''}`}>
            <h3 className='text-lg font-medium mb-3'>AI provider</h3>
            <Select
                aria-label='AI provider'
                className='w-full mb-4'
                options={PROVIDER_OPTIONS}
                value={provider}
                onChange={(value) => {
                    setSelectedProvider(value)
                    setApiKeyInput('')
                    setModelInput(null)
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
            <div className='flex flex-col gap-3'>
                <Input.Password
                    aria-label={`${providerInfo.label} API key`}
                    placeholder={savedKey ? 'Saved. Enter a new key to replace' : providerInfo.keyPlaceholder}
                    value={apiKeyInput}
                    onChange={(e) => { setApiKeyInput(e.target.value) }}
                    onPressEnter={() => { void handleSave() }}
                />
                <div className='flex flex-col gap-1 text-sm text-gray-600'>
                    <span>Model for parsing</span>
                    <AutoComplete
                        aria-label='Model for parsing'
                        options={providerInfo.models.map(value => ({ value }))}
                        placeholder={providerInfo.defaultModel}
                        value={model}
                        onChange={(value) => { setModelInput(value) }}
                    />
                </div>
                <Button
                    type='primary'
                    disabled={!apiKeyInput.trim() && !savedKey}
                    onClick={() => { void handleSave() }}
                >
                    Save
                </Button>
            </div>
        </div>
    )
}

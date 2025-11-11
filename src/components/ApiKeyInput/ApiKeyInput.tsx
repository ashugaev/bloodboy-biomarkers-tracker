import { useEffect, useState } from 'react'

import { Button, Input } from 'antd'
import { usePostHog } from 'posthog-js/react'

import { MAIN_SETTINGS_ID, PRESERVED_OPENAI_TOKEN_KEY } from '@/constants'
import { addAppSettings, updateAppSettings, useAppSettings } from '@/db/models/appSettings'
import { captureEvent } from '@/utils'

import { ApiKeyInputProps } from './ApiKeyInput.types'

export const ApiKeyInput = (props: ApiKeyInputProps) => {
    const { className } = props
    const posthog = usePostHog()
    const [apiKeyInput, setApiKeyInput] = useState('')
    const { data: settings, loading } = useAppSettings()

    const currentSettings = settings[0]

    useEffect(() => {
        if (loading) return

        const preservedToken = sessionStorage.getItem(PRESERVED_OPENAI_TOKEN_KEY)
        if (preservedToken && !currentSettings?.openaiApiKey) {
            const restoreSettings = async () => {
                const newSettings = {
                    id: MAIN_SETTINGS_ID,
                    openaiApiKey: preservedToken,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                }
                if (currentSettings) {
                    await updateAppSettings(MAIN_SETTINGS_ID, newSettings)
                } else {
                    await addAppSettings(newSettings)
                }
                sessionStorage.removeItem(PRESERVED_OPENAI_TOKEN_KEY)
            }
            void restoreSettings()
        }
    }, [currentSettings, loading])

    const handleSaveApiKey = async () => {
        if (!apiKeyInput.trim()) return

        const newSettings = {
            id: MAIN_SETTINGS_ID,
            openaiApiKey: apiKeyInput.trim(),
            createdAt: new Date(),
            updatedAt: new Date(),
        }

        if (currentSettings) {
            await updateAppSettings(MAIN_SETTINGS_ID, newSettings)
            captureEvent(posthog, 'api_key_updated')
        } else {
            await addAppSettings(newSettings)
            captureEvent(posthog, 'api_key_saved')
        }

        setApiKeyInput('')
    }

    return (
        <div className={`bg-white p-6 rounded border border-gray-100 ${className ?? ''}`}>
            <h3 className='text-lg font-medium mb-2'>OpenAI API Key Required</h3>
            <p className='text-sm text-gray-600 mb-2'>
                Stored locally in your browser
            </p>
            <p className='text-sm text-gray-600 mb-4'>
                Get your API key at{' '}
                <a
                    href='https://platform.openai.com/api-keys'
                    target='_blank'
                    rel='noopener noreferrer'
                    className='text-blue-600 hover:text-blue-800 underline'
                    onClick={() => {
                        captureEvent(posthog, 'openai_api_keys_link_clicked')
                    }}
                >
                    platform.openai.com/api-keys
                </a>
            </p>
            <div className='flex gap-2'>
                <Input.Password
                    placeholder='sk-...'
                    value={apiKeyInput}
                    onChange={(e) => { setApiKeyInput(e.target.value) }}
                    onPressEnter={() => { void handleSaveApiKey() }}
                />
                <Button type='primary' onClick={() => { void handleSaveApiKey() }}>
                    Save
                </Button>
            </div>
        </div>
    )
}

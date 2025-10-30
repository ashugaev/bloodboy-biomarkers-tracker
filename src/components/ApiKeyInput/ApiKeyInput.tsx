import { useState } from 'react'

import { Button, Input } from 'antd'

import { MAIN_SETTINGS_ID } from '@/constants'
import { addAppSettings, updateAppSettings, useAppSettings } from '@/db/models/appSettings'

import { ApiKeyInputProps } from './ApiKeyInput.types'

export const ApiKeyInput = (props: ApiKeyInputProps) => {
    const { className } = props
    const [apiKeyInput, setApiKeyInput] = useState('')
    const { data: settings } = useAppSettings()

    const currentSettings = settings[0]

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
        } else {
            await addAppSettings(newSettings)
        }

        setApiKeyInput('')
    }

    return (
        <div className={`bg-white p-6 rounded shadow-sm border border-gray-100 ${className ?? ''}`}>
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

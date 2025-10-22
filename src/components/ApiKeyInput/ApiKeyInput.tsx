import { useState } from 'react'

import { Button, Input } from 'antd'

import { DBStore } from '@/db/constants/stores'
import { useDb } from '@/db/hooks/useDb'

import { ApiKeyInputProps } from './ApiKeyInput.types'

export const ApiKeyInput = (props: ApiKeyInputProps) => {
    const { className } = props
    const [apiKeyInput, setApiKeyInput] = useState('')
    const { data: settings, add, update } = useDb(DBStore.APP_SETTINGS)

    const currentSettings = settings[0]

    const handleSaveApiKey = async () => {
        if (!apiKeyInput.trim()) return

        const newSettings = {
            id: 'main',
            openaiApiKey: apiKeyInput.trim(),
            createdAt: new Date(),
            updatedAt: new Date(),
        }

        if (currentSettings) {
            await update('main', newSettings)
        } else {
            await add(newSettings)
        }

        setApiKeyInput('')
    }

    return (
        <div className={`bg-white p-6 rounded-lg shadow-sm ${className ?? ''}`}>
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

import { useCallback, useMemo } from 'react'

import { App } from 'antd'
import OpenAI from 'openai'

import { DBStore } from '@/db/constants/stores'
import { useDb } from '@/db/hooks/useDb'

export const useOpenAI = () => {
    const { message } = App.useApp()
    const { data: settings, loading, remove } = useDb(DBStore.APP_SETTINGS)
    const apiKey = settings[0]?.openaiApiKey

    const resetApiKey = useCallback(async () => {
        if (settings[0]) {
            await remove(settings[0].id)
        }
    }, [settings, remove])

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
                        } catch (error: any) {
                            if (error?.status === 401) {
                                message.error('Invalid API key')
                                await resetApiKey()
                            } else {
                                message.error(`OpenAI API error: ${error?.message || 'Unknown error'}`)
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
        loading,
    }
}

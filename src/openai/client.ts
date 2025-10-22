import { useCallback, useEffect, useMemo, useState } from 'react'

import { App } from 'antd'
import OpenAI from 'openai'

import { DBStore } from '@/db/constants/stores'
import { useDb } from '@/db/hooks/useDb'

export const useOpenAI = () => {
    const { message } = App.useApp()
    const { data: settings, loading, remove } = useDb(DBStore.APP_SETTINGS)
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
                        } catch (error: unknown) {
                            const err = error as { status?: number, message?: string }
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

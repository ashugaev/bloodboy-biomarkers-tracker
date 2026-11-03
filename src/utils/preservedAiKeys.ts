import { PRESERVED_AI_KEYS_KEY } from '@/constants'
import { AiProvider, AppSettings } from '@/db/models/appSettings'

export interface PreservedAiKeys {
    openaiApiKey?: string
    anthropicApiKey?: string
    aiProvider?: AiProvider
}

export const getAiKeysToPreserve = (settings?: AppSettings): PreservedAiKeys | null => {
    if (!settings?.openaiApiKey && !settings?.anthropicApiKey) return null

    return {
        ...(settings.openaiApiKey ? { openaiApiKey: settings.openaiApiKey } : {}),
        ...(settings.anthropicApiKey ? { anthropicApiKey: settings.anthropicApiKey } : {}),
        ...(settings.aiProvider ? { aiProvider: settings.aiProvider } : {}),
    }
}

export const savePreservedAiKeys = (keys: PreservedAiKeys) => {
    sessionStorage.setItem(PRESERVED_AI_KEYS_KEY, JSON.stringify(keys))
}

export const readPreservedAiKeys = (): PreservedAiKeys | null => {
    const raw = sessionStorage.getItem(PRESERVED_AI_KEYS_KEY)
    if (!raw) return null

    try {
        const parsed = JSON.parse(raw) as PreservedAiKeys
        if (!parsed.openaiApiKey && !parsed.anthropicApiKey) return null
        return parsed
    } catch {
        return null
    }
}

export const clearPreservedAiKeys = () => {
    sessionStorage.removeItem(PRESERVED_AI_KEYS_KEY)
}

import { PRESERVED_AI_KEYS_KEY } from '@/constants'
import { AI_API_KEY_FIELDS, AppSettings } from '@/db/models/appSettings/appSettings.types'

const API_KEY_FIELDS = Object.values(AI_API_KEY_FIELDS)

export type PreservedAiKeys = Partial<Pick<AppSettings, typeof API_KEY_FIELDS[number] | 'aiProvider' | 'aiModels'>>

const hasApiKey = (keys: PreservedAiKeys) => API_KEY_FIELDS.some(field => !!keys[field])

export const getAiKeysToPreserve = (settings?: AppSettings): PreservedAiKeys | null => {
    if (!settings || !hasApiKey(settings)) return null

    const keys: PreservedAiKeys = {}
    API_KEY_FIELDS.forEach((field) => {
        if (settings[field]) keys[field] = settings[field]
    })
    if (settings.aiProvider) keys.aiProvider = settings.aiProvider
    if (settings.aiModels) keys.aiModels = settings.aiModels

    return keys
}

export const savePreservedAiKeys = (keys: PreservedAiKeys) => {
    sessionStorage.setItem(PRESERVED_AI_KEYS_KEY, JSON.stringify(keys))
}

export const readPreservedAiKeys = (): PreservedAiKeys | null => {
    const raw = sessionStorage.getItem(PRESERVED_AI_KEYS_KEY)
    if (!raw) return null

    try {
        const parsed = JSON.parse(raw) as PreservedAiKeys
        return hasApiKey(parsed) ? parsed : null
    } catch {
        return null
    }
}

export const clearPreservedAiKeys = () => {
    sessionStorage.removeItem(PRESERVED_AI_KEYS_KEY)
}

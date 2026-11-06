import { AI_API_KEY_FIELDS, AiProvider, AppSettings } from '@/db/models/appSettings/appSettings.types'

export type { AiProvider }

export interface VisionJsonRequest {
    systemPrompt: string
    imageDataUrl: string
    userText: string
    followUpText?: string
    model?: string
}

export type ResolvedVisionJsonRequest = VisionJsonRequest & { model: string }

export interface AiProviderInfo {
    label: string
    keyPlaceholder: string
    keyUrl: string
    keyUrlLabel: string
    defaultModel: string
    models: string[]
}

export const DEFAULT_AI_PROVIDER: AiProvider = 'openai'

export const AI_REASONING_EFFORT = 'medium'

export const AI_PROVIDERS: Record<AiProvider, AiProviderInfo> = {
    openai: {
        label: 'OpenAI',
        keyPlaceholder: 'sk-...',
        keyUrl: 'https://platform.openai.com/api-keys',
        keyUrlLabel: 'platform.openai.com/api-keys',
        defaultModel: 'gpt-6.1-sol',
        models: ['gpt-6.1-sol', 'gpt-6-astra', 'gpt-6.1-terra', 'gpt-6-luna'],
    },
    anthropic: {
        label: 'Claude',
        keyPlaceholder: 'sk-ant-...',
        keyUrl: 'https://platform.claude.com/settings/keys',
        keyUrlLabel: 'platform.claude.com/settings/keys',
        defaultModel: 'claude-opus-5-5',
        models: ['claude-opus-5-5', 'claude-sonnet-5-5', 'claude-haiku-4-5'],
    },
    gemini: {
        label: 'Gemini',
        keyPlaceholder: 'AIza...',
        keyUrl: 'https://aistudio.google.com/apikey',
        keyUrlLabel: 'aistudio.google.com/apikey',
        defaultModel: 'gemini-4-argon',
        models: ['gemini-4-argon', 'gemini-3.8-flash', 'gemini-3.6-flash'],
    },
    openrouter: {
        label: 'OpenRouter',
        keyPlaceholder: 'sk-or-...',
        keyUrl: 'https://openrouter.ai/settings/keys',
        keyUrlLabel: 'openrouter.ai/settings/keys',
        defaultModel: 'openai/gpt-6.1-sol',
        models: ['openai/gpt-6.1-sol', 'anthropic/claude-opus-5.5', 'google/gemini-4-argon', 'google/gemini-3.8-flash'],
    },
}

export const AI_PROVIDER_ORDER: AiProvider[] = ['openai', 'anthropic', 'gemini', 'openrouter']

export const getAiProvider = (settings?: AppSettings): AiProvider => (
    settings?.aiProvider && settings.aiProvider in AI_PROVIDERS ? settings.aiProvider : DEFAULT_AI_PROVIDER
)

export const getAiApiKey = (settings: AppSettings | undefined, provider: AiProvider) => (
    settings?.[AI_API_KEY_FIELDS[provider]] ?? ''
)

export const getAiModel = (settings: AppSettings | undefined, provider: AiProvider) => {
    const model = settings?.aiModels?.[provider]?.trim()
    if (model) return model
    return AI_PROVIDERS[provider].defaultModel
}

import { AiProvider } from '@/db/models/appSettings'

export type { AiProvider }

export interface VisionJsonRequest {
    systemPrompt: string
    imageDataUrl: string
    userText: string
    followUpText?: string
    model?: string
}

export interface AiProviderInfo {
    label: string
    keyPlaceholder: string
    keyUrl: string
    keyUrlLabel: string
    defaultModel: string
}

export const DEFAULT_AI_PROVIDER: AiProvider = 'openai'

export const AI_PROVIDERS: Record<AiProvider, AiProviderInfo> = {
    openai: {
        label: 'OpenAI',
        keyPlaceholder: 'sk-...',
        keyUrl: 'https://platform.openai.com/api-keys',
        keyUrlLabel: 'platform.openai.com/api-keys',
        defaultModel: 'gpt-6.1-sol',
    },
    anthropic: {
        label: 'Claude',
        keyPlaceholder: 'sk-ant-...',
        keyUrl: 'https://platform.claude.com/settings/keys',
        keyUrlLabel: 'platform.claude.com/settings/keys',
        defaultModel: 'claude-opus-5-5',
    },
}

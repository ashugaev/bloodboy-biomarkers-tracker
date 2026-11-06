export interface GoogleDriveBackupSettings {
    enabled: boolean
    rootFolderId?: string
    latestFolderId?: string
    historyFolderId?: string
    manifestFileId?: string
    latestFileId?: string
    lastBackupAt?: Date
    lastBackupFileId?: string
    lastBackupFileName?: string
    lastBackupWebViewLink?: string
    lastSyncDirection?: 'uploaded' | 'downloaded' | 'none'
    lastError?: string
    connectedAt?: Date
}

export type AiProvider = 'openai' | 'anthropic' | 'openrouter' | 'gemini'

export interface AppSettings {
    id: string
    openaiApiKey: string
    anthropicApiKey?: string
    openrouterApiKey?: string
    geminiApiKey?: string
    aiProvider?: AiProvider
    aiModels?: Partial<Record<AiProvider, string>>
    lastExportedAt?: Date
    googleDriveBackup?: GoogleDriveBackupSettings
    createdAt: Date
    updatedAt: Date
}

export const AI_API_KEY_FIELDS = {
    openai: 'openaiApiKey',
    anthropic: 'anthropicApiKey',
    openrouter: 'openrouterApiKey',
    gemini: 'geminiApiKey',
} as const satisfies Record<AiProvider, keyof AppSettings>

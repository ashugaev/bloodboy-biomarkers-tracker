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

export type AiProvider = 'openai' | 'anthropic'

export interface AppSettings {
    id: string
    openaiApiKey: string
    anthropicApiKey?: string
    aiProvider?: AiProvider
    lastExportedAt?: Date
    googleDriveBackup?: GoogleDriveBackupSettings
    createdAt: Date
    updatedAt: Date
}

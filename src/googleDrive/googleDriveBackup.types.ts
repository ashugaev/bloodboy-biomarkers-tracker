import { GoogleDriveBackupSettings } from '@/db/models/appSettings'

export interface GoogleDriveBackupResult {
    exportedAt: Date
    dataVersionAt: Date
    latestFileId: string
    latestFileName: string
    historyFileId: string
    historyFileName: string
    manifestFileId: string
    rootFolderId: string
    latestFolderId: string
    historyFolderId: string
    webViewLink?: string
}

export interface GoogleDriveBackupStructure {
    rootFolderId: string
    latestFolderId: string
    historyFolderId: string
    latestFileId?: string
    manifestFileId?: string
}

export interface GoogleDriveBackupUploadStructure extends GoogleDriveBackupStructure {
    monthFolderId: string
}

export interface GoogleDriveBackupManifest {
    app: 'Bloodboy'
    format: 'dexie-export-import'
    generatedAt: string
    dataVersionAt?: string
    latest: {
        fileName: string
        fileId: string
    }
    archivedVersion: {
        fileName: string
        fileId: string
    }
}

export interface BackupDatabaseToGoogleDriveOptions {
    prompt?: string
    forceEnable?: boolean
    interactive?: boolean
}

export interface GoogleDriveBackupState {
    settingsId: string
    driveSettings?: GoogleDriveBackupSettings
}

export type GoogleDriveSyncAction = 'uploaded' | 'downloaded' | 'none'

export interface GoogleDriveSyncResult {
    action: GoogleDriveSyncAction
    localVersionAt: Date | null
    remoteVersionAt: Date | null
    backup?: GoogleDriveBackupResult
}

import { GoogleDriveBackupSettings } from '@/db/models/appSettings'

export interface GoogleDriveBackupResult {
    exportedAt: Date
    dataVersionAt: Date
    dataFingerprint: string | null
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
    dataFingerprint?: string
    profile?: {
        id: string
        name: string
    }
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

export type GoogleDriveSyncAction = 'uploaded' | 'downloaded' | 'none' | 'conflict'

export type GoogleDriveSyncPlan = 'upload' | 'download' | 'conflict' | 'in-sync' | 'none'

export type GoogleDriveConflictChoice = 'local' | 'remote'

export interface GoogleDriveSyncState {
    localFingerprint: string | null
    localVersionAt: Date | null
    remoteVersion: string | null
    remoteVersionAt: Date | null
    remoteFingerprint?: string
    syncedLocalFingerprint?: string
    syncedRemoteVersion?: string
    lastBackupAt?: Date
}

export interface GoogleDriveSyncResult {
    action: GoogleDriveSyncAction
    localVersionAt: Date | null
    remoteVersionAt: Date | null
    backup?: GoogleDriveBackupResult
    conflictBackupFileName?: string
}

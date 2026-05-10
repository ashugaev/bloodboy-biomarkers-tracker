import { config } from '@/config'
import { MAIN_SETTINGS_ID } from '@/constants'
import { AppSettings, GoogleDriveBackupSettings } from '@/db/models/appSettings'
// eslint-disable-next-line no-restricted-imports
import { db } from '@/db/services/db.service'
import { getLatestUserDataUpdatedAt } from '@/db/utils/exportStatus.utils'
import { createDatabaseBackupBlob } from '@/utils/exportData'
import { importDatabaseBackup } from '@/utils/importData'

import {
    BackupDatabaseToGoogleDriveOptions,
    GoogleDriveBackupManifest,
    GoogleDriveBackupResult,
    GoogleDriveBackupState,
    GoogleDriveBackupStructure,
    GoogleDriveBackupUploadStructure,
    GoogleDriveSyncResult,
} from './googleDriveBackup.types'

const GOOGLE_IDENTITY_SCRIPT_ID = 'google-identity-services'
const GOOGLE_IDENTITY_SCRIPT_SRC = 'https://accounts.google.com/gsi/client'
const GOOGLE_DRIVE_SCOPE = 'https://www.googleapis.com/auth/drive.file'
const DRIVE_API_BASE_URL = 'https://www.googleapis.com/drive/v3'
const DRIVE_UPLOAD_BASE_URL = 'https://www.googleapis.com/upload/drive/v3'
const BACKUP_ROOT_FOLDER_NAME = 'Bloodboy Backups'
const LATEST_FOLDER_NAME = 'latest'
const HISTORY_FOLDER_NAME = 'history'
const MANIFEST_FILE_NAME = 'bloodboy_backup_manifest.json'
const LATEST_BACKUP_FILE_NAME = 'bloodboy_db_backup_latest.json'

interface GoogleTokenResponse {
    access_token?: string
    error?: string
    error_description?: string
    expires_in?: number
}

interface GoogleTokenClient {
    requestAccessToken: (overrideConfig?: { prompt?: string }) => void
}

interface GoogleDriveFile {
    id: string
    name: string
    webViewLink?: string
}

interface GoogleDriveFileList {
    files: GoogleDriveFile[]
}

interface GoogleDriveErrorPayload {
    error?: {
        message?: string
    }
}

declare global {
    interface Window {
        google?: {
            accounts: {
                oauth2: {
                    initTokenClient: (config: {
                        client_id: string
                        scope: string
                        callback: (response: GoogleTokenResponse) => void
                    }) => GoogleTokenClient
                }
            }
        }
    }
}

let cachedAccessToken: string | null = null
let cachedAccessTokenExpiresAt = 0

export class GoogleDriveBackupError extends Error {
    status?: number

    constructor (message: string, status?: number) {
        super(message)
        this.name = 'GoogleDriveBackupError'
        this.status = status
    }
}

const isFreshAccessToken = () => {
    return cachedAccessToken && Date.now() < cachedAccessTokenExpiresAt - 60_000
}

const loadGoogleIdentityScript = async () => {
    if (window.google?.accounts.oauth2) return

    const existingScript = document.getElementById(GOOGLE_IDENTITY_SCRIPT_ID)
    if (existingScript) {
        await new Promise<void>((resolve, reject) => {
            existingScript.addEventListener('load', () => { resolve() }, { once: true })
            existingScript.addEventListener('error', () => { reject(new Error('Failed to load Google Identity Services')) }, { once: true })
        })
        return
    }

    await new Promise<void>((resolve, reject) => {
        const script = document.createElement('script')
        script.id = GOOGLE_IDENTITY_SCRIPT_ID
        script.src = GOOGLE_IDENTITY_SCRIPT_SRC
        script.async = true
        script.defer = true
        script.onload = () => { resolve() }
        script.onerror = () => { reject(new Error('Failed to load Google Identity Services')) }
        document.head.appendChild(script)
    })
}

const requestGoogleDriveAccessToken = async (prompt = ''): Promise<string> => {
    if (isFreshAccessToken() && cachedAccessToken) {
        return cachedAccessToken
    }

    if (!config.googleClientId) {
        throw new GoogleDriveBackupError('Google Drive client ID is not configured')
    }

    const googleClientId = config.googleClientId

    await loadGoogleIdentityScript()

    if (!window.google?.accounts.oauth2) {
        throw new GoogleDriveBackupError('Google Identity Services is unavailable')
    }

    return await new Promise((resolve, reject) => {
        const tokenClient = window.google?.accounts.oauth2.initTokenClient({
            client_id: googleClientId,
            scope: GOOGLE_DRIVE_SCOPE,
            callback: (response) => {
                if (response.error) {
                    reject(new GoogleDriveBackupError(response.error_description ?? response.error))
                    return
                }

                if (!response.access_token) {
                    reject(new GoogleDriveBackupError('Google did not return an access token'))
                    return
                }

                cachedAccessToken = response.access_token
                cachedAccessTokenExpiresAt = Date.now() + (response.expires_in ?? 3600) * 1000
                resolve(response.access_token)
            },
        })

        tokenClient?.requestAccessToken({ prompt })
    })
}

export const clearGoogleDriveAccessToken = () => {
    cachedAccessToken = null
    cachedAccessTokenExpiresAt = 0
}

const getErrorMessage = async (response: Response): Promise<string> => {
    try {
        const payload = await response.json() as GoogleDriveErrorPayload
        return payload.error?.message ?? response.statusText
    } catch {
        return response.statusText
    }
}

const driveFetch = async <T>(accessToken: string, url: string, init?: RequestInit): Promise<T> => {
    const response = await fetch(`${DRIVE_API_BASE_URL}${url}`, {
        ...init,
        headers: {
            ...init?.headers,
            Authorization: `Bearer ${accessToken}`,
        },
    })

    if (!response.ok) {
        throw new GoogleDriveBackupError(await getErrorMessage(response), response.status)
    }

    return await response.json() as T
}

const driveDownload = async (accessToken: string, fileId: string): Promise<Blob> => {
    const response = await fetch(`${DRIVE_API_BASE_URL}/files/${fileId}?alt=media`, {
        headers: {
            Authorization: `Bearer ${accessToken}`,
        },
    })

    if (!response.ok) {
        throw new GoogleDriveBackupError(await getErrorMessage(response), response.status)
    }

    return await response.blob()
}

const driveDownloadJson = async <T>(accessToken: string, fileId: string): Promise<T> => {
    const blob = await driveDownload(accessToken, fileId)
    return JSON.parse(await blob.text()) as T
}

const escapeDriveQueryValue = (value: string): string => {
    return value.replace(/\\/g, '\\\\').replace(/'/g, '\\\'')
}

const findDriveFile = async (
    accessToken: string,
    name: string,
    parentId: string | null,
    mimeType?: string,
): Promise<GoogleDriveFile | null> => {
    const queryParts = [
        `name='${escapeDriveQueryValue(name)}'`,
        'trashed=false',
    ]

    if (parentId) {
        queryParts.push(`'${parentId}' in parents`)
    }

    if (mimeType) {
        queryParts.push(`mimeType='${mimeType}'`)
    }

    const searchParams = new URLSearchParams({
        q: queryParts.join(' and '),
        fields: 'files(id,name,webViewLink)',
        pageSize: '1',
        spaces: 'drive',
    })

    const result = await driveFetch<GoogleDriveFileList>(accessToken, `/files?${searchParams.toString()}`)
    return result.files[0] ?? null
}

const createDriveMetadataFile = async (
    accessToken: string,
    metadata: Record<string, unknown>,
): Promise<GoogleDriveFile> => {
    return await driveFetch<GoogleDriveFile>(accessToken, '/files?fields=id,name,webViewLink', {
        method: 'POST',
        body: JSON.stringify(metadata),
        headers: {
            'Content-Type': 'application/json',
        },
    })
}

const getOrCreateFolder = async (
    accessToken: string,
    name: string,
    parentId: string | null,
): Promise<GoogleDriveFile> => {
    const existingFolder = await findDriveFile(
        accessToken,
        name,
        parentId,
        'application/vnd.google-apps.folder',
    )

    if (existingFolder) {
        return existingFolder
    }

    return await createDriveMetadataFile(accessToken, {
        name,
        mimeType: 'application/vnd.google-apps.folder',
        ...(parentId ? { parents: [parentId] } : {}),
    })
}

const createMultipartBody = (
    metadata: Record<string, unknown>,
    blob: Blob,
): { body: Blob, contentType: string } => {
    const boundary = `bloodboy_backup_${crypto.randomUUID()}`
    const delimiter = `--${boundary}\r\n`
    const closeDelimiter = `\r\n--${boundary}--`
    const metadataPart = [
        delimiter,
        'Content-Type: application/json; charset=UTF-8\r\n\r\n',
        JSON.stringify(metadata),
        '\r\n',
        delimiter,
        'Content-Type: application/json\r\n\r\n',
    ].join('')

    return {
        body: new Blob([metadataPart, blob, closeDelimiter], {
            type: `multipart/related; boundary=${boundary}`,
        }),
        contentType: `multipart/related; boundary=${boundary}`,
    }
}

const uploadMultipartFile = async (
    accessToken: string,
    method: 'POST' | 'PATCH',
    path: string,
    metadata: Record<string, unknown>,
    blob: Blob,
): Promise<GoogleDriveFile> => {
    const { body, contentType } = createMultipartBody(metadata, blob)
    const searchParams = new URLSearchParams({
        uploadType: 'multipart',
        fields: 'id,name,webViewLink',
    })

    const response = await fetch(`${DRIVE_UPLOAD_BASE_URL}${path}?${searchParams.toString()}`, {
        method,
        headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': contentType,
        },
        body,
    })

    if (!response.ok) {
        throw new GoogleDriveBackupError(await getErrorMessage(response), response.status)
    }

    return await response.json() as GoogleDriveFile
}

const toBackupTimestamp = (date: Date): string => {
    return date.toISOString().replace(/[:.]/g, '-')
}

const getMonthFolderName = (date: Date): string => {
    return String(date.getUTCMonth() + 1).padStart(2, '0')
}

const ensureBaseBackupStructure = async (
    accessToken: string,
): Promise<GoogleDriveBackupStructure> => {
    const rootFolder = await getOrCreateFolder(accessToken, BACKUP_ROOT_FOLDER_NAME, null)
    const latestFolder = await getOrCreateFolder(accessToken, LATEST_FOLDER_NAME, rootFolder.id)
    const historyFolder = await getOrCreateFolder(accessToken, HISTORY_FOLDER_NAME, rootFolder.id)
    const latestFile = await findDriveFile(accessToken, LATEST_BACKUP_FILE_NAME, latestFolder.id, 'application/json')
    const manifestFile = await findDriveFile(accessToken, MANIFEST_FILE_NAME, rootFolder.id, 'application/json')

    return {
        rootFolderId: rootFolder.id,
        latestFolderId: latestFolder.id,
        historyFolderId: historyFolder.id,
        latestFileId: latestFile?.id,
        manifestFileId: manifestFile?.id,
    }
}

const ensureBackupStructure = async (
    accessToken: string,
    exportedAt: Date,
): Promise<GoogleDriveBackupUploadStructure> => {
    const baseStructure = await ensureBaseBackupStructure(accessToken)
    const yearFolder = await getOrCreateFolder(accessToken, String(exportedAt.getUTCFullYear()), baseStructure.historyFolderId)
    const monthFolder = await getOrCreateFolder(accessToken, getMonthFolderName(exportedAt), yearFolder.id)

    return {
        ...baseStructure,
        monthFolderId: monthFolder.id,
    }
}

const uploadBackupFiles = async (
    accessToken: string,
    backupBlob: Blob,
    exportedAt: Date,
    dataVersionAt: Date,
): Promise<GoogleDriveBackupResult> => {
    const structure = await ensureBackupStructure(accessToken, exportedAt)
    const historyFileName = `bloodboy_db_backup_${toBackupTimestamp(exportedAt)}.json`
    const historyFile = await uploadMultipartFile(
        accessToken,
        'POST',
        '/files',
        {
            name: historyFileName,
            mimeType: 'application/json',
            parents: [structure.monthFolderId],
        },
        backupBlob,
    )

    const latestMetadata = {
        name: LATEST_BACKUP_FILE_NAME,
        mimeType: 'application/json',
        parents: [structure.latestFolderId],
    }
    let latestFile: GoogleDriveFile

    if (structure.latestFileId) {
        try {
            latestFile = await uploadMultipartFile(
                accessToken,
                'PATCH',
                `/files/${structure.latestFileId}`,
                {
                    name: LATEST_BACKUP_FILE_NAME,
                    mimeType: 'application/json',
                },
                backupBlob,
            )
        } catch (error) {
            if (!(error instanceof GoogleDriveBackupError) || error.status !== 404) {
                throw error
            }
            latestFile = await uploadMultipartFile(accessToken, 'POST', '/files', latestMetadata, backupBlob)
        }
    } else {
        latestFile = await uploadMultipartFile(accessToken, 'POST', '/files', latestMetadata, backupBlob)
    }

    const manifest = {
        app: 'Bloodboy',
        format: 'dexie-export-import',
        generatedAt: exportedAt.toISOString(),
        dataVersionAt: dataVersionAt.toISOString(),
        latest: {
            fileName: LATEST_BACKUP_FILE_NAME,
            fileId: latestFile.id,
        },
        archivedVersion: {
            fileName: historyFileName,
            fileId: historyFile.id,
        },
        structure: {
            latest: `/${BACKUP_ROOT_FOLDER_NAME}/${LATEST_FOLDER_NAME}/${LATEST_BACKUP_FILE_NAME}`,
            history: `/${BACKUP_ROOT_FOLDER_NAME}/${HISTORY_FOLDER_NAME}/${exportedAt.getUTCFullYear()}/${getMonthFolderName(exportedAt)}/${historyFileName}`,
        },
    }
    const manifestBlob = new Blob([JSON.stringify(manifest, null, 2)], { type: 'application/json' })
    const manifestMetadata = {
        name: MANIFEST_FILE_NAME,
        mimeType: 'application/json',
        parents: [structure.rootFolderId],
    }
    const manifestFile = structure.manifestFileId
        ? await uploadMultipartFile(
            accessToken,
            'PATCH',
            `/files/${structure.manifestFileId}`,
            {
                name: MANIFEST_FILE_NAME,
                mimeType: 'application/json',
            },
            manifestBlob,
        )
        : await uploadMultipartFile(accessToken, 'POST', '/files', manifestMetadata, manifestBlob)

    return {
        exportedAt,
        dataVersionAt,
        latestFileId: latestFile.id,
        latestFileName: LATEST_BACKUP_FILE_NAME,
        historyFileId: historyFile.id,
        historyFileName,
        manifestFileId: manifestFile.id,
        rootFolderId: structure.rootFolderId,
        latestFolderId: structure.latestFolderId,
        historyFolderId: structure.historyFolderId,
        webViewLink: latestFile.webViewLink ?? historyFile.webViewLink,
    }
}

const parseBackupDate = (value: string | undefined): Date | null => {
    if (!value) {
        return null
    }

    const timestamp = new Date(value)
    return Number.isNaN(timestamp.getTime()) ? null : timestamp
}

const getRemoteManifestVersionAt = (manifest: GoogleDriveBackupManifest): Date | null => {
    return parseBackupDate(manifest.dataVersionAt) ?? parseBackupDate(manifest.generatedAt)
}

const getRemoteBackupManifest = async (
    accessToken: string,
): Promise<{ manifest: GoogleDriveBackupManifest, structure: GoogleDriveBackupStructure } | null> => {
    const structure = await ensureBaseBackupStructure(accessToken)

    if (!structure.manifestFileId) {
        return null
    }

    try {
        const manifest = await driveDownloadJson<GoogleDriveBackupManifest>(accessToken, structure.manifestFileId)

        return {
            manifest,
            structure,
        }
    } catch (error) {
        if (error instanceof GoogleDriveBackupError && error.status === 404) {
            return null
        }

        throw error
    }
}

const downloadLatestBackup = async (
    accessToken: string,
    manifest: GoogleDriveBackupManifest,
    structure: GoogleDriveBackupStructure,
): Promise<Blob> => {
    try {
        return await driveDownload(accessToken, manifest.latest.fileId)
    } catch (error) {
        if (!(error instanceof GoogleDriveBackupError) || error.status !== 404) {
            throw error
        }
    }

    const latestFile = structure.latestFileId
        ? { id: structure.latestFileId }
        : await findDriveFile(accessToken, LATEST_BACKUP_FILE_NAME, structure.latestFolderId, 'application/json')

    if (!latestFile) {
        throw new GoogleDriveBackupError('Google Drive latest backup file was not found')
    }

    return await driveDownload(accessToken, latestFile.id)
}

const ensureAppSettings = async (): Promise<AppSettings> => {
    const settings = await db.appSettings.limit(1).first()
    if (settings) {
        return settings
    }

    const now = new Date()
    const newSettings: AppSettings = {
        id: MAIN_SETTINGS_ID,
        openaiApiKey: '',
        createdAt: now,
        updatedAt: now,
    }

    await db.appSettings.add(newSettings)
    return newSettings
}

const mergeDriveSettings = (
    currentSettings: GoogleDriveBackupSettings | undefined,
    result: GoogleDriveBackupResult,
    forceEnable: boolean,
    lastSyncDirection: GoogleDriveBackupSettings['lastSyncDirection'] = 'uploaded',
): GoogleDriveBackupSettings => {
    return {
        ...currentSettings,
        enabled: forceEnable || currentSettings?.enabled !== false,
        autoSync: currentSettings?.autoSync ?? true,
        rootFolderId: result.rootFolderId,
        latestFolderId: result.latestFolderId,
        historyFolderId: result.historyFolderId,
        manifestFileId: result.manifestFileId,
        latestFileId: result.latestFileId,
        lastBackupAt: result.dataVersionAt,
        lastBackupFileId: result.historyFileId,
        lastBackupFileName: result.historyFileName,
        lastBackupWebViewLink: result.webViewLink,
        lastSyncDirection,
        lastError: undefined,
        connectedAt: currentSettings?.connectedAt ?? result.exportedAt,
    }
}

const mergeImportedDriveSettings = (
    currentSettings: GoogleDriveBackupSettings | undefined,
    manifest: GoogleDriveBackupManifest,
    structure: GoogleDriveBackupStructure,
    remoteVersionAt: Date,
): GoogleDriveBackupSettings => {
    return {
        ...currentSettings,
        enabled: currentSettings?.enabled ?? true,
        autoSync: currentSettings?.autoSync ?? true,
        rootFolderId: structure.rootFolderId,
        latestFolderId: structure.latestFolderId,
        historyFolderId: structure.historyFolderId,
        manifestFileId: structure.manifestFileId,
        latestFileId: manifest.latest.fileId,
        lastBackupAt: remoteVersionAt,
        lastBackupFileId: manifest.archivedVersion.fileId,
        lastBackupFileName: manifest.archivedVersion.fileName,
        lastSyncDirection: 'downloaded',
        lastError: undefined,
        connectedAt: currentSettings?.connectedAt ?? new Date(),
    }
}

export const getGoogleDriveBackupState = async (): Promise<GoogleDriveBackupState> => {
    const settings = await ensureAppSettings()

    return {
        settingsId: settings.id,
        driveSettings: settings.googleDriveBackup,
    }
}

export const backupDatabaseToGoogleDrive = async (
    options: BackupDatabaseToGoogleDriveOptions = {},
): Promise<GoogleDriveBackupResult> => {
    const exportedAt = new Date()
    const settings = await ensureAppSettings()
    const accessToken = await requestGoogleDriveAccessToken(options.prompt)
    const dataVersionAt = await getLatestUserDataUpdatedAt() ?? exportedAt
    const backupBlob = await createDatabaseBackupBlob(exportedAt)
    const result = await uploadBackupFiles(accessToken, backupBlob, exportedAt, dataVersionAt)

    await db.appSettings.update(settings.id, {
        googleDriveBackup: mergeDriveSettings(settings.googleDriveBackup, result, options.forceEnable ?? false),
        lastExportedAt: exportedAt,
        updatedAt: exportedAt,
    })

    return result
}

const markGoogleDriveSyncNoop = async (
    settings: AppSettings,
    structure: GoogleDriveBackupStructure | null,
    remoteVersionAt: Date | null,
    forceEnable: boolean,
) => {
    await db.appSettings.update(settings.id, {
        googleDriveBackup: {
            ...settings.googleDriveBackup,
            enabled: forceEnable || settings.googleDriveBackup?.enabled === true,
            autoSync: settings.googleDriveBackup?.autoSync ?? true,
            ...(structure
                ? {
                    rootFolderId: structure.rootFolderId,
                    latestFolderId: structure.latestFolderId,
                    historyFolderId: structure.historyFolderId,
                    manifestFileId: structure.manifestFileId,
                    latestFileId: structure.latestFileId,
                }
                : {}),
            ...(remoteVersionAt ? { lastBackupAt: remoteVersionAt } : {}),
            lastSyncDirection: 'none',
            lastError: undefined,
            connectedAt: settings.googleDriveBackup?.connectedAt ?? new Date(),
        },
        updatedAt: new Date(),
    })
}

export const syncDatabaseWithGoogleDrive = async (
    options: BackupDatabaseToGoogleDriveOptions = {},
): Promise<GoogleDriveSyncResult> => {
    const settings = await ensureAppSettings()
    const accessToken = await requestGoogleDriveAccessToken(options.prompt)
    const localVersionAt = await getLatestUserDataUpdatedAt()
    const remoteBackup = await getRemoteBackupManifest(accessToken)
    const remoteVersionAt = remoteBackup ? getRemoteManifestVersionAt(remoteBackup.manifest) : null
    const lastSyncedAt = settings.googleDriveBackup?.lastBackupAt ?? null
    const shouldDownload = remoteBackup && remoteVersionAt && (
        localVersionAt == null
            ? lastSyncedAt?.getTime() !== remoteVersionAt.getTime()
            : remoteVersionAt.getTime() > localVersionAt.getTime() &&
                remoteVersionAt.getTime() > (lastSyncedAt?.getTime() ?? 0)
    )

    if (shouldDownload) {
        const backupBlob = await downloadLatestBackup(accessToken, remoteBackup.manifest, remoteBackup.structure)
        const googleDriveBackup = mergeImportedDriveSettings(
            settings.googleDriveBackup,
            remoteBackup.manifest,
            remoteBackup.structure,
            remoteVersionAt,
        )

        await importDatabaseBackup(backupBlob, {
            successMessage: 'Newer Google Drive backup restored. Refreshing...',
            googleDriveBackup,
        })

        return {
            action: 'downloaded',
            localVersionAt,
            remoteVersionAt,
        }
    }

    if (
        localVersionAt &&
        (!remoteVersionAt || localVersionAt.getTime() > remoteVersionAt.getTime())
    ) {
        const backup = await backupDatabaseToGoogleDrive(options)

        return {
            action: 'uploaded',
            localVersionAt,
            remoteVersionAt,
            backup,
        }
    }

    await markGoogleDriveSyncNoop(
        settings,
        remoteBackup?.structure ?? null,
        remoteVersionAt,
        options.forceEnable ?? false,
    )

    return {
        action: 'none',
        localVersionAt,
        remoteVersionAt,
    }
}

export const setGoogleDriveAutoSync = async (autoSync: boolean) => {
    const settings = await ensureAppSettings()

    await db.appSettings.update(settings.id, {
        googleDriveBackup: {
            ...settings.googleDriveBackup,
            enabled: settings.googleDriveBackup?.enabled ?? autoSync,
            autoSync,
            lastError: undefined,
        },
        updatedAt: new Date(),
    })
}

export const disconnectGoogleDriveBackup = async () => {
    const settings = await ensureAppSettings()
    clearGoogleDriveAccessToken()

    await db.appSettings.update(settings.id, {
        googleDriveBackup: {
            ...settings.googleDriveBackup,
            enabled: false,
            autoSync: false,
            lastError: undefined,
        },
        updatedAt: new Date(),
    })
}

export const markGoogleDriveBackupError = async (error: unknown) => {
    const settings = await ensureAppSettings()
    const message = error instanceof Error ? error.message : 'Google Drive backup failed'

    await db.appSettings.update(settings.id, {
        googleDriveBackup: {
            ...settings.googleDriveBackup,
            enabled: settings.googleDriveBackup?.enabled ?? false,
            autoSync: settings.googleDriveBackup?.autoSync ?? false,
            lastError: message,
        },
        updatedAt: new Date(),
    })
}

export const getGoogleDriveBackupErrorMessage = (error: unknown): string => {
    if (error instanceof GoogleDriveBackupError) {
        return error.message
    }

    if (error instanceof Error) {
        return error.message
    }

    return 'Google Drive backup failed'
}

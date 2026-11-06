import { message } from 'antd'
import { exportDB } from 'dexie-export-import'

import { DB_NAME, MAIN_SETTINGS_ID } from '@/constants'
import { AppSettings } from '@/db/models/appSettings'
import { BiomarkerConfig } from '@/db/models/biomarkerConfig'
import { BiomarkerRecord } from '@/db/models/biomarkerRecord'
import { UploadedDocument } from '@/db/models/document'
// eslint-disable-next-line no-restricted-imports
import { BloodTestDatabase, db } from '@/db/services/db.service'
import { getLoadedProfile, getProfileFileTag } from '@/profiles/profiles.service'

const DOWNLOAD_URL_TTL_MS = 60_000

export interface DatabaseExportJson {
    formatName: string
    formatVersion: number
    data: {
        databaseName: string
        databaseVersion: number
        tables: unknown[]
        data: unknown[]
    }
}

export interface ExportDataParams {
    configs: BiomarkerConfig[]
    records: BiomarkerRecord[]
    documents: UploadedDocument[]
}

export const downloadBlob = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.setTimeout(() => { URL.revokeObjectURL(url) }, DOWNLOAD_URL_TTL_MS)
}

const exportToCSV = (data: ExportDataParams) => {
    const { configs, records, documents } = data

    const configsMap = new Map(configs.map(c => [c.id, c]))
    const documentsMap = new Map(documents.map(d => [d.id, d]))

    const csvRows = [
        ['Test Date', 'Name', 'Value', 'Unit', 'Normal Range Min', 'Normal Range Max', 'Target Range Min', 'Target Range Max'].join(','),
    ]

    records
        .filter(r => r.approved && (r.value !== undefined || r.textValue !== undefined))
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
        .forEach(record => {
            const config = configsMap.get(record.biomarkerId)
            const doc = record.documentId ? documentsMap.get(record.documentId) : null

            const testDate = doc?.testDate ? doc.testDate.toLocaleDateString() : record.createdAt.toLocaleDateString()
            const name = config?.name ?? record.originalName ?? 'Unknown'
            const value = record.textValue ?? record.value?.toString() ?? ''
            const unit = record.ucumCode ?? ''
            const normalRangeMin = config?.normalRange?.min?.toString() ?? ''
            const normalRangeMax = config?.normalRange?.max?.toString() ?? ''
            const targetRangeMin = config?.targetRange?.min?.toString() ?? ''
            const targetRangeMax = config?.targetRange?.max?.toString() ?? ''

            csvRows.push([testDate, name, value, unit, normalRangeMin, normalRangeMax, targetRangeMin, targetRangeMax].join(','))
        })

    const csvContent = csvRows.join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const date = new Date().toISOString().split('T')[0]
    downloadBlob(blob, `bloodboy_results${getProfileFileTag(getLoadedProfile())}_${date}.csv`)
}

const ensureAppSettingsForExport = async (exportedAt: Date) => {
    const settings = await db.appSettings.limit(1).first()

    if (settings) {
        return {
            settingsId: settings.id,
            isTemporary: false,
        }
    }

    await db.appSettings.add({
        id: MAIN_SETTINGS_ID,
        openaiApiKey: '',
        lastExportedAt: exportedAt,
        createdAt: exportedAt,
        updatedAt: exportedAt,
    })

    return {
        settingsId: MAIN_SETTINGS_ID,
        isTemporary: true,
    }
}

const sanitizeAppSettingsForBackup = (settings: Record<string, unknown>, exportedAt: Date): AppSettings => {
    const googleDriveBackup = settings.googleDriveBackup && typeof settings.googleDriveBackup === 'object'
        ? {
            ...settings.googleDriveBackup as Record<string, unknown>,
            enabled: false,
            lastError: undefined,
        }
        : undefined

    return {
        ...settings,
        openaiApiKey: '',
        lastExportedAt: exportedAt,
        googleDriveBackup,
    } as AppSettings
}

export const exportDatabaseJson = async (
    exportedAt: Date,
    database: BloodTestDatabase = db,
): Promise<DatabaseExportJson> => {
    const blob = await exportDB(database, {
        transform: (table: string, value: unknown) => {
            if (table === 'appSettings' && value && typeof value === 'object' && 'openaiApiKey' in value) {
                return {
                    value: sanitizeAppSettingsForBackup(value as Record<string, unknown>, exportedAt),
                }
            }
            return { value }
        },
    })
    const json = JSON.parse(await blob.text()) as DatabaseExportJson
    json.data.databaseName = DB_NAME

    return json
}

export const createDatabaseBackupBlob = async (
    exportedAt: Date,
    database: BloodTestDatabase = db,
): Promise<Blob> => {
    const json = await exportDatabaseJson(exportedAt, database)
    return new Blob([JSON.stringify(json)], { type: 'application/json' })
}

export const exportData = async (data: ExportDataParams) => {
    const exportedAt = new Date()
    const date = exportedAt.toISOString().split('T')[0]
    let exportSettings: Awaited<ReturnType<typeof ensureAppSettingsForExport>> | null = null

    try {
        exportSettings = await ensureAppSettingsForExport(exportedAt)

        const jsonBlob = await createDatabaseBackupBlob(exportedAt)
        downloadBlob(jsonBlob, `bloodboy_db_backup${getProfileFileTag(getLoadedProfile())}_${date}.json`)

        exportToCSV(data)

        if (!exportSettings.isTemporary) {
            await db.appSettings.update(exportSettings.settingsId, {
                lastExportedAt: exportedAt,
                updatedAt: exportedAt,
            })
        }

        void message.success('Data exported successfully: JSON backup and CSV file created')
    } catch (error) {
        if (exportSettings?.isTemporary) {
            await db.appSettings.delete(exportSettings.settingsId)
        }
        console.error('Export error:', error)
        void message.error('Failed to export data')
    }
}

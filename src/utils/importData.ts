import { message } from 'antd'
import { importDB } from 'dexie-export-import'

import { config } from '@/config'
import { MAIN_SETTINGS_ID } from '@/constants'
import { GoogleDriveBackupSettings } from '@/db/models/appSettings'
// eslint-disable-next-line no-restricted-imports
import { db, setIsImporting } from '@/db/services/db.service'

import { clearPreservedAiKeys, getAiKeysToPreserve, readPreservedAiKeys, savePreservedAiKeys } from './preservedAiKeys'

interface ImportDatabaseBackupOptions {
    reload?: boolean
    successMessage?: string
    googleDriveBackup?: GoogleDriveBackupSettings
}

export const importDatabaseBackup = async (
    file: Blob,
    options: ImportDatabaseBackupOptions = {},
) => {
    const {
        reload = true,
        successMessage = 'Data imported successfully. Refreshing...',
        googleDriveBackup,
    } = options

    setIsImporting(true)

    const currentSettings = await db.appSettings.toArray()
    const keysToPreserve = getAiKeysToPreserve(currentSettings[0])
    const googleDriveBackupToPreserve = googleDriveBackup ?? currentSettings[0]?.googleDriveBackup

    if (keysToPreserve) {
        savePreservedAiKeys(keysToPreserve)
    }

    try {
        await db.transaction('rw', db.tables, async () => {
            await Promise.all(db.tables.map(table => table.clear()))
        })

        await importDB(file)

        if (keysToPreserve != null || googleDriveBackupToPreserve != null) {
            const preservedKeys = readPreservedAiKeys()
            if (preservedKeys != null || googleDriveBackupToPreserve != null) {
                const importedSettings = await db.appSettings.toArray()
                if (importedSettings[0]) {
                    await db.appSettings.update(importedSettings[0].id, {
                        ...(preservedKeys ?? {}),
                        ...(googleDriveBackupToPreserve ? { googleDriveBackup: googleDriveBackupToPreserve } : {}),
                        updatedAt: new Date(),
                    })
                } else {
                    await db.appSettings.add({
                        id: MAIN_SETTINGS_ID,
                        openaiApiKey: '',
                        ...(preservedKeys ?? {}),
                        ...(googleDriveBackupToPreserve ? { googleDriveBackup: googleDriveBackupToPreserve } : {}),
                        createdAt: new Date(),
                        updatedAt: new Date(),
                    })
                }
            }
            clearPreservedAiKeys()
        }

        void message.success(successMessage)
    } catch (error) {
        setIsImporting(false)
        clearPreservedAiKeys()
        throw error
    }

    if (reload) {
        setTimeout(() => {
            setIsImporting(false)
            const baseUrl = config.baseUrl || '/'
            const dataUrl = `${window.location.origin}${baseUrl}data`
            window.location.replace(dataUrl)
        }, 1000)
        return
    }

    setIsImporting(false)
}

export const importData = async (file: File) => {
    try {
        await importDatabaseBackup(file)
    } catch (error) {
        console.error('Import error:', error)
        setIsImporting(false)
        void message.error('Failed to import data. Make sure you selected a valid JSON backup file.')
        clearPreservedAiKeys()
    }
}

import { message } from 'antd'
import { importDB } from 'dexie-export-import'

import { config } from '@/config'
import { MAIN_SETTINGS_ID, PRESERVED_OPENAI_TOKEN_KEY } from '@/constants'
import { GoogleDriveBackupSettings } from '@/db/models/appSettings'
// eslint-disable-next-line no-restricted-imports
import { db, setIsImporting } from '@/db/services/db.service'

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
    const tokenToPreserve = currentSettings[0]?.openaiApiKey || null
    const googleDriveBackupToPreserve = googleDriveBackup ?? currentSettings[0]?.googleDriveBackup

    if (tokenToPreserve) {
        sessionStorage.setItem(PRESERVED_OPENAI_TOKEN_KEY, tokenToPreserve)
    }

    try {
        await db.transaction('rw', db.tables, async () => {
            await Promise.all(db.tables.map(table => table.clear()))
        })

        await importDB(file)

        if (tokenToPreserve != null || googleDriveBackupToPreserve != null) {
            const preservedToken = sessionStorage.getItem(PRESERVED_OPENAI_TOKEN_KEY)
            if (preservedToken != null || googleDriveBackupToPreserve != null) {
                const importedSettings = await db.appSettings.toArray()
                if (importedSettings[0]) {
                    await db.appSettings.update(importedSettings[0].id, {
                        ...(preservedToken ? { openaiApiKey: preservedToken } : {}),
                        ...(googleDriveBackupToPreserve ? { googleDriveBackup: googleDriveBackupToPreserve } : {}),
                        updatedAt: new Date(),
                    })
                } else {
                    await db.appSettings.add({
                        id: MAIN_SETTINGS_ID,
                        openaiApiKey: preservedToken ?? '',
                        ...(googleDriveBackupToPreserve ? { googleDriveBackup: googleDriveBackupToPreserve } : {}),
                        createdAt: new Date(),
                        updatedAt: new Date(),
                    })
                }
            }
            sessionStorage.removeItem(PRESERVED_OPENAI_TOKEN_KEY)
        }

        void message.success(successMessage)
    } catch (error) {
        setIsImporting(false)
        sessionStorage.removeItem(PRESERVED_OPENAI_TOKEN_KEY)
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
        const preservedToken = sessionStorage.getItem(PRESERVED_OPENAI_TOKEN_KEY)
        if (preservedToken) {
            sessionStorage.removeItem(PRESERVED_OPENAI_TOKEN_KEY)
        }
    }
}

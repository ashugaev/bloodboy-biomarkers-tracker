import { message } from 'antd'
import { importDB } from 'dexie-export-import'

import { config } from '@/config'
import { MAIN_SETTINGS_ID, PRESERVED_OPENAI_TOKEN_KEY } from '@/constants'
// eslint-disable-next-line no-restricted-imports
import { db, setIsImporting } from '@/db/services/db.service'

export const importData = async (file: File) => {
    try {
        setIsImporting(true)

        const currentSettings = await db.appSettings.toArray()
        const tokenToPreserve = currentSettings[0]?.openaiApiKey || null

        if (tokenToPreserve) {
            sessionStorage.setItem(PRESERVED_OPENAI_TOKEN_KEY, tokenToPreserve)
        }

        await db.transaction('rw', db.tables, async () => {
            await Promise.all(db.tables.map(table => table.clear()))
        })

        await importDB(file)

        if (tokenToPreserve) {
            const preservedToken = sessionStorage.getItem(PRESERVED_OPENAI_TOKEN_KEY)
            if (preservedToken) {
                const importedSettings = await db.appSettings.toArray()
                if (importedSettings[0]) {
                    await db.appSettings.update(importedSettings[0].id, {
                        openaiApiKey: preservedToken,
                        updatedAt: new Date(),
                    })
                } else {
                    await db.appSettings.add({
                        id: MAIN_SETTINGS_ID,
                        openaiApiKey: preservedToken,
                        createdAt: new Date(),
                        updatedAt: new Date(),
                    })
                }
                sessionStorage.removeItem(PRESERVED_OPENAI_TOKEN_KEY)
            }
        }

        void message.success('Data imported successfully. Refreshing...')
        setTimeout(() => {
            setIsImporting(false)
            const baseUrl = config.baseUrl || '/'
            const dataUrl = `${window.location.origin}${baseUrl}data`
            window.location.replace(dataUrl)
        }, 1000)
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

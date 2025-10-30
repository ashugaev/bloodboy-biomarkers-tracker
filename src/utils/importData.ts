import { message } from 'antd'
import { importDB } from 'dexie-export-import'

// eslint-disable-next-line no-restricted-imports
import { db } from '@/db/services/db.service'

export const importData = async (file: File) => {
    try {
        await db.transaction('rw', db.tables, async () => {
            await Promise.all(db.tables.map(table => table.clear()))
        })

        await importDB(file)
        void message.success('Data imported successfully. Refreshing...')
        setTimeout(() => {
            window.location.reload()
        }, 1000)
    } catch (error) {
        console.error('Import error:', error)
        void message.error('Failed to import data. Make sure you selected a valid JSON backup file.')
    }
}

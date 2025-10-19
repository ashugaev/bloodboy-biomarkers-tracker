import { db } from '../services'

export const clearAllData = async (): Promise<void> => {
    await db.transaction('rw', [
        db.biomarkerConfigs,
        db.biomarkerRecords,
        db.uploadedFiles,
    ], async () => {
        await db.biomarkerConfigs.clear()
        await db.biomarkerRecords.clear()
        await db.uploadedFiles.clear()
    })
}

export const exportData = async (): Promise<{
    biomarkerConfigs: unknown[]
    biomarkerRecords: unknown[]
    uploadedFiles: unknown[]
}> => {
    return {
        biomarkerConfigs: await db.biomarkerConfigs.toArray(),
        biomarkerRecords: await db.biomarkerRecords.toArray(),
        uploadedFiles: await db.uploadedFiles.toArray(),
    }
}

export const importData = async (data: {
    biomarkerConfigs?: unknown[]
    biomarkerRecords?: unknown[]
    uploadedFiles?: unknown[]
}): Promise<void> => {
    await db.transaction('rw', [
        db.biomarkerConfigs,
        db.biomarkerRecords,
        db.uploadedFiles,
    ], async () => {
        if (data.biomarkerConfigs) {
            await db.biomarkerConfigs.bulkAdd(data.biomarkerConfigs as never)
        }
        if (data.biomarkerRecords) {
            await db.biomarkerRecords.bulkAdd(data.biomarkerRecords as never)
        }
        if (data.uploadedFiles) {
            await db.uploadedFiles.bulkAdd(data.uploadedFiles as never)
        }
    })
}

export const getDatabaseStats = async () => {
    const [configsCount, recordsCount, uploadedFilesCount] = await Promise.all([
        db.biomarkerConfigs.count(),
        db.biomarkerRecords.count(),
        db.uploadedFiles.count(),
    ])

    return {
        biomarkerConfigs: configsCount,
        biomarkerRecords: recordsCount,
        uploadedFiles: uploadedFilesCount,
        total: configsCount + recordsCount + uploadedFilesCount,
    }
}

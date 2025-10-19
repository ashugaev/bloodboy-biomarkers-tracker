import { useLiveQuery } from 'dexie-react-hooks'

import { db } from '../services/db.service'
import { BiomarkerRecord } from '../types'

export const useBiomarkerRecords = (biomarkerId?: string) => {
    const records = useLiveQuery(
        async () => {
            if (!biomarkerId) {
                return await db.biomarkerRecords.toArray()
            }
            return await db.biomarkerRecords
                .where('biomarkerId')
                .equals(biomarkerId)
                .reverse()
                .sortBy('testDate')
        },
        [biomarkerId],
    )

    return {
        records: records ?? [],
        loading: records === undefined,
    }
}

export const useDocumentRecords = (documentId?: string) => {
    const records = useLiveQuery(
        async () => {
            if (!documentId) return []
            return await db.biomarkerRecords
                .where('documentId')
                .equals(documentId)
                .toArray()
        },
        [documentId],
    )

    return {
        records: records ?? [],
        loading: records === undefined,
    }
}

export const useRecentRecords = (limit: number = 10) => {
    const records = useLiveQuery(
        async () => {
            return await db.biomarkerRecords
                .orderBy('testDate')
                .reverse()
                .limit(limit)
                .toArray()
        },
        [limit],
    )

    return {
        records: records ?? [],
        loading: records === undefined,
    }
}

export const addBiomarkerRecord = async (record: BiomarkerRecord): Promise<string> => {
    return await db.biomarkerRecords.add(record)
}

export const updateBiomarkerRecord = async (id: string, updates: Partial<BiomarkerRecord>): Promise<void> => {
    await db.biomarkerRecords.update(id, {
        ...updates,
        updatedAt: new Date(),
    })
}

export const deleteBiomarkerRecord = async (id: string): Promise<void> => {
    await db.biomarkerRecords.delete(id)
}

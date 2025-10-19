import { useCallback, useState } from 'react'

import { EntityTable } from 'dexie'
import { useLiveQuery } from 'dexie-react-hooks'

import { DBStore } from '../constants/stores'
import { db } from '../services/db.service'
import { StoreTypeMap, UseDbResult } from '../types/store.types'

type AnyTable = EntityTable<StoreTypeMap[DBStore.BIOMARKER_CONFIGS], 'id'> | EntityTable<StoreTypeMap[DBStore.BIOMARKER_RECORDS], 'id'> | EntityTable<StoreTypeMap[DBStore.UPLOADED_FILES], 'id'> | EntityTable<StoreTypeMap[DBStore.APP_SETTINGS], 'id'>

const getTable = (storeName: DBStore): AnyTable => {
    switch (storeName) {
        case DBStore.BIOMARKER_CONFIGS:
            return db.biomarkerConfigs
        case DBStore.BIOMARKER_RECORDS:
            return db.biomarkerRecords
        case DBStore.UPLOADED_FILES:
            return db.uploadedFiles
        case DBStore.APP_SETTINGS:
            return db.appSettings
        default:
            throw new Error(`Unknown store: ${storeName}`)
    }
}

export const useDb = <S extends DBStore>(
    storeName: S,
): UseDbResult<StoreTypeMap[S]> => {
    const [error, setError] = useState<Error | null>(null)

    const data = useLiveQuery(
        async () => {
            try {
                setError(null)
                const table = getTable(storeName)
                return await table.toArray()
            } catch (err) {
                setError(err as Error)
                return []
            }
        },
        [storeName],
    ) ?? []

    const refresh = useCallback(async () => {
        // Dexie with useLiveQuery auto-refreshes, but we keep this for API compatibility
    }, [])

    const add = useCallback(async (item: StoreTypeMap[S]) => {
        try {
            const table = getTable(storeName)
            await table.add(item as never)
            setError(null)
        } catch (err) {
            setError(err as Error)
            throw err
        }
    }, [storeName])

    const update = useCallback(async (_id: string, item: StoreTypeMap[S]) => {
        try {
            const table = getTable(storeName)
            await table.put(item as never)
            setError(null)
        } catch (err) {
            setError(err as Error)
            throw err
        }
    }, [storeName])

    const remove = useCallback(async (id: string) => {
        try {
            const table = getTable(storeName)
            await table.delete(id)
            setError(null)
        } catch (err) {
            setError(err as Error)
            throw err
        }
    }, [storeName])

    return {
        data: (data ?? []) as Array<StoreTypeMap[S]>,
        loading: data === undefined,
        error,
        refresh,
        add,
        update,
        remove,
    }
}

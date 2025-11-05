import { useMemo } from 'react'

import { EntityTable, IDType, UpdateSpec, InsertType, IndexableType } from 'dexie'
import { useLiveQuery } from 'dexie-react-hooks'

import { createBaseEntity } from '@/db/utils/entity.utils'

interface ModelHooksConfig<T> {
    defaultSort?: (a: T, b: T) => number
}

interface UseItemsOptions<T> {
    filter?: (item: T) => boolean
    sort?: (a: T, b: T) => number
}

type IDParam<T, K extends keyof T & string> = IDType<T, K>

export function createModelHooks<T extends object, K extends keyof T & string> (
    table: EntityTable<T, K>,
    config?: ModelHooksConfig<T>,
) {
    return {
        useItems: (options?: UseItemsOptions<T>) => {
            const rawData = useLiveQuery(async () => await table.toArray(), [])

            const data = useMemo(() => {
                if (!rawData) return []
                let items = rawData
                if (options?.filter) {
                    items = items.filter(Boolean).filter(options.filter)
                }
                const sortFn = options?.sort ?? config?.defaultSort
                return sortFn ? items.sort(sortFn) : items
            }, [rawData, options?.filter, options?.sort])

            return {
                data,
                loading: rawData === undefined,
            }
        },

        useItem: (id?: IDParam<T, K>) => {
            const data = useLiveQuery(
                async () => id ? await table.get(id) ?? null : null,
                [id],
            )
            return {
                data: data ?? null,
                loading: data === undefined,
            }
        },

        createItems: async (partials: Array<Partial<T>>): Promise<T[]> => {
            const baseEntities = await Promise.all(
                partials.map(() => createBaseEntity()),
            )
            const items = partials.map((partial, index) => ({
                ...baseEntities[index],
                ...partial,
            } as T))
            await table.bulkAdd(items as Array<InsertType<T, K>>)
            return items
        },

        addItem: async (item: Partial<T>): Promise<IDParam<T, K>> => {
            const itemWithBase = {
                ...await createBaseEntity(),
                ...item,
            } as InsertType<T, K>
            return await table.add(itemWithBase)
        },

        updateItem: async (id: IDParam<T, K>, updates: UpdateSpec<InsertType<T, K>>): Promise<void> => {
            await table.update(id, {
                ...updates,
                updatedAt: new Date(),
            })
        },

        removeItem: async (id: IDParam<T, K>): Promise<void> => {
            await table.delete(id)
        },

        modifyItem: async (
            id: IDParam<T, K>,
            callback: (item: T) => void,
        ): Promise<number> => {
            return await table
                .where(table.schema.primKey.keyPath as K)
                .equals(id as never)
                .modify((item) => {
                    callback(item)
                    if ('updatedAt' in item) {
                        (item as T & { updatedAt: Date }).updatedAt = new Date()
                    }
                })
        },

        bulkUpdate: async (items: T[]): Promise<void> => {
            if (items.length === 0) return

            const primKey = table.schema.primKey.keyPath as K
            const ids = items.map(item => (item as T & Record<K, IDParam<T, K>>)[primKey])
            const now = new Date()

            await table
                .where(primKey)
                .anyOf(ids as IndexableType[])
                .modify((item) => {
                    const itemId = (item as T & Record<K, IDParam<T, K>>)[primKey]
                    const updateItem = items.find(i => (i as T & Record<K, IDParam<T, K>>)[primKey] === itemId)
                    if (updateItem) {
                        Object.assign(item, updateItem)
                        if ('updatedAt' in item) {
                            (item as T & { updatedAt: Date }).updatedAt = now
                        }
                    }
                })
        },

        bulkDelete: async (ids: Array<IDParam<T, K>>): Promise<void> => {
            if (ids.length > 0) {
                await table.bulkDelete(ids)
            }
        },
    }
}

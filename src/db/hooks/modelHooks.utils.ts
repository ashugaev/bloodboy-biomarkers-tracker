import { EntityTable, IDType, UpdateSpec, InsertType } from 'dexie'
import { useLiveQuery } from 'dexie-react-hooks'

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
            const data = useLiveQuery(async () => {
                let items = await table.toArray()
                if (options?.filter) {
                    items = items.filter(options.filter)
                }
                const sortFn = options?.sort ?? config?.defaultSort
                return sortFn ? items.sort(sortFn) : items
            }, [options?.filter, options?.sort])
            return {
                data: data ?? [],
                loading: data === undefined,
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

        addItem: async (item: InsertType<T, K>): Promise<IDParam<T, K>> => {
            return await table.add(item)
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
                .equals(id)
                .modify((item) => {
                    callback(item)
                    if ('updatedAt' in item) {
                        (item as T & { updatedAt: Date }).updatedAt = new Date()
                    }
                })
        },
    }
}

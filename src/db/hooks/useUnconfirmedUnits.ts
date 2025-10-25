import { useLiveQuery } from 'dexie-react-hooks'

import { db } from '../services/db.service'

export const useUnconfirmedUnits = () => {
    const unconfirmedUnits = useLiveQuery(async () => {
        return await db.units.where('approved').equals(false).toArray()
    }, [])

    return {
        unconfirmedUnits: unconfirmedUnits ?? [],
        loading: unconfirmedUnits === undefined,
    }
}

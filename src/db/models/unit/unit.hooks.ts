import { createModelHooks } from '@/db/hooks/modelHooks.utils'
import { db } from '@/db/services/db.service'

export const {
    useItems: useUnits,
    useItem: useUnit,
    createItems: createUnits,
    addItem: addUnit,
    updateItem: updateUnit,
    removeItem: deleteUnit,
} = createModelHooks(db.units)

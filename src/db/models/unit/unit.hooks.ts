import { createModelHooks } from '@/db/hooks/modelHooks.utils'
// eslint-disable-next-line no-restricted-imports
import { db } from '@/db/services/db.service'

export const {
    useItems: useUnits,
    useItem: useUnit,
    createItems: createUnits,
    addItem: addUnit,
    updateItem: updateUnit,
    removeItem: deleteUnit,
} = createModelHooks(db.units)

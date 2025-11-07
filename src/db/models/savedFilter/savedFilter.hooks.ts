import { createModelHooks } from '@/db/hooks/modelHooks.utils'
// eslint-disable-next-line no-restricted-imports
import { db } from '@/db/services/db.service'

export const {
    useItems: useSavedFilters,
    useItem: useSavedFilter,
    addItem: addSavedFilter,
    updateItem: updateSavedFilter,
    removeItem: deleteSavedFilter,
    modifyItem: modifySavedFilter,
} = createModelHooks(db.savedFilters, {
    defaultSort: (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
})

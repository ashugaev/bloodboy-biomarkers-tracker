import { createModelHooks } from '@/db/hooks/modelHooks.utils'
import { db } from '@/db/services/db.service'

export const {
    useItems: useBlockedMerges,
    useItem: useBlockedMerge,
    addItem: addBlockedMerge,
    updateItem: updateBlockedMerge,
    removeItem: deleteBlockedMerge,
    modifyItem: modifyBlockedMerge,
} = createModelHooks(db.blockedMerges)


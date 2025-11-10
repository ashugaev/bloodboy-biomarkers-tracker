import { createModelHooks } from '@/db/hooks/modelHooks.utils'
// eslint-disable-next-line no-restricted-imports
import { db } from '@/db/services/db.service'

export const {
    useItems: useVerifiedConversions,
    useItem: useVerifiedConversion,
    addItem: addVerifiedConversion,
    updateItem: updateVerifiedConversion,
    removeItem: deleteVerifiedConversion,
    modifyItem: modifyVerifiedConversion,
} = createModelHooks(db.verifiedConversions, {
    defaultSort: (a, b) => a.createdAt.getTime() - b.createdAt.getTime(),
})

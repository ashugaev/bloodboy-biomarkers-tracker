import { createModelHooks } from '@/db/hooks/modelHooks.utils'
// eslint-disable-next-line no-restricted-imports
import { db } from '@/db/services/db.service'

export const {
    useItems: useBiomarkerConfigs,
    useItem: useBiomarkerConfig,
    createItems: createBiomarkerConfigs,
    addItem: addBiomarkerConfig,
    updateItem: updateBiomarkerConfig,
    removeItem: deleteBiomarkerConfig,
    bulkUpdate: bulkUpdateBiomarkerConfigs,
    bulkDelete: bulkDeleteBiomarkerConfigs,
} = createModelHooks(db.biomarkerConfigs, {
    defaultSort: (a, b) => (a.order ?? Infinity) - (b.order ?? Infinity),
})

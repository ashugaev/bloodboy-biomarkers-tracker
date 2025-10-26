import { createModelHooks } from '@/db/hooks/modelHooks.utils'
import { db } from '@/db/services/db.service'

export const {
    useItems: useBiomarkerConfigs,
    useItem: useBiomarkerConfig,
    addItem: addBiomarkerConfig,
    updateItem: updateBiomarkerConfig,
    removeItem: deleteBiomarkerConfig,
} = createModelHooks(db.biomarkerConfigs, {
    defaultSort: (a, b) => (a.order ?? Infinity) - (b.order ?? Infinity),
})

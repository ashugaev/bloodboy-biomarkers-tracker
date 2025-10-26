import { createModelHooks } from '@/db/hooks/modelHooks.utils'
import { db } from '@/db/services/db.service'

export const {
    useItems: useBiomarkerRecords,
    useItem: useBiomarkerRecord,
    addItem: addBiomarkerRecord,
    updateItem: updateBiomarkerRecord,
    removeItem: deleteBiomarkerRecord,
    modifyItem: modifyBiomarkerRecord,
} = createModelHooks(db.biomarkerRecords, {
    defaultSort: (a, b) => (a.order ?? Infinity) - (b.order ?? Infinity),
})

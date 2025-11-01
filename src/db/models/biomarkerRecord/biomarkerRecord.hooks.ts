import { createModelHooks } from '@/db/hooks/modelHooks.utils'
import { compareBiomarkerRecords } from '@/db/models/biomarkerRecord/biomarkerRecord.utils'
// eslint-disable-next-line no-restricted-imports
import { db } from '@/db/services/db.service'

export const {
    useItems: useBiomarkerRecords,
    useItem: useBiomarkerRecord,
    createItems: createBiomarkerRecords,
    addItem: addBiomarkerRecord,
    updateItem: updateBiomarkerRecord,
    removeItem: deleteBiomarkerRecord,
    modifyItem: modifyBiomarkerRecord,
    bulkUpdate: bulkUpdateBiomarkerRecords,
} = createModelHooks(db.biomarkerRecords, {
    defaultSort: compareBiomarkerRecords,
})

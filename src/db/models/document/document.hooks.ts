import { createModelHooks } from '@/db/hooks/modelHooks.utils'
// eslint-disable-next-line no-restricted-imports
import { db } from '@/db/services/db.service'

export const {
    useItems: useDocuments,
    useItem: useDocument,
    addItem: addDocument,
    updateItem: updateDocument,
    removeItem: deleteDocument,
} = createModelHooks(db.uploadedFiles, {
    defaultSort: (a, b) => b.uploadDate.getTime() - a.uploadDate.getTime(),
})

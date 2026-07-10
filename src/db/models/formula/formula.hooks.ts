import { createModelHooks } from '@/db/hooks/modelHooks.utils'
// eslint-disable-next-line no-restricted-imports
import { db } from '@/db/services/db.service'

export const {
    useItems: useFormulas,
    useItem: useFormula,
    createItems: createFormulas,
    addItem: addFormula,
    updateItem: updateFormula,
    removeItem: deleteFormula,
} = createModelHooks(db.formulas, {
    defaultSort: (a, b) => {
        const orderDiff = (a.order ?? Infinity) - (b.order ?? Infinity)
        if (orderDiff !== 0) return orderDiff
        return a.createdAt.getTime() - b.createdAt.getTime()
    },
})

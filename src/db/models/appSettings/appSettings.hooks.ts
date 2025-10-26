import { createModelHooks } from '@/db/hooks/modelHooks.utils'
// eslint-disable-next-line no-restricted-imports
import { db } from '@/db/services/db.service'

export const {
    useItems: useAppSettings,
    useItem: useAppSettingsById,
    addItem: addAppSettings,
    updateItem: updateAppSettings,
    removeItem: deleteAppSettings,
} = createModelHooks(db.appSettings)

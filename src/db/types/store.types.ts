import { DBStore } from '../constants/stores'

import { BiomarkerConfig, BiomarkerRecord } from './biomarker.types'
import { UploadedDocument } from './document.types'
import { AppSettings } from './settings.types'

export interface StoreTypeMap {
    [DBStore.BIOMARKER_CONFIGS]: BiomarkerConfig
    [DBStore.BIOMARKER_RECORDS]: BiomarkerRecord
    [DBStore.UPLOADED_FILES]: UploadedDocument
    [DBStore.APP_SETTINGS]: AppSettings
}

export interface UseDbResult<T> {
    data: T[]
    loading: boolean
    error: Error | null
    refresh: () => Promise<void>
    add: (item: T) => Promise<void>
    update: (id: string, item: T) => Promise<void>
    remove: (id: string) => Promise<void>
}

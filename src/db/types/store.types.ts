import { DBStore } from '@/db/constants/stores.constants'
import { AppSettings } from '@/db/models/appSettings'
import { BiomarkerConfig } from '@/db/models/biomarkerConfig'
import { BiomarkerRecord } from '@/db/models/biomarkerRecord'
import { UploadedDocument } from '@/db/models/document'

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

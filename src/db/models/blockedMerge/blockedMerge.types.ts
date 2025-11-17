import { BaseEntity } from '@/db/types/base.types'

export interface BlockedMerge extends BaseEntity {
    biomarkerName: string
    sourceUnits: string[]
    targetUnits: string[]
}


import { BaseEntity } from '@/db/types/base.types'
import { Range } from '@/db/types/range.types'

export interface BiomarkerConfig extends BaseEntity {
    name: string
    originalName?: string
    description?: string
    normalRange?: Range
    targetRange?: Range
    ucumCode?: string
    approved: boolean
    order?: number
    isDefault?: boolean
}

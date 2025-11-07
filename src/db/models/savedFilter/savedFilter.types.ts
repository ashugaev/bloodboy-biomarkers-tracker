import { RangeType } from '@/components/BiomarkersDataTableFilters'
import { BaseEntity } from '@/db/types/base.types'

export type TagColor = 'magenta' | 'red' | 'volcano' | 'orange' | 'gold' | 'lime' | 'green' | 'cyan' | 'blue' | 'geekblue' | 'purple'

export interface SavedFilter extends BaseEntity {
    name: string
    color: TagColor
    documentId?: string[]
    biomarkerIds?: string[]
    outOfRange?: RangeType
}

import { Range } from '@/db/types'

export interface NewBiomarkerRow {
    id?: string
    name: string
    originalName?: string
    ucumCode?: string
    normalRange?: Range
    targetRange?: Range
}

export interface NewBiomarkersTableProps {
    biomarkers: NewBiomarkerRow[]
    onSave: (biomarkers: NewBiomarkerRow[]) => void
    onCancel: () => void
    className?: string
}

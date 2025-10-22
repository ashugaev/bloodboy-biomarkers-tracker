import { Unit, Range } from '@/db/types'

export interface NewBiomarkerRow {
    name: string
    defaultUnit?: Unit
    normalRange?: Range
    targetRange?: Range
}

export interface NewBiomarkersTableProps {
    biomarkers: NewBiomarkerRow[]
    onSave: (biomarkers: NewBiomarkerRow[]) => void
    onCancel: () => void
    className?: string
}

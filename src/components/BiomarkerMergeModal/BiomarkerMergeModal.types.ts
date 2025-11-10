import { MergePreview } from '@/components/BiomarkersDataTable/BiomarkersDataTable.merger.types'
import { BiomarkerConfig } from '@/db/models/biomarkerConfig'
import { BiomarkerRecord } from '@/db/models/biomarkerRecord'

export interface BiomarkerMergeModalProps {
    open: boolean
    mergeableBiomarkers: Array<{
        name: string
        configs: BiomarkerConfig[]
        recordsCount: number
    }>
    records: BiomarkerRecord[]
    onCancel: () => void
}

export interface MergePreviewProps {
    preview: MergePreview
    onBack: () => void
    onMerge: () => void
    onTargetUnitChange: (unit: string) => void
    onConfigToggle: (configId: string, selected: boolean) => void
    merging: boolean
}

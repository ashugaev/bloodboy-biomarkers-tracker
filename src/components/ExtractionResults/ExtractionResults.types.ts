import { BiomarkerConfig } from '@/db/types'
import { ExtractedBiomarker } from '@/openai'

export interface ExtractionResultsProps {
    biomarkers: ExtractedBiomarker[]
    configs: BiomarkerConfig[]
    onSave: (biomarkers: ExtractedBiomarker[]) => void
    onCancel: () => void
    onAddNew?: () => void
    className?: string
}

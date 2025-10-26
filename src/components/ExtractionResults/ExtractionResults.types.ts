import { BiomarkerConfig } from '@/db/models/biomarkerConfig'
import { ExtractedBiomarker } from '@/openai'

export interface ExtractionResultsProps {
    biomarkers: ExtractedBiomarker[]
    configs: BiomarkerConfig[]
    onSave: (biomarkers: ExtractedBiomarker[]) => void
    onCancel: () => void
    onAddNew?: () => void
    className?: string
}

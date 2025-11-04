import { ExtractedBiomarker } from '@/openai'

export interface ExtractionResultsProps {
    biomarkers: ExtractedBiomarker[]
    onSave: (biomarkers: ExtractedBiomarker[]) => void
    onCancel: () => void
    onAddNew?: () => void
    className?: string
}

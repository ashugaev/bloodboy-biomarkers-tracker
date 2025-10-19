import { ExtractedBiomarker } from '@/openai'

export interface ExtractionResultsProps {
    biomarkers: ExtractedBiomarker[]
    onSave: (biomarkers: ExtractedBiomarker[]) => void
    onCancel: () => void
    onRetry: () => void
    className?: string
}

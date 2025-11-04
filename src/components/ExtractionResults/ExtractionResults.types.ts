import { ExtractedBiomarker } from '@/openai'

export interface ExtractedBiomarkerWithApproval extends ExtractedBiomarker {
    approved?: boolean
}

export interface ExtractionResultsProps {
    biomarkers: ExtractedBiomarkerWithApproval[]
    onSave: (biomarkers: ExtractedBiomarkerWithApproval[]) => void
    onCancel: () => void
    onAddNew?: () => void
    className?: string
}

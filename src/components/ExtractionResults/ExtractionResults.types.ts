import { ExtractedBiomarker } from '@/openai'

export interface ExtractedBiomarkerWithApproval extends ExtractedBiomarker {
    approved?: boolean
}

export interface ExtractionResultsProps {
    biomarkers: ExtractedBiomarkerWithApproval[]
    documentId?: string
    onSave?: (biomarkers: ExtractedBiomarkerWithApproval[]) => void
    onCancel: () => void
    onAddNew?: (page: number) => void
    onPageChange?: (page: number) => void
    className?: string
}

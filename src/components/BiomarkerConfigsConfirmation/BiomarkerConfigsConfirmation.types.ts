import { BiomarkerConfig } from '@/db/models/biomarkerConfig'

export interface BiomarkerConfigsConfirmationProps {
    configs: BiomarkerConfig[]
    className?: string
}

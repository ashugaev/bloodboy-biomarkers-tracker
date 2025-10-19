import { BiomarkerType, Unit } from '@/db/types'

export interface UnitSelectorProps {
    biomarkerType: BiomarkerType
    currentUnit: Unit
    value?: number
    onChange?: (unit: Unit, convertedValue?: number) => void
    className?: string
}

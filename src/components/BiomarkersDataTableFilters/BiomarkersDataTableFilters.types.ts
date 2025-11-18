export enum RangeType {
    NORMAL = 'normal',
    TARGET = 'target',
}

export interface BiomarkersDataTableFiltersProps {
    documentId?: string[]
    biomarkerIds?: string[]
    outOfRange?: RangeType
    outOfRangeHistory?: RangeType
    hasAnomaly?: number
    onDocumentChange?: (documentId: string[] | undefined) => void
    onBiomarkerChange?: (biomarkerIds: string[] | undefined) => void
    onOutOfRangeChange?: (outOfRange: RangeType | undefined) => void
    onOutOfRangeHistoryChange?: (outOfRangeHistory: RangeType | undefined) => void
    onHasAnomalyChange?: (hasAnomaly: number | undefined) => void
}

export enum RangeType {
    NORMAL = 'normal',
    TARGET = 'target',
}

export interface BiomarkersDataTableFiltersProps {
    documentId?: string
    outOfRange?: RangeType
    onDocumentChange?: (documentId: string | undefined) => void
    onOutOfRangeChange?: (outOfRange: RangeType | undefined) => void
}

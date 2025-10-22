export interface DocumentMetadataFormData {
    fileName: string
    fileSize: number
    lab?: string
    testDate?: string
    notes?: string
}

export interface DocumentMetadataFormProps {
    initialData: DocumentMetadataFormData
    onSave: (data: DocumentMetadataFormData) => void
    onCancel: () => void
    className?: string
}

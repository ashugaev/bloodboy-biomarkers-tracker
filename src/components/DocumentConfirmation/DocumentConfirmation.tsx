import { updateDocument, deleteDocument } from '@/db/hooks/useDocuments'

import { DocumentMetadataForm, DocumentMetadataFormData } from '../DocumentMetadataForm'

import { DocumentConfirmationProps } from './DocumentConfirmation.types'

export const DocumentConfirmation = (props: DocumentConfirmationProps) => {
    const { document, className } = props

    const handleSave = async (data: DocumentMetadataFormData) => {
        await updateDocument(document.id, {
            approved: true,
            lab: data.lab,
            testDate: data.testDate ? new Date(data.testDate) : undefined,
            notes: data.notes,
        })
    }

    const handleCancel = async () => {
        await deleteDocument(document.id)
    }

    const initialData: DocumentMetadataFormData = {
        fileName: document.fileName,
        fileSize: document.fileSize,
        lab: document.lab ?? '',
        testDate: document.testDate?.toISOString().split('T')[0],
        notes: document.notes ?? '',
    }

    return (
        <DocumentMetadataForm
            initialData={initialData}
            onSave={(data) => { void handleSave(data) }}
            onCancel={() => { void handleCancel() }}
            className={className}
        />
    )
}

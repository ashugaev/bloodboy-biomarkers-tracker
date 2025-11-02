import { usePostHog } from 'posthog-js/react'

import { DocumentMetadataForm, DocumentMetadataFormData } from '@/components/DocumentMetadataForm'
import { useCancelUnapproved } from '@/db/hooks/useCancelUnapproved'
import { updateDocument } from '@/db/models/document'
import { captureEvent } from '@/utils'

import { DocumentConfirmationProps } from './DocumentConfirmation.types'

export const DocumentConfirmation = (props: DocumentConfirmationProps) => {
    const { document, className } = props
    const posthog = usePostHog()
    const { cancelAll } = useCancelUnapproved()

    const handleSave = async (data: DocumentMetadataFormData) => {
        await updateDocument(document.id, {
            approved: true,
            lab: data.lab,
            testDate: data.testDate ? new Date(data.testDate) : undefined,
            notes: data.notes,
        })
        captureEvent(posthog, 'document_confirmed', {
            hasLab: !!data.lab,
            hasTestDate: !!data.testDate,
            hasNotes: !!data.notes,
        })
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
            onCancel={() => { void cancelAll() }}
            className={className}
        />
    )
}

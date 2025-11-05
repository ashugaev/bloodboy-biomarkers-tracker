import { usePostHog } from 'posthog-js/react'

import { DocumentMetadataForm, DocumentMetadataFormData } from '@/components/DocumentMetadataForm'
import { useCancelUnapproved } from '@/db/hooks/useCancelUnapproved'
import { bulkUpdateBiomarkerConfigs } from '@/db/models/biomarkerConfig'
import { bulkDeleteBiomarkerRecords, bulkUpdateBiomarkerRecords } from '@/db/models/biomarkerRecord'
import { updateDocument } from '@/db/models/document'
// eslint-disable-next-line no-restricted-imports
import { db } from '@/db/services/db.service'
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

        const unconfirmedRecords = await db.biomarkerRecords
            .where('documentId')
            .equals(document.id)
            .filter(r => !r.approved)
            .toArray()

        const validRecords = unconfirmedRecords.filter(r => r.id && r.biomarkerId && r.ucumCode)
        if (validRecords.length > 0) {
            const recordsToUpdate = validRecords.map(r => ({
                ...r,
                approved: true,
            }))
            await bulkUpdateBiomarkerRecords(recordsToUpdate)
        }

        const invalidRecords = unconfirmedRecords.filter(r => r.id && (!r.biomarkerId || !r.ucumCode))
        if (invalidRecords.length > 0) {
            const invalidRecordIds = invalidRecords.map(r => r.id).filter((id): id is string => !!id)
            await bulkDeleteBiomarkerRecords(invalidRecordIds)
        }

        const unconfirmedConfigs = await db.biomarkerConfigs.filter(c => !c.approved).toArray()
        if (unconfirmedConfigs.length > 0) {
            const configsToUpdate = unconfirmedConfigs.map(c => ({
                ...c,
                approved: true,
            }))
            await bulkUpdateBiomarkerConfigs(configsToUpdate)
        }

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

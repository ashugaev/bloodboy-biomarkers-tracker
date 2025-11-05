import { useMemo } from 'react'

import { BiomarkerRecordsConfirmation } from '@/components/BiomarkerRecordsConfirmation'
import { DocumentConfirmation } from '@/components/DocumentConfirmation'
import { useBiomarkerRecords } from '@/db/models/biomarkerRecord'
import { useDocuments } from '@/db/models/document'

import { ConfirmationPanelProps } from './ConfirmationPanel.types'

export const ConfirmationPanel = (props: ConfirmationPanelProps) => {
    const { className, onPageChange } = props

    const { data: unconfirmedDocuments, loading: documentsLoading } = useDocuments({ filter: (item) => !item.approved })
    const { data: allRecords, loading: recordsLoading } = useBiomarkerRecords()

    const unapprovedDocumentId = useMemo(() => {
        return unconfirmedDocuments.length > 0 ? unconfirmedDocuments[0].id : null
    }, [unconfirmedDocuments])

    const recordsForDocument = useMemo(() => {
        if (!unapprovedDocumentId) return []
        return allRecords.filter(record => record.documentId === unapprovedDocumentId)
    }, [allRecords, unapprovedDocumentId])

    const loading = documentsLoading || recordsLoading

    const hasUnapprovedRecords = useMemo(() => {
        return recordsForDocument.some(record => !record.approved)
    }, [recordsForDocument])

    if (loading) {
        return null
    }

    if (recordsForDocument.length > 0 && hasUnapprovedRecords) {
        return (
            <BiomarkerRecordsConfirmation
                records={recordsForDocument}
                documentId={unapprovedDocumentId ?? undefined}
                className={className}
                onPageChange={onPageChange}
            />
        )
    }

    if (unconfirmedDocuments.length > 0) {
        return (
            <DocumentConfirmation document={unconfirmedDocuments[0]} className={className}/>
        )
    }

    return null
}

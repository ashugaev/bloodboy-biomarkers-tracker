import { BiomarkerRecordsConfirmation } from '@/components/BiomarkerRecordsConfirmation'
import { DocumentConfirmation } from '@/components/DocumentConfirmation'
import { useBiomarkerRecords } from '@/db/models/biomarkerRecord'
import { useDocuments } from '@/db/models/document'

import { ConfirmationPanelProps } from './ConfirmationPanel.types'

export const ConfirmationPanel = (props: ConfirmationPanelProps) => {
    const { className } = props

    const { data: unconfirmedDocuments, loading: documentsLoading } = useDocuments({ filter: (item) => !item.approved })
    const { data: unconfirmedRecords, loading: recordsLoading } = useBiomarkerRecords({ filter: (item) => !item.approved })

    const loading = documentsLoading || recordsLoading

    if (loading) {
        return null
    }

    if (unconfirmedRecords.length > 0) {
        return (
            <BiomarkerRecordsConfirmation records={unconfirmedRecords} className={className}/>
        )
    }

    if (unconfirmedDocuments.length > 0) {
        return (
            <DocumentConfirmation document={unconfirmedDocuments[0]} className={className}/>
        )
    }

    return null
}

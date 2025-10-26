import { BiomarkerConfigsConfirmation } from '@/components/BiomarkerConfigsConfirmation'
import { BiomarkerRecordsConfirmation } from '@/components/BiomarkerRecordsConfirmation'
import { DocumentConfirmation } from '@/components/DocumentConfirmation'
import { useBiomarkerConfigs } from '@/db/models/biomarkerConfig'
import { useBiomarkerRecords } from '@/db/models/biomarkerRecord'
import { useDocuments } from '@/db/models/document'

import { ConfirmationPanelProps } from './ConfirmationPanel.types'

export const ConfirmationPanel = (props: ConfirmationPanelProps) => {
    const { className } = props

    const { data: unconfirmedDocuments, loading: documentsLoading } = useDocuments({ filter: (item) => !item.approved })
    const { data: unconfirmedConfigs, loading: configsLoading } = useBiomarkerConfigs({ filter: (item) => !item.approved })
    const { data: unconfirmedRecords, loading: recordsLoading } = useBiomarkerRecords({ filter: (item) => !item.approved })

    const loading = documentsLoading || configsLoading || recordsLoading

    if (loading) {
        return null
    }

    if (unconfirmedConfigs.length > 0) {
        return (
            <BiomarkerConfigsConfirmation configs={unconfirmedConfigs} className={className}/>
        )
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

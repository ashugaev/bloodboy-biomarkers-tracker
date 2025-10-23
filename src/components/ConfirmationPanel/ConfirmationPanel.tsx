import { useUnconfirmedBiomarkerConfigs } from '@/db/hooks/useUnconfirmedBiomarkerConfigs'
import { useUnconfirmedBiomarkerRecords } from '@/db/hooks/useUnconfirmedBiomarkerRecords'
import { useUnconfirmedDocuments } from '@/db/hooks/useUnconfirmedDocuments'

import { BiomarkerConfigsConfirmation } from '../BiomarkerConfigsConfirmation'
import { BiomarkerRecordsConfirmation } from '../BiomarkerRecordsConfirmation'
import { DocumentConfirmation } from '../DocumentConfirmation'

import { ConfirmationPanelProps } from './ConfirmationPanel.types'

export const ConfirmationPanel = (props: ConfirmationPanelProps) => {
    const { className } = props

    const { unconfirmedDocuments, loading: documentsLoading } = useUnconfirmedDocuments()
    const { unconfirmedConfigs, loading: configsLoading } = useUnconfirmedBiomarkerConfigs()
    const { unconfirmedRecords, loading: recordsLoading } = useUnconfirmedBiomarkerRecords()

    console.log('unconfirmedConfigs', unconfirmedConfigs)
    console.log('unconfirmedRecords', unconfirmedRecords)
    console.log('unconfirmedDocuments', unconfirmedDocuments)
    
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

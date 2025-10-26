import { ExtractionResults } from '@/components/ExtractionResults'
import { useCancelUnapproved } from '@/db/hooks/useCancelUnapproved'
import { useBiomarkerConfigs } from '@/db/models/biomarkerConfig'
import { bulkUpdateBiomarkerRecords, createBiomarkerRecords } from '@/db/models/biomarkerRecord'
import { ExtractedBiomarker } from '@/openai/openai.biomarkers'

import { BiomarkerRecordsConfirmationProps } from './BiomarkerRecordsConfirmation.types'

export const BiomarkerRecordsConfirmation = (props: BiomarkerRecordsConfirmationProps) => {
    const { records, className } = props
    const { data: configs } = useBiomarkerConfigs()
    const { cancelAll } = useCancelUnapproved()

    const handleSave = async (biomarkers: ExtractedBiomarker[]) => {
        const updatedRecords = records
            .slice(0, biomarkers.length)
            .map(record => ({
                ...record,
                approved: true,
            }))

        await bulkUpdateBiomarkerRecords(updatedRecords)
    }

    const handleAddNew = async () => {
        if (configs.length === 0) return

        await createBiomarkerRecords([{
            biomarkerId: undefined,
            ucumCode: '',
            approved: false,
            testDate: new Date(),
            latest: true,
        }])
    }

    const extractedBiomarkers: ExtractedBiomarker[] = records.map(record => {
        const config = configs.find(c => c.id === record.biomarkerId)

        return {
            id: record.id,
            biomarkerId: record.biomarkerId,
            name: config?.name,
            originalName: record.originalName,
            value: record.value,
            ucumCode: record.ucumCode,
            referenceRange: config?.normalRange,
            order: record.order,
        }
    }).sort((a, b) => (a.order ?? 0) - (b.order ?? 0))

    return (
        <ExtractionResults
            biomarkers={extractedBiomarkers}
            configs={configs}
            onSave={(biomarkers) => { void handleSave(biomarkers) }}
            onCancel={() => { void cancelAll() }}
            onAddNew={() => { void handleAddNew() }}
            className={className}
        />
    )
}

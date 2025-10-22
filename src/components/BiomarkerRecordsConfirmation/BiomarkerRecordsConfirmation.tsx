import { useBiomarkerConfigs } from '@/db/hooks/useBiomarkerConfigs'
import { updateBiomarkerRecord, deleteBiomarkerRecord } from '@/db/hooks/useBiomarkerRecords'
import { ExtractedBiomarker } from '@/openai/biomarkers'

import { ExtractionResults } from '../ExtractionResults'

import { BiomarkerRecordsConfirmationProps } from './BiomarkerRecordsConfirmation.types'

export const BiomarkerRecordsConfirmation = (props: BiomarkerRecordsConfirmationProps) => {
    const { records, className } = props
    const { configs } = useBiomarkerConfigs(false)

    const handleSave = async (biomarkers: ExtractedBiomarker[]) => {
        for (let i = 0; i < biomarkers.length && i < records.length; i++) {
            await updateBiomarkerRecord(records[i].id, {
                approved: true,
            })
        }
    }

    const handleCancel = async () => {
        for (const record of records) {
            await deleteBiomarkerRecord(record.id)
        }
    }

    const handleRetry = () => {
        // TODO: Implement retry extraction
    }

    const extractedBiomarkers: ExtractedBiomarker[] = records.map(record => {
        const config = configs.find(c => c.id === record.biomarkerId)

        return {
            id: record.id,
            name: config?.name,
            value: record.value,
            unit: record.unit,
            referenceRange: config?.normalRange,
            order: record.order,
        }
    }).sort((a, b) => (a.order ?? 0) - (b.order ?? 0))

    return (
        <ExtractionResults
            biomarkers={extractedBiomarkers}
            onSave={(biomarkers) => { void handleSave(biomarkers) }}
            onCancel={() => { void handleCancel() }}
            onRetry={handleRetry}
            className={className}
        />
    )
}

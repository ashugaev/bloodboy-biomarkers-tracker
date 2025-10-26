import { ExtractionResults } from '@/components/ExtractionResults'
import { useBiomarkerConfigs } from '@/db/models/biomarkerConfig'
import { addBiomarkerRecord, createBiomarkerRecord, deleteBiomarkerRecord, updateBiomarkerRecord } from '@/db/models/biomarkerRecord'
import { ExtractedBiomarker } from '@/openai/openai.biomarkers'

import { BiomarkerRecordsConfirmationProps } from './BiomarkerRecordsConfirmation.types'

export const BiomarkerRecordsConfirmation = (props: BiomarkerRecordsConfirmationProps) => {
    const { records, className } = props
    const { data: configs } = useBiomarkerConfigs()

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

    const handleAddNew = async () => {
        if (configs.length === 0) return

        const newRecord = await createBiomarkerRecord({
            biomarkerId: undefined,
            ucumCode: '',
            approved: false,
        })
        await addBiomarkerRecord(newRecord)
    }

    const extractedBiomarkers: ExtractedBiomarker[] = records.map(record => {
        const config = configs.find(c => c.id === record.biomarkerId)

        return {
            id: record.id,
            biomarkerId: record.biomarkerId,
            name: config?.name,
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
            onCancel={() => { void handleCancel() }}
            onAddNew={() => { void handleAddNew() }}
            className={className}
        />
    )
}

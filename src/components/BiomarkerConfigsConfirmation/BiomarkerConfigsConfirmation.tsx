import { NewBiomarkersTable, NewBiomarkerRow } from '@/components/NewBiomarkersTable'
import { deleteBiomarkerConfig, updateBiomarkerConfig } from '@/db/models/biomarkerConfig'

import { BiomarkerConfigsConfirmationProps } from './BiomarkerConfigsConfirmation.types'

export const BiomarkerConfigsConfirmation = (props: BiomarkerConfigsConfirmationProps) => {
    const { configs, className } = props

    const handleSave = async (biomarkers: NewBiomarkerRow[]) => {
        for (const biomarker of biomarkers) {
            const config = configs.find(c => c.name === biomarker.name)
            if (config) {
                await updateBiomarkerConfig(config.id, {
                    approved: true,
                    ucumCode: biomarker.ucumCode,
                    normalRange: biomarker.normalRange,
                    targetRange: biomarker.targetRange,
                })
            }
        }
    }

    const handleCancel = async () => {
        for (const config of configs) {
            await deleteBiomarkerConfig(config.id)
        }
    }

    const biomarkerRows: NewBiomarkerRow[] = configs.map(config => ({
        id: config.id,
        name: config.name,
        ucumCode: config.ucumCode,
        normalRange: config.normalRange,
        targetRange: config.targetRange,
    })).sort((a, b) => {
        const orderA = configs.find(c => c.id === a.id)?.order ?? Infinity
        const orderB = configs.find(c => c.id === b.id)?.order ?? Infinity
        return orderA - orderB
    })

    return (
        <NewBiomarkersTable
            biomarkers={biomarkerRows}
            onSave={(biomarkers) => { void handleSave(biomarkers) }}
            onCancel={() => { void handleCancel() }}
            className={className}
        />
    )
}

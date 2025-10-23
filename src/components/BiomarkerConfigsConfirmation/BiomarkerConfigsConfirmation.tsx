import { updateBiomarkerConfig, deleteBiomarkerConfig } from '@/db/hooks/useBiomarkerConfigs'

import { NewBiomarkersTable, NewBiomarkerRow } from '../NewBiomarkersTable'

import { BiomarkerConfigsConfirmationProps } from './BiomarkerConfigsConfirmation.types'

export const BiomarkerConfigsConfirmation = (props: BiomarkerConfigsConfirmationProps) => {
    const { configs, className } = props

    const handleSave = async (biomarkers: NewBiomarkerRow[]) => {
        for (const biomarker of biomarkers) {
            const config = configs.find(c => c.name === biomarker.name)
            if (config) {
                await updateBiomarkerConfig(config.id, {
                    approved: true,
                    unit: biomarker.defaultUnit,
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
        defaultUnit: config.unit,
        normalRange: config.normalRange,
        targetRange: config.targetRange,
    }))

    return (
        <NewBiomarkersTable
            biomarkers={biomarkerRows}
            onSave={(biomarkers) => { void handleSave(biomarkers) }}
            onCancel={() => { void handleCancel() }}
            className={className}
        />
    )
}

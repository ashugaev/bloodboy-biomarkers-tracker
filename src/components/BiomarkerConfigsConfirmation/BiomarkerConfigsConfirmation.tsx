import { NewBiomarkersTable, NewBiomarkerRow } from '@/components/NewBiomarkersTable'
import { useCancelUnapproved } from '@/db/hooks/useCancelUnapproved'
import { bulkUpdateBiomarkerConfigs } from '@/db/models/biomarkerConfig'

import { BiomarkerConfigsConfirmationProps } from './BiomarkerConfigsConfirmation.types'

export const BiomarkerConfigsConfirmation = (props: BiomarkerConfigsConfirmationProps) => {
    const { configs, className } = props
    const { cancelAll } = useCancelUnapproved()

    const handleSave = async (biomarkers: NewBiomarkerRow[]) => {
        const updatedConfigs = biomarkers
            .map(biomarker => {
                const config = configs.find(c => c.name === biomarker.name)
                if (!config) return null
                return {
                    ...config,
                    approved: true,
                    ucumCode: biomarker.ucumCode,
                    normalRange: biomarker.normalRange,
                    targetRange: biomarker.targetRange,
                }
            })
            .filter((config): config is NonNullable<typeof config> => config !== null)

        await bulkUpdateBiomarkerConfigs(updatedConfigs)
    }

    const biomarkerRows: NewBiomarkerRow[] = configs.map(config => ({
        id: config.id,
        name: config.name,
        originalName: config.originalName,
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
            onCancel={() => { void cancelAll() }}
            className={className}
        />
    )
}

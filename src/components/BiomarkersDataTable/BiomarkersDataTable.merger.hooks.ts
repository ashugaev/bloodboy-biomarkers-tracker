import { useMemo } from 'react'

import { buildBlockedMergesMap, isConversionBlocked } from '@/components/BiomarkerMergeModal/BiomarkerMergeModal.utils'
import { useBiomarkerConfigs } from '@/db/models/biomarkerConfig'
import { useBiomarkerRecords } from '@/db/models/biomarkerRecord'
import { useBlockedMerges } from '@/db/models/blockedMerge'

import { MergeableBiomarker } from './BiomarkersDataTable.merger.types'
import { findMergeableBiomarkers, getMostPopularUnit } from './BiomarkersDataTable.merger.utils'

export const useMergeableBiomarkers = () => {
    const { data: configs } = useBiomarkerConfigs({ filter: (c) => c.approved })
    const { data: records } = useBiomarkerRecords({ filter: (r) => r.approved })

    const mergeableBiomarkers = useMemo(() => {
        return findMergeableBiomarkers(configs, records)
    }, [configs, records])

    return {
        mergeableBiomarkers,
        configs,
        records,
    }
}

export const useFilteredMergeableBiomarkers = (
    mergeableBiomarkers: MergeableBiomarker[],
    records: ReturnType<typeof useBiomarkerRecords>['data'],
) => {
    const { data: blockedMerges } = useBlockedMerges()

    const blockedMergesMap = useMemo(() => {
        return buildBlockedMergesMap(blockedMerges)
    }, [blockedMerges])

    const filtered = useMemo(() => {
        return mergeableBiomarkers.filter(biomarker => {
            const biomarkerRecords = records?.filter(r =>
                biomarker.configs.some(c => c.id === r.biomarkerId) && r.approved,
            ) ?? []
            
            if (biomarkerRecords.length === 0) return false
            
            const possibleTargetUnits = [...new Set(
                biomarker.configs
                    .filter(c => biomarkerRecords.some(r => r.biomarkerId === c.id))
                    .map(c => c.ucumCode)
                    .filter((u): u is string => Boolean(u))
            )]
            
            for (const targetUnit of possibleTargetUnits) {
                const availableConfigs = biomarker.configs.filter(config => {
                    const configRecords = biomarkerRecords.filter(r => r.biomarkerId === config.id)
                    if (configRecords.length === 0) return false
                    
                    const configUnit = config.ucumCode
                    if (!configUnit || configUnit === targetUnit) return true
                    
                    return !isConversionBlocked(biomarker.name, configUnit, targetUnit, blockedMergesMap)
                })
                
                if (availableConfigs.length >= 2) {
                    return true
                }
            }
            
            return false
        })
    }, [mergeableBiomarkers, records, blockedMergesMap])

    return filtered
}

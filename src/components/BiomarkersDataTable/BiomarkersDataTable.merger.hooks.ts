import { useMemo } from 'react'

import { useBiomarkerConfigs } from '@/db/models/biomarkerConfig'
import { useBiomarkerRecords } from '@/db/models/biomarkerRecord'

import { findMergeableBiomarkers } from './BiomarkersDataTable.merger.utils'

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

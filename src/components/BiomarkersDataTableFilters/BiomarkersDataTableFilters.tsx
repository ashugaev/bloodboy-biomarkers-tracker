import { useMemo } from 'react'

import { Select, Space } from 'antd'

import { useBiomarkerConfigs } from '@/db/models/biomarkerConfig'
import { useBiomarkerRecords } from '@/db/models/biomarkerRecord'
import { useDocuments } from '@/db/models/document'

import { BiomarkersDataTableFiltersProps, RangeType } from './BiomarkersDataTableFilters.types'

export const BiomarkersDataTableFilters = (props: BiomarkersDataTableFiltersProps) => {
    const { documentId, biomarkerIds, outOfRange, onDocumentChange, onBiomarkerChange, onOutOfRangeChange } = props
    const { data: records } = useBiomarkerRecords({ filter: (r) => r.approved })
    const { data: documents } = useDocuments()
    const { data: configs } = useBiomarkerConfigs({ filter: (c) => c.approved })

    const documentOptions = useMemo(() => {
        const documentIds = new Set(records.map(r => r.documentId).filter((id): id is string => !!id))
        const docs = documents
            .filter(d => documentIds.has(d.id))
            .map(d => ({
                id: d.id,
                label: `${d.testDate?.toLocaleDateString() ?? '—'} ${d.lab ?? ''}`.trim(),
                testDate: d.testDate,
            }))
            .sort((a, b) => {
                if (!a.testDate && !b.testDate) return 0
                if (!a.testDate) return 1
                if (!b.testDate) return -1
                return b.testDate.getTime() - a.testDate.getTime()
            })

        return [
            ...docs.map(d => ({
                value: d.id,
                label: d.label,
            })),
        ]
    }, [records, documents])

    const biomarkerOptions = useMemo(() => {
        return configs
            .map(config => ({
                value: config.id,
                label: config.name,
            }))
            .sort((a, b) => a.label.localeCompare(b.label))
    }, [configs])

    const outOfRangeOptions = [
        {
            value: RangeType.NORMAL,
            label: 'Out of normal',
        },
        {
            value: RangeType.TARGET,
            label: 'Out of target',
        },
    ]

    return (
        <Space size={16}>
            <Select
                mode='multiple'
                style={{ width: 250 }}
                placeholder='Filter by biomarker'
                value={biomarkerIds ?? undefined}
                onChange={(value) => onBiomarkerChange?.(value.length > 0 ? value : undefined)}
                options={biomarkerOptions}
                allowClear
                size='small'
                maxTagCount='responsive'
                showSearch
                filterOption={(input, option) =>
                    (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                }
            />
            <Select
                mode='multiple'
                style={{ width: 250 }}
                placeholder='Filter by document'
                value={documentId ?? undefined}
                onChange={(value) => onDocumentChange?.(value.length > 0 ? value : undefined)}
                options={documentOptions}
                allowClear
                size='small'
                maxTagCount='responsive'
            />
            <Select
                style={{ width: 200 }}
                placeholder='Filter by range'
                value={outOfRange ?? undefined}
                onChange={(value) => onOutOfRangeChange?.(value ?? undefined)}
                options={outOfRangeOptions}
                allowClear
                size='small'
            />
        </Space>
    )
}

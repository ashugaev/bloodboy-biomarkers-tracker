import { useCallback, useMemo, useState } from 'react'

import { CloseOutlined, FilterOutlined, SaveOutlined } from '@ant-design/icons'
import { Button, Form, Input, message, Modal, Select, Space, Tag } from 'antd'

import { useBiomarkerConfigs } from '@/db/models/biomarkerConfig'
import { useBiomarkerRecords } from '@/db/models/biomarkerRecord'
import { useDocuments } from '@/db/models/document'
import { addSavedFilter, deleteSavedFilter, getRandomTagColor, useSavedFilters } from '@/db/models/savedFilter'

import { BiomarkersDataTableFiltersProps, RangeType } from './BiomarkersDataTableFilters.types'

export const BiomarkersDataTableFilters = (props: BiomarkersDataTableFiltersProps) => {
    const { documentId, biomarkerIds, outOfRange, outOfRangeHistory, hasAnomaly, onDocumentChange, onBiomarkerChange, onOutOfRangeChange, onOutOfRangeHistoryChange, onHasAnomalyChange } = props
    const { data: records } = useBiomarkerRecords({ filter: (r) => r.approved })
    const { data: documents } = useDocuments()
    const { data: configs } = useBiomarkerConfigs({ filter: (c) => c.approved })
    const { data: savedFilters } = useSavedFilters()
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [form] = Form.useForm<{ name: string }>()

    const documentOptions = useMemo(() => {
        if (!documents || documents.length === 0) return []
        if (!records || records.length === 0) return []

        const documentIds = new Set(
            records
                .map(r => r.documentId)
                .filter((id): id is string => !!id),
        )
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
        if (!configs || configs.length === 0) return []

        return configs
            .map(config => ({
                value: config.id,
                label: config.name,
            }))
            .sort((a, b) => a.label.localeCompare(b.label))
    }, [configs])

    const outOfRangeOptions = [
        {
            value: `${RangeType.NORMAL}:last`,
            label: 'Out of normal (Last)',
        },
        {
            value: `${RangeType.TARGET}:last`,
            label: 'Out of target (Last)',
        },
        {
            value: `${RangeType.NORMAL}:history`,
            label: 'Out of normal (History)',
        },
        {
            value: `${RangeType.TARGET}:history`,
            label: 'Out of target (History)',
        },
    ]

    const outOfRangeValue = useMemo(() => {
        if (outOfRange) {
            return `${outOfRange}:last`
        }
        if (outOfRangeHistory) {
            return `${outOfRangeHistory}:history`
        }
        return undefined
    }, [outOfRange, outOfRangeHistory])

    const handleOutOfRangeChange = useCallback((value: string | undefined) => {
        if (!value) {
            onOutOfRangeChange?.(undefined)
            onOutOfRangeHistoryChange?.(undefined)
            return
        }

        const [rangeType, scope] = value.split(':')
        if (scope === 'last') {
            onOutOfRangeChange?.(rangeType as RangeType)
            onOutOfRangeHistoryChange?.(undefined)
        } else if (scope === 'history') {
            onOutOfRangeChange?.(undefined)
            onOutOfRangeHistoryChange?.(rangeType as RangeType)
        }
    }, [onOutOfRangeChange, onOutOfRangeHistoryChange])

    const handleSaveFilter = useCallback(async () => {
        try {
            const values = await form.validateFields()
            await addSavedFilter({
                name: values.name,
                color: getRandomTagColor(),
                documentId: documentId && documentId.length > 0 ? documentId : undefined,
                biomarkerIds: biomarkerIds && biomarkerIds.length > 0 ? biomarkerIds : undefined,
                outOfRange,
                outOfRangeHistory,
                hasAnomaly,
            })
            void message.success('Filter saved successfully')
            setIsModalOpen(false)
            form.resetFields()
        } catch (error) {
            if ((error as { errorFields?: unknown })?.errorFields) {
                return
            }
            void message.error('Failed to save filter')
            console.error('Failed to save filter:', error)
        }
    }, [form, documentId, biomarkerIds, outOfRange, outOfRangeHistory, hasAnomaly])

    const handleApplyFilter = useCallback((filter: { documentId?: string[], biomarkerIds?: string[], outOfRange?: RangeType, outOfRangeHistory?: RangeType, hasAnomaly?: number }) => {
        onDocumentChange?.(filter.documentId)
        onBiomarkerChange?.(filter.biomarkerIds)
        onOutOfRangeChange?.(filter.outOfRange)
        onOutOfRangeHistoryChange?.(filter.outOfRangeHistory)
        onHasAnomalyChange?.(filter.hasAnomaly)
    }, [onDocumentChange, onBiomarkerChange, onOutOfRangeChange, onOutOfRangeHistoryChange, onHasAnomalyChange])

    const handleDeleteFilter = useCallback((id: string, filterName: string, e: React.MouseEvent) => {
        e.stopPropagation()
        Modal.confirm({
            title: 'Delete Filter',
            content: `Are you sure you want to delete filter "${filterName}"?`,
            okText: 'Delete',
            cancelText: 'Cancel',
            okButtonProps: {
                danger: true,
            },
            onOk: async () => {
                try {
                    await deleteSavedFilter(id)
                    void message.success('Filter deleted successfully')
                } catch (error) {
                    void message.error('Failed to delete filter')
                    console.error('Failed to delete filter:', error)
                }
            },
        })
    }, [])

    const handleCancel = useCallback(() => {
        setIsModalOpen(false)
        form.resetFields()
    }, [form])

    const hasActiveFilters = useMemo(() => {
        return (documentId?.length ?? 0) > 0 ||
            (biomarkerIds?.length ?? 0) > 0 ||
            outOfRange !== undefined ||
            outOfRangeHistory !== undefined ||
            hasAnomaly !== undefined
    }, [documentId, biomarkerIds, outOfRange, outOfRangeHistory, hasAnomaly])

    return (
        <div className='flex flex-col gap-2'>
            <Space size={16} wrap>
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
                    autoClearSearchValue={false}
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
                    style={{ width: 220 }}
                    placeholder='Filter by range'
                    value={outOfRangeValue}
                    onChange={handleOutOfRangeChange}
                    options={outOfRangeOptions}
                    allowClear
                    size='small'
                />
                <Select
                    style={{ width: 300 }}
                    placeholder='Filter by anomaly threshold'
                    value={hasAnomaly !== undefined ? hasAnomaly.toString() : undefined}
                    onChange={(value) => onHasAnomalyChange?.(value ? Number(value) : undefined)}
                    options={[
                        {
                            value: '50',
                            label: '≥50% change (Moderate fluctuations)',
                        },
                        {
                            value: '70',
                            label: '≥70% change (Strong fluctuations)',
                        },
                        {
                            value: '100',
                            label: '≥100% change (Very strong fluctuations)',
                        },
                        {
                            value: '150',
                            label: '≥150% change (Extreme fluctuations)',
                        },
                    ]}
                    allowClear
                    size='small'
                />
                <Button
                    icon={<SaveOutlined/>}
                    type='link'
                    size='small'
                    onClick={() => { setIsModalOpen(true) }}
                    disabled={!hasActiveFilters}
                >
                    Save Filter
                </Button>
            </Space>
            {savedFilters.length > 0 && (
                <Space size={8} wrap>
                    {savedFilters.map(filter => (
                        <Tag
                            key={filter.id}
                            color={filter.color}
                            icon={<FilterOutlined/>}
                            onClick={() => { handleApplyFilter(filter) }}
                            style={{ cursor: 'pointer' }}
                        >
                            {filter.name}
                            <CloseOutlined
                                onClick={(e) => { handleDeleteFilter(filter.id, filter.name, e) }}
                                style={{
                                    marginLeft: 4,
                                    cursor: 'pointer',
                                }}
                            />
                        </Tag>
                    ))}
                </Space>
            )}
            <Modal
                title='Save Filter'
                open={isModalOpen}
                onCancel={handleCancel}
                onOk={() => { void handleSaveFilter() }}
                okText='Save'
                cancelText='Cancel'
            >
                <Form
                    form={form}
                    layout='vertical'
                >
                    <Form.Item
                        name='name'
                        label='Filter Name'
                        rules={[
                            {
                                required: true,
                                message: 'Please enter filter name',
                            },
                            {
                                min: 1,
                                message: 'Name must not be empty',
                            },
                        ]}
                    >
                        <Input placeholder='e.g., Out of range biomarkers'/>
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    )
}

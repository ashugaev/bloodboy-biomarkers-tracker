import { useCallback, useMemo, useState } from 'react'

import { ArrowLeftOutlined, CheckCircleOutlined, CloseCircleOutlined, ExclamationCircleOutlined, StopOutlined } from '@ant-design/icons'
import { Alert, Button, Checkbox, List, Modal, Select, Table, Tag } from 'antd'
import { usePostHog } from 'posthog-js/react'

import { MergePreview } from '@/components/BiomarkersDataTable/BiomarkersDataTable.merger.types'
import { createMergePreview, getConversionStatus } from '@/components/BiomarkersDataTable/BiomarkersDataTable.merger.utils'
import { COLORS } from '@/constants/colors'
import { BiomarkerRecord } from '@/db/models/biomarkerRecord'
import { addBlockedMergePair, createBlockedMergeKey, useBlockedMerges, deleteBlockedMerge } from '@/db/models/blockedMerge'
import { getNameByUcum, useUnits } from '@/db/models/unit'
import { addVerifiedConversion, createVerifiedConversionKey, useVerifiedConversions, VerifiedConversionMethod } from '@/db/models/verifiedConversion'
import { captureEvent } from '@/utils'

import { BiomarkerMergeModalProps, MergePreviewProps } from './BiomarkerMergeModal.types'
import { buildBlockedMergesMap, buildVerifiedConversionsMap, getBestTargetUnit, isBiomarkerFullyVerified, isConversionBlocked } from './BiomarkerMergeModal.utils'
import { useFilteredMergeableBiomarkers } from '@/components/BiomarkersDataTable/BiomarkersDataTable.merger.hooks'

const MergePreviewScreen = (props: MergePreviewProps) => {
    const { preview, onBack, onMerge, onTargetUnitChange, onConfigToggle, merging } = props
    const posthog = usePostHog()
    const { data: units } = useUnits()
    const { data: verifiedConversions } = useVerifiedConversions()
    const { data: blockedMerges } = useBlockedMerges()
    const [showBlockConfirmation, setShowBlockConfirmation] = useState(false)

    const targetConfigInfo = useMemo(() => preview.configs.find(c => c.isTarget), [preview.configs])

    const blockedMergesMap = useMemo(() => {
        return buildBlockedMergesMap(blockedMerges)
    }, [blockedMerges])

    const selectedConfigs = preview.configs.filter(c => {
        if (!c.selected) return false
        if (c.isTarget) return true
        
        const configUnit = c.config.ucumCode
        if (!configUnit || configUnit === preview.targetUnit) return true
        
        return !isConversionBlocked(preview.biomarkerName, configUnit, preview.targetUnit, blockedMergesMap)
    })

    const sourceUnits = useMemo(() => {
        const units = selectedConfigs
            .filter(c => !c.isTarget && c.config.ucumCode !== preview.targetUnit)
            .map(c => c.config.ucumCode)
            .filter((unit): unit is string => Boolean(unit))
        return [...new Set(units)]
    }, [selectedConfigs, preview.targetUnit])

    const selectedConfigsCount = selectedConfigs.length
    const selectedRecordsCount = preview.records.filter(r =>
        selectedConfigs.some(c => c.config.id === r.config.id),
    ).length

    const selectedConfigIds = new Set(selectedConfigs.map(c => c.config.id))
    const selectedFailedConversions = preview.failedConversions.filter(failed => {
        const record = preview.records.find(r => r.record.id === failed.recordId)
        return record && selectedConfigIds.has(record.config.id)
    })

    const groupedErrors = useMemo(() => {
        const groups = new Map<string, Array<{
            failed: typeof selectedFailedConversions[0]
            recordInfo: typeof preview.records[0]
        }>>()

        for (const failed of selectedFailedConversions) {
            const recordInfo = preview.records.find(r => r.record.id === failed.recordId)
            if (!recordInfo) continue

            const conversionError = recordInfo.conversionResult.error ?? failed.error
            const key = conversionError

            if (!groups.has(key)) {
                groups.set(key, [])
            }
            const group = groups.get(key)
            if (group) {
                group.push({
                    failed,
                    recordInfo,
                })
            }
        }

        return Array.from(groups.entries()).map(([error, items]) => ({
            error,
            items,
            count: items.length,
        }))
    }, [selectedFailedConversions, preview.records])

    const hasSelectedErrors = selectedFailedConversions.length > 0

    const verifiedConversionsMap = useMemo(() => {
        return buildVerifiedConversionsMap(verifiedConversions)
    }, [verifiedConversions])

    const blockedConfigsCount = useMemo(() => {
        return preview.configs.filter(c => {
            if (c.isTarget || !c.selected) return false
            const configUnit = c.config.ucumCode
            if (!configUnit || configUnit === preview.targetUnit) return false
            return isConversionBlocked(preview.biomarkerName, configUnit, preview.targetUnit, blockedMergesMap)
        }).length
    }, [preview.configs, preview.biomarkerName, preview.targetUnit, blockedMergesMap])

    const hasDefaultVerifiedConversions = useMemo(() => {
        if (sourceUnits.length === 0) return false
        return sourceUnits.every(sourceUnit => {
            const key = createVerifiedConversionKey(preview.biomarkerName, sourceUnit, preview.targetUnit)
            return verifiedConversionsMap.has(key)
        })
    }, [sourceUnits, preview.biomarkerName, preview.targetUnit, verifiedConversionsMap])

    const canMerge = selectedConfigsCount >= 2 && !hasSelectedErrors && sourceUnits.length > 0

    const handleMerge = useCallback(() => {
        captureEvent(posthog, 'biomarker_merge_preview_confirmed', {
            biomarkerName: preview.biomarkerName,
            targetUnit: preview.targetUnit,
            configsCount: selectedConfigsCount,
            recordsCount: selectedRecordsCount,
        })
        onMerge()
    }, [posthog, preview, selectedConfigsCount, selectedRecordsCount, onMerge])

    const failedSourceUnits = useMemo(() => {
        return [...new Set(selectedFailedConversions.map(failed => failed.originalUnit))]
    }, [selectedFailedConversions])

    const blockedMergesForThisPair = useMemo(() => {
        if (!blockedMerges) return []
        return blockedMerges.filter(bm => {
            if (bm.biomarkerName !== preview.biomarkerName) return false
            return bm.targetUnits.includes(preview.targetUnit) || bm.sourceUnits.some(su => 
                preview.configs.some(c => c.config.ucumCode === su)
            )
        })
    }, [blockedMerges, preview.biomarkerName, preview.targetUnit, preview.configs])

    const handleBlockMerge = useCallback(async () => {
        await addBlockedMergePair(preview.biomarkerName, failedSourceUnits, [preview.targetUnit])
        captureEvent(posthog, 'biomarker_merge_blocked', {
            biomarkerName: preview.biomarkerName,
            sourceUnits: failedSourceUnits,
            targetUnit: preview.targetUnit,
        })
        setShowBlockConfirmation(false)
        
        // const remainingConfigs = preview.configs.filter(c => {
        //     if (c.recordsCount === 0) return false
        //     if (c.isTarget) return true
        //     const configUnit = c.config.ucumCode
        //     if (!configUnit || configUnit === preview.targetUnit) return true
        //     return !failedSourceUnits.includes(configUnit)
        // })
        
        // if (remainingConfigs.length < 2) {
        //     onBack()
        // }
    }, [posthog, preview.biomarkerName, failedSourceUnits, preview.targetUnit, preview.configs, onBack])

    const handleUnblockMerge = useCallback(async () => {
        for (const blockedMerge of blockedMergesForThisPair) {
            await deleteBlockedMerge(blockedMerge.id)
        }
        const unblockedUnits = preview.configs
            .filter(c => !c.isTarget && c.config.ucumCode)
            .map(c => c.config.ucumCode!)
        captureEvent(posthog, 'biomarker_merge_unblocked', {
            biomarkerName: preview.biomarkerName,
            sourceUnits: unblockedUnits,
            targetUnit: preview.targetUnit,
        })
    }, [posthog, preview.biomarkerName, preview.targetUnit, preview.configs, blockedMergesForThisPair])

    const conversionStatusColumns = [
        {
            title: 'Config',
            dataIndex: 'configName',
            key: 'configName',
            render: (_: unknown, record: MergePreview['records'][0]) => record.config.name,
        },
        {
            title: 'Original Value',
            dataIndex: 'originalValue',
            key: 'originalValue',
            render: (_: unknown, record: MergePreview['records'][0]) => {
                if (record.originalValue === undefined) return 'N/A'
                const unitTitle = getNameByUcum(units, record.originalUnit)
                return `${record.originalValue} ${unitTitle}`
            },
        },
        {
            title: 'Converted Value',
            dataIndex: 'convertedValue',
            key: 'convertedValue',
            render: (_: unknown, record: MergePreview['records'][0]) => {
                if (record.convertedValue === undefined) return 'N/A'
                const targetUnitTitle = getNameByUcum(units, preview.targetUnit)
                return `${record.convertedValue.toFixed(2)} ${targetUnitTitle}`
            },
        },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            render: (_: unknown, record: MergePreview['records'][0]) => {
                const status = getConversionStatus(record, preview.targetUnit)
                if (status === 'no-conversion') {
                    return <Tag color='default'>No Conversion</Tag>
                }
                if (status === 'converted') {
                    const isVerified = record.originalUnit && record.originalUnit !== preview.targetUnit
                        ? verifiedConversionsMap.has(createVerifiedConversionKey(preview.biomarkerName, record.originalUnit, preview.targetUnit))
                        : false
                    return <Tag color={isVerified ? 'success' : 'warning'} icon={<CheckCircleOutlined/>}>Converted</Tag>
                }
                if (status === 'failed') {
                    return <Tag color='error' icon={<CloseCircleOutlined/>}>Failed</Tag>
                }
                return <Tag color='warning'>N/A</Tag>
            },
        },
    ]

    const displayedRecords = preview.records
        .filter(r => selectedConfigs.some(c => c.config.id === r.config.id))
        .slice(0, 20)

    return (
        <div>
            <div className='mb-4'>
                <Button
                    icon={<ArrowLeftOutlined/>}
                    onClick={onBack}
                    disabled={merging}
                >
                    Back
                </Button>
            </div>

            <div className='mb-4'>
                <h3 className='text-lg font-semibold mb-2'>Target Unit</h3>
                <Select
                    value={preview.targetUnit}
                    onChange={onTargetUnitChange}
                    style={{ width: '100%' }}
                    disabled={merging}
                >
                    {preview.unitStats.map(stat => (
                        <Select.Option key={stat.unit} value={stat.unit}>
                            {getNameByUcum(units, stat.unit)} ({stat.recordsCount} records)
                        </Select.Option>
                    ))}
                </Select>
            </div>

            <div className='mb-4'>
                <h3 className='text-lg font-semibold mb-2'>Configs to be merged</h3>
                <List
                    dataSource={preview.configs.filter(c => {
                        if (c.recordsCount === 0) return false
                        if (c.isTarget) return true
                        const configUnit = c.config.ucumCode
                        if (!configUnit || configUnit === preview.targetUnit) return true
                        return !isConversionBlocked(preview.biomarkerName, configUnit, preview.targetUnit, blockedMergesMap)
                    })}
                    renderItem={(configInfo) => {
                        const isTarget = configInfo.isTarget
                        const isSelected = configInfo.selected
                        
                        return (
                            <List.Item>
                                <Checkbox
                                    checked={isSelected}
                                    disabled={isTarget || merging}
                                    onChange={(e) => {
                                        if (!isTarget) {
                                            onConfigToggle(configInfo.config.id, e.target.checked)
                                        }
                                    }}
                                >
                                    <span className={isTarget ? 'font-semibold' : ''}>
                                        {configInfo.config.name} [{getNameByUcum(units, configInfo.config.ucumCode)}] ({configInfo.recordsCount} records)
                                        {isTarget && ' [Target]'}
                                    </span>
                                </Checkbox>
                            </List.Item>
                        )
                    }}
                />
            </div>

            {blockedConfigsCount > 0 && (
                <Alert
                    message='Some Configs Excluded'
                    description={(
                        <div className='flex justify-between items-center'>
                            <span>
                                {blockedConfigsCount} config{blockedConfigsCount > 1 ? 's' : ''} with blocked unit conversions {blockedConfigsCount > 1 ? 'have' : 'has'} been automatically excluded from this merge. You previously chose not to merge these unit combinations.
                            </span>
                            <Button
                                size='small'
                                onClick={() => { void handleUnblockMerge() }}
                                disabled={merging}
                            >
                                Allow All
                            </Button>
                        </div>
                    )}
                    type='info'
                    icon={<StopOutlined/>}
                    className='mb-4'
                    showIcon
                />
            )}

            <Modal
                open={showBlockConfirmation}
                onCancel={() => { setShowBlockConfirmation(false) }}
                title="Don't Suggest This Merge Again?"
                width={500}
                footer={[
                    <Button key='cancel' onClick={() => { setShowBlockConfirmation(false) }}>
                        Cancel
                    </Button>,
                    <Button
                        key='confirm'
                        type='primary'
                        danger
                        onClick={() => { void handleBlockMerge() }}
                    >
                        Yes, Don't Suggest
                    </Button>,
                ]}
            >
                <div className='space-y-3'>
                    <p>
                        This will prevent the app from suggesting to combine <b>{preview.biomarkerName}</b> measurements in the future.
                    </p>
                    <div className='bg-gray-50 p-3 rounded'>
                        <div className='text-sm text-gray-600 mb-2'>Values that won't be combined:</div>
                        <div className='space-y-1'>
                            {failedSourceUnits.map(sourceUnit => (
                                <div key={sourceUnit} className='text-sm'>
                                    • {getNameByUcum(units, sourceUnit)} → {getNameByUcum(units, preview.targetUnit)}
                                </div>
                            ))}
                        </div>
                    </div>
                    <p className='text-sm text-gray-600'>
                        You can manage blocked merges later in settings if you change your mind.
                    </p>
                </div>
            </Modal>

            {hasSelectedErrors && (
                <>
                    <Alert
                        message='Conversion Errors'
                        description={`Some units cannot be converted to ${getNameByUcum(units, preview.targetUnit)}. Please review the failed conversions below.`}
                        type='error'
                        icon={<ExclamationCircleOutlined/>}
                        className='mb-4'
                    />
                </>
            )}

            <div className='mb-4'>
                <h3 className='text-lg font-semibold mb-2'>Values to be converted</h3>
                <Table
                    columns={conversionStatusColumns}
                    dataSource={displayedRecords}
                    rowKey={(record) => record.record.id}
                    pagination={false}
                    size='small'
                />
                {preview.records.length > 20 && (
                    <div className='mt-2 text-sm text-gray-500'>
                        Showing first 20 of {preview.records.length} records
                    </div>
                )}
                {sourceUnits.length > 0 && !hasSelectedErrors && (
                    <Alert
                        description={(
                            <span>
                                {hasDefaultVerifiedConversions ? (
                                    <>
                                        This conversion is verified. Records for "<b>{targetConfigInfo?.config.name}</b>" will be automatically converted from <b>{sourceUnits.map(u => getNameByUcum(units, u)).join(', ')}</b> to <b>{getNameByUcum(units, preview.targetUnit)}</b> in future uploads.
                                    </>
                                ) : (
                                    <>
                                        This conversion is not yet verified. Please review the conversion carefully. After confirming the merge, records for "<b>{targetConfigInfo?.config.name}</b>" will be automatically converted from <b>{sourceUnits.map(u => getNameByUcum(units, u)).join(', ')}</b> to <b>{getNameByUcum(units, preview.targetUnit)}</b> in future uploads.
                                    </>
                                )}
                            </span>
                        )}
                        type={hasDefaultVerifiedConversions ? 'success' : 'warning'}
                        className='mt-4'
                        showIcon
                        style={{ padding: '12px 12px' }}
                    />
                )}
            </div>

            {hasSelectedErrors && (
                <div className='mb-4'>
                    <h4 className='font-semibold mb-2'>Failed Conversions:</h4>
                    <div className='space-y-3'>
                        {groupedErrors.map((group, groupIdx) => {
                            const firstItem = group.items[0]
                            const recordInfo = firstItem.recordInfo

                            const conversionMethod = recordInfo.conversionResult.method

                            const details: string[] = []
                            if (conversionMethod !== 'failed') {
                                details.push(`Method attempted: ${conversionMethod}`)
                            }
                            if (recordInfo.config.molecularWeight) {
                                details.push(`Molecular weight: ${recordInfo.config.molecularWeight} g/mol`)
                            }
                            if (recordInfo.config.conversionFactor) {
                                details.push(`Conversion factor: ${recordInfo.config.conversionFactor}`)
                            }

                            return (
                                <div key={groupIdx} className='text-sm'>
                                    <div className='text-red-500 font-medium mb-1'>
                                        {group.error} {group.count > 1 && `(${group.count} records)`}
                                    </div>
                                    {details.length > 0 && (
                                        <div className='text-gray-600 ml-4 mt-1 text-xs space-y-0.5'>
                                            {details.map((detail, detailIdx) => (
                                                <div key={detailIdx}>{detail}</div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )
                        })}
                    </div>
                </div>
            )}

            <div className='flex justify-between items-center'>
                <div>
                    {hasSelectedErrors && failedSourceUnits.length > 0 && (
                        <Button
                            danger
                            onClick={() => { setShowBlockConfirmation(true) }}
                            disabled={merging}
                        >
                            Exclude and don't Suggest Filed
                        </Button>
                    )}
                </div>
                <div className='flex gap-2'>
                    <Button onClick={onBack} disabled={merging}>
                        Cancel
                    </Button>
                    <Button
                        type='primary'
                        onClick={handleMerge}
                        disabled={!canMerge || merging}
                        loading={merging}
                    >
                        Merge {selectedRecordsCount} Records from {selectedConfigsCount} Configs
                    </Button>
                </div>
            </div>
        </div>
    )
}

export const BiomarkerMergeModal = (props: BiomarkerMergeModalProps) => {
    const { open, mergeableBiomarkers, records, onCancel } = props
    const posthog = usePostHog()
    const [selectedBiomarker, setSelectedBiomarker] = useState<string | null>(null)
    const [preview, setPreview] = useState<MergePreview | null>(null)
    const [merging, setMerging] = useState(false)
    const { data: verifiedConversions } = useVerifiedConversions()
    const { data: blockedMerges } = useBlockedMerges()

    const verifiedConversionsMap = useMemo(() => {
        return buildVerifiedConversionsMap(verifiedConversions)
    }, [verifiedConversions])

    const blockedMergesMap = useMemo(() => {
        return buildBlockedMergesMap(blockedMerges)
    }, [blockedMerges])

    const filteredMergeableBiomarkers = useFilteredMergeableBiomarkers(mergeableBiomarkers, records)

    const biomarkerVerificationStatus = useMemo(() => {
        const statusMap = new Map<string, boolean>()
        for (const biomarker of filteredMergeableBiomarkers) {
            const isVerified = isBiomarkerFullyVerified(biomarker, records, verifiedConversionsMap)
            statusMap.set(biomarker.name, isVerified)
        }
        return statusMap
    }, [filteredMergeableBiomarkers, records, verifiedConversionsMap])

    const verifiedBiomarkers = useMemo(() => {
        return filteredMergeableBiomarkers.filter(b => biomarkerVerificationStatus.get(b.name) === true)
    }, [filteredMergeableBiomarkers, biomarkerVerificationStatus])

    const handleBiomarkerSelect = useCallback((name: string) => {
        const biomarker = filteredMergeableBiomarkers.find(b => b.name === name)
        if (!biomarker) return

        const biomarkerRecordsForPreview = records.filter(r =>
            biomarker.configs.some(c => c.id === r.biomarkerId) && r.approved,
        )
        const targetUnit = getBestTargetUnit(name, biomarker.configs, biomarkerRecordsForPreview, blockedMergesMap) ?? biomarker.configs[0]?.ucumCode ?? ''
        const newPreview = createMergePreview(name, biomarker.configs, biomarkerRecordsForPreview, targetUnit)
        setPreview(newPreview)
        setSelectedBiomarker(name)
        captureEvent(posthog, 'biomarker_merge_preview_opened', {
            biomarkerName: name,
            configsCount: biomarker.configs.length,
            recordsCount: biomarker.recordsCount,
        })
    }, [filteredMergeableBiomarkers, records, blockedMergesMap, posthog])

    const handleBack = useCallback(() => {
        setSelectedBiomarker(null)
        setPreview(null)
    }, [])

    const handleTargetUnitChange = useCallback((unit: string) => {
        if (!selectedBiomarker || !preview) return
        const biomarker = filteredMergeableBiomarkers.find(b => b.name === selectedBiomarker)
        if (!biomarker) return
        const biomarkerRecordsForPreview = records.filter(r =>
            biomarker.configs.some(c => c.id === r.biomarkerId) && r.approved,
        )
        const newPreview = createMergePreview(selectedBiomarker, biomarker.configs, biomarkerRecordsForPreview, unit)
        setPreview(newPreview)
    }, [selectedBiomarker, preview, filteredMergeableBiomarkers, records])

    const handleConfigToggle = useCallback((configId: string, selected: boolean) => {
        if (!preview) return
        const newPreview = {
            ...preview,
            configs: preview.configs.map(c =>
                c.config.id === configId ? {
                    ...c,
                    selected,
                } : c,
            ),
        }
        setPreview(newPreview)
    }, [preview])

    const executeMerge = useCallback(async (previewToMerge: MergePreview) => {
        const selectedConfigs = previewToMerge.configs.filter(c => c.selected)
        const targetConfig = selectedConfigs.find(c => c.isTarget)

        if (!targetConfig) {
            throw new Error('Target config not found')
        }

        const recordsToUpdate: BiomarkerRecord[] = []
        const configsToDelete: string[] = []

        for (const configInfo of selectedConfigs) {
            if (configInfo.isTarget) continue

            const configRecords = previewToMerge.records.filter(r =>
                r.config.id === configInfo.config.id &&
                r.conversionResult.method !== 'failed' &&
                r.convertedValue !== undefined,
            )

            for (const recordInfo of configRecords) {
                const updatedRecord: BiomarkerRecord = {
                    ...recordInfo.record,
                    biomarkerId: targetConfig.config.id,
                    originalValue: recordInfo.originalValue ?? recordInfo.record.value,
                    originalUnit: recordInfo.originalUnit || recordInfo.record.ucumCode,
                    value: recordInfo.convertedValue !== undefined
                        ? Math.round(recordInfo.convertedValue * 100) / 100
                        : undefined,
                    ucumCode: previewToMerge.targetUnit,
                }
                recordsToUpdate.push(updatedRecord)
            }

            configsToDelete.push(configInfo.config.id)
        }

        const { db } = await import('@/db/services/db.service')

        await db.biomarkerRecords.bulkPut(recordsToUpdate)
        await db.biomarkerConfigs.bulkDelete(configsToDelete)

        const savedConversions = new Set<string>()

        for (const configInfo of selectedConfigs) {
            if (configInfo.isTarget) continue

            const sourceUnit = configInfo.config.ucumCode
            if (!sourceUnit || sourceUnit === previewToMerge.targetUnit) continue

            const conversionKey = createVerifiedConversionKey(previewToMerge.biomarkerName, sourceUnit, previewToMerge.targetUnit)
            if (savedConversions.has(conversionKey)) continue

            const sampleRecord = previewToMerge.records.find(r =>
                r.config.id === configInfo.config.id &&
                r.conversionResult.method !== 'failed',
            )

            if (!sampleRecord) continue

            const conversionMethod = sampleRecord.conversionResult.method
            if (conversionMethod === 'failed') continue

            await addVerifiedConversion({
                biomarkerName: previewToMerge.biomarkerName,
                sourceUnit,
                targetUnit: previewToMerge.targetUnit,
                conversionMethod: conversionMethod as VerifiedConversionMethod,
                molecularWeight: configInfo.config.molecularWeight,
                conversionFactor: configInfo.config.conversionFactor,
            })

            savedConversions.add(conversionKey)
        }

        return {
            recordsMerged: recordsToUpdate.length,
            configsDeleted: configsToDelete.length,
        }
    }, [])

    const handleMerge = useCallback(async () => {
        if (!preview || !selectedBiomarker) return

        setMerging(true)
        captureEvent(posthog, 'biomarker_merge_started', {
            biomarkerName: preview.biomarkerName,
            targetUnit: preview.targetUnit,
            configsCount: preview.configs.filter(c => c.selected).length,
        })

        try {
            const result = await executeMerge(preview)

            captureEvent(posthog, 'biomarker_merge_completed', {
                biomarkerName: preview.biomarkerName,
                targetUnit: preview.targetUnit,
                recordsMerged: result.recordsMerged,
                configsDeleted: result.configsDeleted,
            })

            setMerging(false)
            setSelectedBiomarker(null)
            setPreview(null)
            onCancel()
        } catch {
            setMerging(false)
        }
    }, [preview, selectedBiomarker, posthog, onCancel, executeMerge])

    const handleMergeAllVerified = useCallback(async () => {
        if (verifiedBiomarkers.length === 0) return

        setMerging(true)
        captureEvent(posthog, 'biomarker_merge_all_verified_started', {
            biomarkersCount: verifiedBiomarkers.length,
        })

        const results: Array<{ biomarkerName: string, success: boolean, recordsMerged?: number, configsDeleted?: number, error?: string }> = []

        for (const biomarker of verifiedBiomarkers) {
            try {
                const biomarkerRecords = records.filter(r =>
                    biomarker.configs.some(c => c.id === r.biomarkerId) && r.approved,
                )

                if (biomarkerRecords.length === 0) {
                    results.push({
                        biomarkerName: biomarker.name,
                        success: false,
                        error: 'No records found',
                    })
                    continue
                }

                const targetUnit = getBestTargetUnit(biomarker.name, biomarker.configs, biomarkerRecords, blockedMergesMap) ?? biomarker.configs[0]?.ucumCode ?? ''
                if (!targetUnit) {
                    results.push({
                        biomarkerName: biomarker.name,
                        success: false,
                        error: 'No target unit found',
                    })
                    continue
                }

                const previewToMerge = createMergePreview(biomarker.name, biomarker.configs, biomarkerRecords, targetUnit)

                if (previewToMerge.hasErrors && previewToMerge.failedConversions.length > 0) {
                    results.push({
                        biomarkerName: biomarker.name,
                        success: false,
                        error: 'Has conversion errors',
                    })
                    continue
                }

                const selectedConfigs = previewToMerge.configs.filter(c => c.selected && c.recordsCount > 0)
                if (selectedConfigs.length < 2) {
                    results.push({
                        biomarkerName: biomarker.name,
                        success: false,
                        error: 'Not enough configs to merge',
                    })
                    continue
                }

                const result = await executeMerge(previewToMerge)
                results.push({
                    biomarkerName: biomarker.name,
                    success: true,
                    recordsMerged: result.recordsMerged,
                    configsDeleted: result.configsDeleted,
                })
            } catch (error) {
                results.push({
                    biomarkerName: biomarker.name,
                    success: false,
                    error: error instanceof Error ? error.message : 'Unknown error',
                })
            }
        }

        const successful = results.filter(r => r.success)
        const failed = results.filter(r => !r.success)

        captureEvent(posthog, 'biomarker_merge_all_verified_completed', {
            totalBiomarkers: verifiedBiomarkers.length,
            successfulCount: successful.length,
            failedCount: failed.length,
            totalRecordsMerged: successful.reduce((sum, r) => sum + (r.recordsMerged ?? 0), 0),
            totalConfigsDeleted: successful.reduce((sum, r) => sum + (r.configsDeleted ?? 0), 0),
        })

        setMerging(false)
        onCancel()
    }, [verifiedBiomarkers, records, blockedMergesMap, posthog, onCancel, executeMerge])

    const handleCancel = useCallback(() => {
        if (merging) return
        captureEvent(posthog, 'biomarker_merge_cancelled', {
            biomarkerName: selectedBiomarker ?? undefined,
        })
        setSelectedBiomarker(null)
        setPreview(null)
        onCancel()
    }, [merging, posthog, selectedBiomarker, onCancel])

    return (
        <Modal
            open={open}
            onCancel={handleCancel}
            title='Merge Biomarkers'
            width={800}
            footer={null}
            closable={!merging}
            maskClosable={!merging}
        >
            {!selectedBiomarker ? (
                <div>
                    <div className='mb-4 flex justify-between items-center'>
                        <h3 className='text-lg font-semibold'>Select Biomarker to Merge</h3>
                        {verifiedBiomarkers.length > 0 && (
                            <Button
                                type='primary'
                                onClick={() => { void handleMergeAllVerified() }}
                                disabled={merging}
                                loading={merging}
                            >
                                Merge All Verified ({verifiedBiomarkers.length})
                            </Button>
                        )}
                    </div>
                    <List
                        dataSource={filteredMergeableBiomarkers}
                        renderItem={(biomarker) => {
                            const isVerified = biomarkerVerificationStatus.get(biomarker.name) === true
                            return (
                                <List.Item
                                    actions={[
                                        <Button
                                            key='preview'
                                            type='link'
                                            onClick={() => { handleBiomarkerSelect(biomarker.name) }}
                                            disabled={merging}
                                        >
                                            Preview Merge
                                        </Button>,
                                    ]}
                                >
                                    <List.Item.Meta
                                        title={(
                                            <span className='flex items-center gap-2'>
                                                {isVerified ? (
                                                    <CheckCircleOutlined style={{ color: COLORS.SUCCESS }}/>
                                                ) : (
                                                    <ExclamationCircleOutlined style={{ color: COLORS.WARNING }}/>
                                                )}
                                                {biomarker.name}
                                            </span>
                                        )}
                                        description={`${biomarker.configs.length} configs, ${biomarker.recordsCount} records`}
                                    />
                                </List.Item>
                            )
                        }}
                    />
                </div>
            ) : (
                preview && (
                    <MergePreviewScreen
                        preview={preview}
                        onBack={handleBack}
                        onMerge={() => { void handleMerge() }}
                        onTargetUnitChange={handleTargetUnitChange}
                        onConfigToggle={handleConfigToggle}
                        merging={merging}
                    />
                )
            )}
        </Modal>
    )
}

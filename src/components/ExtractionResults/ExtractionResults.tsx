import { useCallback, useEffect, useMemo, useState } from 'react'

import { CellValueChangedEvent, ColDef } from '@ag-grid-community/core'
import { AgGridReact } from '@ag-grid-community/react'
import { DeleteOutlined, PlusOutlined } from '@ant-design/icons'
import { Button, message } from 'antd'
import { usePostHog } from 'posthog-js/react'

import { createNormalRangeMaxColumn, createNormalRangeMinColumn, createOriginalNameColumn, createPageColumn, createValueColumn } from '@/aggrid/columns/biomarkerColumns'
import { validateRanges } from '@/aggrid/validators/rangeValidators'
import { CreateBiomarkerModal } from '@/components/CreateBiomarkerModal'
import { CreateUnitModal } from '@/components/CreateUnitModal'
import { ValidationWarning } from '@/components/ValidationWarning'
import { updateBiomarkerConfig, useBiomarkerConfigs } from '@/db/models/biomarkerConfig'
import { deleteBiomarkerRecord, updateBiomarkerRecord } from '@/db/models/biomarkerRecord'
import { useUnits } from '@/db/models/unit'
import { ExtractedBiomarker } from '@/openai/openai.biomarkers'
import { captureEvent } from '@/utils'
import { getInvalidCellStyle } from '@/utils/cellStyle'

import { ExtractionResultsProps } from './ExtractionResults.types'

export const ExtractionResults = (props: ExtractionResultsProps) => {
    const { biomarkers, onSave, onCancel, onAddNew, className } = props
    const posthog = usePostHog()
    const [rowData, setRowData] = useState<ExtractedBiomarker[]>(biomarkers)
    const [isBiomarkerModalOpen, setIsBiomarkerModalOpen] = useState(false)
    const [isUnitModalOpen, setIsUnitModalOpen] = useState(false)
    const { data: units } = useUnits()
    const { data: configs } = useBiomarkerConfigs()

    const handleDelete = useCallback(async (id?: string) => {
        if (id) {
            await deleteBiomarkerRecord(id)
        }
    }, [])

    const hasInvalidBiomarkers = useMemo(() => {
        return rowData.some(b => !b.name || (b.value === undefined && !b.textValue))
    }, [rowData])

    const biomarkerOptions = useMemo(() => {
        return configs.map(config => {
            const unit = units.find(u => u.ucumCode === config.ucumCode)
            return {
                value: config.id,
                label: `${config.name} (${unit?.title ?? 'N/A'})`,
            }
        })
    }, [configs, units])

    const columnDefs = useMemo<Array<ColDef<ExtractedBiomarker>>>(() => [
        createPageColumn<ExtractedBiomarker>(),
        {
            field: 'name',
            headerName: 'Name',
            flex: 1.5,
            minWidth: 250,
            editable: true,
            cellEditor: 'agSelectCellEditor',
            cellEditorParams: {
                values: biomarkerOptions.map(opt => opt.label),
            },
            valueGetter: (params) => {
                const config = configs.find(c => c.id === params.data?.biomarkerId)
                if (config) {
                    const unit = units.find(u => u.ucumCode === config.ucumCode)
                    return `${config.name} (${unit?.title ?? 'N/A'})`
                }
                return params.data?.name
            },
            valueSetter: (params) => {
                if (params.data) {
                    const selectedOption = biomarkerOptions.find(opt => opt.label === params.newValue)
                    if (selectedOption) {
                        const config = configs.find(c => c.id === selectedOption.value)
                        if (config) {
                            params.data.biomarkerId = config.id
                            params.data.name = config.name
                            params.data.ucumCode = config.ucumCode ?? undefined
                            return true
                        }
                    }
                }
                return false
            },
            cellStyle: (params) => getInvalidCellStyle(params, (data) => !data?.name),
        },
        createOriginalNameColumn<ExtractedBiomarker>(),
        createValueColumn<ExtractedBiomarker>(units),
        createNormalRangeMinColumn<ExtractedBiomarker>(),
        createNormalRangeMaxColumn<ExtractedBiomarker>(),
        {
            colId: 'delete',
            headerName: '',
            minWidth: 90,
            flex: 0.4,
            suppressMenu: true,
            sortable: false,
            filter: false,
            editable: false,
            cellRenderer: (params: { data: ExtractedBiomarker }) => {
                return (
                    <Button
                        type='text'
                        danger
                        icon={<DeleteOutlined/>}
                        onClick={() => { void handleDelete(params.data.id) }}
                    />
                )
            },
        },
    ], [handleDelete, biomarkerOptions, configs, units])

    const onCellValueChanged = useCallback(async (event: CellValueChangedEvent<ExtractedBiomarker>) => {
        const row = event.data

        if (row) {
            const validation = validateRanges(row.normalRange, row.targetRange)

            if (!validation.isValid) {
                void message.error(validation.errors.join('. '))
            }
        }

        setRowData(prev => [...prev])

        if (row?.id) {
            await updateBiomarkerRecord(row.id, {
                biomarkerId: row.biomarkerId,
                value: row.value,
                textValue: row.textValue,
                ucumCode: row.ucumCode ?? undefined,
            })

            if (row.biomarkerId) {
                await updateBiomarkerConfig(row.biomarkerId, {
                    normalRange: row.normalRange,
                    targetRange: row.targetRange,
                })
            }
        }
    }, [])

    useEffect(() => {
        setRowData(biomarkers)
    }, [biomarkers])

    const handleSave = () => {
        captureEvent(posthog, 'extraction_results_saved', {
            biomarkersCount: rowData.length,
        })
        onSave(rowData)
    }

    const handleAddNewClick = () => {
        captureEvent(posthog, 'extraction_results_add_new_clicked')
        if (onAddNew) {
            onAddNew()
        }
    }

    return (
        <div className={`bg-white p-4 rounded border border-gray-100 flex flex-col ${className ?? ''}`}>
            <div className='mb-4'>
                <div className='flex justify-between items-center mb-2'>
                    <h3 className='text-lg font-medium'>Verify New Records ({biomarkers.length})</h3>
                    <div className='flex gap-2'>
                        <Button size='small' icon={<PlusOutlined/>} onClick={() => { setIsUnitModalOpen(true) }}>
                            Add Unit
                        </Button>
                        <Button size='small' icon={<PlusOutlined/>} onClick={() => { setIsBiomarkerModalOpen(true) }}>
                            Add Biomarker
                        </Button>
                        {onAddNew && (
                            <Button size='small' icon={<PlusOutlined/>} onClick={handleAddNewClick}>
                                Add Record
                            </Button>
                        )}
                    </div>
                </div>
                <p className='text-sm text-gray-600'>Click on any cell to edit values and correct results</p>
            </div>

            {hasInvalidBiomarkers && (
                <ValidationWarning message='Some values are empty. Please fill them manually or retry the extraction to continue.'/>
            )}

            <div className='ag-theme-material flex-1 mb-4'>
                <AgGridReact
                    rowData={rowData}
                    columnDefs={columnDefs}
                    domLayout='normal'
                    onCellValueChanged={(event) => { void onCellValueChanged(event) }}
                />
            </div>

            <div className='flex gap-2 justify-end'>
                <Button
                    onClick={() => {
                        captureEvent(posthog, 'extraction_results_cancelled')
                        onCancel()
                    }}
                >
                    Cancel
                </Button>
                <Button type='primary' onClick={handleSave} disabled={hasInvalidBiomarkers}>
                    Save Results
                </Button>
            </div>

            <CreateBiomarkerModal
                open={isBiomarkerModalOpen}
                onCancel={() => { setIsBiomarkerModalOpen(false) }}
            />

            <CreateUnitModal
                open={isUnitModalOpen}
                onCancel={() => { setIsUnitModalOpen(false) }}
            />
        </div>
    )
}

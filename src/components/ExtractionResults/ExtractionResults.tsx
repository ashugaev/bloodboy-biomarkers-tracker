import { useCallback, useEffect, useMemo, useState } from 'react'

import { CellValueChangedEvent, ColDef } from '@ag-grid-community/core'
import { AgGridReact } from '@ag-grid-community/react'
import { DeleteOutlined, PlusOutlined } from '@ant-design/icons'
import { Button, message } from 'antd'

import { createOriginalNameColumn, createPageColumn, createValueColumn } from '@/aggrid/columns/biomarkerColumns'
import { ValidationWarning } from '@/components/ValidationWarning'
import { BiomarkerRecord, deleteBiomarkerRecord, modifyBiomarkerRecord } from '@/db/models/biomarkerRecord'
import { useUnits } from '@/db/models/unit'
import { ExtractedBiomarker } from '@/openai/openai.biomarkers'
import { getInvalidCellStyle } from '@/utils/cellStyle'

import { ExtractionResultsProps } from './ExtractionResults.types'

export const ExtractionResults = (props: ExtractionResultsProps) => {
    const { biomarkers, configs, onSave, onCancel, onAddNew, className } = props
    const [rowData, setRowData] = useState<ExtractedBiomarker[]>(biomarkers)
    const { data: units } = useUnits()

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
                            params.data.ucumCode = config.ucumCode ?? null
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

    const onCellValueChanged = useCallback((event: CellValueChangedEvent<ExtractedBiomarker>) => {
        const data = event.data
        const colDef = event.colDef
        const newValue = event.newValue as number | string | undefined
        const field = colDef.field as string

        setRowData(prev => [...prev])

        if (!data?.id) {
            void message.error('Failed to update biomarker record')
            return
        }

        if (field === 'name') {
            const selectedOption = biomarkerOptions.find(opt => opt.label === newValue)
            if (selectedOption) {
                const config = configs.find(c => c.id === selectedOption.value)
                if (config?.ucumCode) {
                    void modifyBiomarkerRecord(data.id, (record) => {
                        (record as unknown as Record<string, unknown>).biomarkerId = config.id;
                        (record as unknown as Record<string, unknown>).ucumCode = config.ucumCode ?? ''
                    })
                }
            }
        } else if (field === 'value') {
            void modifyBiomarkerRecord(data.id, (record: BiomarkerRecord) => {
                if (data.textValue !== undefined) {
                    record.textValue = data.textValue
                    record.value = undefined
                } else if (data.value !== undefined) {
                    record.value = data.value
                    record.textValue = undefined
                }
            })
        } else if (field && newValue !== undefined) {
            void modifyBiomarkerRecord(data.id, (record) => {
                (record as unknown as Record<string, unknown>)[field] = newValue
            })
        }
    }, [biomarkerOptions, configs])

    useEffect(() => {
        setRowData(biomarkers)
    }, [biomarkers])

    const handleSave = () => {
        onSave(rowData)
    }

    const handleAddNewClick = () => {
        if (onAddNew) {
            onAddNew()
        }
    }

    return (
        <div className={`bg-white p-4 rounded border border-gray-100 flex flex-col ${className ?? ''}`}>
            <div className='mb-4'>
                <div className='flex justify-between items-center mb-2'>
                    <h3 className='text-lg font-medium'>Verify New Records ({biomarkers.length})</h3>
                    {onAddNew && (
                        <Button size='small' icon={<PlusOutlined/>} onClick={handleAddNewClick}>
                            Add New
                        </Button>
                    )}
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
                    onCellValueChanged={onCellValueChanged}
                />
            </div>

            <div className='flex gap-2 justify-end'>
                <Button onClick={onCancel}>
                    Cancel
                </Button>
                <Button type='primary' onClick={handleSave} disabled={hasInvalidBiomarkers}>
                    Save Results
                </Button>
            </div>
        </div>
    )
}

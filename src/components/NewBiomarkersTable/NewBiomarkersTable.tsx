import { useCallback, useEffect, useMemo, useState } from 'react'

import { ColDef, CellValueChangedEvent } from '@ag-grid-community/core'
import { AgGridReact } from '@ag-grid-community/react'
import { DeleteOutlined, PlusOutlined } from '@ant-design/icons'
import { Button } from 'antd'

import { ValidationWarning } from '@/components/ValidationWarning'
import { updateBiomarkerConfig, deleteBiomarkerConfig, addBiomarkerConfig } from '@/db/hooks/useBiomarkerConfigs'
import { Unit } from '@/db/types'
import { createBiomarkerConfig } from '@/db/utils/biomarker.utils'
import { getInvalidCellStyle } from '@/utils/cellStyles'

import { NewBiomarkerRow, NewBiomarkersTableProps } from './NewBiomarkersTable.types'

export const NewBiomarkersTable = (props: NewBiomarkersTableProps) => {
    const { biomarkers, onSave, onCancel, className } = props
    const [rowData, setRowData] = useState<NewBiomarkerRow[]>(biomarkers)

    const handleDelete = useCallback(async (id?: string) => {
        if (id) {
            await deleteBiomarkerConfig(id)
        }
    }, [])

    const handleAddNew = useCallback(async () => {
        const newConfig = await createBiomarkerConfig({
            name: '',
            approved: false,
        })
        await addBiomarkerConfig(newConfig)
    }, [])

    useEffect(() => {
        setRowData(biomarkers)
    }, [biomarkers])

    const isValid = useMemo(() => {
        return rowData.every(row => row.name && row.defaultUnit)
    }, [rowData])

    const columnDefs = useMemo<Array<ColDef<NewBiomarkerRow>>>(() => [
        {
            field: 'name',
            headerName: 'Name',
            flex: 1,
            editable: true,
            minWidth: 200,
            cellStyle: (params) => getInvalidCellStyle(params, (data) => !data?.name),
        },
        {
            field: 'defaultUnit',
            headerName: 'Unit',
            flex: 0.8,
            editable: true,
            cellEditor: 'agSelectCellEditor',
            cellEditorParams: {
                values: Object.values(Unit),
            },
            minWidth: 100,
            cellStyle: (params) => getInvalidCellStyle(params, (data) => !data?.defaultUnit),
        },
        {
            field: 'normalRange.min',
            headerName: 'Min.',
            flex: 0.6,
            minWidth: 100,
            editable: true,
            valueGetter: (params) => params.data?.normalRange?.min,
            valueSetter: (params) => {
                if (params.data) {
                    if (!params.data.normalRange) {
                        params.data.normalRange = {
                            min: 0,
                            max: 0,
                        }
                    }
                    params.data.normalRange.min = Number(params.newValue)
                    return true
                }
                return false
            },
        },
        {
            field: 'normalRange.max',
            headerName: 'Max.',
            flex: 0.6,
            minWidth: 100,
            editable: true,
            valueGetter: (params) => params.data?.normalRange?.max,
            valueSetter: (params) => {
                if (params.data) {
                    if (!params.data.normalRange) {
                        params.data.normalRange = {
                            min: 0,
                            max: 0,
                        }
                    }
                    params.data.normalRange.max = Number(params.newValue)
                    return true
                }
                return false
            },
        },
        {
            field: 'targetRange.min',
            minWidth: 130,
            headerName: 'Optimal Min.',
            flex: 0.7,
            editable: true,
            valueGetter: (params) => params.data?.targetRange?.min ?? '',
            valueSetter: (params) => {
                if (params.data) {
                    if (!params.data.targetRange) {
                        params.data.targetRange = {
                            min: 0,
                            max: 0,
                        }
                    }
                    params.data.targetRange.min = Number(params.newValue)
                    return true
                }
                return false
            },
        },
        {
            field: 'targetRange.max',
            minWidth: 130,
            headerName: 'Optimal Max.',
            flex: 0.7,
            editable: true,
            valueGetter: (params) => params.data?.targetRange?.max ?? '',
            valueSetter: (params) => {
                if (params.data) {
                    if (!params.data.targetRange) {
                        params.data.targetRange = {
                            min: 0,
                            max: 0,
                        }
                    }
                    params.data.targetRange.max = Number(params.newValue)
                    return true
                }
                return false
            },
        },
        {
            colId: 'delete',
            headerName: '',
            minWidth: 80,
            flex: 0.4,
            suppressMenu: true,
            sortable: false,
            filter: false,
            editable: false,
            cellRenderer: (params: { data: NewBiomarkerRow }) => {
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
    ], [handleDelete])

    const onCellValueChanged = useCallback(async (event: CellValueChangedEvent<NewBiomarkerRow>) => {
        const row = event.data
        setRowData(prev => [...prev])

        if (row?.id) {
            await updateBiomarkerConfig(row.id, {
                name: row.name,
                unit: row.defaultUnit,
                normalRange: row.normalRange,
                targetRange: row.targetRange,
            })
        }
    }, [])

    const handleSave = () => {
        onSave(rowData)
    }

    return (
        <div className={`bg-white p-6 rounded-lg shadow-sm flex flex-col ${className ?? ''}`}>
            <div className='mb-4'>
                <div className='flex justify-between items-center mb-2'>
                    <h3 className='text-lg font-medium'>Verify New Biomarker Configs ({biomarkers.length})</h3>
                    <Button icon={<PlusOutlined/>} onClick={() => { void handleAddNew() }}>
                        Add New
                    </Button>
                </div>
                <p className='text-sm text-gray-600'>First review and configure new biomarker references and target ranges to add to the database</p>
            </div>

            {!isValid && (
                <ValidationWarning message='Some values are empty. Please fill them manually to continue.'/>
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
                <Button onClick={onCancel}>
                    Cancel
                </Button>
                <Button type='primary' onClick={handleSave} disabled={!isValid}>
                    Continue
                </Button>
            </div>
        </div>
    )
}

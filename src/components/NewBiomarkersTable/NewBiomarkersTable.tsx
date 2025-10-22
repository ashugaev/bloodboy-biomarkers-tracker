import { useCallback, useMemo, useState } from 'react'

import { ColDef } from '@ag-grid-community/core'
import { AgGridReact } from '@ag-grid-community/react'
import { Button } from 'antd'

import { Unit } from '@/db/types'

import { NewBiomarkerRow, NewBiomarkersTableProps } from './NewBiomarkersTable.types'

export const NewBiomarkersTable = (props: NewBiomarkersTableProps) => {
    const { biomarkers, onSave, onCancel, className } = props
    const [rowData, setRowData] = useState<NewBiomarkerRow[]>(biomarkers)

    const handleDelete = useCallback((rowIndex: number) => {
        setRowData(prev => prev.filter((_, index) => index !== rowIndex))
    }, [])

    const columnDefs = useMemo<Array<ColDef<NewBiomarkerRow>>>(() => [
        {
            field: 'name',
            headerName: 'Name',
            flex: 1,
            editable: true,
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
        },
        {
            field: 'normalRange.min',
            headerName: 'Min',
            flex: 0.6,
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
            headerName: 'Max',
            flex: 0.6,
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
            headerName: 'Target Min',
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
            headerName: 'Target Max',
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
            headerName: '',
            flex: 0.4,
            cellRenderer: (params: { rowIndex: number }) => {
                return (
                    <button
                        onClick={() => { handleDelete(params.rowIndex) }}
                        className='text-red-600 hover:text-red-800'
                    >
                        Delete
                    </button>
                )
            },
        },
    ], [handleDelete])

    const onCellValueChanged = useCallback(() => {
        setRowData([...rowData])
    }, [rowData])

    const handleSave = () => {
        onSave(rowData)
    }

    return (
        <div className={`bg-white p-6 rounded-lg shadow-sm ${className ?? ''}`}>
            <div className='mb-4'>
                <h3 className='text-lg font-medium'>New Biomarkers ({biomarkers.length})</h3>
                <p className='text-sm text-gray-600 mt-1'>Review and configure new biomarkers to add to the database</p>
            </div>

            <div className='ag-theme-material h-96 mb-4'>
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
                <Button type='primary' onClick={handleSave}>
                    Continue
                </Button>
            </div>
        </div>
    )
}

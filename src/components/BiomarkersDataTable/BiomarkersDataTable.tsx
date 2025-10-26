import { memo, useCallback, useMemo } from 'react'

import { CellValueChangedEvent, ColDef, ICellRendererParams } from '@ag-grid-community/core'
import { AgGridReact } from '@ag-grid-community/react'
import { DeleteOutlined, RightOutlined } from '@ant-design/icons'
import { Button } from 'antd'
import { useNavigate } from 'react-router-dom'

import { AddNewButton } from '@/components/AddNewButton'
import { addBiomarkerConfig, deleteBiomarkerConfig, updateBiomarkerConfig, useBiomarkerConfigs } from '@/db/hooks/useBiomarkerConfigs'
import { useBiomarkerRecords } from '@/db/hooks/useBiomarkerRecords'
import { useUnits } from '@/db/hooks/useUnits'
import { createBiomarkerConfig } from '@/db/utils/biomarker.utils'
import { getInvalidCellStyle, getRangeCellStyle } from '@/utils/cellStyle'

import { BiomarkerRowData, BiomarkersDataTableProps } from './BiomarkersDataTable.types'

export const BiomarkersDataTable = (props: BiomarkersDataTableProps) => {
    const { className } = props
    const { configs } = useBiomarkerConfigs(true)
    const { records } = useBiomarkerRecords()
    const { units } = useUnits()
    const navigate = useNavigate()

    const handleDelete = useCallback(async (id: string) => {
        await deleteBiomarkerConfig(id)
    }, [])

    const handleViewRecords = useCallback((id: string) => {
        void navigate(`/biomarker/${id}`)
    }, [navigate])

    const handleAddNew = useCallback(async () => {
        const newConfig = await createBiomarkerConfig({
            name: '',
            approved: true,
        })
        await addBiomarkerConfig(newConfig)
    }, [])

    const rowData = useMemo(() => {
        return configs.map(config => {
            const configRecords = records.filter(r => r.biomarkerId === config.id && r.approved)
            const values = configRecords.map(r => r.value).filter((v): v is number => v !== undefined)
            const unit = units.find(u => u.ucumCode === config.ucumCode)

            return {
                ...config,
                unitTitle: unit?.title,
                stats: {
                    lastMeasurement: values.length > 0 ? values[values.length - 1] : undefined,
                    maxResult: values.length > 0 ? Math.max(...values) : undefined,
                    minResult: values.length > 0 ? Math.min(...values) : undefined,
                },
            }
        })
    }, [configs, records, units])

    const ViewButtonCellRenderer = useMemo(() => {
        return memo((cellProps: ICellRendererParams<BiomarkerRowData>) => (
            <Button
                icon={<RightOutlined/>}
                iconPosition='end'
                type='link'
                onClick={() => {
                    if (cellProps.data?.id) {
                        handleViewRecords(cellProps.data.id)
                    }
                }}
            >
                View All Records
            </Button>
        ))
    }, [handleViewRecords])

    const DeleteButtonCellRenderer = useMemo(() => {
        return memo((cellProps: ICellRendererParams<BiomarkerRowData>) => (
            <Button
                type='text'
                danger
                icon={<DeleteOutlined/>}
                onClick={() => {
                    if (cellProps.data?.id) {
                        void handleDelete(cellProps.data.id)
                    }
                }}
            />
        ))
    }, [handleDelete])

    const columnDefs = useMemo<Array<ColDef<BiomarkerRowData>>>(() => [
        {
            colId: 'view',
            headerName: '',
            minWidth: 220,
            flex: 0.3,
            suppressHeaderMenuButton: true,
            sortable: false,
            filter: false,
            editable: false,
            cellRenderer: ViewButtonCellRenderer,
        },
        {
            field: 'name',
            headerName: 'Name',
            flex: 1.2,
            minWidth: 180,
            sortable: true,
            sort: 'asc',
            editable: true,
            cellStyle: (params) => getInvalidCellStyle(params, (data) => !data?.name),
        },
        {
            field: 'unitTitle',
            headerName: 'Unit',
            flex: 0.7,
            minWidth: 100,
            editable: true,
            cellEditor: 'agSelectCellEditor',
            cellEditorParams: {
                values: units.map(u => u.title),
            },
            valueSetter: (params) => {
                if (params.data) {
                    const selectedUnit = units.find(u => u.title === params.newValue)
                    if (selectedUnit) {
                        params.data.unitTitle = selectedUnit.title
                        return true
                    }
                }
                return false
            },
            cellStyle: (params) => getInvalidCellStyle(params, (data) => {
                return !data?.ucumCode?.trim()
            }),
        },
        {
            field: 'normalRange.min',
            headerName: 'Normal Min',
            flex: 0.7,
            minWidth: 100,
            editable: true,
            valueGetter: (params) => params.data?.normalRange?.min,
            valueSetter: (params) => {
                if (params.data) {
                    if (!params.data.normalRange) {
                        params.data.normalRange = {}
                    }
                    params.data.normalRange.min = Number(params.newValue)
                    return true
                }
                return false
            },
        },
        {
            field: 'normalRange.max',
            headerName: 'Normal Max',
            flex: 0.7,
            minWidth: 100,
            editable: true,
            valueGetter: (params) => params.data?.normalRange?.max,
            valueSetter: (params) => {
                if (params.data) {
                    if (!params.data.normalRange) {
                        params.data.normalRange = {}
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
            minWidth: 100,
            editable: true,
            valueGetter: (params) => params.data?.targetRange?.min ?? '',
            valueSetter: (params) => {
                if (params.data) {
                    if (!params.data.targetRange) {
                        params.data.targetRange = {}
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
            minWidth: 100,
            editable: true,
            valueGetter: (params) => params.data?.targetRange?.max ?? '',
            valueSetter: (params) => {
                if (params.data) {
                    if (!params.data.targetRange) {
                        params.data.targetRange = {}
                    }
                    params.data.targetRange.max = Number(params.newValue)
                    return true
                }
                return false
            },
        },
        {
            field: 'stats.lastMeasurement',
            headerName: 'Last',
            flex: 0.6,
            minWidth: 90,
            editable: false,
            valueGetter: (params) => params.data?.stats.lastMeasurement ?? '',
            cellStyle: (params) => getRangeCellStyle(
                params.data?.stats.lastMeasurement,
                params.data?.normalRange,
                params.data?.targetRange,
            ),
        },
        {
            field: 'stats.maxResult',
            headerName: 'Max',
            flex: 0.6,
            minWidth: 90,
            editable: false,
            valueGetter: (params) => params.data?.stats.maxResult ?? '',
        },
        {
            field: 'stats.minResult',
            headerName: 'Min',
            flex: 0.6,
            minWidth: 90,
            editable: false,
            valueGetter: (params) => params.data?.stats.minResult ?? '',
        },
        {
            colId: 'delete',
            headerName: '',
            minWidth: 80,
            flex: 0.4,
            suppressHeaderMenuButton: true,
            sortable: false,
            filter: false,
            editable: false,
            cellRenderer: DeleteButtonCellRenderer,
        },
    ], [ViewButtonCellRenderer, DeleteButtonCellRenderer, units])

    const onCellValueChanged = useCallback(async (event: CellValueChangedEvent<BiomarkerRowData>) => {
        const row = event.data

        if (row?.id) {
            await updateBiomarkerConfig(row.id, {
                name: row.name,
                ucumCode: row.ucumCode,
                normalRange: row.normalRange,
                targetRange: row.targetRange,
            })
        }
    }, [])

    return (
        <div className={`bg-white p-6 rounded-lg shadow-sm flex flex-col ${className ?? ''}`}>
            <div className='mb-4'>
                <div className='flex justify-between items-center mb-2'>
                    <h3 className='text-lg font-medium'>Biomarkers ({configs.length})</h3>
                    <AddNewButton onClick={() => { void handleAddNew() }}/>
                </div>
                <p className='text-sm text-gray-600'>Manage biomarker configurations and view statistics</p>
            </div>

            <div className='ag-theme-material flex-1'>
                <AgGridReact
                    rowData={rowData}
                    columnDefs={columnDefs}
                    domLayout='normal'
                    getRowId={(params) => params.data.id}
                    onCellValueChanged={(event) => { void onCellValueChanged(event) }}
                />
            </div>
        </div>
    )
}

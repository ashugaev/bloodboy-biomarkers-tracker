import { memo, useCallback, useMemo } from 'react'

import { CellValueChangedEvent, ColDef, ICellRendererParams } from '@ag-grid-community/core'
import { AgGridReact } from '@ag-grid-community/react'
import { DeleteOutlined, RightOutlined } from '@ant-design/icons'
import { Button, message } from 'antd'
import { useNavigate } from 'react-router-dom'

import { createNameColumn, createNormalRangeMaxColumn, createNormalRangeMinColumn, createTargetRangeMaxColumn, createTargetRangeMinColumn, createUnitColumn } from '@/aggrid/columns/biomarkerColumns'
import { validateRanges } from '@/aggrid/validators/rangeValidators'
import { AddNewButton } from '@/components/AddNewButton'
import { COLORS } from '@/constants/colors'
import { createBiomarkerConfigs, deleteBiomarkerConfig, updateBiomarkerConfig, useBiomarkerConfigs } from '@/db/models/biomarkerConfig'
import { useBiomarkerRecords } from '@/db/models/biomarkerRecord'
import { useUnits } from '@/db/models/unit'
import { getRangeCellStyle } from '@/utils/cellStyle'

import { BiomarkerRowData, BiomarkersDataTableProps } from './BiomarkersDataTable.types'

export const BiomarkersDataTable = (props: BiomarkersDataTableProps) => {
    const { className } = props
    const { data: configs } = useBiomarkerConfigs({ filter: (c) => c.approved })
    const { data: records } = useBiomarkerRecords({ filter: (r) => r.approved })
    const { data: units } = useUnits()
    const navigate = useNavigate()

    const handleDelete = useCallback(async (id: string) => {
        await deleteBiomarkerConfig(id)
    }, [])

    const handleViewRecords = useCallback((id: string) => {
        void navigate(`/biomarker/${id}`)
    }, [navigate])

    const handleAddNew = useCallback(async () => {
        await createBiomarkerConfigs([{
            name: '',
            approved: true,
        }])
    }, [])

    const sparklineTooltipRenderer = useCallback((params: { yValue?: number }) => {
        return {
            title: '',
            content: params.yValue?.toFixed(2) ?? 'N/A',
        }
    }, [])

    const rowData = useMemo(() => {
        return configs.map(config => {
            const configRecords = records.filter(r => r.biomarkerId === config.id)
            const values = configRecords.map(r => r.value).filter((v): v is number => v !== undefined)
            const unit = units.find(u => u.ucumCode === config.ucumCode)
            const lastFiveValues = values.slice(-5)

            return {
                ...config,
                unitTitle: unit?.title,
                history: lastFiveValues,
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

    // eslint-disable-next-line react-hooks/preserve-manual-memoization
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
            ...createNameColumn<BiomarkerRowData>(),
            sort: 'asc',
        },
        {
            ...createUnitColumn<BiomarkerRowData>(units),
        },
        createNormalRangeMinColumn<BiomarkerRowData>(),
        createNormalRangeMaxColumn<BiomarkerRowData>(),
        createTargetRangeMinColumn<BiomarkerRowData>(),
        createTargetRangeMaxColumn<BiomarkerRowData>(),
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
            field: 'history',
            headerName: 'History',
            flex: 1,
            minWidth: 150,
            sortable: false,
            filter: false,
            cellRenderer: 'agSparklineCellRenderer',
            cellStyle: { cursor: 'pointer' },
            onCellClicked: (params) => {
                if (params.data?.id) {
                    handleViewRecords(params.data.id)
                }
            },
            cellRendererParams: (params: ICellRendererParams<BiomarkerRowData>) => {
                const normalRange = params.data?.normalRange
                const targetRange = params.data?.targetRange

                return {
                    sparklineOptions: {
                        type: 'bar',
                        direction: 'horizontal',
                        axis: {
                            strokeWidth: 0,
                        },
                        tooltip: {
                            renderer: sparklineTooltipRenderer,
                        },
                        formatter: (formatterParams: { yValue: number }) => {
                            const value = formatterParams.yValue

                            if (normalRange?.min !== undefined && normalRange?.max !== undefined) {
                                if (value < normalRange.min || value > normalRange.max) {
                                    return { fill: COLORS.ERROR }
                                }
                            }

                            if (targetRange?.min !== undefined && targetRange?.max !== undefined) {
                                if (value < targetRange.min || value > targetRange.max) {
                                    return { fill: COLORS.WARNING }
                                }
                            }

                            return { fill: COLORS.SUCCESS }
                        },
                    },
                }
            },
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
    ], [ViewButtonCellRenderer, DeleteButtonCellRenderer, units, sparklineTooltipRenderer])

    const onCellValueChanged = useCallback(async (event: CellValueChangedEvent<BiomarkerRowData>) => {
        const row = event.data

        if (row?.id) {
            const validation = validateRanges(row.normalRange, row.targetRange)

            if (!validation.isValid) {
                void message.error(validation.errors.join('. '))
                return
            }

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

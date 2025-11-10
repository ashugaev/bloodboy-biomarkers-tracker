import { memo, useCallback, useMemo, useRef, useState } from 'react'

import { CellValueChangedEvent, ColDef, ICellRendererParams, GridApi } from '@ag-grid-community/core'
import { AgGridReact } from '@ag-grid-community/react'
import { DeleteOutlined, RightOutlined } from '@ant-design/icons'
import { Button, message } from 'antd'
import { useNavigate } from 'react-router-dom'

import { createNameColumn, createNormalRangeMaxColumn, createNormalRangeMinColumn, createTargetRangeMaxColumn, createTargetRangeMinColumn, createUnitColumn } from '@/aggrid/columns/biomarkerColumns'
import { validateRanges } from '@/aggrid/validators/rangeValidators'
import { BiomarkersDataTableFilters, RangeType } from '@/components/BiomarkersDataTableFilters'
import { MiniBarChart } from '@/components/MiniBarChart'
import { deleteBiomarkerConfig, updateBiomarkerConfig, useBiomarkerConfigs } from '@/db/models/biomarkerConfig'
import { useBiomarkerRecords } from '@/db/models/biomarkerRecord'
import { useDocuments } from '@/db/models/document'
import { useUnits } from '@/db/models/unit'
import { ViewMode } from '@/types/viewMode.types'
import { getRangeCellStyle } from '@/utils/cellStyle'

import { BiomarkerRowData, BiomarkersDataTableProps } from './BiomarkersDataTable.types'

export const BiomarkersDataTable = (props: BiomarkersDataTableProps) => {
    const { className } = props
    const gridApiRef = useRef<GridApi | null>(null)
    const { data: configs } = useBiomarkerConfigs({ filter: (c) => c.approved })
    const { data: records } = useBiomarkerRecords({ filter: (r) => r.approved })
    const { data: documents } = useDocuments()
    const { data: units } = useUnits()
    const navigate = useNavigate()
    const [documentId, setDocumentId] = useState<string[] | undefined>()
    const [biomarkerIds, setBiomarkerIds] = useState<string[] | undefined>()
    const [outOfRange, setOutOfRange] = useState<RangeType | undefined>()

    const handleDelete = useCallback(async (id: string) => {
        await deleteBiomarkerConfig(id)
    }, [])

    const handleViewRecords = useCallback((id: string, mode: ViewMode = 'table') => {
        void navigate(`/biomarker/${id}`, { state: { viewMode: mode } })
    }, [navigate])

    const rowData = useMemo(() => {
        let filteredRecords = records
        if (documentId && documentId.length > 0) {
            filteredRecords = filteredRecords.filter(r => r.documentId && documentId.includes(r.documentId))
        }

        let filteredConfigs = configs
        if (biomarkerIds && biomarkerIds.length > 0) {
            filteredConfigs = filteredConfigs.filter(c => biomarkerIds.includes(c.id))
        }

        return filteredConfigs
            .map(config => {
                const configRecords = filteredRecords.filter(r => r.biomarkerId === config.id)
                const allConfigRecords = records.filter(r => r.biomarkerId === config.id)

                const sortedData = configRecords
                    .map(record => {
                        const document = documents.find(d => d.id === record.documentId)
                        const date = document?.testDate
                        return {
                            record,
                            date,
                            timestamp: date?.getTime() ?? 0,
                        }
                    })
                    .sort((a, b) => a.timestamp - b.timestamp)

                const allSortedData = allConfigRecords
                    .map(record => {
                        const document = documents.find(d => d.id === record.documentId)
                        const date = document?.testDate
                        return {
                            record,
                            date,
                            timestamp: date?.getTime() ?? 0,
                        }
                    })
                    .sort((a, b) => a.timestamp - b.timestamp)

                const values = sortedData
                    .map(item => item.record.value)
                    .filter((v): v is number => v !== undefined)

                const allValues = allSortedData
                    .map(item => item.record.value)
                    .filter((v): v is number => v !== undefined)

                const unit = units.find(u => u.ucumCode === config.ucumCode)

                const lastFiveData = allSortedData
                    .filter((item): item is typeof item & { record: { value: number } } => item.record.value !== undefined)
                    .slice(-5)
                    .map(item => ({
                        value: item.record.value,
                        date: item.date ? item.date.toLocaleDateString() : '',
                    }))

                const lastRecord = sortedData.length > 0 ? sortedData[sortedData.length - 1].record : undefined
                const lastValue = lastRecord?.textValue ?? (lastRecord?.value != null ? lastRecord.value : undefined)

                return {
                    ...config,
                    unitTitle: unit?.title,
                    history: lastFiveData,
                    stats: {
                        lastMeasurement: values.length > 0 ? values[values.length - 1] : undefined,
                        lastValue,
                        maxResult: allValues.length > 0 ? Math.max(...allValues) : undefined,
                        minResult: allValues.length > 0 ? Math.min(...allValues) : undefined,
                    },
                    hasRecords: configRecords.length > 0,
                }
            })
            .filter(row => {
                const hasDocumentFilter = (documentId?.length ?? 0) > 0
                const hasBiomarkerFilter = (biomarkerIds?.length ?? 0) > 0
                const hasFilters = hasDocumentFilter || hasBiomarkerFilter

                // For the new records
                const isDefault = row.isDefault ?? false
                if (!hasFilters && (isDefault || !row.hasRecords)) {
                    return true
                }

                if (!row.hasRecords && !row.isDefault) return false

                if (row.stats.lastValue === undefined || row.stats.lastValue === '') return false

                if (outOfRange) {
                    if (typeof row.stats.lastValue !== 'number') return false

                    const value = row.stats.lastValue
                    if (outOfRange === RangeType.NORMAL) {
                        const isOutsideNormal =
                            (row.normalRange?.min !== undefined && value < row.normalRange.min) ||
                            (row.normalRange?.max !== undefined && value > row.normalRange.max)
                        return isOutsideNormal
                    }
                    if (outOfRange === RangeType.TARGET) {
                        const isOutsideTarget =
                            (row.targetRange?.min !== undefined && value < row.targetRange.min) ||
                            (row.targetRange?.max !== undefined && value > row.targetRange.max)
                        return isOutsideTarget
                    }
                }

                return true
            })
    }, [configs, records, documents, units, documentId, biomarkerIds, outOfRange])

    const ViewButtonCellRenderer = useMemo(() => {
        return memo((cellProps: ICellRendererParams<BiomarkerRowData>) => (
            <Button
                size='small'
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

    const HistoryCellRenderer = useMemo(() => {
        return memo((cellProps: ICellRendererParams<BiomarkerRowData>) => {
            const data = cellProps.data?.history ?? []
            const normalRange = cellProps.data?.normalRange
            const targetRange = cellProps.data?.targetRange

            return (
                <MiniBarChart
                    data={data}
                    normalRange={normalRange}
                    targetRange={targetRange}
                    onClick={() => {
                        if (cellProps.data?.id) {
                            handleViewRecords(cellProps.data.id, 'chart')
                        }
                    }}
                />
            )
        })
    }, [handleViewRecords])

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
            field: 'stats.lastValue',
            headerName: 'Last',
            flex: 0.6,
            minWidth: 90,
            editable: false,
            valueGetter: (params) => {
                const val = params.data?.stats.lastValue
                if (typeof val === 'string') return val
                if (typeof val === 'number') return val
                return ''
            },
            cellStyle: (params) => {
                const val = params.data?.stats.lastValue
                if (typeof val === 'number') {
                    return getRangeCellStyle(
                        val,
                        params.data?.normalRange,
                        params.data?.targetRange,
                    )
                }
                return {}
            },
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
            cellRenderer: HistoryCellRenderer,
        },
        {
            colId: 'delete',
            headerName: '',
            minWidth: 90,
            flex: 0.4,
            suppressHeaderMenuButton: true,
            sortable: false,
            filter: false,
            editable: false,
            cellRenderer: DeleteButtonCellRenderer,
        },
    ], [ViewButtonCellRenderer, DeleteButtonCellRenderer, HistoryCellRenderer, units])

    const onCellValueChanged = useCallback(async (event: CellValueChangedEvent<BiomarkerRowData>) => {
        const row = event.data
        const colId = event.column?.getColId()

        if (row?.id && gridApiRef.current) {
            const validation = validateRanges(row.normalRange, row.targetRange)

            if (!validation.isValid) {
                void message.error(validation.errors.join('. '))
            }

            const rowNode = event.node
            if (rowNode && row) {
                requestAnimationFrame(() => {
                    if (gridApiRef.current && rowNode) {
                        if (colId === 'normalRangeMin' || colId === 'normalRangeMax') {
                            gridApiRef.current.refreshCells({
                                rowNodes: [rowNode],
                                columns: ['normalRangeMin', 'normalRangeMax'],
                                force: true,
                            })
                        } else if (colId === 'targetRangeMin' || colId === 'targetRangeMax') {
                            gridApiRef.current.refreshCells({
                                rowNodes: [rowNode],
                                columns: ['targetRangeMin', 'targetRangeMax'],
                                force: true,
                            })
                        }
                    }
                })
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
        <div className={`flex flex-col h-full min-h-0 ${className ?? ''}`}>
            <div className='mb-2'>
                <BiomarkersDataTableFilters
                    documentId={documentId}
                    biomarkerIds={biomarkerIds}
                    outOfRange={outOfRange}
                    onDocumentChange={setDocumentId}
                    onBiomarkerChange={setBiomarkerIds}
                    onOutOfRangeChange={setOutOfRange}
                />
            </div>
            <div className='ag-theme-material flex-1 min-h-0'>
                <AgGridReact
                    rowData={rowData}
                    columnDefs={columnDefs}
                    domLayout='normal'
                    getRowId={(params) => params.data.id}
                    onGridReady={(params) => {
                        gridApiRef.current = params.api
                    }}
                    onCellValueChanged={(event) => { void onCellValueChanged(event) }}
                />
            </div>
        </div>
    )
}

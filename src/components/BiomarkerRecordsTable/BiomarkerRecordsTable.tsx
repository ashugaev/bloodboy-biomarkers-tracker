import { memo, useCallback, useMemo } from 'react'

import { CellValueChangedEvent, ColDef, ICellRendererParams } from '@ag-grid-community/core'
import { AgGridReact } from '@ag-grid-community/react'
import { DeleteOutlined } from '@ant-design/icons'
import { Button } from 'antd'

import { COLORS } from '@/constants/colors'
import { deleteBiomarkerRecord, updateBiomarkerRecord, useBiomarkerRecords } from '@/db/hooks/useBiomarkerRecords'
import { useDocuments } from '@/db/hooks/useDocuments'
import { Unit } from '@/db/types'
import { getRangeCellStyle } from '@/utils/cell-styles'

import { BiomarkerRecordRowData, BiomarkerRecordsTableProps } from './BiomarkerRecordsTable.types'

export const BiomarkerRecordsTable = (props: BiomarkerRecordsTableProps) => {
    const { biomarkerId, biomarkerName, normalRange, targetRange, className } = props
    const { records } = useBiomarkerRecords(biomarkerId)
    const { documents } = useDocuments()

    const handleDelete = useCallback(async (id: string) => {
        await deleteBiomarkerRecord(id)
    }, [])

    const rowData = useMemo(() => {
        const approvedRecords = records.filter(r => r.approved)
        return approvedRecords.map(record => {
            const document = documents.find(d => d.id === record.documentId)
            return {
                ...record,
                date: document?.testDate ?? record.createdAt,
            }
        })
    }, [records, documents])

    const DeleteButtonCellRenderer = useMemo(() => {
        return memo((cellProps: ICellRendererParams<BiomarkerRecordRowData>) => (
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

    const columnDefs = useMemo<Array<ColDef<BiomarkerRecordRowData>>>(() => [
        {
            field: 'date',
            headerName: 'Date',
            flex: 1,
            minWidth: 150,
            editable: false,
            valueFormatter: (params) => {
                if (!params.value) return ''
                const date = new Date(params.value as string | number | Date)
                return date.toLocaleDateString()
            },
        },
        {
            field: 'value',
            headerName: 'Value',
            flex: 0.8,
            minWidth: 100,
            editable: true,
            cellStyle: (params) => getRangeCellStyle(
                params.data?.value,
                normalRange,
                targetRange,
            ),
        },
        {
            field: 'unit',
            headerName: 'Unit',
            flex: 0.8,
            minWidth: 100,
            editable: true,
            cellEditor: 'agSelectCellEditor',
            cellEditorParams: {
                values: Object.values(Unit),
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
    ], [normalRange, targetRange, DeleteButtonCellRenderer])

    const onCellValueChanged = useCallback(async (event: CellValueChangedEvent<BiomarkerRecordRowData>) => {
        const row = event.data

        if (row?.id) {
            await updateBiomarkerRecord(row.id, {
                value: row.value,
                unit: row.unit,
            })
        }
    }, [])

    return (
        <div className={`bg-white p-6 rounded-lg shadow-sm flex flex-col ${className ?? ''}`}>
            <div className='mb-4'>
                <h3 className='text-lg font-medium'>{biomarkerName} Records ({rowData.length})</h3>
                <p className='text-sm text-gray-600'>View and manage all records for this biomarker</p>
            </div>

            <div className='mb-4 flex gap-6'>
                {normalRange && (normalRange.min !== undefined || normalRange.max !== undefined) && (
                    <div className='flex items-center gap-2'>
                        <div
                            className='w-4 h-4 rounded'
                            style={{ backgroundColor: COLORS.OUT_OF_NORMAL_BG }}
                        />
                        <span className='text-sm text-gray-700'>
                            Normal Range: {normalRange.min ?? '—'} - {normalRange.max ?? '—'}
                        </span>
                    </div>
                )}
                {targetRange && (targetRange.min !== undefined || targetRange.max !== undefined) && (
                    <div className='flex items-center gap-2'>
                        <div
                            className='w-4 h-4 rounded'
                            style={{ backgroundColor: COLORS.OUT_OF_TARGET_BG }}
                        />
                        <span className='text-sm text-gray-700'>
                            Target Range: {targetRange.min ?? '—'} - {targetRange.max ?? '—'}
                        </span>
                    </div>
                )}
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

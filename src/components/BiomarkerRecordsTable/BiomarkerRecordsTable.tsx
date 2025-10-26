import { memo, useCallback, useMemo } from 'react'

import { CellValueChangedEvent, ColDef, ICellRendererParams } from '@ag-grid-community/core'
import { AgGridReact } from '@ag-grid-community/react'
import { DeleteOutlined } from '@ant-design/icons'
import { Button } from 'antd'

import { createUnitColumn } from '@/aggrid/columns/biomarkerColumns'
import { dateComparator } from '@/aggrid/comparators/dateComprator'
import { AddNewButton } from '@/components/AddNewButton'
import { COLORS } from '@/constants/colors'
import { createBiomarkerRecords, deleteBiomarkerRecord, updateBiomarkerRecord, useBiomarkerRecords } from '@/db/models/biomarkerRecord'
import { useDocuments, updateDocument } from '@/db/models/document'
import { useUnits } from '@/db/models/unit'
import { getRangeCellStyle } from '@/utils/cellStyle'

import { BiomarkerRecordRowData, BiomarkerRecordsTableProps } from './BiomarkerRecordsTable.types'

export const BiomarkerRecordsTable = (props: BiomarkerRecordsTableProps) => {
    const { biomarkerId, biomarkerName, normalRange, targetRange, className } = props
    const { data: records } = useBiomarkerRecords({
        filter: (item) => item.biomarkerId === biomarkerId && item.approved,
    })
    const { data: documents } = useDocuments()
    const { data: units } = useUnits()

    const handleDelete = useCallback(async (id: string) => {
        await deleteBiomarkerRecord(id)
    }, [])

    const handleAddNew = useCallback(async () => {
        const defaultUcumCode = records.find(r => r.ucumCode)?.ucumCode
        await createBiomarkerRecords([{
            biomarkerId,
            ucumCode: defaultUcumCode ?? '',
            approved: true,
            testDate: new Date(),
            latest: true,
        }])
    }, [biomarkerId, records])

    const rowData = useMemo(() => {
        return records.map(record => {
            const document = documents.find(d => d.id === record.documentId)
            const unit = units.find(u => u.ucumCode === record.ucumCode)
            return {
                ...record,
                unitTitle: unit?.title,
                date: document?.testDate,
                lab: document?.lab,
            }
        })
    }, [records, documents, units])

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
            sortable: true,
            sort: 'desc',
            comparator: dateComparator,
            valueFormatter: (params) => {
                if (!params.value) return ''
                const date = new Date(params.value as string | number | Date)
                return date.toLocaleDateString()
            },
        },
        {
            field: 'lab',
            headerName: 'Lab',
            flex: 1,
            minWidth: 160,
            editable: true,
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
        createUnitColumn<BiomarkerRecordRowData>(units),
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
    ], [normalRange, targetRange, DeleteButtonCellRenderer, units])

    const onCellValueChanged = useCallback(async (event: CellValueChangedEvent<BiomarkerRecordRowData>) => {
        const row = event.data
        const colId = event.column.getColId()

        if (!row) return

        if (colId === 'lab' && row.documentId) {
            await updateDocument(row.documentId, { lab: row.lab })
            return
        }

        if (row.id && (colId === 'value' || colId === 'unitTitle')) {
            await updateBiomarkerRecord(row.id, {
                value: row.value,
                ucumCode: row.ucumCode,
            })
        }
    }, [])

    return (
        <div className={`bg-white p-6 rounded-lg shadow-sm flex flex-col ${className ?? ''}`}>
            <div className='mb-4'>
                <div className='flex justify-between items-center mb-2'>
                    <h3 className='text-lg font-medium'>{biomarkerName} Records ({rowData.length})</h3>
                    <AddNewButton onClick={() => { void handleAddNew() }} label='Add Record'/>
                </div>
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

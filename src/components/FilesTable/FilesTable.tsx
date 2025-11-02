import { memo, useCallback, useMemo } from 'react'

import { ColDef, ICellRendererParams } from '@ag-grid-community/core'
import { AgGridReact } from '@ag-grid-community/react'
import { DeleteOutlined, DownloadOutlined } from '@ant-design/icons'
import { Button } from 'antd'
import cn from 'classnames'

import { dateComparator } from '@/aggrid/comparators/dateComprator'
import { deleteDocument, useDocuments } from '@/db/models/document'
import { formatFileSize } from '@/db/models/document/document.utils'

import { FileRowData, FilesTableProps } from './FilesTable.types'

const downloadFile = (fileData: ArrayBuffer, originalName: string) => {
    const blob = new Blob([fileData], { type: 'application/pdf' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = originalName
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
}

export const FilesTable = (props: FilesTableProps) => {
    const { className } = props
    const { data: documents } = useDocuments()

    const handleDelete = useCallback(async (id: string) => {
        await deleteDocument(id)
    }, [])

    const handleDownload = useCallback((fileData: ArrayBuffer | undefined, originalName: string) => {
        if (!fileData) return
        downloadFile(fileData, originalName)
    }, [])

    const rowData = useMemo(() => {
        return documents
    }, [documents])

    const DownloadButtonCellRenderer = useMemo(() => {
        return memo((cellProps: ICellRendererParams<FileRowData>) => (
            <Button
                size='small'
                icon={<DownloadOutlined/>}
                type='link'
                onClick={() => {
                    if (cellProps.data?.fileData && cellProps.data?.originalName) {
                        handleDownload(cellProps.data.fileData, cellProps.data.originalName)
                    }
                }}
                disabled={!cellProps.data?.fileData}
            />
        ))
    }, [handleDownload])

    const DeleteButtonCellRenderer = useMemo(() => {
        return memo((cellProps: ICellRendererParams<FileRowData>) => (
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

    const columnDefs = useMemo<Array<ColDef<FileRowData>>>(() => [
        {
            field: 'testDate',
            headerName: 'Date',
            flex: 0.6,
            minWidth: 120,
            sort: 'asc',
            comparator: dateComparator,
            valueFormatter: (params) => {
                if (!params.value) return ''
                const date = new Date(params.value as string | number | Date)
                return date.toLocaleDateString()
            },
        },
        {
            field: 'originalName',
            headerName: 'Original Name',
            flex: 1,
            minWidth: 200,
        },
        {
            field: 'lab',
            headerName: 'Lab',
            flex: 0.6,
            minWidth: 120,
            valueGetter: (params) => params.data?.lab ?? '',
        },
        {
            field: 'fileSize',
            headerName: 'Size',
            flex: 0.5,
            minWidth: 100,
            valueGetter: (params) => params.data?.fileSize ? formatFileSize(params.data.fileSize) : '',
        },

        {
            field: 'notes',
            headerName: 'Notes',
            flex: 0.5,
            minWidth: 150,
        },
        {
            colId: 'download',
            headerName: '',
            minWidth: 90,
            flex: 0.3,
            suppressHeaderMenuButton: true,
            sortable: false,
            filter: false,
            editable: false,
            cellRenderer: DownloadButtonCellRenderer,
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
    ], [DownloadButtonCellRenderer, DeleteButtonCellRenderer])

    return (
        <div className={cn('flex flex-col h-full min-h-0', className)}>
            <div className='ag-theme-material flex-1 min-h-0'>
                <AgGridReact
                    rowData={rowData}
                    columnDefs={columnDefs}
                    domLayout='normal'
                    getRowId={(params) => params.data.id}
                />
            </div>
        </div>
    )
}

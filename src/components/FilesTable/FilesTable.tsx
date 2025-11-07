import { memo, useCallback, useMemo, useState } from 'react'

import { ColDef, ICellRendererParams, RowClickedEvent } from '@ag-grid-community/core'
import { AgGridReact } from '@ag-grid-community/react'
import { DeleteOutlined, DownloadOutlined } from '@ant-design/icons'
import { Button, Modal } from 'antd'
import cn from 'classnames'
import { usePostHog } from 'posthog-js/react'

import { dateComparator } from '@/aggrid/comparators/dateComprator'
import { PdfViewer } from '@/components/PdfViewer'
import { deleteDocument, useDocuments } from '@/db/models/document'
import { formatFileSize } from '@/db/models/document/document.utils'
import { captureEvent } from '@/utils'

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
    const posthog = usePostHog()
    const [selectedDocument, setSelectedDocument] = useState<FileRowData | null>(null)

    const handleDelete = useCallback(async (id: string) => {
        await deleteDocument(id)
    }, [])

    const handleDownload = useCallback((fileData: ArrayBuffer | undefined, originalName: string) => {
        if (!fileData) return
        downloadFile(fileData, originalName)
    }, [])

    const handleRowClick = useCallback((event: RowClickedEvent<FileRowData>) => {
        const target = event.event?.target as HTMLElement
        const buttonElement = target?.closest('button') ?? target?.closest('.ant-btn')
        if (buttonElement) {
            return
        }

        if (event.data?.fileData) {
            captureEvent(posthog, 'document_viewer_opened', {
                documentId: event.data.id,
                fileName: event.data.originalName,
            })
            setSelectedDocument(event.data)
        }
    }, [posthog])

    const handleCloseViewer = useCallback(() => {
        captureEvent(posthog, 'document_viewer_closed', {
            documentId: selectedDocument?.id,
        })
        setSelectedDocument(null)
    }, [posthog, selectedDocument?.id])

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
        <>
            <div className={cn('flex flex-col h-full min-h-0', className)}>
                <div className='ag-theme-material flex-1 min-h-0'>
                    <AgGridReact
                        rowData={rowData}
                        columnDefs={columnDefs}
                        domLayout='normal'
                        getRowId={(params) => params.data.id}
                        onRowClicked={handleRowClick}
                        rowSelection='single'
                    />
                </div>
            </div>
            <Modal
                open={!!selectedDocument}
                onCancel={handleCloseViewer}
                footer={null}
                width='90vw'
                style={{ top: 20 }}
                styles={{
                    body: {
                        height: 'calc(100vh - 100px)',
                        padding: 0,
                    },
                }}
                title={selectedDocument?.originalName}
            >
                {selectedDocument?.fileData && (
                    <PdfViewer
                        fileData={selectedDocument.fileData}
                        fileName={selectedDocument.originalName}
                    />
                )}
            </Modal>
        </>
    )
}

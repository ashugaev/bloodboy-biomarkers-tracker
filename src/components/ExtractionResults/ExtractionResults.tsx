import { useCallback, useMemo, useState } from 'react'

import { ColDef } from '@ag-grid-community/core'
import { AgGridReact } from '@ag-grid-community/react'
import { Button } from 'antd'

import { ExtractedBiomarker } from '@/openai/biomarkers'

import { ExtractionResultsProps } from './ExtractionResults.types'

export const ExtractionResults = (props: ExtractionResultsProps) => {
    const { biomarkers, onSave, onCancel, onRetry, className } = props
    const [rowData, setRowData] = useState<ExtractedBiomarker[]>(biomarkers)

    const columnDefs = useMemo<Array<ColDef<ExtractedBiomarker>>>(() => [
        {
            field: 'name',
            headerName: 'Biomarker',
            flex: 1,
            editable: true,
        },
        {
            field: 'value',
            headerName: 'Value',
            flex: 1,
            editable: true,
        },
        {
            field: 'unit',
            headerName: 'Unit',
            flex: 1,
            editable: true,
        },
        {
            field: 'date',
            headerName: 'Date',
            flex: 1,
            editable: true,
        },
        {
            field: 'referenceRange.min',
            headerName: 'Min',
            flex: 1,
            editable: true,
            valueGetter: (params) => params.data?.referenceRange?.min,
            valueSetter: (params) => {
                if (params.data) {
                    if (!params.data.referenceRange) {
                        params.data.referenceRange = {}
                    }
                    params.data.referenceRange.min = params.newValue
                    return true
                }
                return false
            },
        },
        {
            field: 'referenceRange.max',
            headerName: 'Max',
            flex: 1,
            editable: true,
            valueGetter: (params) => params.data?.referenceRange?.max,
            valueSetter: (params) => {
                if (params.data) {
                    if (!params.data.referenceRange) {
                        params.data.referenceRange = {}
                    }
                    params.data.referenceRange.max = params.newValue
                    return true
                }
                return false
            },
        },
    ], [])

    const onCellValueChanged = useCallback(() => {
        setRowData([...rowData])
    }, [rowData])

    const handleSave = () => {
        onSave(rowData)
    }

    return (
        <div className={`bg-white p-6 rounded-lg shadow-sm ${className ?? ''}`}>
            <h3 className='text-lg font-medium mb-4'>Extracted Biomarkers ({biomarkers.length})</h3>

            <div className='ag-theme-material h-96 mb-4'>
                <AgGridReact
                    rowData={rowData}
                    columnDefs={columnDefs}
                    domLayout='normal'
                    onCellValueChanged={onCellValueChanged}
                />
            </div>

            <div className='flex gap-2 justify-between'>
                <Button onClick={onRetry}>
                    Retry Extraction
                </Button>
                <div className='flex gap-2'>
                    <Button onClick={onCancel}>
                        Cancel
                    </Button>
                    <Button type='primary' onClick={handleSave}>
                        Save Results
                    </Button>
                </div>
            </div>
        </div>
    )
}

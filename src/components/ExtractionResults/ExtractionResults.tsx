import { useCallback, useEffect, useMemo, useState } from 'react'

import { CellValueChangedEvent, ColDef } from '@ag-grid-community/core'
import { AgGridReact } from '@ag-grid-community/react'
import { Button, message } from 'antd'

import { modifyBiomarkerRecord } from '@/db/hooks/useBiomarkerRecords'
import { BiomarkerRecord, Unit } from '@/db/types'
import { ExtractedBiomarker } from '@/openai/biomarkers'
import { getInvalidCellStyle } from '@/utils/cellStyles'

import { ExtractionResultsProps } from './ExtractionResults.types'

export const ExtractionResults = (props: ExtractionResultsProps) => {
    const { biomarkers, onSave, onCancel, onRetry, className } = props
    const [rowData, setRowData] = useState<ExtractedBiomarker[]>(biomarkers)

    const hasInvalidBiomarkers = useMemo(() => {
        return rowData.some(b => !b.name || b.value === undefined || !b.unit)
    }, [rowData])

    const columnDefs = useMemo<Array<ColDef<ExtractedBiomarker>>>(() => [
        {
            field: 'name',
            valueGetter: (params) => params.data?.name,
            headerName: 'Name',
            flex: 1,
            minWidth: 200,
            cellStyle: (params) => getInvalidCellStyle(params, (data) => !data?.name),
        },
        {
            field: 'value',
            headerName: 'Value',
            flex: 1,
            editable: true,
            cellStyle: (params) => getInvalidCellStyle(params, (data) => data?.value === undefined),
        },
        {
            field: 'unit',
            headerName: 'Unit',
            flex: 1,
            cellEditor: 'agSelectCellEditor',
            cellEditorParams: {
                values: Object.values(Unit),
            },
            cellStyle: (params) => getInvalidCellStyle(params, (data) => !data?.unit),
        },
    ], [])

    const onCellValueChanged = useCallback((event: CellValueChangedEvent<ExtractedBiomarker>) => {
        const data = event.data
        const colDef = event.colDef
        const newValue = event.newValue as number | string | undefined
        const field = colDef.field as keyof BiomarkerRecord

        if (data?.id && field && newValue !== undefined) {
            void modifyBiomarkerRecord(data.id, (record: BiomarkerRecord) => {
                (record[field] as number | string) = newValue
            })
        } else {
            void message.error('Failed to update biomarker record')
        }
    }, [])

    useEffect(() => {
        setRowData(biomarkers)
    }, [biomarkers])

    const handleSave = () => {
        onSave(rowData)
    }

    return (
        <div className={`bg-white p-4 rounded-lg shadow-sm flex flex-col ${className ?? ''}`}>
            <div className='mb-4'>
                <h3 className='text-lg font-medium'>Extracted Biomarkers ({biomarkers.length})</h3>
                <p className='text-sm text-gray-600 mt-1'>Click on any cell to edit values and correct results</p>
            </div>

            {hasInvalidBiomarkers && (
                <div className='mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm'>
                    Some values are empty. Please fill them manually or retry the extraction to continue.
                </div>
            )}

            <div className='ag-theme-material flex-grow min-h-96 mb-4'>
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
                    <Button type='primary' onClick={handleSave} disabled={hasInvalidBiomarkers}>
                        Save Results
                    </Button>
                </div>
            </div>
        </div>
    )
}

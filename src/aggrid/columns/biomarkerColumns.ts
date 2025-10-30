import { ColDef, ICellRendererParams } from '@ag-grid-community/core'

import { isRangeInvalid } from '@/aggrid/validators/rangeValidators'
import { BiomarkerConfig } from '@/db/models/biomarkerConfig'
import { Unit } from '@/db/models/unit'
import { getInvalidCellStyle } from '@/utils/cellStyle'

type BiomarkerWithRanges = Pick<BiomarkerConfig, 'id' | 'name' | 'ucumCode' | 'normalRange' | 'targetRange'>

export const createNameColumn = <T extends BiomarkerWithRanges>(): ColDef<T> => ({
    field: 'name',
    headerName: 'Name',
    flex: 1,
    minWidth: 180,
    editable: true,
    sortable: true,
    cellStyle: (params) => getInvalidCellStyle(params, (data) => !data?.name),
})

export const createOriginalNameColumn = <T extends { originalName?: string }>(): ColDef<T> => ({
    field: 'originalName',
    headerName: 'Original Name',
    flex: 0.8,
    minWidth: 150,
    editable: false,
    sortable: true,
})

export const createNormalRangeMinColumn = <T extends BiomarkerWithRanges>(): ColDef<T> => ({
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
    cellStyle: (params) => getInvalidCellStyle(params, (data) =>
        isRangeInvalid(data?.normalRange, data?.targetRange),
    ),
})

export const createNormalRangeMaxColumn = <T extends BiomarkerWithRanges>(): ColDef<T> => ({
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
    cellStyle: (params) => getInvalidCellStyle(params, (data) =>
        isRangeInvalid(data?.normalRange, data?.targetRange),
    ),
})

export const createTargetRangeMinColumn = <T extends BiomarkerWithRanges>(): ColDef<T> => ({
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
    cellStyle: (params) => getInvalidCellStyle(params, (data) =>
        isRangeInvalid(data?.normalRange, data?.targetRange),
    ),
})

export const createTargetRangeMaxColumn = <T extends BiomarkerWithRanges>(): ColDef<T> => ({
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
    cellStyle: (params) => getInvalidCellStyle(params, (data) =>
        isRangeInvalid(data?.normalRange, data?.targetRange),
    ),
})

export const createUnitColumn = <T extends { ucumCode?: string, unitTitle?: string }>(
    units: Unit[], field: string = 'ucumCode',
): ColDef<T> => ({
    field,
    headerName: 'Unit',
    flex: 0.8,
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
                params.data[field] = selectedUnit.ucumCode
                return true
            }
        }
        return false
    },
    cellStyle: (params) => getInvalidCellStyle(params, (data) => !data?.[field]),
    valueFormatter: (params) => {
        const unit = units.find(u => u.ucumCode === params.value)
        return unit?.title ?? (params.value as string)
    },
})

export const createDeleteColumn = <T extends { id: string }>(
    onDelete: (id: string) => void,
    DeleteButtonComponent: React.ComponentType<ICellRendererParams<T>>,
): ColDef<T> => ({
    colId: 'delete',
    headerName: '',
    minWidth: 90,
    flex: 0.4,
    suppressHeaderMenuButton: true,
    suppressMenu: true,
    sortable: false,
    filter: false,
    editable: false,
    cellRenderer: DeleteButtonComponent,
})

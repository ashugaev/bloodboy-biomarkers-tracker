import { ColDef, ICellRendererParams, ValueFormatterParams, ValueSetterParams } from '@ag-grid-community/core'

import { isRangeInvalid } from '@/aggrid/validators/rangeValidators'
import { getNameByUcum, Unit } from '@/db/models/unit'
import { getInvalidCellStyle } from '@/utils/cellStyle'

interface BiomarkerWithRanges {
    id?: string
    name?: string
    ucumCode?: string | null
    normalRange?: { min?: number, max?: number }
    targetRange?: { min?: number, max?: number }
}

export const createNameColumn = <T extends BiomarkerWithRanges>(): ColDef<T> => ({
    field: 'name' as never,
    headerName: 'Name',
    flex: 1,
    minWidth: 180,
    editable: true,
    sortable: true,
    cellStyle: (params) => getInvalidCellStyle(params, (data) => !data?.name),
})

export const createOriginalNameColumn = <T extends { originalName?: string | null }>(): ColDef<T> => ({
    field: 'originalName' as never,
    headerName: 'Original Name',
    flex: 0.8,
    minWidth: 250,
    editable: false,
    sortable: true,
})

export const createPageColumn = <T extends { page?: number | null }>(): ColDef<T> => ({
    field: 'page' as never,
    headerName: 'Page',
    flex: 0.5,
    minWidth: 100,
    editable: false,
    sortable: true,
})

export const createNormalRangeMinColumn = <T extends BiomarkerWithRanges>(): ColDef<T> => ({
    colId: 'normalRangeMin',
    field: 'normalRange' as never,
    headerName: 'Normal Min',
    flex: 0.7,
    minWidth: 150,
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
        isRangeInvalid(data?.normalRange, undefined),
    ),
})

export const createNormalRangeMaxColumn = <T extends BiomarkerWithRanges>(): ColDef<T> => ({
    colId: 'normalRangeMax',
    field: 'normalRange' as never,
    headerName: 'Normal Max',
    flex: 0.7,
    minWidth: 150,
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
        isRangeInvalid(data?.normalRange, undefined),
    ),
})

export const createTargetRangeMinColumn = <T extends BiomarkerWithRanges>(): ColDef<T> => ({
    colId: 'targetRangeMin',
    field: 'targetRange' as never,
    headerName: 'Target Min',
    flex: 0.7,
    minWidth: 150,
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
        isRangeInvalid(undefined, data?.targetRange),
    ),
})

export const createTargetRangeMaxColumn = <T extends BiomarkerWithRanges>(): ColDef<T> => ({
    colId: 'targetRangeMax',
    field: 'targetRange' as never,
    headerName: 'Target Max',
    flex: 0.7,
    minWidth: 150,
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
        isRangeInvalid(undefined, data?.targetRange),
    ),
})

export const createUnitColumn = <T extends { ucumCode?: string, unitTitle?: string }>(
    units: Unit[], field: keyof T = 'ucumCode' as keyof T,
): ColDef<T> => ({
    field: field as never,
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
                (params.data as Record<string, unknown>)[field as string] = selectedUnit.ucumCode
                return true
            }
        }
        return false
    },
    cellStyle: (params) => getInvalidCellStyle(params, (data) => !data?.[field]),
    valueFormatter: (params) => {
        return getNameByUcum(units, params.value as string | undefined)
    },
})

export const createValueColumn = <T extends { value?: number, textValue?: string, ucumCode?: string | null }>(
    units: Unit[],
    cellStyleGetter?: (value?: number) => Record<string, string | number>,
): ColDef<T> => ({
    field: 'value' as never,
    headerName: 'Value',
    flex: 0.8,
    minWidth: 100,
    editable: true,
    cellEditorSelector: (params) => {
        const ucumCode = params.data?.ucumCode
        if (!ucumCode) {
            return {
                component: 'agTextCellEditor',
                params: {},
            }
        }
        const unit = units.find(u => u.ucumCode === ucumCode)
        if (unit?.valueType === 'select' && unit.options && unit.options.length > 0) {
            return {
                component: 'agSelectCellEditor',
                params: { values: unit.options },
            }
        }
        return {
            component: 'agTextCellEditor',
            params: {},
        }
    },
    valueGetter: (params) => {
        const unit = units.find(u => u.ucumCode === params.data?.ucumCode)
        if (unit?.valueType === 'select' || unit?.valueType === 'text') {
            return params.data?.textValue
        }
        return params.data?.value ?? params.data?.textValue
    },
    valueSetter: (params: ValueSetterParams<T>) => {
        if (params.data) {
            const unit = units.find(u => u.ucumCode === params.data?.ucumCode)
            if (unit?.valueType === 'select' || unit?.valueType === 'text') {
                (params.data as Record<string, unknown>).textValue = params.newValue as string;
                // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
                (params.data as Record<string, unknown>).value = undefined
            } else {
                const dataRecord = params.data as Record<string, unknown>
                if (typeof params.newValue === 'number') {
                    dataRecord.value = params.newValue
                } else if (params.newValue === '' || params.newValue == null) {
                    dataRecord.value = undefined
                } else {
                    const strValue = String(params.newValue)
                    const numValue = +strValue
                    dataRecord.value = Number.isNaN(numValue) ? undefined : numValue
                }
                dataRecord.textValue = undefined
            }
            return true
        }
        return false
    },
    cellStyle: (params) => {
        const unit = units.find(u => u.ucumCode === params.data?.ucumCode)
        if (unit?.valueType === 'select' || unit?.valueType === 'text') {
            return {}
        }
        return cellStyleGetter ? cellStyleGetter(params.data?.value) : {}
    },
    valueFormatter: (params: ValueFormatterParams<T>) => {
        const unit = units.find(u => u.ucumCode === params.data?.ucumCode)
        if (unit?.valueType === 'select' || unit?.valueType === 'text') {
            return params.data?.textValue ?? ''
        }
        return params.value != null ? String(params.value) : ''
    },
})

export const createDeleteColumn = <T extends { id: string }>(
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

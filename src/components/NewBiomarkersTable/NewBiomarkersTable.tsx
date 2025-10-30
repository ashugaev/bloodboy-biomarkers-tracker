import { useCallback, useEffect, useMemo, useState } from 'react'

import { ColDef, CellValueChangedEvent } from '@ag-grid-community/core'
import { AgGridReact } from '@ag-grid-community/react'
import { DeleteOutlined, PlusOutlined } from '@ant-design/icons'
import { Button, Form, Input, message, Modal } from 'antd'

import { createNameColumn, createOriginalNameColumn, createNormalRangeMaxColumn, createNormalRangeMinColumn, createTargetRangeMaxColumn, createTargetRangeMinColumn, createUnitColumn } from '@/aggrid/columns/biomarkerColumns'
import { validateRanges } from '@/aggrid/validators/rangeValidators'
import { ValidationWarning } from '@/components/ValidationWarning'
import { createBiomarkerConfigs, deleteBiomarkerConfig, updateBiomarkerConfig } from '@/db/models/biomarkerConfig'
import { addUnit, useUnits } from '@/db/models/unit'
import { validateUcumCode } from '@/utils/ucum'

import { NewBiomarkerRow, NewBiomarkersTableProps } from './NewBiomarkersTable.types'

interface NewUnitFormData {
    title: string
    ucumCode: string
}

export const NewBiomarkersTable = (props: NewBiomarkersTableProps) => {
    const { biomarkers, onSave, onCancel, className } = props
    const [rowData, setRowData] = useState<NewBiomarkerRow[]>(biomarkers)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [form] = Form.useForm<NewUnitFormData>()
    const { data: units } = useUnits()

    const handleDelete = useCallback(async (id?: string) => {
        if (id) {
            await deleteBiomarkerConfig(id)
        }
    }, [])

    const handleAddNew = useCallback(async () => {
        await createBiomarkerConfigs([{
            name: '',
            approved: false,
        }])
    }, [])

    const handleCreateUnit = useCallback(async (values: NewUnitFormData) => {
        try {
            const now = new Date()
            await addUnit({
                ucumCode: values.ucumCode,
                title: values.title,
                approved: true,
                createdAt: now,
                updatedAt: now,
            })
            void message.success('Unit created successfully')
            setIsModalOpen(false)
            form.resetFields()
        } catch (error) {
            void message.error('Failed to create unit')
            console.error('Failed to create unit:', error)
        }
    }, [form])

    useEffect(() => {
        setRowData(biomarkers)
    }, [biomarkers])

    const isValid = useMemo(() => {
        return rowData.every(row => {
            if (!row.name || !row.ucumCode) return false
            const validation = validateRanges(row.normalRange, row.targetRange)
            return validation.isValid
        })
    }, [rowData])

    const columnDefs = useMemo<Array<ColDef<NewBiomarkerRow>>>(() => [
        createNameColumn<NewBiomarkerRow>(),
        createOriginalNameColumn<NewBiomarkerRow>(),
        createUnitColumn<NewBiomarkerRow>(units),
        createNormalRangeMinColumn<NewBiomarkerRow>(),
        createNormalRangeMaxColumn<NewBiomarkerRow>(),
        createTargetRangeMinColumn<NewBiomarkerRow>(),
        {
            ...createTargetRangeMaxColumn<NewBiomarkerRow>(),
            minWidth: 130,
        } as ColDef<NewBiomarkerRow>,
        {
            colId: 'delete',
            headerName: '',
            minWidth: 90,
            flex: 0.4,
            suppressMenu: true,
            sortable: false,
            filter: false,
            editable: false,
            cellRenderer: (params: { data: NewBiomarkerRow }) => {
                return (
                    <Button
                        type='text'
                        danger
                        icon={<DeleteOutlined/>}
                        onClick={() => { void handleDelete(params.data.id) }}
                    />
                )
            },
        },
    ], [handleDelete, units])

    const onCellValueChanged = useCallback(async (event: CellValueChangedEvent<NewBiomarkerRow>) => {
        const row = event.data

        if (row) {
            const validation = validateRanges(row.normalRange, row.targetRange)

            if (!validation.isValid) {
                void message.error(validation.errors.join('. '))
            }
        }

        setRowData(prev => [...prev])

        if (row?.id) {
            await updateBiomarkerConfig(row.id, {
                name: row.name,
                ucumCode: row.ucumCode,
                normalRange: row.normalRange,
                targetRange: row.targetRange,
            })
        }
    }, [])

    const handleSave = () => {
        onSave(rowData)
    }

    return (
        <>
            <div className={`bg-white p-6 rounded-lg shadow-sm flex flex-col ${className ?? ''}`}>
                <div className='mb-4'>
                    <div className='flex justify-between items-center mb-2'>
                        <h3 className='text-lg font-medium'>Verify New Biomarker Configs ({biomarkers.length})</h3>
                        <div className='flex gap-2'>
                            <Button icon={<PlusOutlined/>} onClick={() => { setIsModalOpen(true) }}>
                                Add Unit
                            </Button>
                            <Button icon={<PlusOutlined/>} onClick={() => { void handleAddNew() }}>
                                Add Biomarker
                            </Button>
                        </div>
                    </div>
                    <p className='text-sm text-gray-600'>First review and configure new biomarker references and target ranges to add to the database</p>
                </div>

                {!isValid && (
                    <ValidationWarning message='Some values are empty. Please fill them manually to continue.'/>
                )}

                <div className='ag-theme-material flex-1 mb-4'>
                    <AgGridReact
                        rowData={rowData}
                        columnDefs={columnDefs}
                        domLayout='normal'
                        onCellValueChanged={(event) => { void onCellValueChanged(event) }}
                    />
                </div>

                <div className='flex gap-2 justify-end'>
                    <Button onClick={onCancel}>
                        Cancel
                    </Button>
                    <Button type='primary' onClick={handleSave} disabled={!isValid}>
                        Continue
                    </Button>
                </div>
            </div>

            <Modal
                title='Create New Unit'
                open={isModalOpen}
                onCancel={() => {
                    setIsModalOpen(false)
                    form.resetFields()
                }}
                onOk={() => { form.submit() }}
                okText='Create'
                cancelText='Cancel'
            >
                <Form
                    form={form}
                    layout='vertical'
                    onFinish={(values) => { void handleCreateUnit(values) }}
                >
                    <Form.Item
                        name='title'
                        label='Unit Title'
                        rules={[
                            {
                                required: true,
                                message: 'Please enter unit title',
                            },
                            {
                                min: 1,
                                message: 'Title must not be empty',
                            },
                        ]}
                    >
                        <Input placeholder='e.g., mg/dL, mmol/L'/>
                    </Form.Item>
                    <Form.Item
                        name='ucumCode'
                        label='UCUM Code'
                        rules={[
                            {
                                required: true,
                                message: 'Please enter UCUM code',
                            },
                            {
                                validator: (_, value: string) => {
                                    if (!value) return Promise.resolve()

                                    const existingUnit = units.find(u => u.ucumCode === value)
                                    if (existingUnit) {
                                        return Promise.reject(new Error(`Unit with code "${value}" already exists`))
                                    }

                                    if (!validateUcumCode(value)) {
                                        return Promise.reject(new Error('Invalid UCUM code'))
                                    }

                                    return Promise.resolve()
                                },
                            },
                        ]}
                    >
                        <Input placeholder='e.g., mg/dL, mmol/L'/>
                    </Form.Item>
                </Form>
            </Modal>
        </>
    )
}

import { useCallback, useMemo } from 'react'

import { AutoComplete, Form, message, Modal } from 'antd'

import { addUnit, useUnits } from '@/db/models/unit'
import { validateUcumCode } from '@/utils/ucum'

import { CreateUnitModalProps } from './CreateUnitModal.types'

interface NewUnitFormData {
    title: string
    ucumCode: string
}

export const CreateUnitModal = (props: CreateUnitModalProps) => {
    const { open, onCancel, onSuccess } = props
    const [form] = Form.useForm<NewUnitFormData>()
    const { data: units } = useUnits()

    const unitTitleOptions = useMemo(() => {
        return units.map(unit => ({
            value: unit.title,
            ucumCode: unit.ucumCode,
        }))
    }, [units])

    const ucumCodeOptions = useMemo(() => {
        return units.map(unit => ({
            value: unit.ucumCode,
            title: unit.title,
        }))
    }, [units])

    const handleCreateUnit = useCallback(async (values: NewUnitFormData) => {
        try {
            await addUnit({
                ucumCode: values.ucumCode,
                title: values.title,
                approved: true,
            })
            void message.success('Unit created successfully')
            onCancel()
            form.resetFields()
            onSuccess?.()
        } catch (error) {
            void message.error('Failed to create unit')
            console.error('Failed to create unit:', error)
        }
    }, [form, onCancel, onSuccess])

    const handleCancel = useCallback(() => {
        onCancel()
        form.resetFields()
    }, [form, onCancel])

    return (
        <Modal
            title='Create New Unit'
            open={open}
            onCancel={handleCancel}
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
                    <AutoComplete
                        options={unitTitleOptions}
                        placeholder='e.g., mg/dL, mmol/L'
                        filterOption={(inputValue, option) =>
                            option?.value?.toLowerCase().includes(inputValue.toLowerCase()) ?? false
                        }
                        onSelect={(value) => {
                            const selectedUnit = unitTitleOptions.find(u => u.value === value)
                            if (selectedUnit) {
                                form.setFieldValue('ucumCode', selectedUnit.ucumCode)
                            }
                        }}
                    />
                </Form.Item>
                <Form.Item
                    name='ucumCode'
                    label='UCUM Code'
                    help={(
                        <span className='text-xs text-gray-500'>
                            See{' '}
                            <a
                                href='https://download.hl7.de/documents/ucum/ucumdata.html'
                                target='_blank'
                                rel='noopener noreferrer'
                                className='text-blue-500 hover:underline'
                            >
                                UCUM codes reference
                            </a>. If UCUM code is not available, you can use <code>{'{any_name}'}</code> format.
                        </span>
                    )}
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
                    <AutoComplete
                        options={ucumCodeOptions}
                        placeholder='e.g., mg/dL, mmol/L'
                        filterOption={(inputValue, option) =>
                            option?.value?.toLowerCase().includes(inputValue.toLowerCase()) ?? false
                        }
                        onSelect={(value) => {
                            const selectedUnit = ucumCodeOptions.find(u => u.value === value)
                            if (selectedUnit && !form.getFieldValue('title')) {
                                form.setFieldValue('title', selectedUnit.title)
                            }
                        }}
                    />
                </Form.Item>
            </Form>
        </Modal>
    )
}

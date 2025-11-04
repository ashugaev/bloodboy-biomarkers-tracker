import { useCallback, useMemo } from 'react'

import { AutoComplete, Form, message, Modal, Select } from 'antd'

import { createBiomarkerConfigs, useBiomarkerConfigs } from '@/db/models/biomarkerConfig'
import { useUnits } from '@/db/models/unit'

import { CreateBiomarkerModalProps } from './CreateBiomarkerModal.types'

interface NewBiomarkerFormData {
    name: string
    ucumCode: string
}

export const CreateBiomarkerModal = (props: CreateBiomarkerModalProps) => {
    const { open, onCancel, onSuccess } = props
    const [form] = Form.useForm<NewBiomarkerFormData>()
    const { data: units } = useUnits()
    const { data: configs } = useBiomarkerConfigs()

    const biomarkerNameOptions = useMemo(() => {
        return configs.map(config => ({
            value: config.name,
        }))
    }, [configs])

    const handleCreateBiomarker = useCallback(async (values: NewBiomarkerFormData) => {
        try {
            await createBiomarkerConfigs([{
                name: values.name,
                ucumCode: values.ucumCode,
                approved: true,
            }])
            void message.success('Biomarker created successfully')
            onCancel()
            form.resetFields()
            onSuccess?.()
        } catch (error) {
            void message.error('Failed to create biomarker')
            console.error('Failed to create biomarker:', error)
        }
    }, [form, onCancel, onSuccess])

    const handleCancel = useCallback(() => {
        onCancel()
        form.resetFields()
    }, [form, onCancel])

    return (
        <Modal
            title='Create New Biomarker'
            open={open}
            onCancel={handleCancel}
            onOk={() => { form.submit() }}
            okText='Create'
            cancelText='Cancel'
        >
            <Form
                form={form}
                layout='vertical'
                onFinish={(values) => { void handleCreateBiomarker(values) }}
            >
                <Form.Item
                    name='name'
                    label='Biomarker Name'
                    rules={[
                        {
                            required: true,
                            message: 'Please enter biomarker name',
                        },
                        {
                            min: 1,
                            message: 'Name must not be empty',
                        },
                    ]}
                >
                    <AutoComplete
                        options={biomarkerNameOptions}
                        placeholder='e.g., Glucose, Cholesterol'
                        filterOption={(inputValue, option) =>
                            option?.value?.toLowerCase().includes(inputValue.toLowerCase()) ?? false
                        }
                    />
                </Form.Item>
                <Form.Item
                    name='ucumCode'
                    label='Unit'
                    rules={[
                        {
                            required: true,
                            message: 'Please select unit',
                        },
                    ]}
                >
                    <Select
                        placeholder='Select unit'
                        showSearch
                        filterOption={(input, option) =>
                            (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                        }
                        options={units.map(u => ({
                            value: u.ucumCode,
                            label: u.title,
                        }))}
                    />
                </Form.Item>
            </Form>
        </Modal>
    )
}

import { useState } from 'react'

import { Button, DatePicker, Input } from 'antd'
import dayjs from 'dayjs'

import { DocumentMetadataFormProps } from './DocumentMetadataForm.types'

export const DocumentMetadataForm = (props: DocumentMetadataFormProps) => {
    const { initialData, onSave, onCancel, className } = props
    const [formData, setFormData] = useState(initialData)

    const handleSave = () => {
        onSave(formData)
    }

    return (
        <div className={`bg-white p-6 rounded shadow-sm border border-gray-100 ${className ?? ''}`}>
            <div className='mb-4'>
                <h3 className='text-lg font-medium'>Document Information</h3>
                <p className='text-sm text-gray-600 mt-1'>Review and edit document metadata</p>
            </div>

            <div className='space-y-4 mb-6'>
                <div>
                    <label className='block text-sm font-medium text-gray-700 mb-1'>
                        File Name
                    </label>
                    <Input
                        value={formData.fileName}
                        disabled
                        className='bg-gray-50'
                    />
                </div>

                <div>
                    <label className='block text-sm font-medium text-gray-700 mb-1'>
                        Laboratory
                    </label>
                    <Input
                        value={formData.lab}
                        onChange={(e) => {
                            setFormData({
                                ...formData,
                                lab: e.target.value,
                            })
                        }}
                        placeholder='Enter laboratory name'
                    />
                </div>

                <div>
                    <label className='block text-sm font-medium text-gray-700 mb-1'>
                        Test Date
                    </label>
                    <DatePicker
                        value={formData.testDate ? dayjs(formData.testDate) : null}
                        onChange={(date) => {
                            setFormData({
                                ...formData,
                                testDate: date?.format('YYYY-MM-DD'),
                            })
                        }}
                        className='w-full'
                        format='YYYY-MM-DD'
                    />
                </div>

                <div>
                    <label className='block text-sm font-medium text-gray-700 mb-1'>
                        Notes
                    </label>
                    <Input.TextArea
                        value={formData.notes}
                        onChange={(e) => {
                            setFormData({
                                ...formData,
                                notes: e.target.value,
                            })
                        }}
                        placeholder='Add any notes...'
                        rows={3}
                    />
                </div>
            </div>

            <div className='flex gap-2 justify-end'>
                <Button onClick={onCancel}>
                    Cancel
                </Button>
                <Button type='primary' onClick={handleSave}>
                    Continue
                </Button>
            </div>
        </div>
    )
}

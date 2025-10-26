import { useState } from 'react'

import { UploadOutlined, FileOutlined, DeleteOutlined } from '@ant-design/icons'
import { Button, Card, List, Typography, Tag, Space } from 'antd'

import { createDocument, formatFileSize, getDocumentTypeFromMimeType, useDocuments, addDocument, deleteDocument, useBiomarkerRecords } from '@/db'

import { DocumentUploadProps } from './DocumentUpload.types'

export const DocumentUpload = (props: DocumentUploadProps) => {
    const { className } = props
    const { Text } = Typography

    const { data: documents, loading } = useDocuments()
    const { data: allRecords } = useBiomarkerRecords()

    const [selectedFile, setSelectedFile] = useState<File | null>(null)
    const [recordCounts, setRecordCounts] = useState<Record<string, number>>({})

    const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0]
        if (file) {
            if (file.type !== 'application/pdf') {
                alert('Only PDF files are supported')
                return
            }
            setSelectedFile(file)
        }
    }

    const handleUpload = async () => {
        if (!selectedFile) return

        const newDocument = await createDocument({
            fileName: `${Date.now()}_${selectedFile.name}`,
            originalName: selectedFile.name,
            fileSize: selectedFile.size,
            mimeType: selectedFile.type,
            type: getDocumentTypeFromMimeType(selectedFile.type),
            uploadDate: new Date(),
        })

        await addDocument(newDocument)
        setSelectedFile(null)

        const fileInput = document.querySelector('input[type="file"]')
        if (fileInput instanceof HTMLInputElement) {
            fileInput.value = ''
        }
    }

    const loadRecordCounts = () => {
        const counts: Record<string, number> = {}
        for (const doc of documents) {
            const records = allRecords.filter(r => r.documentId === doc.id)
            counts[doc.id] = records.length
        }
        setRecordCounts(counts)
    }

    if (loading) return <div className='text-center py-8'>Loading documents...</div>

    return (
        <div className={className}>
            <Card title='Document Upload' className='mb-6'>
                <Space direction='vertical' className='w-full'>
                    <div className='flex gap-4 items-center'>
                        <input
                            type='file'
                            onChange={handleFileSelect}
                            accept='.pdf,application/pdf'
                            className='flex-1'
                        />
                        <Button
                            type='primary'
                            icon={<UploadOutlined/>}
                            onClick={() => { void handleUpload() }}
                            disabled={!selectedFile}
                        >
                            Upload
                        </Button>
                    </div>

                    {selectedFile && (
                        <div className='p-4 bg-gray-50 rounded'>
                            <Text>Selected: {selectedFile.name} ({formatFileSize(selectedFile.size)})</Text>
                        </div>
                    )}
                </Space>
            </Card>

            <Card
                title='Uploaded Documents'
                extra={(
                    <Button size='small' onClick={loadRecordCounts}>
                        Load Stats
                    </Button>
                )}
            >
                {documents.length === 0 ? (
                    <Text type='secondary'>No documents uploaded yet</Text>
                ) : (
                    <List
                        dataSource={documents}
                        renderItem={doc => (
                            <List.Item
                                actions={[
                                    <Button
                                        key='delete'
                                        danger
                                        size='small'
                                        icon={<DeleteOutlined/>}
                                        onClick={() => { void deleteDocument(doc.id) }}
                                    />,
                                ]}
                            >
                                <List.Item.Meta
                                    avatar={<FileOutlined className='text-2xl text-blue-500'/>}
                                    title={(
                                        <Space>
                                            <Text strong>{doc.originalName}</Text>
                                            <Tag color='blue'>{doc.type}</Tag>
                                            <Tag color={doc.approved ? 'green' : 'orange'}>
                                                {doc.approved ? 'approved' : 'pending'}
                                            </Tag>
                                        </Space>
                                    )}
                                    description={(
                                        <Space direction='vertical' size='small'>
                                            <Text type='secondary'>
                                                Size: {formatFileSize(doc.fileSize)}
                                            </Text>
                                            <Text type='secondary'>
                                                Uploaded: {doc.uploadDate.toLocaleDateString()}
                                            </Text>
                                            {doc.lab && <Text type='secondary'>Lab: {doc.lab}</Text>}
                                            {recordCounts[doc.id] !== undefined && (
                                                <Text type='secondary'>
                                                    Records: {recordCounts[doc.id]}
                                                </Text>
                                            )}
                                        </Space>
                                    )}
                                />
                            </List.Item>
                        )}
                    />
                )}
            </Card>
        </div>
    )
}

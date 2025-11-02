import { useState } from 'react'

import { Tabs } from 'antd'
import cn from 'classnames'
import { usePostHog } from 'posthog-js/react'

import { AddNewButton } from '@/components/AddNewButton'
import { BiomarkersDataTable } from '@/components/BiomarkersDataTable'
import { FilesTable } from '@/components/FilesTable'
import { PdfViewer } from '@/components/PdfViewer'
import { createBiomarkerConfigs } from '@/db/models/biomarkerConfig'
import { useBiomarkerRecords } from '@/db/models/biomarkerRecord'
import { useDocuments } from '@/db/models/document'
import { captureEvent } from '@/utils'

import { ContentAreaProps } from './ContentArea.types'

export const ContentArea = (props: ContentAreaProps) => {
    const { className } = props
    const posthog = usePostHog()
    const [activeTab, setActiveTab] = useState<'biomarkers' | 'files'>('biomarkers')
    const { data: unconfirmedDocuments } = useDocuments({ filter: (item) => !item.approved })
    const { data: records } = useBiomarkerRecords({ filter: (r) => r.approved })
    const { data: documents } = useDocuments()

    const currentDocument = unconfirmedDocuments[0]

    const handleAddNew = async () => {
        await createBiomarkerConfigs([{
            name: '',
            approved: true,
        }])
    }

    const biomarkersCount = records.length
    const filesCount = documents.length

    if (currentDocument?.fileData) {
        return (
            <div className={cn('overflow-hidden', className)}>
                <div className='bg-white rounded border border-gray-100 h-full'>
                    <PdfViewer
                        fileData={currentDocument.fileData}
                        fileName={currentDocument.originalName}
                    />
                </div>
            </div>
        )
    }

    return (
        <div className={cn('flex flex-col h-full min-h-0', className)}>
            <div className='flex justify-between items-center mb-4 flex-shrink-0' style={{ minHeight: 40 }}>
                <h3 className='text-lg font-medium'>
                    {activeTab === 'biomarkers' ? `Test Records (${biomarkersCount})` : `Files (${filesCount})`}
                </h3>
                {activeTab === 'biomarkers' && (
                    <AddNewButton onClick={() => { void handleAddNew() }}/>
                )}
            </div>
            <div className='bg-white px-6 pb-6 rounded border border-gray-100 flex flex-col flex-1 min-h-0'>
                <Tabs
                    activeKey={activeTab}
                    onChange={(key) => {
                        captureEvent(posthog, 'content_area_tab_changed', {
                            tab: key,
                        })
                        setActiveTab(key as 'biomarkers' | 'files')
                    }}
                    centered
                    items={[
                        {
                            key: 'biomarkers',
                            label: 'Test Records',
                        },
                        {
                            key: 'files',
                            label: 'Files',
                        },
                    ]}
                    className='flex-shrink-0'
                />
                <div className='flex-1 min-h-0 mt-4'>
                    {activeTab === 'biomarkers' ? (
                        <BiomarkersDataTable className='h-full'/>
                    ) : (
                        <FilesTable className='h-full'/>
                    )}
                </div>
            </div>
        </div>
    )
}

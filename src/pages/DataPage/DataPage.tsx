import { useState } from 'react'

import { ApiKeyInput } from '@/components/ApiKeyInput'
import { ConfirmationPanel } from '@/components/ConfirmationPanel'
import { ContentArea } from '@/components/ContentArea'
import { Header } from '@/components/Header'
import { UploadArea } from '@/components/UploadArea'
import { useBiomarkerConfigs } from '@/db/models/biomarkerConfig'
import { useBiomarkerRecords } from '@/db/models/biomarkerRecord'
import { useDocuments } from '@/db/models/document'
import { useExtractBiomarkers } from '@/openai'

import { DataPageProps } from './DataPage.types'

export const DataPage = (props: DataPageProps) => {
    const { className } = props
    const { hasApiKey, loading } = useExtractBiomarkers()
    const { data: unconfirmedDocuments } = useDocuments({ filter: (item) => !item.approved })
    const { data: unconfirmedConfigs } = useBiomarkerConfigs({ filter: (item) => !item.approved })
    const { data: unconfirmedRecords } = useBiomarkerRecords({ filter: (item) => !item.approved })
    const [currentPage, setCurrentPage] = useState<number | undefined>()

    const hasPendingConfirmations =
        unconfirmedDocuments.length > 0 ||
        unconfirmedConfigs.length > 0 ||
        unconfirmedRecords.length > 0

    if (loading) return null

    return (
        <div className={className}>
            <Header/>
            <div className='h-screen bg-gray-50 pt-16 flex flex-col overflow-hidden'>
                {!hasApiKey ? (
                    <div className='flex items-center justify-center flex-1'>
                        <div className='w-full max-w-2xl px-4'>
                            <ApiKeyInput/>
                        </div>
                    </div>
                ) : (
                    <div className='flex flex-col flex-1 pr-4 pb-4 pl-4 gap-4 overflow-hidden'>
                        {!hasPendingConfirmations && <UploadArea/>}

                        <div className='flex flex-col md:flex-row flex-1 gap-4 overflow-hidden'>
                            <ConfirmationPanel
                                className='w-full md:flex-[5] flex flex-col overflow-hidden'
                                onPageChange={setCurrentPage}
                            />
                            <ContentArea
                                className={`w-full flex flex-col overflow-hidden ${hasPendingConfirmations ? 'md:flex-[5]' : 'md:flex-1'}`}
                                currentPage={currentPage}
                            />
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

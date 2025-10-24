import { ApiKeyInput } from '@/components/ApiKeyInput'
import { ConfirmationPanel } from '@/components/ConfirmationPanel'
import { ContentArea } from '@/components/ContentArea'
import { Header } from '@/components/Header'
import { UploadArea } from '@/components/UploadArea'
import { useUnconfirmedBiomarkerConfigs } from '@/db/hooks/useUnconfirmedBiomarkerConfigs'
import { useUnconfirmedBiomarkerRecords } from '@/db/hooks/useUnconfirmedBiomarkerRecords'
import { useUnconfirmedDocuments } from '@/db/hooks/useUnconfirmedDocuments'
import { useExtractBiomarkers } from '@/openai'

import { DataPageProps } from './DataPage.types'

export const DataPage = (props: DataPageProps) => {
    const { className } = props
    const { hasApiKey, loading } = useExtractBiomarkers()
    const { unconfirmedDocuments } = useUnconfirmedDocuments()
    const { unconfirmedConfigs } = useUnconfirmedBiomarkerConfigs()
    const { unconfirmedRecords } = useUnconfirmedBiomarkerRecords()

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
                        <UploadArea/>

                        <div className='flex flex-col md:flex-row flex-1 gap-4 overflow-hidden'>
                            <ConfirmationPanel className='w-full md:flex-[5] flex flex-col overflow-hidden'/>
                            <ContentArea className={`w-full flex flex-col overflow-hidden ${hasPendingConfirmations ? 'md:flex-[5]' : 'md:flex-1'}`}/>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

import { Spin } from 'antd'

import { ApiKeyInput } from '@/components/ApiKeyInput'
import { Header } from '@/components/Header'
import { PdfUploadForm } from '@/components/PdfUploadForm'
import { useExtractBiomarkers } from '@/openai'

import { DataPageProps } from './DataPage.types'

export const DataPage = (props: DataPageProps) => {
    const { className } = props
    const { hasApiKey, loading } = useExtractBiomarkers()

    return (
        <div className={className}>
            <Header/>
            <div className='min-h-screen bg-gray-50 flex items-center justify-center pt-16'>
                <div className='w-full max-w-2xl px-4 space-y-6'>
                    {loading ? (
                        <Spin size='large'/>
                    ) : !hasApiKey ? (
                        <ApiKeyInput/>
                    ) : (
                        <PdfUploadForm/>
                    )}
                </div>
            </div>
        </div>
    )
}

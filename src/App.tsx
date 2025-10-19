import { ConfigProvider } from 'antd'

import { BiomarkerExample } from '@/components/BiomarkerExample'
import { DocumentUpload } from '@/components/DocumentUpload'
import { themeConfig } from '@/constants'

export const App = () => {
    return (
        <ConfigProvider theme={themeConfig}>
            <div className='min-h-screen bg-gray-50'>
                <div className='container mx-auto py-8'>
                    <h1 className='text-3xl font-bold text-center mb-8'>
                        Blood Test Tracker
                    </h1>
                    <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
                        <DocumentUpload/>
                        <BiomarkerExample/>
                    </div>
                </div>
            </div>
        </ConfigProvider>
    )
}

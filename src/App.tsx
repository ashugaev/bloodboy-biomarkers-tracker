import { ConfigProvider } from 'antd'
import { RcFile } from 'antd/es/upload/interface'
import { PDFParse } from 'pdf-parse'
import { UploadRequestOption } from 'rc-upload/lib/interface'

import { UploadDropZone } from '@/components/UploadDropZone'
import { themeConfig } from '@/constants'

interface PdfData {
    text: string
    numpages: number
}

export const App = () => {
    const handleUpload = async (data: UploadRequestOption) => {
        const file = data.file as RcFile
        let parser: PDFParse | null = null

        try {
            const arrayBuffer = await file.arrayBuffer()
            parser = new PDFParse({ data: arrayBuffer })
            const pdfData = await parser.getText() as PdfData

            // eslint-disable-next-line no-console
            console.log('Extracted text:', pdfData.text)
            // eslint-disable-next-line no-console
            console.log('Pages:', pdfData.numpages)

            data.onSuccess?.(pdfData)
        } catch (error) {
            // eslint-disable-next-line no-console
            console.error('PDF parsing error:', error)
            data.onError?.(error as Error)
        } finally {
            if (parser) {
                await parser.destroy()
            }
        }
    }

    return (
        <ConfigProvider theme={themeConfig}>
            <div className='min-h-screen bg-gray-50 flex items-center justify-center'>
                <div className='w-full max-w-2xl px-4'>
                    <UploadDropZone
                        customRequest={handleUpload}
                        button
                    />
                </div>
            </div>
        </ConfigProvider>
    )
}

import { useUnconfirmedDocuments } from '../../db/hooks'
import { PdfViewer } from '../PdfViewer'

import { ContentAreaProps } from './ContentArea.types'

export const ContentArea = (props: ContentAreaProps) => {
    const { className } = props
    const { unconfirmedDocuments } = useUnconfirmedDocuments()

    const currentDocument = unconfirmedDocuments[0]

    if (currentDocument?.fileData) {
        return (
            <div className={`overflow-hidden ${className ?? ''}`}>
                <div className='bg-white rounded-lg shadow-sm h-full'>
                    <PdfViewer
                        fileData={currentDocument.fileData}
                        fileName={currentDocument.originalName}
                    />
                </div>
            </div>
        )
    }

    return (
        <div className={`overflow-y-auto ${className ?? ''}`}>
            <div className='bg-white p-6 rounded-lg shadow-sm min-h-full flex items-center justify-center text-gray-400'>
                Content area (reserved for future features)
            </div>
        </div>
    )
}

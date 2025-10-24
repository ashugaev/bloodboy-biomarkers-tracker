import { useUnconfirmedDocuments } from '../../db/hooks'
import { BiomarkersDataTable } from '../BiomarkersDataTable'
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
        <div className={`flex flex-col ${className ?? ''}`}>
            <BiomarkersDataTable className='flex-1'/>
        </div>
    )
}

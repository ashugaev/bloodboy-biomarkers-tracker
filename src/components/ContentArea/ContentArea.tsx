import { BiomarkersDataTable } from '@/components/BiomarkersDataTable'
import { PdfViewer } from '@/components/PdfViewer'
import { useDocuments } from '@/db/models/document'

import { ContentAreaProps } from './ContentArea.types'

export const ContentArea = (props: ContentAreaProps) => {
    const { className } = props
    const { data: unconfirmedDocuments } = useDocuments({ filter: (item) => !item.approved })

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

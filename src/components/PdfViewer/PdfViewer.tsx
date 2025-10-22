import { useState, useEffect } from 'react'

import { Document, Page, pdfjs } from 'react-pdf'

import { PdfViewerProps } from './PdfViewer.types'

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`

export const PdfViewer = (props: PdfViewerProps) => {
    const { fileData } = props
    const [, setNumPages] = useState<number>(0)
    const [pageNumber] = useState<number>(1)
    const [blobUrl, setBlobUrl] = useState<string | null>(null)

    useEffect(() => {
        if (!fileData) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setBlobUrl(null)
            return
        }

        const blob = new Blob([fileData], { type: 'application/pdf' })
        const url = URL.createObjectURL(blob)
        setBlobUrl(url)

        return () => {
            URL.revokeObjectURL(url)
        }
    }, [fileData])

    const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
        setNumPages(numPages)
    }

    if (!blobUrl) {
        return null
    }

    return (
        <div className='flex flex-col h-full'>
            <div className='flex-1 overflow-auto flex justify-center p-4'>
                <Document
                    file={blobUrl}
                    onLoadSuccess={onDocumentLoadSuccess}
                    loading={<div className='text-gray-500'>Loading PDF...</div>}
                    error={<div className='text-red-500'>Failed to load PDF</div>}
                >
                    <Page
                        pageNumber={pageNumber}
                        renderTextLayer
                        renderAnnotationLayer
                    />
                </Document>
            </div>
        </div>
    )
}

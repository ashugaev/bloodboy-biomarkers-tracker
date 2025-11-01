import { useState, useEffect, useRef } from 'react'

import { Document, Page, pdfjs } from 'react-pdf'

import { PdfViewerProps } from './PdfViewer.types'

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`

export const PdfViewer = (props: PdfViewerProps) => {
    const { fileData } = props
    const [blobUrl, setBlobUrl] = useState<string | null>(null)
    const [containerWidth, setContainerWidth] = useState<number>(0)
    const [scale, setScale] = useState<number>(1)
    const [numPages, setNumPages] = useState<number>(0)
    const containerRef = useRef<HTMLDivElement>(null)

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

    useEffect(() => {
        const updateWidth = () => {
            if (containerRef.current) {
                setContainerWidth(containerRef.current.offsetWidth - 32)
            }
        }

        updateWidth()

        const resizeObserver = new ResizeObserver(updateWidth)
        if (containerRef.current) {
            resizeObserver.observe(containerRef.current)
        }

        return () => {
            resizeObserver.disconnect()
        }
    }, [])

    const handleZoomIn = () => {
        setScale(prev => Math.min(prev + 0.25, 3))
    }

    const handleZoomOut = () => {
        setScale(prev => Math.max(prev - 0.25, 0.5))
    }

    const handleResetZoom = () => {
        setScale(1)
    }

    if (!blobUrl) {
        return null
    }

    return (
        <div className='flex flex-col h-full'>
            <div className='flex-1 relative min-h-0'>
                <div ref={containerRef} className='absolute inset-0 overflow-auto p-4'>
                    <div className='inline-block min-w-full text-center'>
                        <Document
                            file={blobUrl}
                            loading={<div className='text-gray-500'>Loading PDF...</div>}
                            error={<div className='text-red-500'>Failed to load PDF</div>}
                            onLoadSuccess={(pdf) => { setNumPages(pdf.numPages) }}
                            className='flex flex-col gap-4'
                        >
                            {Array.from(new Array(numPages), (_, index) => (
                                <div key={`page_${index + 1}`} className='flex flex-col gap-4'>
                                    <Page
                                        pageNumber={index + 1}
                                        width={containerWidth || undefined}
                                        scale={scale}
                                        renderTextLayer={false}
                                        renderAnnotationLayer={false}
                                    />
                                    {index < numPages - 1 && (
                                        <div className='h-1 w-full bg-gray-100'></div>
                                    )}
                                </div>
                            ))}
                        </Document>
                    </div>
                </div>
                <div className='absolute bottom-4 left-1/2 -translate-x-1/2 z-50 flex gap-2 bg-white/50 backdrop-blur-sm rounded-lg shadow-md p-1 pointer-events-auto'>
                    <button
                        onClick={handleZoomOut}
                        className='p-2 hover:bg-gray-100/80 rounded transition-colors'
                        title='Zoom Out'
                    >
                        <svg xmlns='http://www.w3.org/2000/svg' className='h-5 w-5' viewBox='0 0 20 20' fill='currentColor'>
                            <path fillRule='evenodd' d='M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z' clipRule='evenodd'/>
                            <path fillRule='evenodd' d='M5 8a1 1 0 011-1h4a1 1 0 110 2H6a1 1 0 01-1-1z' clipRule='evenodd'/>
                        </svg>
                    </button>
                    <button
                        onClick={handleResetZoom}
                        className='px-3 py-2 hover:bg-gray-100/80 rounded transition-colors text-sm font-medium'
                        title='Reset Zoom'
                    >
                        {Math.round(scale * 100)}%
                    </button>
                    <button
                        onClick={handleZoomIn}
                        className='p-2 hover:bg-gray-100/80 rounded transition-colors'
                        title='Zoom In'
                    >
                        <svg xmlns='http://www.w3.org/2000/svg' className='h-5 w-5' viewBox='0 0 20 20' fill='currentColor'>
                            <path fillRule='evenodd' d='M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z' clipRule='evenodd'/>
                            <path fillRule='evenodd' d='M8 5a1 1 0 011 1v1h1a1 1 0 110 2H9v1a1 1 0 11-2 0V9H6a1 1 0 110-2h1V6a1 1 0 011-1z' clipRule='evenodd'/>
                        </svg>
                    </button>
                </div>
            </div>
        </div>
    )
}

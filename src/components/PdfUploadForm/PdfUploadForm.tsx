import { useState } from 'react'

import { RcFile } from 'antd/es/upload/interface'
import { PDFParse } from 'pdf-parse'
import { UploadRequestOption } from 'rc-upload/lib/interface'
import { v4 as uuidv4 } from 'uuid'

import { addBiomarkerRecord } from '@/db/hooks/useBiomarkerRecords'
import { Unit } from '@/db/types'
import { useExtractBiomarkers } from '@/openai'
import { ExtractedBiomarker } from '@/openai/biomarkers'

import { ExtractionResults } from '../ExtractionResults'
import { UploadDropZone } from '../UploadDropZone'
import { UploadStatus, UploadStage } from '../UploadStatus'

import { PdfUploadFormProps } from './PdfUploadForm.types'

export const PdfUploadForm = (props: PdfUploadFormProps) => {
    const { className } = props
    const { extractBiomarkers, hasApiKey } = useExtractBiomarkers()
    const [uploadStage, setUploadStage] = useState<UploadStage | null>(null)
    const [currentPage, setCurrentPage] = useState<number>(0)
    const [totalPages, setTotalPages] = useState<number>(0)
    const [extractedBiomarkers, setExtractedBiomarkers] = useState<ExtractedBiomarker[]>([])
    const [showResults, setShowResults] = useState(false)
    const [pdfPages, setPdfPages] = useState<Array<{ text: string }>>([])

    const handleUpload = async (data: UploadRequestOption) => {
        const file = data.file as RcFile
        let parser: PDFParse | null = null

        try {
            setUploadStage(UploadStage.UPLOADING)
            const arrayBuffer = await file.arrayBuffer()

            setUploadStage(UploadStage.PARSING)
            parser = new PDFParse({ data: arrayBuffer })
            const pdfData = await parser.getText()

            // eslint-disable-next-line no-console
            console.log('Extracted text:', pdfData.text)
            // eslint-disable-next-line no-console
            console.log('Pages:', pdfData.pages)

            setPdfPages(pdfData.pages || [])

            if (hasApiKey && pdfData.pages) {
                await performExtraction(pdfData.pages)
            }

            data.onSuccess?.(pdfData)
        } catch (error) {
            // eslint-disable-next-line no-console
            console.error('PDF parsing error:', error)
            data.onError?.(error as Error)
        } finally {
            if (parser) {
                await parser.destroy()
            }
            setUploadStage(null)
            setCurrentPage(0)
            setTotalPages(0)
        }
    }

    const performExtraction = async (pages: Array<{ text: string }>) => {
        setUploadStage(UploadStage.EXTRACTING)
        setTotalPages(pages.length)

        const allBiomarkers = []

        for (let i = 0; i < pages.length; i++) {
            setCurrentPage(i + 1)
            const pageText = pages[i].text

            try {
                const biomarkers = await extractBiomarkers(pageText)
                if (biomarkers?.biomarkers.length) {
                    allBiomarkers.push(...biomarkers.biomarkers)
                }
            } catch (openaiError) {
                // eslint-disable-next-line no-console
                console.error(`OpenAI extraction error on page ${i + 1}:`, openaiError)
            }
        }

        // eslint-disable-next-line no-console
        console.log('All extracted biomarkers:', allBiomarkers)

        setExtractedBiomarkers(allBiomarkers)
        setShowResults(true)
        setUploadStage(null)
        setCurrentPage(0)
        setTotalPages(0)
    }

    const handleRetry = async () => {
        setShowResults(false)
        setExtractedBiomarkers([])

        if (pdfPages.length > 0) {
            await performExtraction(pdfPages)
        }
    }

    const handleSave = async (biomarkers: ExtractedBiomarker[]) => {
        const now = new Date()

        for (const biomarker of biomarkers) {
            const record = {
                id: uuidv4(),
                userId: 'default',
                biomarkerId: uuidv4(),
                value: biomarker.value,
                unit: biomarker.unit as Unit,
                testDate: biomarker.date ? new Date(biomarker.date) : now,
                approved: false,
                latest: true,
                createdAt: now,
                updatedAt: now,
            }

            await addBiomarkerRecord(record)
        }

        setShowResults(false)
        setExtractedBiomarkers([])
    }

    const handleCancel = () => {
        setShowResults(false)
        setExtractedBiomarkers([])
        setPdfPages([])
    }

    if (showResults) {
        return (
            <ExtractionResults
                biomarkers={extractedBiomarkers}
                onSave={handleSave}
                onCancel={handleCancel}
                onRetry={handleRetry}
                className={className}
            />
        )
    }

    if (uploadStage) {
        return (
            <UploadStatus
                stage={uploadStage}
                currentPage={currentPage}
                totalPages={totalPages}
                className={className}
            />
        )
    }

    return (
        <UploadDropZone
            customRequest={handleUpload}
            button
            className={className}
        />
    )
}

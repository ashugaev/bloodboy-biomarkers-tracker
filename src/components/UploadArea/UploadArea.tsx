import { useState, useEffect, useRef } from 'react'

import { RcFile } from 'antd/es/upload/interface'
import { PDFParse } from 'pdf-parse'
import { UploadRequestOption } from 'rc-upload/lib/interface'
import { v4 as uuidv4 } from 'uuid'

import { addBiomarkerConfig, useBiomarkerConfigs } from '@/db/hooks/useBiomarkerConfigs'
import { addBiomarkerRecord } from '@/db/hooks/useBiomarkerRecords'
import { addDocument } from '@/db/hooks/useDocuments'
import { useUnconfirmedBiomarkerConfigs } from '@/db/hooks/useUnconfirmedBiomarkerConfigs'
import { useUnconfirmedBiomarkerRecords } from '@/db/hooks/useUnconfirmedBiomarkerRecords'
import { useUnconfirmedDocuments } from '@/db/hooks/useUnconfirmedDocuments'
import { getCurrentUserId } from '@/db/hooks/useUser'
import { DocumentType, Unit } from '@/db/types'
import { validateExtractionResult } from '@/db/utils'
import { useExtractBiomarkers } from '@/openai'
import { ExtractedBiomarker } from '@/openai/biomarkers'

import { UploadDropZone } from '../UploadDropZone'
import { UploadStatus, UploadStage } from '../UploadStatus'

export const UploadArea = () => {
    const { extractBiomarkers, hasApiKey } = useExtractBiomarkers()
    const { configs } = useBiomarkerConfigs()
    const { unconfirmedDocuments } = useUnconfirmedDocuments()
    const { unconfirmedConfigs } = useUnconfirmedBiomarkerConfigs()
    const { unconfirmedRecords } = useUnconfirmedBiomarkerRecords()

    const [uploadStage, setUploadStage] = useState<UploadStage | null>(null)
    const [currentPage, setCurrentPage] = useState<number>(0)
    const [totalPages, setTotalPages] = useState<number>(0)
    const [currentFile, setCurrentFile] = useState<number>(0)
    const [totalFiles, setTotalFiles] = useState<number>(0)
    const uploadQueueRef = useRef<UploadRequestOption[]>([])
    const isProcessingRef = useRef(false)
    const [queueTrigger, setQueueTrigger] = useState(0)

    const isUploading = uploadStage !== null
    const hasUnconfirmed =
        unconfirmedDocuments.length > 0 ||
        unconfirmedConfigs.length > 0 ||
        unconfirmedRecords.length > 0
    const isDisabled = isUploading || hasUnconfirmed

    const handleUpload = async (data: UploadRequestOption) => {
        uploadQueueRef.current.push(data)
        setTotalFiles(uploadQueueRef.current.length)
        setQueueTrigger(prev => prev + 1)
        return Promise.resolve()
    }

    const processFile = async (data: UploadRequestOption) => {
        const file = data.file as RcFile
        let parser: PDFParse | null = null

        try {
            setUploadStage(UploadStage.UPLOADING)
            const arrayBuffer = await file.arrayBuffer()

            setUploadStage(UploadStage.PARSING)
            parser = new PDFParse({ data: arrayBuffer })
            const pdfData = await parser.getText()

            if (hasApiKey && pdfData.pages) {
                await performExtraction(file, pdfData.pages)
            }

            data.onSuccess?.(pdfData)
        } catch (error) {
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

    useEffect(() => {
        const processQueue = async () => {
            if (isProcessingRef.current || uploadQueueRef.current.length === 0) return

            isProcessingRef.current = true

            while (uploadQueueRef.current.length > 0) {
                const nextFile = uploadQueueRef.current.shift()
                if (!nextFile) break

                setCurrentFile(totalFiles - uploadQueueRef.current.length)
                await processFile(nextFile)
            }

            isProcessingRef.current = false
            setCurrentFile(0)
            setTotalFiles(0)
        }

        void processQueue()
    }, [queueTrigger])

    const performExtraction = async (file: RcFile, pages: Array<{ text: string }>) => {
        setUploadStage(UploadStage.EXTRACTING)
        setTotalPages(pages.length)

        const allBiomarkers: ExtractedBiomarker[] = []
        const metadata = {
            testDate: undefined as string | undefined,
            labName: undefined as string | undefined,
            notes: undefined as string | undefined,
        }

        const MAX_RETRIES = 2

        for (let i = 0; i < pages.length; i++) {
            setCurrentPage(i + 1)
            const pageText = pages[i].text
            let retryCount = 0
            let success = false

            while (retryCount <= MAX_RETRIES && !success) {
                try {
                    const result = await extractBiomarkers(pageText)
                    if (result) {
                        const isValid = validateExtractionResult(result)
                        if (!isValid) {
                            throw new Error('Validation failed')
                        }

                        if (result.biomarkers.length) {
                            allBiomarkers.push(...result.biomarkers)
                        }
                        if (result.testDate && !metadata.testDate) {
                            metadata.testDate = result.testDate
                        }
                        if (result.labName && !metadata.labName) {
                            metadata.labName = result.labName
                        }
                        if (result.notes) {
                            metadata.notes = metadata.notes ? `${metadata.notes}\n${result.notes}` : result.notes
                        }
                        success = true
                    }
                } catch (error) {
                    retryCount++
                    if (retryCount > MAX_RETRIES) {
                        console.error(`Failed to extract page ${i + 1} after ${MAX_RETRIES + 1} attempts:`, error)
                    }
                }
            }
        }

        await saveToDatabase(file, allBiomarkers, metadata)

        setUploadStage(null)
        setCurrentPage(0)
        setTotalPages(0)
    }

    const saveToDatabase = async (
        file: RcFile,
        biomarkers: ExtractedBiomarker[],
        metadata: { testDate?: string, labName?: string, notes?: string },
    ) => {
        const now = new Date()
        const documentId = uuidv4()
        const userId = await getCurrentUserId()
        const fileData = await file.arrayBuffer()

        await addDocument({
            id: documentId,
            userId,
            type: DocumentType.PDF,
            approved: false,
            uploadDate: now,
            fileName: file.name,
            originalName: file.name,
            fileSize: file.size,
            mimeType: file.type,
            fileData,
            lab: metadata.labName,
            testDate: metadata.testDate ? new Date(metadata.testDate) : undefined,
            notes: metadata.notes,
            createdAt: now,
            updatedAt: now,
        })

        const uniqueExtractedBiomarkerNames = new Set(biomarkers.map(b => b.name))
        const existingBiomarkerConfigNames = new Set(configs.map(c => c.name))
        const newConfigIds: Record<string, string> = {}

        for (const name of uniqueExtractedBiomarkerNames) {
            if (!existingBiomarkerConfigNames.has(name)) {
                const biomarker = biomarkers.find(b => b.name === name)
                const configId = uuidv4()
                newConfigIds[name] = configId

                await addBiomarkerConfig({
                    id: configId,
                    userId,
                    name,
                    unit: biomarker?.unit as Unit | undefined,
                    normalRange: biomarker?.referenceRange ? {
                        min: biomarker.referenceRange.min,
                        max: biomarker.referenceRange.max,
                    } : undefined,
                    approved: false,
                    order: biomarker?.order,
                    createdAt: now,
                    updatedAt: now,
                })
            }
        }

        for (const biomarker of biomarkers) {
            const existingConfig = configs.find(c => c.name === biomarker.name)
            const biomarkerId = existingConfig?.id ?? newConfigIds[biomarker.name ?? '']

            if (!biomarkerId) continue

            await addBiomarkerRecord({
                id: uuidv4(),
                userId,
                biomarkerId,
                documentId,
                value: biomarker.value,
                unit: biomarker.unit as Unit,
                approved: false,
                latest: true,
                order: biomarker.order,
                createdAt: now,
                updatedAt: now,
            })
        }
    }

    if (uploadStage) {
        return (
            <UploadStatus
                stage={uploadStage}
                currentPage={currentPage}
                totalPages={totalPages}
                currentFile={currentFile}
                totalFiles={totalFiles}
            />
        )
    }

    if (isDisabled) return null

    return (
        <UploadDropZone
            customRequest={handleUpload}
            button
            disabled={isDisabled}
        />
    )
}

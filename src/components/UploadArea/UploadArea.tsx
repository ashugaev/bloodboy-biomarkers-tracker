import { useState, useEffect, useRef } from 'react'

import { message } from 'antd'
import { RcFile } from 'antd/es/upload/interface'
import { UploadRequestOption } from 'rc-upload/lib/interface'
import { v4 as uuidv4 } from 'uuid'

import { addBiomarkerConfig, useBiomarkerConfigs } from '@/db/hooks/useBiomarkerConfigs'
import { addBiomarkerRecord } from '@/db/hooks/useBiomarkerRecords'
import { addDocument } from '@/db/hooks/useDocuments'
import { useUnconfirmedBiomarkerConfigs } from '@/db/hooks/useUnconfirmedBiomarkerConfigs'
import { useUnconfirmedBiomarkerRecords } from '@/db/hooks/useUnconfirmedBiomarkerRecords'
import { useUnconfirmedDocuments } from '@/db/hooks/useUnconfirmedDocuments'
import { addUnit, useUnits } from '@/db/hooks/useUnits'
import { getCurrentUserId } from '@/db/hooks/useUser'
import { DocumentType } from '@/db/types'
import { useExtractBiomarkers } from '@/openai'
import { ExtractedBiomarker } from '@/openai/biomarkers'

import { UploadDropZone } from '../UploadDropZone'
import { UploadStatus, UploadStage } from '../UploadStatus'

import { normalizeExtractionResults, usePdfExtraction } from './UploadArea.hooks'

export const UploadArea = () => {
    const { extractBiomarkers, hasApiKey } = useExtractBiomarkers()
    const { configs } = useBiomarkerConfigs()
    const { units } = useUnits()
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

    const { extractFromPdf } = usePdfExtraction({
        extractBiomarkers,
        onPageProgress: setCurrentPage,
        onTotalPagesFound: setTotalPages,
    })

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

    useEffect(() => {
        const processFile = async (data: UploadRequestOption) => {
            const file = data.file as RcFile

            try {
                setUploadStage(UploadStage.UPLOADING)
                const arrayBuffer = await file.arrayBuffer()

                setUploadStage(UploadStage.PARSING)

                if (hasApiKey) {
                    await performExtraction(file, arrayBuffer)
                }

                data.onSuccess?.({ success: true })
            } catch (error) {
                console.error('PDF parsing error:', error)
                data.onError?.(error as Error)
            } finally {
                setUploadStage(null)
                setCurrentPage(0)
                setTotalPages(0)
            }
        }

        const processQueue = async () => {
            if (isProcessingRef.current || uploadQueueRef.current.length === 0) return

            isProcessingRef.current = true
            const totalCount = uploadQueueRef.current.length

            while (uploadQueueRef.current.length > 0) {
                const nextFile = uploadQueueRef.current.shift()
                if (!nextFile) break

                setCurrentFile(totalCount - uploadQueueRef.current.length)
                await processFile(nextFile)
            }

            isProcessingRef.current = false
            setCurrentFile(0)
            setTotalFiles(0)
        }

        void processQueue()
    }, [queueTrigger, hasApiKey])

    const performExtraction = async (file: RcFile, arrayBuffer: ArrayBuffer) => {
        setUploadStage(UploadStage.EXTRACTING)

        const result = await extractFromPdf(arrayBuffer)

        if (result.biomarkers.length === 0) {
            void message.error('No biomarkers found in the document')
            setUploadStage(null)
            setCurrentPage(0)
            setTotalPages(0)
            return
        }

        await saveToDatabase(file, result)

        setUploadStage(null)
        setCurrentPage(0)
        setTotalPages(0)
    }

    const saveToDatabase = async (
        file: RcFile,
        extractionResult: ExtractionResult,
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

        const uniqueExtractedUcumCodes = new Set(
            biomarkers.map(b => b.ucumCode).filter((code): code is string => !!code),
        )
        const existingUnitCodes = new Set(units.map(u => u.ucumCode))

        for (const ucumCode of uniqueExtractedUcumCodes) {
            if (!existingUnitCodes.has(ucumCode)) {
                const biomarkerWithUnit = biomarkers.find(b => b.ucumCode === ucumCode)
                // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call
                await addUnit({
                    ucumCode,
                    title: biomarkerWithUnit?.unit ?? ucumCode,
                    approved: false,
                    createdAt: now,
                    updatedAt: now,
                })
            }
        }

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
                    ucumCode: biomarker?.ucumCode,
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
                ucumCode: biomarker.ucumCode ?? '',
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

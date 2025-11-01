import { useState, useEffect, useRef } from 'react'

import { message } from 'antd'
import { RcFile } from 'antd/es/upload/interface'
import { UploadRequestOption } from 'rc-upload/lib/interface'
import { v4 as uuidv4 } from 'uuid'

import { ExtractionErrorModal } from '@/components/ExtractionErrorModal'
import { UploadDropZone } from '@/components/UploadDropZone'
import { UploadStatus, UploadStage } from '@/components/UploadStatus'
import { createBiomarkerConfigs, useBiomarkerConfigs } from '@/db/models/biomarkerConfig'
import { createBiomarkerRecords, useBiomarkerRecords } from '@/db/models/biomarkerRecord'
import { addDocument, useDocuments, DocumentType } from '@/db/models/document'
import { createUnits, useUnits } from '@/db/models/unit'
import { getCurrentUserId } from '@/db/models/user'
import { useExtractBiomarkers } from '@/openai'
import { ExtractionResult } from '@/openai/openai.biomarkers'

import { usePdfExtraction } from './UploadArea.hooks'
import { createRecordKey, createDocumentKey } from './UploadArea.utils'

export const UploadArea = () => {
    const { extractBiomarkers, hasApiKey } = useExtractBiomarkers()
    const { data: configs } = useBiomarkerConfigs()
    const { data: records } = useBiomarkerRecords()
    const { data: units } = useUnits()
    const { data: documents } = useDocuments()
    const { data: unconfirmedDocuments } = useDocuments({ filter: (item) => !item.approved })
    const { data: unconfirmedConfigs } = useBiomarkerConfigs({ filter: (item) => !item.approved })
    const { data: unconfirmedRecords } = useBiomarkerRecords({ filter: (item) => !item.approved })

    const [uploadStage, setUploadStage] = useState<UploadStage | null>(null)
    const [currentPage, setCurrentPage] = useState<number>(0)
    const [totalPages, setTotalPages] = useState<number>(0)
    const [currentFile, setCurrentFile] = useState<number>(0)
    const [totalFiles, setTotalFiles] = useState<number>(0)
    const uploadQueueRef = useRef<UploadRequestOption[]>([])
    const isProcessingRef = useRef(false)
    const [queueTrigger, setQueueTrigger] = useState(0)
    const [showErrorModal, setShowErrorModal] = useState(false)
    const [failedPageIndices, setFailedPageIndices] = useState<number[]>([])
    const [retrying, setRetrying] = useState(false)
    const currentFileRef = useRef<RcFile | null>(null)
    const currentArrayBufferRef = useRef<ArrayBuffer | null>(null)
    const savedPageResultsRef = useRef<Map<number, ExtractionResult | null>>(new Map())

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
    }, [queueTrigger, hasApiKey, documents, configs, records, extractFromPdf])

    const performExtraction = async (file: RcFile, arrayBuffer: ArrayBuffer, retryFailedPages?: number[], model?: string) => {
        setUploadStage(UploadStage.EXTRACTING)

        const extractionResult = await extractFromPdf(
            arrayBuffer,
            retryFailedPages,
            model,
            retryFailedPages ? savedPageResultsRef.current : undefined,
        )

        if (extractionResult.failedPageIndices.length > 0) {
            setFailedPageIndices(extractionResult.failedPageIndices)
            setShowErrorModal(true)
            currentFileRef.current = file
            currentArrayBufferRef.current = arrayBuffer
            savedPageResultsRef.current = extractionResult.pageResults
            setUploadStage(null)
            setCurrentPage(0)
            setTotalPages(0)
            return
        }

        if (!extractionResult.result.biomarkers || extractionResult.result.biomarkers.length === 0) {
            void message.error('No biomarkers found in the document')
            setUploadStage(null)
            setCurrentPage(0)
            setTotalPages(0)
            return
        }

        await saveToDatabase(file, extractionResult.result)

        setUploadStage(null)
        setCurrentPage(0)
        setTotalPages(0)
        savedPageResultsRef.current = new Map()
    }

    const handleRetry = async () => {
        if (!currentFileRef.current || !currentArrayBufferRef.current) return

        setRetrying(true)
        setShowErrorModal(false)

        await performExtraction(currentFileRef.current, currentArrayBufferRef.current, failedPageIndices)

        setRetrying(false)
    }

    const handleCancelRetry = () => {
        setShowErrorModal(false)
        currentFileRef.current = null
        currentArrayBufferRef.current = null
        savedPageResultsRef.current = new Map()
        setFailedPageIndices([])
    }

    const saveToDatabase = async (
        file: RcFile,
        extractionResult: ExtractionResult,
    ) => {
        const now = new Date()
        const documentId = uuidv4()
        const userId = await getCurrentUserId()
        const fileData = await file.arrayBuffer()
        const testDate = extractionResult.testDate ? new Date(extractionResult.testDate) : undefined

        const { biomarkers = [] } = extractionResult

        const uniqueExtractedUcumCodes = new Set(
            biomarkers.map(b => b.ucumCode).filter((code): code is string => !!code),
        )
        const existingUnitCodes = new Set(units.map(u => u.ucumCode))

        const newUnits = Array.from(uniqueExtractedUcumCodes)
            .filter(ucumCode => !existingUnitCodes.has(ucumCode))
            .map(ucumCode => {
                const biomarkerWithUnit = biomarkers.find(b => b.ucumCode === ucumCode)
                return {
                    ucumCode,
                    title: biomarkerWithUnit?.unit ?? ucumCode,
                    approved: false,
                    createdAt: now,
                    updatedAt: now,
                }
            })

        const uniqueExtractedBiomarkerNames = new Set(biomarkers.map(b => b.name).filter((n): n is string => !!n))
        const existingBiomarkerConfigNames = new Set(configs.map(c => c.name))
        const newConfigIds: Record<string, string> = {}

        const newConfigs = Array.from(uniqueExtractedBiomarkerNames)
            .filter((name): name is string => !existingBiomarkerConfigNames.has(name))
            .map(name => {
                const biomarker = biomarkers.find(b => b.name === name)
                const configId = uuidv4()
                newConfigIds[name] = configId

                const biomarkerName = name ?? ''
                const biomarkerUcumCode = biomarker?.ucumCode ?? ''
                return {
                    id: configId,
                    userId,
                    name: biomarkerName,
                    originalName: biomarker?.originalName ?? undefined,
                    ucumCode: biomarkerUcumCode,
                    normalRange: biomarker?.referenceRange ? {
                        min: biomarker.referenceRange.min ?? undefined,
                        max: biomarker.referenceRange.max ?? undefined,
                    } : undefined,
                    approved: false,
                    order: biomarker?.order ?? undefined,
                    createdAt: now,
                    updatedAt: now,
                }
            })

        const candidateRecords = biomarkers
            .map(biomarker => {
                const existingConfig = configs.find(c => c.name === biomarker.name)
                const biomarkerId = existingConfig?.id ?? newConfigIds[biomarker.name ?? '']

                if (!biomarkerId) return null

                return {
                    id: uuidv4(),
                    userId,
                    biomarkerId,
                    documentId,
                    value: biomarker.value ?? undefined,
                    textValue: biomarker.textValue ?? undefined,
                    ucumCode: biomarker.ucumCode ?? '',
                    originalName: biomarker.originalName ?? undefined,
                    approved: false,
                    latest: true,
                    order: biomarker.order ?? undefined,
                    page: biomarker.page ?? undefined,
                    createdAt: now,
                    updatedAt: now,
                }
            })
            .filter((record): record is NonNullable<typeof record> => record !== null)

        const existingKeys = new Set(
            records
                .map(r => {
                    const doc = documents.find(d => d.id === r.documentId)
                    const date = doc?.testDate
                    return date ? createRecordKey(r, date) : null
                })
                .filter((key): key is string => key !== null),
        )

        const newRecords = candidateRecords.filter(c => !existingKeys.has(createRecordKey(c, testDate)))

        const duplicatesCount = candidateRecords.length - newRecords.length
        if (duplicatesCount > 0) {
            void message.warning(`${duplicatesCount} duplicate record${duplicatesCount > 1 ? 's' : ''} excluded`)
        }

        if (newRecords.length === 0 && newConfigs.length === 0 && newUnits.length === 0) {
            void message.info('No new data to save')
            return
        }

        const existingDocumentKeys = new Set(documents.map(createDocumentKey))
        const currentDocKey = createDocumentKey({
            fileName: file.name,
            fileSize: file.size,
        })
        const isDuplicate = existingDocumentKeys.has(currentDocKey)

        if (isDuplicate) {
            void message.warning(`File "${file.name}" was already uploaded before`)
            return
        }

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
            lab: extractionResult.labName ?? undefined,
            testDate,
            notes: '',
            createdAt: now,
            updatedAt: now,
        })

        const bulkOperations = []

        if (newUnits.length > 0) {
            bulkOperations.push(createUnits(newUnits))
        }

        if (newConfigs.length > 0) {
            bulkOperations.push(createBiomarkerConfigs(newConfigs))
        }

        if (newRecords.length > 0) {
            bulkOperations.push(createBiomarkerRecords(newRecords))
        }

        await Promise.all(bulkOperations)
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

    return (
        <>
            <UploadDropZone
                customRequest={handleUpload}
                button
                disabled={isDisabled}
            />
            <ExtractionErrorModal
                open={showErrorModal}
                failedPages={failedPageIndices}
                onRetry={() => { void handleRetry() }}
                onCancel={handleCancelRetry}
                retrying={retrying}
            />
        </>
    )
}

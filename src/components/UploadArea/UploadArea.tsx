import { useState, useEffect, useRef } from 'react'

import { message, notification } from 'antd'
import { RcFile } from 'antd/es/upload/interface'
import { usePostHog } from 'posthog-js/react'
import { UploadRequestOption } from 'rc-upload/lib/interface'
import { v4 as uuidv4 } from 'uuid'

import { ExtractionErrorModal } from '@/components/ExtractionErrorModal'
import { UploadDropZone } from '@/components/UploadDropZone'
import { UploadStatus, UploadStage } from '@/components/UploadStatus'
import { BiomarkerConfig, bulkUpdateBiomarkerConfigs, createBiomarkerConfigs, useBiomarkerConfigs } from '@/db/models/biomarkerConfig'
import { createBiomarkerRecords, useBiomarkerRecords } from '@/db/models/biomarkerRecord'
import {
    addDocument,
    buildBiomarkerNameMap,
    createAnalysisSignatureFromRecords,
    DocumentType,
    DuplicateReason,
    getDocumentFileHash,
    getDuplicateReasons,
    sha256Hex,
    useDocuments,
} from '@/db/models/document'
import { createUnits, useUnits } from '@/db/models/unit'
import { getCurrentUserId } from '@/db/models/user'
import { useVerifiedConversions } from '@/db/models/verifiedConversion'
import { useExtractBiomarkers } from '@/openai'
import { ExtractionResult } from '@/openai/openai.biomarkers'
import { captureEvent } from '@/utils'
import { getUnitType } from '@/utils/ucum/unitType'

import { usePdfExtraction } from './UploadArea.hooks'
import { createRecordsFromExtractedBiomarkers } from './UploadArea.utils'

export const UploadArea = () => {
    const posthog = usePostHog()
    const { extractBiomarkers, hasApiKey } = useExtractBiomarkers()
    const { data: configs } = useBiomarkerConfigs()
    const { data: records } = useBiomarkerRecords()
    const { data: units } = useUnits()
    const { data: documents } = useDocuments()
    const { data: unconfirmedDocuments } = useDocuments({ filter: (item) => !item.approved })
    const { data: verifiedConversions } = useVerifiedConversions()

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

    const notifyDuplicateSkipped = (fileName: string, reason: DuplicateReason) => {
        notification.warning({
            message: 'File excluded as duplicate',
            description: reason === 'exact-file'
                ? `"${fileName}" is identical to a file you already uploaded, so it was not added.`
                : `"${fileName}" has the same test date and biomarker results as an existing report, so it was not added.`,
        })
    }

    const { extractFromPdf } = usePdfExtraction({
        extractBiomarkers,
        onPageProgress: setCurrentPage,
        onTotalPagesFound: setTotalPages,
    })

    const isUploading = uploadStage !== null
    const hasUnconfirmed =
        unconfirmedDocuments.length > 0

    const isDisabled = isUploading || hasUnconfirmed

    const handleUpload = async (data: UploadRequestOption) => {
        uploadQueueRef.current.push(data)
        setTotalFiles(uploadQueueRef.current.length)
        setQueueTrigger(prev => prev + 1)
        captureEvent(posthog, 'document_upload_started', {
            fileSize: (data.file as RcFile)?.size,
        })
        return Promise.resolve()
    }

    useEffect(() => {
        const processFile = async (data: UploadRequestOption) => {
            const file = data.file as RcFile

            try {
                setUploadStage(UploadStage.UPLOADING)
                const arrayBuffer = await file.arrayBuffer()
                const fileHash = await sha256Hex(arrayBuffer)

                const existingHashes = await Promise.all(documents.map(getDocumentFileHash))
                const isExactDuplicate = existingHashes.some(hash => hash && hash === fileHash)

                if (isExactDuplicate) {
                    notifyDuplicateSkipped(file.name, 'exact-file')
                    captureEvent(posthog, 'document_upload_duplicate_skipped', {
                        fileSize: file.size,
                        reason: 'exact-file',
                    })
                    data.onSuccess?.({
                        success: true,
                        skipped: true,
                    })
                    return
                }

                setUploadStage(UploadStage.PARSING)

                if (hasApiKey) {
                    await performExtraction(file, arrayBuffer, fileHash)
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

    const performExtraction = async (file: RcFile, arrayBuffer: ArrayBuffer, fileHash: string, retryFailedPages?: number[], model?: string) => {
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
            captureEvent(posthog, 'biomarker_extraction_failed', {
                failedPages: extractionResult.failedPageIndices.length,
                totalPages: extractionResult.pageResults.size,
            })
            setUploadStage(null)
            setCurrentPage(0)
            setTotalPages(0)
            return
        }

        if (!extractionResult.result.biomarkers || extractionResult.result.biomarkers.length === 0) {
            void message.error('No biomarkers found in the document')
            captureEvent(posthog, 'biomarker_extraction_empty', {
            })
            setUploadStage(null)
            setCurrentPage(0)
            setTotalPages(0)
            return
        }

        await saveToDatabase(file, fileHash, extractionResult.result, extractionResult.totalPages)

        setUploadStage(null)
        setCurrentPage(0)
        setTotalPages(0)
        savedPageResultsRef.current = new Map()
    }

    const handleRetry = async () => {
        if (!currentFileRef.current || !currentArrayBufferRef.current) return

        setRetrying(true)
        setShowErrorModal(false)
        captureEvent(posthog, 'biomarker_extraction_retry', {

            failedPagesCount: failedPageIndices.length,
        })

        const fileHash = await sha256Hex(currentArrayBufferRef.current)
        await performExtraction(currentFileRef.current, currentArrayBufferRef.current, fileHash, failedPageIndices)

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
        fileHash: string,
        extractionResult: ExtractionResult,
        totalPages: number,
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
                    unitType: getUnitType(ucumCode),
                    approved: false,
                    createdAt: now,
                    updatedAt: now,
                }
            })

        const uniqueBiomarkerKeys = new Set(
            biomarkers
                .map(b => {
                    const name = b.name ?? ''
                    const ucum = b.ucumCode ?? ''
                    return `${name}|${ucum}`
                })
                .filter(key => key !== '|'),
        )
        const existingConfigKeys = new Set(
            configs.map(c => {
                const name = c.name ?? ''
                const ucum = c.ucumCode ?? ''
                return `${name}|${ucum}`
            }),
        )
        const newConfigIds: Record<string, string> = {}

        const configsToUpdate: BiomarkerConfig[] = []

        Array.from(uniqueBiomarkerKeys).forEach(key => {
            const [name, ucum] = key.split('|')
            const matchingBiomarkers = biomarkers.filter(b =>
                (b.name ?? '') === name && (b.ucumCode ?? '') === ucum,
            )
            if (matchingBiomarkers.length === 0) return

            const existingConfig = configs.find(c => {
                const configName = c.name ?? ''
                const configUcum = c.ucumCode ?? ''
                return configName === name && configUcum === ucum
            })

            if (existingConfig) {
                const biomarker = matchingBiomarkers[0]

                configsToUpdate.push({
                    ...existingConfig,
                    originalName: existingConfig.originalName ?? biomarker.originalName,
                    ucumCode: existingConfig.ucumCode ?? (biomarker.ucumCode ?? undefined),
                    normalRange: biomarker.referenceRange ? {
                        min: biomarker.referenceRange.min ?? existingConfig.normalRange?.min,
                        max: biomarker.referenceRange.max ?? existingConfig.normalRange?.max,
                    } : existingConfig.normalRange,
                    updatedAt: now,
                })
            }
        })

        const newConfigs = Array.from(uniqueBiomarkerKeys)
            .filter(key => !existingConfigKeys.has(key))
            .map(key => {
                const [name, ucum] = key.split('|')
                const matchingBiomarkers = biomarkers.filter(b =>
                    (b.name ?? '') === name && (b.ucumCode ?? '') === ucum,
                )
                if (matchingBiomarkers.length === 0) return null

                const biomarker = matchingBiomarkers[0]

                const configId = uuidv4()
                newConfigIds[key] = configId

                return {
                    id: configId,
                    userId,
                    name: name ?? '',
                    originalName: biomarker.originalName,
                    ucumCode: biomarker.ucumCode ?? '',
                    normalRange: biomarker.referenceRange ? {
                        min: biomarker.referenceRange.min ?? undefined,
                        max: biomarker.referenceRange.max ?? undefined,
                    } : undefined,
                    approved: false,
                    order: biomarker.order,
                    createdAt: now,
                    updatedAt: now,
                }
            })
            .filter((config): config is NonNullable<typeof config> => config !== null)

        const candidateRecords = await createRecordsFromExtractedBiomarkers({
            biomarkers,
            configs,
            documentId,
            userId,
            newConfigIds,
            verifiedConversions: verifiedConversions || [],
        })

        const biomarkerNamesById = buildBiomarkerNameMap([
            ...configs,
            ...newConfigs,
        ])
        const existingBiomarkerNamesById = buildBiomarkerNameMap(configs)
        const recordsByDocumentId = records.reduce<Record<string, typeof records>>((acc, record) => {
            if (!record.documentId) {
                return acc
            }

            acc[record.documentId] = [...(acc[record.documentId] ?? []), record]
            return acc
        }, {})

        const uploadAnalysisSignature = createAnalysisSignatureFromRecords(candidateRecords, biomarkerNamesById)

        const isSameAnalysisDuplicate = documents.some(document => getDuplicateReasons(
            {
                testDate,
                analysisSignature: uploadAnalysisSignature,
            },
            {
                testDate: document.testDate,
                analysisSignature: createAnalysisSignatureFromRecords(
                    recordsByDocumentId[document.id] ?? [],
                    existingBiomarkerNamesById,
                ),
            },
        ).includes('same-analysis'))

        if (isSameAnalysisDuplicate) {
            notifyDuplicateSkipped(file.name, 'same-analysis')
            captureEvent(posthog, 'document_upload_duplicate_skipped', {
                fileSize: file.size,
                reason: 'same-analysis',
            })
            return
        }

        if (candidateRecords.length === 0 && newConfigs.length === 0 && newUnits.length === 0 && configsToUpdate.length === 0) {
            void message.info('No new data to save')
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
            fileHash,
            fileData,
            lab: extractionResult.labName ?? undefined,
            testDate,
            notes: '',
            totalPages,
            createdAt: now,
            updatedAt: now,
        })

        const bulkOperations = []

        if (newUnits.length > 0) {
            bulkOperations.push(createUnits(newUnits))
        }

        if (configsToUpdate.length > 0) {
            bulkOperations.push(bulkUpdateBiomarkerConfigs(configsToUpdate))
        }

        if (newConfigs.length > 0) {
            bulkOperations.push(createBiomarkerConfigs(newConfigs))
        }

        if (candidateRecords.length > 0) {
            bulkOperations.push(createBiomarkerRecords(candidateRecords))
        }

        await Promise.all(bulkOperations)

        captureEvent(posthog, 'document_uploaded', {
            fileSize: file.size,
            biomarkersCount: biomarkers.length,
            newRecordsCount: candidateRecords.length,
            newConfigsCount: newConfigs.length,
            updatedConfigsCount: configsToUpdate.length,
            newUnitsCount: newUnits.length,
            hasLab: !!extractionResult.labName,
            hasTestDate: !!testDate,
        })
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

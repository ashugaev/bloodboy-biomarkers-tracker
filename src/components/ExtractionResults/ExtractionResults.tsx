import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { CellValueChangedEvent, ColDef, ICellRendererParams } from '@ag-grid-community/core'
import { AgGridReact } from '@ag-grid-community/react'
import { DeleteOutlined, PlusOutlined, QuestionCircleOutlined } from '@ant-design/icons'
import { Button, Checkbox, Dropdown, Input, message, Tooltip } from 'antd'
import { usePostHog } from 'posthog-js/react'
import { v4 as uuidv4 } from 'uuid'

import { createNormalRangeMaxColumn, createNormalRangeMinColumn, createOriginalNameColumn, createValueColumn } from '@/aggrid/columns/biomarkerColumns'
import { validateRanges } from '@/aggrid/validators/rangeValidators'
import { CreateBiomarkerModal } from '@/components/CreateBiomarkerModal'
import { CreateUnitModal } from '@/components/CreateUnitModal'
import { usePdfExtraction } from '@/components/UploadArea/UploadArea.hooks'
import { createRecordKey, createRecordsFromExtractedBiomarkers } from '@/components/UploadArea/UploadArea.utils'
import { ValidationWarning } from '@/components/ValidationWarning'
import { bulkUpdateBiomarkerConfigs, createBiomarkerConfigs, updateBiomarkerConfig, useBiomarkerConfigs } from '@/db/models/biomarkerConfig'
import { bulkDeleteBiomarkerRecords, bulkUpdateBiomarkerRecords, createBiomarkerRecords, deleteBiomarkerRecord, updateBiomarkerRecord, useBiomarkerRecords } from '@/db/models/biomarkerRecord'
import { updateDocument, useDocument } from '@/db/models/document'
import { useUnits } from '@/db/models/unit'
import { getCurrentUserId } from '@/db/models/user'
import { useExtractBiomarkers } from '@/openai'
import { captureEvent } from '@/utils'
import { getInvalidCellStyle } from '@/utils/cellStyle'

import { ExtractedBiomarkerWithApproval, ExtractionResultsProps } from './ExtractionResults.types'

export const ExtractionResults = (props: ExtractionResultsProps) => {
    const { biomarkers, documentId, onCancel, onAddNew, onPageChange, className } = props
    const posthog = usePostHog()
    const [rowData, setRowData] = useState<ExtractedBiomarkerWithApproval[]>(biomarkers)
    const [isBiomarkerModalOpen, setIsBiomarkerModalOpen] = useState(false)
    const [isUnitModalOpen, setIsUnitModalOpen] = useState(false)
    const [currentPage, setCurrentPage] = useState<number>(1)
    const [retrying, setRetrying] = useState(false)
    const [followUpPrompt, setFollowUpPrompt] = useState<string>('')
    const pageInitializedRef = useRef(false)
    const { data: units } = useUnits()
    const { data: configs } = useBiomarkerConfigs()
    const { data: document } = useDocument(documentId)
    const { data: allRecords } = useBiomarkerRecords()
    const { extractBiomarkers } = useExtractBiomarkers()

    const { extractFromPdf } = usePdfExtraction({
        extractBiomarkers,
    })

    const handleDelete = useCallback(async (id?: string) => {
        if (id) {
            await deleteBiomarkerRecord(id)
        }
    }, [])

    const handleApprove = useCallback(async (id?: string, checked?: boolean) => {
        if (!id) return

        await updateBiomarkerRecord(id, { approved: checked ?? false })
    }, [documentId, document, rowData])

    const pages = useMemo(() => {
        const uniquePages = [...new Set(rowData.map(b => b.page).filter((p): p is number => p !== null && p !== undefined))]
        return uniquePages.sort((a, b) => a - b)
    }, [rowData])

    const currentPageData = useMemo(() => {
        if (pages.length === 0) return rowData
        return rowData.filter(b => b.page === currentPage)
    }, [rowData, currentPage, pages])

    const hasInvalidBiomarkers = useMemo(() => {
        return currentPageData.some(b => !b.name || (b.value === undefined && !b.textValue))
    }, [currentPageData])

    const biomarkerOptions = useMemo(() => {
        return configs.map(config => {
            const unit = units.find(u => u.ucumCode === config.ucumCode)
            return {
                value: config.id,
                label: `${config.name} (${unit?.title ?? 'N/A'})`,
            }
        })
    }, [configs, units])

    const columnDefs = useMemo<Array<ColDef<ExtractedBiomarkerWithApproval>>>(() => [
        // createPageColumn<ExtractedBiomarkerWithApproval>(),
        createOriginalNameColumn<ExtractedBiomarkerWithApproval>(),
        {
            field: 'name',
            headerName: 'Name',
            flex: 1.5,
            minWidth: 250,
            editable: true,
            cellEditor: 'agSelectCellEditor',
            cellEditorParams: {
                values: biomarkerOptions.map(opt => opt.label),
            },
            valueGetter: (params) => {
                const config = configs.find(c => c.id === params.data?.biomarkerId)
                if (config) {
                    const unit = units.find(u => u.ucumCode === config.ucumCode)
                    return `${config.name} (${unit?.title ?? 'N/A'})`
                }
                return params.data?.name
            },
            valueSetter: (params) => {
                if (params.data) {
                    const selectedOption = biomarkerOptions.find(opt => opt.label === params.newValue)
                    if (selectedOption) {
                        const config = configs.find(c => c.id === selectedOption.value)
                        if (config) {
                            params.data.biomarkerId = config.id
                            params.data.name = config.name
                            params.data.ucumCode = config.ucumCode ?? undefined
                            return true
                        }
                    }
                }
                return false
            },
            cellStyle: (params) => {
                const isValid = (data: ExtractedBiomarkerWithApproval | undefined) => {
                    if (!data) return false
                    if (data.name) return true
                    if (data.biomarkerId) {
                        const config = configs.find(c => c.id === data.biomarkerId)
                        return !!config
                    }
                    return false
                }
                const style = getInvalidCellStyle(params, (data) => !isValid(data))
                return style
            },
        },
        createValueColumn<ExtractedBiomarkerWithApproval>(units),
        createNormalRangeMinColumn<ExtractedBiomarkerWithApproval>(),
        createNormalRangeMaxColumn<ExtractedBiomarkerWithApproval>(),
        {
            colId: 'delete',
            headerName: '',
            minWidth: 90,
            flex: 0.4,
            suppressMenu: true,
            sortable: false,
            filter: false,
            editable: false,
            cellRenderer: (params: ICellRendererParams<ExtractedBiomarkerWithApproval>) => {
                return (
                    <Button
                        type='text'
                        danger
                        icon={<DeleteOutlined/>}
                        onClick={() => { void handleDelete(params.data?.id) }}
                    />
                )
            },
        },
        {
            colId: 'approve',
            field: 'approved',
            headerName: '',
            minWidth: 65,
            maxWidth: 65,
            sortable: false,
            filter: false,
            editable: false,
            pinned: 'right',
            headerComponent: () => (
                <Tooltip title='Checkboxes for convenient verification. Selected items are locked if you restart the page extraction.'>
                    <QuestionCircleOutlined className='text-gray-400 hover:text-gray-600'/>
                </Tooltip>
            ),
            cellRenderer: (params: ICellRendererParams<ExtractedBiomarkerWithApproval>) => {
                if (!params.data) return null
                const data = params.data
                return (
                    <Checkbox
                        checked={data.approved ?? false}
                        onChange={(e) => {
                            const newValue = e.target.checked
                            params.node.setData({
                                ...data,
                                approved: newValue,
                            })
                            void handleApprove(data.id, newValue)
                        }}
                        disabled={!data.name || (data.value === undefined && !data.textValue)}
                    />
                )
            },
        },
    ], [handleDelete, handleApprove, biomarkerOptions, configs, units])

    const onCellValueChanged = useCallback(async (event: CellValueChangedEvent<ExtractedBiomarkerWithApproval>) => {
        const row = event.data

        if (row) {
            const validation = validateRanges(row.normalRange, row.targetRange)

            if (!validation.isValid) {
                void message.error(validation.errors.join('. '))
            }
        }

        if (row?.id) {
            await updateBiomarkerRecord(row.id, {
                biomarkerId: row.biomarkerId,
                value: row.value,
                textValue: row.textValue,
                ucumCode: row.ucumCode ?? undefined,
            })

            if (row.biomarkerId) {
                await updateBiomarkerConfig(row.biomarkerId, {
                    normalRange: row.normalRange,
                    targetRange: row.targetRange,
                })
            }
        }
    }, [])

    useEffect(() => {
        setRowData(biomarkers)
    }, [biomarkers])

    useEffect(() => {
        if (!pageInitializedRef.current && pages.length > 0 && document?.approvedPages?.length && currentPage === 1) {
            const sortedPages = pages.sort((a, b) => a - b)
            const approvedPages = document.approvedPages ?? []
            const firstUnapprovedPage = sortedPages.find(page => !approvedPages.includes(page))
            if (firstUnapprovedPage !== undefined) {
                setCurrentPage(firstUnapprovedPage)
            } else {
                setCurrentPage(sortedPages[sortedPages.length - 1])
            }
            pageInitializedRef.current = true
        }
    }, [pages, document, currentPage])

    useEffect(() => {
        if (onPageChange) {
            onPageChange(currentPage)
        }
    }, [currentPage, onPageChange])

    const handleAddNewClick = () => {
        captureEvent(posthog, 'extraction_results_add_new_clicked')
        if (onAddNew) {
            onAddNew(currentPage)
        }
    }

    const currentPageIndex = pages.indexOf(currentPage)
    const hasPrevPage = currentPageIndex > 0
    const hasNextPage = currentPageIndex < pages.length - 1

    const handlePageChange = useCallback((newPage: number) => {
        setCurrentPage(newPage)
    }, [])

    const handleNextPage = useCallback(async () => {
        const pageRecords = currentPageData.filter(r => r.id)

        const unapprovedRecordsForPage = pageRecords
            .filter(r => r.id && !r.approved && r.biomarkerId && r.ucumCode)

        if (unapprovedRecordsForPage.length > 0) {
            const recordsToUpdate = unapprovedRecordsForPage
                .map(r => ({
                    ...r,
                    approved: true,
                }))

            // @ts-expect-error - recordsToUpdate has partial data but bulkUpdate handles it
            await bulkUpdateBiomarkerRecords(recordsToUpdate)
        }

        if (documentId && document) {
            const currentApprovedPages = document.approvedPages ?? []
            if (!currentApprovedPages.includes(currentPage)) {
                await updateDocument(documentId, {
                    approvedPages: [...currentApprovedPages, currentPage],
                })
            }
        }

        const unaprovedConfigs = configs.filter(c => !c.approved)
        const upanprovedConfigsForThePage = unaprovedConfigs.filter(c => c.ucumCode && unapprovedRecordsForPage.some(r => r.ucumCode === c.ucumCode))

        if (upanprovedConfigsForThePage.length > 0) {
            const updatedConfigs = upanprovedConfigsForThePage.map(c => ({
                ...c,
                approved: true,
            }))
            await bulkUpdateBiomarkerConfigs(updatedConfigs)
        }

        captureEvent(posthog, 'extraction_page_approved', {
            page: currentPage,
            recordsCount: pageRecords.length,
        })

        if (hasNextPage && pages[currentPageIndex + 1]) {
            const nextPage = pages[currentPageIndex + 1]
            setCurrentPage(nextPage)
        }
    }, [currentPageData, allRecords, biomarkers, configs, documentId, document, currentPage, hasNextPage, pages, currentPageIndex, posthog])

    const handleRetryExtraction = useCallback(async () => {
        if (!documentId || !document?.fileData) {
            void message.error('Document data is not available')
            return
        }

        setRetrying(true)
        captureEvent(posthog, 'extraction_retry_page', {
            page: currentPage,
        })

        try {
            const pageIndex = currentPage - 1
            const fileDataCopy = document.fileData.slice(0)
            const extractionResult = await extractFromPdf(
                fileDataCopy,
                [pageIndex],
                undefined,
                undefined,
                followUpPrompt.trim() || undefined,
            )

            if (extractionResult.failedPageIndices.length > 0) {
                void message.error('Extraction failed. Please try again.')
                captureEvent(posthog, 'extraction_retry_failed', {
                    page: currentPage,
                })
                return
            }

            const pageResult = extractionResult.pageResults.get(pageIndex)

            if (!pageResult?.biomarkers || pageResult.biomarkers.length === 0) {
                void message.warning('No biomarkers found on this page')
                return
            }

            const userId = await getCurrentUserId()
            const testDate = document?.testDate
            const now = new Date()

            const uniqueBiomarkerKeys = new Set(
                pageResult.biomarkers
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

            const newConfigs = Array.from(uniqueBiomarkerKeys)
                .filter(key => !existingConfigKeys.has(key))
                .map(key => {
                    const [name, ucum] = key.split('|')
                    const matchingBiomarkers = pageResult.biomarkers.filter(b =>
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

            if (newConfigs.length > 0) {
                await createBiomarkerConfigs(newConfigs)
            }

            const candidateRecords = createRecordsFromExtractedBiomarkers({
                biomarkers: pageResult.biomarkers,
                configs,
                documentId,
                userId,
                newConfigIds,
            })

            if (candidateRecords.length === 0) {
                void message.warning('No matching biomarker configurations found. Please create configurations first.')
                return
            }

            const existingKeys = new Set(
                allRecords
                    .filter(r => r.documentId === documentId && r.page === currentPage && r.approved)
                    .map(r => createRecordKey(r, testDate)),
            )

            const newRecords = candidateRecords.filter(c => !existingKeys.has(createRecordKey(c, testDate)))

            const duplicatesCount = candidateRecords.length - newRecords.length
            if (duplicatesCount > 0) {
                void message.warning(`${duplicatesCount} duplicate record${duplicatesCount > 1 ? 's' : ''} excluded`)
            }

            if (newRecords.length === 0) {
                void message.info('No new records to add. All records already exist.')
                return
            }

            const unapprovedPageRecordIds = currentPageData
                .filter((r): r is ExtractedBiomarkerWithApproval & { id: string } => !!r.id && !r.approved)
                .map(r => r.id)
            if (unapprovedPageRecordIds.length > 0) {
                await bulkDeleteBiomarkerRecords(unapprovedPageRecordIds)
            }

            await createBiomarkerRecords(newRecords)

            void message.success(`Extraction completed. Found ${newRecords.length} biomarker${newRecords.length > 1 ? 's' : ''}.`)
            captureEvent(posthog, 'extraction_retry_success', {
                page: currentPage,
                recordsCount: newRecords.length,
            })
        } catch (error) {
            console.error('Retry extraction error:', error)
            void message.error('Failed to retry extraction')
            captureEvent(posthog, 'extraction_retry_error', {
                page: currentPage,
            })
        } finally {
            setRetrying(false)
        }
    }, [documentId, document, currentPage, currentPageData, configs, allRecords, extractFromPdf, posthog])

    return (
        <div className={`bg-white p-4 rounded border border-gray-100 flex flex-col ${className ?? ''}`}>
            <div className='mb-4'>
                <div className='flex justify-between items-center mb-2'>
                    <h3 className='text-lg font-medium'>
                        Verify {currentPageData.length} New Records{pages.length > 1 && ` on Page ${currentPage}`}
                    </h3>
                    <Dropdown
                        menu={{
                            items: [
                                {
                                    key: 'unit',
                                    label: 'Add Unit',
                                    onClick: () => { setIsUnitModalOpen(true) },
                                },
                                {
                                    key: 'biomarker',
                                    label: 'Add Biomarker',
                                    onClick: () => { setIsBiomarkerModalOpen(true) },
                                },
                                ...(onAddNew ? [{
                                    key: 'record',
                                    label: 'Add Record',
                                    onClick: handleAddNewClick,
                                    disabled: retrying,
                                }] : []),
                            ],
                        }}
                        trigger={['click']}
                    >
                        <Button size='small' icon={<PlusOutlined/>}>
                            Add
                        </Button>
                    </Dropdown>
                </div>
                <p className='text-sm text-gray-600'>
                    {pages.length > 1
                        ? `Verifying ${currentPageData.length} records on this page. Click on any cell to edit values.`
                        : 'Click on any cell to edit values and correct results'
                    }
                </p>
            </div>

            {hasInvalidBiomarkers && (
                <ValidationWarning message='Some values are empty. Please fill them manually or retry the extraction to continue.'/>
            )}

            <div className='ag-theme-material flex-1 mb-4'>
                <AgGridReact
                    key={currentPage}
                    rowData={currentPageData}
                    columnDefs={columnDefs}
                    domLayout='normal'
                    // @ts-expect-error - params.node.id is available at runtime even though types don't reflect it
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
                    getRowId={(params) => params.data.id ?? String(params.node.id)}
                    onCellValueChanged={(event) => { void onCellValueChanged(event) }}
                />
            </div>

            <div className='flex flex-col gap-2'>
                <div className='flex gap-2 justify-between items-center'>
                    <div className='flex gap-2'>
                        <Button
                            onClick={() => {
                                captureEvent(posthog, 'extraction_results_cancelled')
                                onCancel()
                            }}
                            disabled={retrying}
                        >
                            Cancel
                        </Button>
                        {document?.fileData && (
                            <Button
                                onClick={() => { void handleRetryExtraction() }}
                                loading={retrying}
                            >
                                Retry Page Extraction
                            </Button>
                        )}

                    </div>

                    <div className='flex items-center gap-2'>
                        {pages.length > 1 && hasPrevPage && (
                            <Button
                                onClick={() => { handlePageChange(pages[currentPageIndex - 1]) }}
                                disabled={retrying}
                                variant='text'
                            >
                                Previous
                            </Button>
                        )}
                        <Button
                            type='primary'
                            onClick={() => { void handleNextPage() }}
                            disabled={hasInvalidBiomarkers || retrying}
                        >
                            Approve Page {currentPage}
                        </Button>
                    </div>
                </div>

                {document?.fileData && (
                    <Input.TextArea
                        placeholder='Add follow-up instructions for extraction retry...'
                        value={followUpPrompt}
                        onChange={(e) => { setFollowUpPrompt(e.target.value) }}
                        disabled={retrying}
                        rows={2}
                        className='w-full'
                    />
                )}
            </div>

            <CreateBiomarkerModal
                open={isBiomarkerModalOpen}
                onCancel={() => { setIsBiomarkerModalOpen(false) }}
            />

            <CreateUnitModal
                open={isUnitModalOpen}
                onCancel={() => { setIsUnitModalOpen(false) }}
            />
        </div>
    )
}

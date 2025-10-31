import { useCallback } from 'react'

import * as pdfjsLib from 'pdfjs-dist'
import { ZodError } from 'zod'

import { ExtractionResult, extractionResultSchema, ExtractedBiomarker } from '@/openai/openai.biomarkers'
import { renderPageToBase64 } from '@/utils/pdf'
import { validateUcumCode } from '@/utils/ucum'

export interface PageExtractionResult {
    result: ExtractionResult | null
    pageIndex: number
    success: boolean
}

export interface ExtractionWithErrors {
    result: ExtractionResult
    failedPageIndices: number[]
    pageResults: Map<number, ExtractionResult | null>
}

interface UsePdfExtractionParams {
    extractBiomarkers: (imageBase64: string, followUpMessage?: string, model?: string) => Promise<ExtractionResult | null>
    onPageProgress: (completedPages: number) => void
    onTotalPagesFound: (totalPages: number) => void
}

export const usePdfExtraction = ({ extractBiomarkers, onPageProgress, onTotalPagesFound }: UsePdfExtractionParams) => {
    const extractPage = useCallback(async (
        page: pdfjsLib.PDFPageProxy,
        pageIndex: number,
        completedPagesRef: { current: number },
        model?: string,
    ): Promise<PageExtractionResult> => {
        const MAX_RETRIES = 1
        const imageBase64 = await renderPageToBase64(page)
        let retryCount = 0
        let parsedExtractionResult: ExtractionResult | null = null
        const followUpMessage: string[] = []

        while (retryCount <= MAX_RETRIES) {
            try {
                const extractionResult = await extractBiomarkers(imageBase64, followUpMessage.join('\n'), model)

                if (extractionResult) {
                    try {
                        parsedExtractionResult = extractionResultSchema.parse(extractionResult)
                    } catch (error) {
                        let errorsInfo = ''
                        try {
                            if (error instanceof ZodError) {
                                const formattedErrors = error.errors.map(err => {
                                    const path = err.path.join('.')
                                    return `  - ${path ? `${path}: ` : ''}${err.message}`
                                }).join('\n')
                                errorsInfo = `Validation errors from previous attempt:\n${formattedErrors}`
                            } else {
                                errorsInfo = `Validation errors from previous attempt: ${error instanceof Error ? error.message : String(error)}`
                            }
                        } catch (stringifyError) {
                            console.error('Validator errors stringify failed', stringifyError)
                            errorsInfo = 'Validation errors from previous attempt - unable to extract'
                        }

                        console.error('JSON Validation failed:', errorsInfo)

                        followUpMessage.push(`VALIDATION ERRORS FROM PREVIOUS ATTEMPT:\n${errorsInfo}\n\nPlease fix these errors and return valid JSON according to the schema.`)
                        throw new Error('Validation failed')
                    }

                    const validBiomarkers = parsedExtractionResult.biomarkers.filter(b => {
                        if (!b.ucumCode) return true
                        return validateUcumCode(b.ucumCode)
                    })

                    const invalidUcumBiomarkers = parsedExtractionResult.biomarkers
                        .filter(b => {
                            if (!b.ucumCode) return false
                            return !validateUcumCode(b.ucumCode)
                        })
                        .map(b => b.name)
                        .filter((name): name is string => !!name)

                    if (invalidUcumBiomarkers.length > 0) {
                        console.warn(`UCUM validation failed for: ${invalidUcumBiomarkers.join(', ')}`)

                        if (validBiomarkers.length > 0) {
                            parsedExtractionResult = {
                                ...parsedExtractionResult,
                                biomarkers: validBiomarkers,
                            }
                        }

                        followUpMessage.push(`VALIDATION ERRORS FROM PREVIOUS ATTEMPT:\nUCUM validation failed for the following biomarkers: ${invalidUcumBiomarkers.join(', ')}. Please provide valid UCUM csCode for these biomarkers.`)
                        throw new Error('Invalid UCUM codes')
                    }

                    break
                }
            } catch (error) {
                retryCount++
                if (retryCount > MAX_RETRIES) {
                    console.error(`Failed to extract page ${pageIndex + 1} after ${MAX_RETRIES + 1} attempts:`, error)
                }
            }
        }

        completedPagesRef.current++
        onPageProgress(completedPagesRef.current)
        return {
            result: parsedExtractionResult,
            pageIndex,
            success: parsedExtractionResult !== null,
        }
    }, [extractBiomarkers, onPageProgress])

    const extractFromPdf = useCallback(async (
        arrayBuffer: ArrayBuffer,
        failedPageIndices?: number[],
        model?: string,
        existingPageResults?: Map<number, ExtractionResult | null>,
    ): Promise<ExtractionWithErrors> => {
        const pdfDocument = await pdfjsLib.getDocument({ data: arrayBuffer }).promise
        const numPages = pdfDocument.numPages

        onTotalPagesFound(numPages)

        const pagePromises: Array<Promise<pdfjsLib.PDFPageProxy>> = []
        for (let i = 1; i <= numPages; i++) {
            pagePromises.push(pdfDocument.getPage(i))
        }
        const pages = await Promise.all(pagePromises)

        const pageResults = existingPageResults ? new Map(existingPageResults) : new Map<number, ExtractionResult | null>()

        const completedPagesRef = { current: existingPageResults ? Array.from(existingPageResults.values()).filter(r => r !== null).length : 0 }
        const pagesToExtract = failedPageIndices && failedPageIndices.length > 0
            ? failedPageIndices.map(index => ({
                page: pages[index],
                index,
            }))
            : pages.map((page, index) => ({
                page,
                index,
            }))

        const pagesExtractionResults = await Promise.all(
            pagesToExtract.map(({ page, index }) => extractPage(page, index, completedPagesRef, model)),
        )

        const failedIndices: number[] = []

        for (const pageResult of pagesExtractionResults) {
            if (!pageResult.success) {
                failedIndices.push(pageResult.pageIndex)
                pageResults.set(pageResult.pageIndex, null)
            } else {
                pageResults.set(pageResult.pageIndex, pageResult.result)
            }
        }

        let labName = ''
        let testDate = ''
        const allBiomarkers: ExtractedBiomarker[] = []
        let prevPageOrder = 0

        for (let i = 0; i < numPages; i++) {
            const pageResult = pageResults.get(i)
            if (!pageResult) {
                if (!failedIndices.includes(i)) {
                    failedIndices.push(i)
                }
                continue
            }

            if (pageResult.labName && !labName) {
                labName = pageResult.labName
            }
            if (pageResult.testDate && !testDate) {
                testDate = pageResult.testDate
            }
            if (pageResult.biomarkers.length) {
                const biomarkersWithOrder = pageResult.biomarkers.map((biomarker, index) => ({
                    ...biomarker,
                    order: (biomarker.order ?? 0) + index + prevPageOrder,
                }))
                allBiomarkers.push(...biomarkersWithOrder)
                prevPageOrder += pageResult.biomarkers.length
            }
        }

        const result: ExtractionResult = {
            labName,
            testDate,
            biomarkers: allBiomarkers,
        }

        return {
            result,
            failedPageIndices: failedIndices,
            pageResults,
        }
    }, [extractPage, onTotalPagesFound])

    return { extractFromPdf }
}

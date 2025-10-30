import { useCallback } from 'react'

import * as pdfjsLib from 'pdfjs-dist'
import { ZodError } from 'zod'

import { ExtractionResult, extractionResultSchema, ExtractedBiomarker } from '@/openai/openai.biomarkers'
import { renderPageToBase64 } from '@/utils/pdf'
import { validateUcumCode } from '@/utils/ucum'

interface UsePdfExtractionParams {
    extractBiomarkers: (imageBase64: string, followUpMessage?: string) => Promise<ExtractionResult | null>
    onPageProgress: (completedPages: number) => void
    onTotalPagesFound: (totalPages: number) => void
}

export const usePdfExtraction = ({ extractBiomarkers, onPageProgress, onTotalPagesFound }: UsePdfExtractionParams) => {
    const extractPage = useCallback(async (
        page: pdfjsLib.PDFPageProxy,
        pageIndex: number,
        completedPagesRef: { current: number },
    ): Promise<ExtractionResult | null> => {
        const MAX_RETRIES = 1
        const imageBase64 = await renderPageToBase64(page)
        let retryCount = 0
        let parsedExtractionResult: ExtractionResult | null = null
        const followUpMessage: string[] = []

        while (retryCount <= MAX_RETRIES) {
            try {
                const extractionResult = await extractBiomarkers(imageBase64, followUpMessage.join('\n'))

                if (extractionResult) {
                    try {
                        parsedExtractionResult = extractionResultSchema.parse(extractionResult)
                    } catch (error) {
                        let errorsInfo = ''
                        try {
                            if (error instanceof ZodError) {
                                errorsInfo = JSON.stringify(error.flatten())
                            }
                        } catch (stringifyError) {
                            console.error('Validator errors stringify failed', stringifyError)
                        }

                        console.error('JSON Validation failed:', errorsInfo)

                        followUpMessage.push(`JSON Validation failed: ${errorsInfo}`)
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

                        // Save valid for the case all retries failed
                        if (validBiomarkers.length > 0) {
                            parsedExtractionResult = {
                                ...parsedExtractionResult,
                                biomarkers: validBiomarkers,
                            }
                        }

                        followUpMessage.push(`UCUM validation failed for the following biomarkers: ${invalidUcumBiomarkers.join(', ')}. Please provide valid UCUM csCode for these biomarkers.`)
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
        return parsedExtractionResult
    }, [extractBiomarkers, onPageProgress])

    const extractFromPdf = useCallback(async (arrayBuffer: ArrayBuffer) => {
        const pdfDocument = await pdfjsLib.getDocument({ data: arrayBuffer }).promise
        const numPages = pdfDocument.numPages

        onTotalPagesFound(numPages)

        const pagePromises: Array<Promise<pdfjsLib.PDFPageProxy>> = []
        for (let i = 1; i <= numPages; i++) {
            pagePromises.push(pdfDocument.getPage(i))
        }
        const pages = await Promise.all(pagePromises)

        const completedPagesRef = { current: 0 }
        const pagesExtractionResults = await Promise.all(pages.map((page, index) => extractPage(page, index, completedPagesRef)))

        let labName = ''
        let testDate = ''
        const allBiomarkers: ExtractedBiomarker[] = []
        let prevPageOrder = 0

        for (const result of pagesExtractionResults) {
            if (result?.labName && !labName) {
                labName = result.labName
            }
            if (result?.testDate && !testDate) {
                testDate = result.testDate
            }
            if (result?.biomarkers.length) {
                const biomarkersWithOrder = result.biomarkers.map((biomarker, index) => ({
                    ...biomarker,
                    order: (biomarker.order ?? 0) + index + prevPageOrder,
                }))
                allBiomarkers.push(...biomarkersWithOrder)
                prevPageOrder += result.biomarkers.length
            }
        }

        const result: ExtractionResult = {
            labName,
            testDate,
            biomarkers: allBiomarkers,
        }

        return result
    }, [extractPage, onTotalPagesFound])

    return { extractFromPdf }
}

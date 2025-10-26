import { useCallback } from 'react'

import { ChatCompletion } from 'openai/resources'
import { z } from 'zod'

import { useBiomarkerConfigs } from '@/db/models/biomarkerConfig'
import { Range } from '@/db/types'

import { useOpenAI } from './openai.client'

export interface ExtractedBiomarker {
    id?: string
    biomarkerId?: string
    name?: string
    value?: number
    unit?: string
    ucumCode?: string
    referenceRange?: Partial<Range>
    order?: number
}

export interface ExtractionResult {
    biomarkers: ExtractedBiomarker[]
    testDate?: string
    labName?: string
}

export const extractedBiomarkerSchema = z.object({
    name: z.string().min(1),
    value: z.number(),
    unit: z.string().min(1),
    ucumCode: z.string().optional().nullable(),
    referenceRange: z.object({
        min: z.number().optional().nullable(),
        max: z.number().optional().nullable(),
    }).partial().optional(),
    order: z.number(),
})

export const extractionResultSchema = z.object({
    biomarkers: z.array(extractedBiomarkerSchema),
    testDate: z.string().date().optional().nullable(),
    labName: z.string().optional().nullable(),
})

const buildExtractionPrompt = (existingBiomarkers: Array<{
    name: string
    ucumCode?: string
}>) => `You are a medical data extraction assistant. Extract all biomarker/blood test results from the provided text.

Return a JSON object with the following structure:
{
  "biomarkers": [
    {
      "name": "biomarker name",
      "value": numeric value,
      "unit": "short unit label (e.g., 'mg/dL', 'μIU/mL', 'K/μL', 'cells/μL'). Set null of not available.",
      "ucumCode": "UCUM csCode string (e.g., mg/dL, mmol/L, [iU]/L, ug/mL). Set null of not available.",
      "referenceRange": {
        "min": minimum reference value or null if not available,
        "max": maximum reference value or null if not available
      },
      "order": order number starting from 0
    }
  ],
  "testDate": "overall test date in YYYY-MM-DD format (omit if not found)",
  "labName": "laboratory name (omit if not found)"
}

IMPORTANT: Preserve the order of biomarkers as they appear in the document. Assign sequential order numbers starting from 0.

${existingBiomarkers.length > 0 ? `\nExisting biomarkers in the system:\n${existingBiomarkers.map(b => `- ${b.name} | UCUM: ${b.ucumCode ?? 'N/A'}`).join('\n')}\n` : ''}
Biomarker Naming Rules (STRICT):
- ALWAYS use English names for biomarkers
- Use standardized medical terminology:
  * Full names in Title Case: "Glucose", "Creatinine", "Vitamin D", "Vitamin B12"
  * Medical abbreviations in UPPERCASE: "TSH", "ALT", "AST", "HDL", "LDL", "WBC", "RBC"
  * Compound names: "Total Cholesterol", "HDL Cholesterol", "LDL Cholesterol", "White Blood Cells", "Red Blood Cells"
- If the biomarker matches one from the existing list, use EXACTLY the same name and do not modify or normalize it. You should also match same tests written on different languages.
- Normalize non-English names to their English equivalents:
  * "Глюкоза" → "Glucose"
  * "Гемоглобин" → "Hemoglobin"
  * "Холестерин общий" → "Total Cholesterol"
  * "Тиреотропный гормон" → "TSH"
- Normalize variations to standard names:
  * "glucose", "GLUCOSE", "Glu" → "Glucose"
  * "cholesterol total", "Total chol" → "Total Cholesterol"
  * "hemoglobin", "HGB", "Hb" → "Hemoglobin"
  * "tsh", "Tsh" → "TSH"

Examples of correct naming:
- "Glucose" (not "glucose", "Glu", "Глюкоза")
- "Total Cholesterol" (not "Cholesterol Total", "CHOL")
- "HDL Cholesterol" (not "HDL-C", "hdl cholesterol")
- "TSH" (not "tsh", "Thyroid Stimulating Hormone")
- "ALT" (not "alt", "SGPT", "Alanine Aminotransferase")
- "White Blood Cells" (not "WBC", "Leukocytes", "Лейкоциты")
- "Vitamin D" (not "Vit D", "vitamin d", "Витамин Д")

Unit and UCUM Rules (STRICT):
- unit: provide a short label that approximates how the unit appears in the document, but normalized to English and consistent casing/font (e.g., "mg/dL", "μIU/mL", "K/μL", "cells/μL"). Use null if not available or for dimensionless values.
- ucumCode: provide the UCUM csCode string (case-sensitive), e.g., mg/dL, mmol/L, [iU]/L, ug/mL. Use null if unsure or not available.
- Do not invent units. If unsure about ucumCode, set null.
Examples of unit vs ucumCode:
- Glucose 5.2 mmol/L → unit: "mmol/L", ucumCode: "mmol/L"
- TSH 2.1 μIU/mL → unit: "μIU/mL", ucumCode: "u[iU]/mL"
- WBC 6.0 K/μL → unit: "K/μL", ucumCode: "10*3/uL"
- WBC 6.0 cells/μL → unit: "cells/μL", ucumCode: "{cells}/uL"
- INR 1.08 (dimensionless) → unit: null, ucumCode: null

General Rules:
- Extract all numeric biomarker values
- Include the unit of measurement for each biomarker
- Include reference ranges when available
- Parse dates in ISO format (YYYY-MM-DD)
- Extract laboratory name if mentioned
- If testDate or labName are not found, omit them from the response
- Use null instead of empty strings for unit, ucumCode, or referenceRange values when not available
- If a value is not numeric or not available, skip that biomarker
- Return only valid JSON, no additional text`

export const useExtractBiomarkers = () => {
    const { client, hasApiKey, loading } = useOpenAI()
    const { data: configs } = useBiomarkerConfigs()

    const extractBiomarkers = useCallback(async (imageBase64: string, followUpMessage?: string): Promise<ExtractionResult | null> => {
        if (!client) return null

        const existingBiomarkers = configs.map(c => ({
            name: c.name,
            ucumCode: c.ucumCode,
        }))
        const prompt = buildExtractionPrompt(existingBiomarkers)

        const messages: Array<{
            role: 'system' | 'user' | 'assistant'
            content: string | Array<{ type: 'text' | 'image_url', text?: string, image_url?: { url: string } }>
        }> = [
            {
                role: 'system',
                content: prompt,
            },
            {
                role: 'user',
                content: [
                    {
                        type: 'text',
                        text: 'Extract biomarkers from this image.',
                    },
                    {
                        type: 'image_url',
                        image_url: {
                            url: imageBase64,
                        },
                    },
                ],
            },
        ]

        if (followUpMessage) {
            messages.push({
                role: 'user',
                content: followUpMessage,
            })
        }

        // eslint-disable-next-line no-console
        console.log('AI Messages:', messages)

        const completion = await client.chat.completions.create({
            // model: 'gpt-5-nano',
            model: 'gpt-5-mini',
            messages,
            reasoning_effort: 'low',
            temperature: 1,
            response_format: { type: 'json_object' },
            stream: false,
        }) as ChatCompletion

        const content = completion.choices[0]?.message.content
        if (!content) return null

        const result = JSON.parse(content) as ExtractionResult
        // eslint-disable-next-line no-console
        console.log('AI Result:', result)
        return result
    }, [client, configs])

    return {
        extractBiomarkers,
        hasApiKey,
        loading,
    }
}

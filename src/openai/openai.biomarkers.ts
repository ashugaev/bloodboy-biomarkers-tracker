import { useCallback } from 'react'

import { ChatCompletion } from 'openai/resources'
import { z } from 'zod'

import { useBiomarkerConfigs } from '@/db/models/biomarkerConfig'
import { useUnits } from '@/db/models/unit'
import { Range } from '@/db/types'

import { useOpenAI } from './openai.client'

export interface ExtractedBiomarker {
    id?: string
    biomarkerId?: string
    name?: string
    originalName?: string
    value?: number
    textValue?: string
    unit?: string | null
    ucumCode?: string | null
    referenceRange?: Partial<Range>
    normalRange?: Range
    targetRange?: Range
    order?: number
    page?: number | null
}

export interface ExtractionResult {
    biomarkers: ExtractedBiomarker[]
    testDate?: string
    labName?: string
}

const referenceRangeSchema = z.object({
    min: z.number({
        message: 'referenceRange.min must be a number',
    }).nullable().optional(),
    max: z.number({
        message: 'referenceRange.max must be a number',
    }).nullable().optional(),
}).transform((val) => ({
    min: val.min ?? undefined,
    max: val.max ?? undefined,
}))

export const extractedBiomarkerSchema = z.object({
    name: z.string({
        message: 'name must be a string',
    }).min(1, 'name cannot be empty'),
    originalName: z.string({
        message: 'originalName must be a string',
    }).min(1, 'originalName cannot be empty'),
    value: z.number({
        message: 'value must be a number',
    }).optional(),
    textValue: z.string({
        message: 'textValue must be a string',
    }).optional(),
    unit: z.union([
        z.string().min(1, 'unit cannot be empty'),
        z.null(),
    ], {
        message: 'unit must be a string or null',
    }),
    ucumCode: z.string({
        message: 'ucumCode must be a string',
    }).nullable().optional(),
    referenceRange: referenceRangeSchema.optional(),
    order: z.number({
        message: 'order must be a number',
    }),
    page: z.number({
        message: 'page must be a number',
    }).nullable().optional(),
}).strict().refine((data) => data.value !== undefined || data.textValue !== undefined, {
    message: 'Either value or textValue must be provided',
})

export const extractionResultSchema = z.object({
    biomarkers: z.array(extractedBiomarkerSchema).min(1, 'biomarkers array cannot be empty'),
    testDate: z.string({
        message: 'testDate must be a string',
    }).date('testDate must be a valid date in YYYY-MM-DD format').optional(),
    labName: z.string({
        message: 'labName must be a string',
    }).optional(),
}).strict()

const buildExtractionPrompt = (existingBiomarkers: Array<{
    name: string
    ucumCode?: string
    valueType?: string
    options?: string[]
}>) => `You are a medical data extraction assistant. Extract all biomarker/blood test results from the provided text.

Return a JSON object with the following structure:
{
  "biomarkers": [
    {
      "name": "normalized biomarker name (use rules below)",
      "originalName": "exact biomarker name as it appears in the document",
      "value": numeric value (ONLY for numeric results, omit if result is text-based),
      "textValue": "text value for qualitative results (ONLY for text-based results - can be predefined values like 'Positive', 'Negative', 'Reactive', 'Detected', or any free-form text description, omit if result is numeric)",
      "unit": "unit label - for numeric: 'mg/dL', 'μIU/mL', etc. For text-based: descriptive title like 'Positive / Negative', 'Blood Type', or general description. Set null if not available.",
      "ucumCode": "UCUM code - for numeric: 'mg/dL', 'mmol/L', '[iU]/L', etc. For text-based: '{reactive}', '{positive}', '{detected}', or '{note}'. Set null if not available.",
      "referenceRange": {
        "min": minimum reference value or null (ONLY for numeric results),
        "max": maximum reference value or null (ONLY for numeric results)
      },
      "order": order number starting from 0
    }
  ],
  "testDate": "overall test date in YYYY-MM-DD format (omit if not found)",
  "labName": "laboratory name (omit if not found)"
}

CRITICAL: Never include both "value" and "textValue" in the same biomarker - use ONLY one based on result type!

IMPORTANT: Preserve the order of biomarkers as they appear in the document. Assign sequential order numbers starting from 0.

${existingBiomarkers.length > 0 ? `\nExisting biomarkers in the system (match these exactly, including ucumCode and valueType):\n${existingBiomarkers.map(b => {
        const ucum = b.ucumCode ?? 'N/A'
        const type = b.valueType ? ` | Type: ${b.valueType}` : ''
        const opts = b.options ? ` | Options: ${b.options.join(', ')}` : ''
        return `- ${b.name} | UCUM: ${ucum}${type}${opts}`
    }).join('\n')}\n` : ''}
Biomarker Naming Rules (STRICT):
- originalName: extract EXACTLY as it appears in the document (preserve original language, case, spacing)
  * If biomarker name appears in multiple languages, prioritize: English > Russian > other languages
  * Example: if document has "Glucose / Глюкоза / 葡萄糖", use originalName: "Glucose"
- name: normalized English standardized name following these rules:
  * ALWAYS use English names for biomarkers
  * Use standardized medical terminology:
    - Full names in Title Case: "Glucose", "Creatinine", "Vitamin D", "Vitamin B12"
    - Medical abbreviations in UPPERCASE: "TSH", "ALT", "AST", "HDL", "LDL", "WBC", "RBC"
    - Compound names: "Total Cholesterol", "HDL Cholesterol", "LDL Cholesterol", "White Blood Cells", "Red Blood Cells"
  * If the biomarker matches one from the existing list, use EXACTLY the same name and do not modify or normalize it. You should also match same tests written on different languages.
  * Normalize non-English names to their English equivalents:
    - "Глюкоза" → "Glucose"
    - "Гемоглобин" → "Hemoglobin"
    - "Холестерин общий" → "Total Cholesterol"
    - "Тиреотропный гормон" → "TSH"
  * Normalize variations to standard names:
    - "glucose", "GLUCOSE", "Glu" → "Glucose"
    - "cholesterol total", "Total chol" → "Total Cholesterol"
    - "hemoglobin", "HGB", "Hb" → "Hemoglobin"
    - "tsh", "Tsh" → "TSH"

Examples of correct naming:
- "Глюкоза" → originalName: "Глюкоза", name: "Glucose"
- "glucose" → originalName: "glucose", name: "Glucose"
- "CHOL" → originalName: "CHOL", name: "Total Cholesterol"
- "HDL-C" → originalName: "HDL-C", name: "HDL Cholesterol"
- "tsh" → originalName: "tsh", name: "TSH"
- "Лейкоциты" → originalName: "Лейкоциты", name: "White Blood Cells"
- "Vit D" → originalName: "Vit D", name: "Vitamin D"

Unit and UCUM Rules (STRICT):
- unit: provide a short label that approximates how the unit appears in the document, but normalized to English and consistent casing/font (e.g., "mg/dL", "μIU/mL", "K/μL", "cells/μL"). Use "No Unit" for dimensionless numeric values. Use null if not available.
- ucumCode: provide the UCUM csCode string (case-sensitive), e.g., mg/dL, mmol/L, [iU]/L, ug/mL. If there is a unit but no specific UCUM code exists, use the format {anyName} (e.g., {appearance}, {blood_type}). For dimensionless numeric values, use "{no_unit}". Use null only if unit is also null.
- Do not invent units. If there is a unit, there must be a corresponding ucumCode (either standard UCUM or {anyName} format).

Examples of numeric values with unit vs ucumCode:
- Glucose 5.2 mmol/L → value: 5.2, unit: "mmol/L", ucumCode: "mmol/L"
- TSH 2.1 μIU/mL → value: 2.1, unit: "μIU/mL", ucumCode: "u[iU]/mL"
- WBC 6.0 K/μL → value: 6.0, unit: "K/μL", ucumCode: "10*3/uL"
- WBC 6.0 cells/μL → value: 6.0, unit: "cells/μL", ucumCode: "{cells}/uL"
- INR 1.08 (dimensionless) → value: 1.08, unit: "No Unit", ucumCode: "{no_unit}"

Examples of text-based values with unit vs ucumCode:
- HIV Antibody: Negative → textValue: "Negative", unit: "Positive / Negative", ucumCode: "{positive}"
- Blood Type: AB+ → textValue: "AB+", unit: "Blood Type", ucumCode: "{blood_type}"
- Hepatitis B Surface Antigen: Reactive → textValue: "Reactive", unit: "Reactive / Non-Reactive", ucumCode: "{reactive}"
- Urine Appearance: Clear yellow → textValue: "Clear yellow", unit: "Appearance", ucumCode: "{appearance}"
- Comment: Sample hemolyzed → textValue: "Sample hemolyzed", unit: "Note", ucumCode: "{note}"

Text-Based Values Rules (CRITICAL):
For qualitative (non-numeric) results, use "textValue" field with appropriate ucumCode:

**Key Rules:**
- unit describes the analysis TYPE, not the value itself
- Never mix numeric values with text-based ucumCodes
- Match existing biomarker ucumCode when available
- Try to use specific descriptive ucumCodes that match the analysis type (e.g., {blood_type}, {appearance}, {color})
- Use unit: "Note" with ucumCode: "{note}" for TEXT-BASED results ONLY as a fallback when no appropriate specific ucumCode can be determined
- ALWAYS normalize textValue to English (e.g., "Отрицательный" → "Negative", "Положительный" → "Positive", "Обнаружено" → "Detected")

General Rules:
- Clean the extracted text from obviously incorrect and unnecessary symbols (e.g., garbage characters, formatting artifacts, stray symbols)
- For numeric biomarker values: use "value" field (number type)
- For qualitative/text-based results: use "textValue" field (string type) and appropriate ucumCode (see Text-Based Values Rules above)
- Either "value" or "textValue" must be provided, but NEVER both
- Include the unit of measurement for each biomarker (for text-based results, unit describes the analysis type)
- Include reference ranges ONLY for numeric values (omit for text-based results)
- Parse dates in ISO format (YYYY-MM-DD)
- Extract laboratory name if mentioned
- If testDate or labName are not found, omit them from the response
- Use null instead of empty strings for unit, ucumCode, or referenceRange values when not available
- Return only valid JSON, no additional text`

export const useExtractBiomarkers = () => {
    const { client, hasApiKey, loading } = useOpenAI()
    const { data: configs } = useBiomarkerConfigs()
    const { data: units } = useUnits()

    const extractBiomarkers = useCallback(async (imageBase64: string, followUpMessage?: string, model?: string): Promise<ExtractionResult | null> => {
        if (!client) return null

        const existingBiomarkers = configs.map(c => {
            const unit = units.find(u => u.ucumCode === c.ucumCode)
            return {
                name: c.name,
                ucumCode: c.ucumCode,
                valueType: unit?.valueType,
                options: unit?.options,
            }
        })
        const prompt = buildExtractionPrompt(existingBiomarkers)

        const messages = [
            {
                role: 'system' as const,
                content: prompt,
            },
            {
                role: 'user' as const,
                content: [
                    {
                        type: 'text' as const,
                        text: 'Extract biomarkers from this image.',
                    },
                    {
                        type: 'image_url' as const,
                        image_url: {
                            url: imageBase64,
                        },
                    },
                ],
            },
        ]

        if (followUpMessage) {
            messages.push({
                role: 'user' as const,
                content: [
                    {
                        type: 'text' as const,
                        text: followUpMessage,
                    },
                ],
            })
        }

        // eslint-disable-next-line no-console
        console.log('AI Messages:', messages)

        const completion = await client.chat.completions.create({
            model: model ?? 'gpt-5-mini',
            messages: messages as never,
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
    }, [client, configs, units])

    return {
        extractBiomarkers,
        hasApiKey,
        loading,
    }
}

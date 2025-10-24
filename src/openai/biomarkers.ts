import { useCallback } from 'react'

import { ChatCompletion } from 'openai/resources'
import { z } from 'zod'

import { useBiomarkerConfigs } from '@/db/hooks/useBiomarkerConfigs'
import { Range, Unit } from '@/db/types'

import { useOpenAI } from './client'

export interface ExtractedBiomarker {
    id?: string
    biomarkerId?: string
    name?: string
    value?: number
    unit?: string
    date?: string
    referenceRange?: Partial<Range>
    order?: number
}

export interface ExtractionResult {
    biomarkers: ExtractedBiomarker[]
    testDate?: string
    labName?: string
    notes?: string
}

export const extractedBiomarkerSchema = z.object({
    name: z.string().min(1),
    value: z.number(),
    unit: z.string().min(1),
    date: z.string().optional(),
    referenceRange: z.object({
        min: z.number(),
        max: z.number(),
    }).partial().optional(),
    order: z.number().optional(),
})

export const extractionResultSchema = z.object({
    biomarkers: z.array(extractedBiomarkerSchema),
    testDate: z.string().optional(),
    labName: z.string().optional(),
    notes: z.string().optional(),
})

const buildExtractionPrompt = (existingBiomarkers: string[]) => `You are a medical data extraction assistant. Extract all biomarker/blood test results from the provided text.

Return a JSON object with the following structure:
{
  "biomarkers": [
    {
      "name": "biomarker name",
      "value": numeric value,
      "unit": "unit of measurement",
      "date": "test date if available",
      "referenceRange": {
        "min": minimum reference value if available,
        "max": maximum reference value if available
      },
      "order": order number starting from 0
    }
  ],
  "testDate": "overall test date if available",
  "labName": "laboratory name if available"
}

IMPORTANT: Preserve the order of biomarkers as they appear in the document. Assign sequential order numbers starting from 0.

${existingBiomarkers.length > 0 ? `\nExisting biomarkers in the system:\n${existingBiomarkers.map(name => `- ${name}`).join('\n')}\n` : ''}
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

Unit Normalization Rules (STRICT):
- ALWAYS use English notation for units
- Use ONLY units from the approved list below (HIGH PRIORITY)
- Add new units ONLY if no suitable unit exists in the approved list

Approved Units:
${Object.values(Unit).join(', ')}

Unit Normalization Examples:
- "мг/дл", "мг/дЛ", "мг дл" → "mg/dL"
- "ммоль/л", "ммоль л" → "mmol/L"
- "мкмоль/л", "мкмоль л", "μмоль/л" → "μmol/L"
- "г/дл", "г/дЛ" → "g/dL"
- "г/л", "г л" → "g/L"
- "Ед/л", "ед/л", "U/l" → "U/L"
- "МЕ/л", "мЕ/л", "IU/l" → "IU/L"
- "нг/мл", "ng/ml" → "ng/mL"
- "пг/мл", "pg/ml" → "pg/mL"
- "мкМЕ/мл", "μIU/ml" → "μIU/mL"
- "мМЕ/л", "mIU/l" → "mIU/L"
- "%" → "%"
- "сек", "sec", "с" → "sec"

General Rules:
- Extract all numeric biomarker values
- Include the unit of measurement for each biomarker
- Include reference ranges when available
- Parse dates in ISO format (YYYY-MM-DD)
- Extract laboratory name if mentioned
- Extract any relevant notes or doctor's comments
- If a value is not numeric or not available, skip that biomarker
- Return only valid JSON, no additional text`

export const useExtractBiomarkers = () => {
    const { client, hasApiKey, loading } = useOpenAI()
    const { configs } = useBiomarkerConfigs()

    const extractBiomarkers = useCallback(async (imageBase64: string): Promise<ExtractionResult | null> => {
        if (!client) return null

        const existingBiomarkerNames = configs.map(c => c.name)
        const prompt = buildExtractionPrompt(existingBiomarkerNames)

        const completion = await client.chat.completions.create({
            model: 'gpt-5',
            messages: [
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
            ],
            temperature: 1,
            response_format: { type: 'json_object' },
            stream: false,
        }) as ChatCompletion

        const content = completion.choices[0]?.message.content
        if (!content) return null

        return JSON.parse(content) as ExtractionResult
    }, [client, configs])

    return {
        extractBiomarkers,
        hasApiKey,
        loading,
    }
}

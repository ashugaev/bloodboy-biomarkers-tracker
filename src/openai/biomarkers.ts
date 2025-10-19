import { useCallback } from 'react'

import { ChatCompletion } from 'openai/resources'

import { Range } from '@/db/types'

import { useOpenAI } from './client'

export interface ExtractedBiomarker {
    name: string
    value: number
    unit: string
    date?: string
    referenceRange?: Partial<Range>
}

export interface ExtractionResult {
    biomarkers: ExtractedBiomarker[]
    testDate?: string
    labName?: string
}

const EXTRACTION_PROMPT = `You are a medical data extraction assistant. Extract all biomarker/blood test results from the provided text.

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
      }
    }
  ],
  "testDate": "overall test date if available",
  "labName": "laboratory name if available"
}

Rules:
- Extract all numeric biomarker values (e.g., glucose, cholesterol, hemoglobin, etc.)
- Include the unit of measurement for each biomarker
- Include reference ranges when available
- Parse dates in ISO format (YYYY-MM-DD)
- If a value is not numeric or not available, skip that biomarker
- Return only valid JSON, no additional text`

export const useExtractBiomarkers = () => {
    const { client, hasApiKey, loading } = useOpenAI()

    const extractBiomarkers = useCallback(async (text: string): Promise<ExtractionResult | null> => {
        if (!client) return null

        const completion = await client.chat.completions.create({
            model: 'gpt-5',
            messages: [
                {
                    role: 'system',
                    content: EXTRACTION_PROMPT,
                },
                {
                    role: 'user',
                    content: `Extract biomarkers from this text:\n\n${text}`,
                },
            ],
            temperature: 1,
            response_format: { type: 'json_object' },
            stream: false,
        }) as ChatCompletion

        const content = completion.choices[0].message.content
        return JSON.parse(content!)
    }, [client])

    return {
        extractBiomarkers,
        hasApiKey,
        loading,
    }
}

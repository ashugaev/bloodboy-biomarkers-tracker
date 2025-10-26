import { ExtractedBiomarker } from '@/openai/openai.biomarkers'

export const mockBiomarkers: ExtractedBiomarker[] = [
    {
        name: 'Glucose',
        value: 95,
        unit: 'mg/dL',
        date: '2025-01-15',
        referenceRange: {
            min: 70,
            max: 100,
        },
    },
    {
        name: 'Hemoglobin',
        value: 14.5,
        unit: 'g/dL',
        date: '2025-01-15',
        referenceRange: {
            min: 13,
            max: 17,
        },
    },
    {
        name: 'Cholesterol',
        value: 180,
        unit: 'mg/dL',
        date: '2025-01-15',
        referenceRange: {
            min: 0,
            max: 200,
        },
    },
    {
        name: 'HDL',
        value: 55,
        unit: 'mg/dL',
        referenceRange: {
            min: 40,
            max: 60,
        },
    },
]

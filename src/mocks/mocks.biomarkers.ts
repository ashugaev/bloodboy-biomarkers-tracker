import { ExtractedBiomarker } from '@/openai/openai.biomarkers'

export const mockBiomarkers: ExtractedBiomarker[] = [
    {
        name: 'Glucose',
        originalName: 'Glucose',
        value: 95,
        unit: 'mg/dL',
        order: 0,
        referenceRange: {
            min: 70,
            max: 100,
        },
    },
    {
        name: 'Hemoglobin',
        originalName: 'Hemoglobin',
        value: 14.5,
        unit: 'g/dL',
        order: 1,
        referenceRange: {
            min: 13,
            max: 17,
        },
    },
    {
        name: 'Cholesterol',
        originalName: 'Cholesterol',
        value: 180,
        unit: 'mg/dL',
        order: 2,
        referenceRange: {
            min: 0,
            max: 200,
        },
    },
    {
        name: 'HDL',
        originalName: 'HDL',
        value: 55,
        unit: 'mg/dL',
        order: 3,
        referenceRange: {
            min: 40,
            max: 60,
        },
    },
]

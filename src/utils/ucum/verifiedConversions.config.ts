import { ConversionMethod } from './convertUniversal'

export interface VerifiedConversionTestCase {
    value: number
    expectedValue: number
}

export interface VerifiedConversionConfig {
    biomarkerName: string
    sourceUnits: string[]
    targetUnits: string[]
    expectedMethod: ConversionMethod
    manuallyVerified: boolean
    testCases: VerifiedConversionTestCase[]
}

export interface VerifiedConversionsConfig {
    verifiedConversions: VerifiedConversionConfig[]
}

const allVerifiedConversions: VerifiedConversionConfig[] = [
    {
        biomarkerName: 'Glucose',
        sourceUnits: ['mmol/L', 'mmol/l'],
        targetUnits: ['mg/dL', 'mg/dl'],
        expectedMethod: 'special-formula',
        manuallyVerified: true,
        testCases: [
            {
                value: 5.5,
                expectedValue: 99.1,
            },
            {
                value: 7.0,
                expectedValue: 126.1274,
            },
        ],
    },
    {
        biomarkerName: 'Creatinine',
        sourceUnits: ['µmol/L', 'umol/L', 'umol/l', 'µmol/l'],
        targetUnits: ['mg/dL', 'mg/dl'],
        expectedMethod: 'special-formula',
        manuallyVerified: true,
        testCases: [
            {
                value: 88.4,
                expectedValue: 1.0,
            },
            {
                value: 176.8,
                expectedValue: 2.0,
            },
        ],
    },
    {
        biomarkerName: 'Creatinine',
        sourceUnits: ['mg/dL', 'mg/dl'],
        targetUnits: ['µmol/L', 'umol/L', 'umol/l', 'µmol/l'],
        expectedMethod: 'special-formula',
        manuallyVerified: true,
        testCases: [
            {
                value: 1.0,
                expectedValue: 88.4,
            },
            {
                value: 2.0,
                expectedValue: 176.8,
            },
        ],
    },
    {
        biomarkerName: 'Cholesterol',
        sourceUnits: ['mmol/L', 'mmol/l'],
        targetUnits: ['mg/dL', 'mg/dl'],
        expectedMethod: 'special-formula',
        manuallyVerified: true,
        testCases: [
            {
                value: 5.0,
                expectedValue: 193.35,
            },
        ],
    },
    {
        biomarkerName: 'Cholesterol',
        sourceUnits: ['mg/dL', 'mg/dl'],
        targetUnits: ['mmol/L', 'mmol/l'],
        expectedMethod: 'molecular-weight',
        manuallyVerified: true,
        testCases: [
            {
                value: 193.35,
                expectedValue: 5.0,
            },
        ],
    },
    {
        biomarkerName: 'Triglycerides',
        sourceUnits: ['mmol/L', 'mmol/l'],
        targetUnits: ['mg/dL', 'mg/dl'],
        expectedMethod: 'special-formula',
        manuallyVerified: true,
        testCases: [
            {
                value: 1.0,
                expectedValue: 88.57,
            },
        ],
    },
    {
        biomarkerName: 'Triglycerides',
        sourceUnits: ['mg/dL', 'mg/dl'],
        targetUnits: ['mmol/L', 'mmol/l'],
        expectedMethod: 'molecular-weight',
        manuallyVerified: true,
        testCases: [
            {
                value: 88.57,
                expectedValue: 1.0,
            },
        ],
    },
    {
        biomarkerName: 'Glucose',
        sourceUnits: ['mg/dL', 'mg/dl'],
        targetUnits: ['mmol/L', 'mmol/l'],
        expectedMethod: 'molecular-weight',
        manuallyVerified: true,
        testCases: [
            {
                value: 99.1,
                expectedValue: 5.5,
            },
            {
                value: 126.1,
                expectedValue: 7.0,
            },
        ],
    },
    {
        biomarkerName: 'Testosterone',
        sourceUnits: ['ng/mL', 'ng/ml'],
        targetUnits: ['nmol/L', 'nmol/l'],
        expectedMethod: 'molecular-weight',
        manuallyVerified: true,
        testCases: [
            {
                value: 5.0,
                expectedValue: 17.3358,
            },
        ],
    },
    {
        biomarkerName: 'Testosterone',
        sourceUnits: ['nmol/L', 'nmol/l'],
        targetUnits: ['ng/mL', 'ng/ml'],
        expectedMethod: 'molecular-weight',
        manuallyVerified: true,
        testCases: [
            {
                value: 17.35,
                expectedValue: 5.0,
            },
        ],
    },
    {
        biomarkerName: 'Vitamin D',
        sourceUnits: ['ng/mL', 'ng/ml'],
        targetUnits: ['nmol/L', 'nmol/l'],
        expectedMethod: 'special-formula',
        manuallyVerified: true,
        testCases: [
            {
                value: 31.2,
                expectedValue: 78.0,
            },
        ],
    },
    {
        biomarkerName: 'Vitamin D',
        sourceUnits: ['nmol/L', 'nmol/l'],
        targetUnits: ['ng/mL', 'ng/ml'],
        expectedMethod: 'special-formula',
        manuallyVerified: true,
        testCases: [
            {
                value: 78.0,
                expectedValue: 31.2,
            },
        ],
    },
    {
        biomarkerName: 'Calcium',
        sourceUnits: ['mg/dL', 'mg/dl'],
        targetUnits: ['mmol/L', 'mmol/l'],
        expectedMethod: 'molecular-weight',
        manuallyVerified: true,
        testCases: [
            {
                value: 10.0,
                expectedValue: 2.495,
            },
        ],
    },
    {
        biomarkerName: 'Calcium',
        sourceUnits: ['mmol/L', 'mmol/l'],
        targetUnits: ['mg/dL', 'mg/dl'],
        expectedMethod: 'special-formula',
        manuallyVerified: true,
        testCases: [
            {
                value: 2.5,
                expectedValue: 10.025,
            },
        ],
    },
    {
        biomarkerName: 'Iron',
        sourceUnits: ['µmol/L', 'umol/L', 'umol/l', 'µmol/l'],
        targetUnits: ['µg/dL', 'ug/dL', 'ug/dl', 'µg/dl'],
        expectedMethod: 'special-formula',
        manuallyVerified: true,
        testCases: [
            {
                value: 20.0,
                expectedValue: 111.7,
            },
        ],
    },
    {
        biomarkerName: 'Iron',
        sourceUnits: ['µg/dL', 'ug/dL', 'ug/dl', 'µg/dl'],
        targetUnits: ['µmol/L', 'umol/L', 'umol/l', 'µmol/l'],
        expectedMethod: 'special-formula',
        manuallyVerified: true,
        testCases: [
            {
                value: 111.7,
                expectedValue: 20.0,
            },
        ],
    },
    {
        biomarkerName: 'LDL Cholesterol',
        sourceUnits: ['mg/dL', 'mg/dl'],
        targetUnits: ['mmol/L', 'mmol/l'],
        expectedMethod: 'molecular-weight',
        manuallyVerified: true,
        testCases: [
            {
                value: 100.0,
                expectedValue: 2.586,
            },
            {
                value: 150.0,
                expectedValue: 3.879,
            },
        ],
    },
    {
        biomarkerName: 'LDL Cholesterol',
        sourceUnits: ['mmol/L', 'mmol/l'],
        targetUnits: ['mg/dL', 'mg/dl'],
        expectedMethod: 'special-formula',
        manuallyVerified: true,
        testCases: [
            {
                value: 2.586,
                expectedValue: 100.0,
            },
            {
                value: 3.879,
                expectedValue: 150.0,
            },
        ],
    },
    {
        biomarkerName: 'Blood Urea Nitrogen',
        sourceUnits: ['mmol/L', 'mmol/l'],
        targetUnits: ['mg/dL', 'mg/dl'],
        expectedMethod: 'special-formula',
        manuallyVerified: true,
        testCases: [
            {
                value: 5.0,
                expectedValue: 14.0,
            },
            {
                value: 7.0,
                expectedValue: 19.6,
            },
        ],
    },
    {
        biomarkerName: 'Blood Urea Nitrogen',
        sourceUnits: ['mg/dL', 'mg/dl'],
        targetUnits: ['mmol/L', 'mmol/l'],
        expectedMethod: 'special-formula',
        manuallyVerified: true,
        testCases: [
            {
                value: 14.0,
                expectedValue: 5.0,
            },
            {
                value: 19.6,
                expectedValue: 7.0,
            },
        ],
    },
    {
        biomarkerName: 'Urea',
        sourceUnits: ['mmol/L', 'mmol/l'],
        targetUnits: ['mg/dL', 'mg/dl'],
        expectedMethod: 'special-formula',
        manuallyVerified: true,
        testCases: [
            {
                value: 5.0,
                expectedValue: 30.03,
            },
            {
                value: 7.0,
                expectedValue: 42.042,
            },
        ],
    },
    {
        biomarkerName: 'Urea',
        sourceUnits: ['mg/dL', 'mg/dl'],
        targetUnits: ['mmol/L', 'mmol/l'],
        expectedMethod: 'special-formula',
        manuallyVerified: true,
        testCases: [
            {
                value: 30.0,
                expectedValue: 4.998,
            },
            {
                value: 42.0,
                expectedValue: 6.997,
            },
        ],
    },
    {
        biomarkerName: 'Sodium',
        sourceUnits: ['mmol/L', 'mmol/l'],
        targetUnits: ['meq/L', 'meq/l'],
        expectedMethod: 'simple-math',
        manuallyVerified: true,
        testCases: [
            {
                value: 140.0,
                expectedValue: 140.0,
            },
            {
                value: 135.0,
                expectedValue: 135.0,
            },
        ],
    },
    {
        biomarkerName: 'Sodium',
        sourceUnits: ['meq/L', 'meq/l'],
        targetUnits: ['mmol/L', 'mmol/l'],
        expectedMethod: 'simple-math',
        manuallyVerified: true,
        testCases: [
            {
                value: 140.0,
                expectedValue: 140.0,
            },
        ],
    },
    {
        biomarkerName: 'Potassium',
        sourceUnits: ['mmol/L', 'mmol/l'],
        targetUnits: ['meq/L', 'meq/l'],
        expectedMethod: 'simple-math',
        manuallyVerified: true,
        testCases: [
            {
                value: 4.0,
                expectedValue: 4.0,
            },
            {
                value: 5.0,
                expectedValue: 5.0,
            },
        ],
    },
    {
        biomarkerName: 'Potassium',
        sourceUnits: ['meq/L', 'meq/l'],
        targetUnits: ['mmol/L', 'mmol/l'],
        expectedMethod: 'simple-math',
        manuallyVerified: true,
        testCases: [
            {
                value: 4.0,
                expectedValue: 4.0,
            },
        ],
    },
    {
        biomarkerName: 'Chloride',
        sourceUnits: ['mmol/L', 'mmol/l'],
        targetUnits: ['meq/L', 'meq/l'],
        expectedMethod: 'simple-math',
        manuallyVerified: true,
        testCases: [
            {
                value: 100.0,
                expectedValue: 100.0,
            },
            {
                value: 110.0,
                expectedValue: 110.0,
            },
        ],
    },
    {
        biomarkerName: 'Chloride',
        sourceUnits: ['meq/L', 'meq/l'],
        targetUnits: ['mmol/L', 'mmol/l'],
        expectedMethod: 'simple-math',
        manuallyVerified: true,
        testCases: [
            {
                value: 100.0,
                expectedValue: 100.0,
            },
        ],
    },
    {
        biomarkerName: 'Magnesium',
        sourceUnits: ['mmol/L', 'mmol/l'],
        targetUnits: ['mg/dL', 'mg/dl'],
        expectedMethod: 'molecular-weight',
        manuallyVerified: true,
        testCases: [
            {
                value: 1.0,
                expectedValue: 2.4305,
            },
            {
                value: 2.0,
                expectedValue: 4.861,
            },
        ],
    },
    {
        biomarkerName: 'Magnesium',
        sourceUnits: ['mg/dL', 'mg/dl'],
        targetUnits: ['mmol/L', 'mmol/l'],
        expectedMethod: 'molecular-weight',
        manuallyVerified: true,
        testCases: [
            {
                value: 2.43,
                expectedValue: 1.0,
            },
            {
                value: 4.86,
                expectedValue: 2.0,
            },
        ],
    },
    {
        biomarkerName: 'Phosphorus',
        sourceUnits: ['mmol/L', 'mmol/l'],
        targetUnits: ['mg/dL', 'mg/dl'],
        expectedMethod: 'molecular-weight',
        manuallyVerified: true,
        testCases: [
            {
                value: 1.0,
                expectedValue: 3.097,
            },
            {
                value: 1.5,
                expectedValue: 4.6455,
            },
        ],
    },
    {
        biomarkerName: 'Phosphorus',
        sourceUnits: ['mg/dL', 'mg/dl'],
        targetUnits: ['mmol/L', 'mmol/l'],
        expectedMethod: 'molecular-weight',
        manuallyVerified: true,
        testCases: [
            {
                value: 3.1,
                expectedValue: 1.0,
            },
            {
                value: 4.65,
                expectedValue: 1.5,
            },
        ],
    },
    {
        biomarkerName: 'HDL Cholesterol',
        sourceUnits: ['mg/dL', 'mg/dl'],
        targetUnits: ['mmol/L', 'mmol/l'],
        expectedMethod: 'molecular-weight',
        manuallyVerified: true,
        testCases: [
            {
                value: 50.0,
                expectedValue: 1.2937,
            },
            {
                value: 60.0,
                expectedValue: 1.5525,
            },
        ],
    },
    {
        biomarkerName: 'HDL Cholesterol',
        sourceUnits: ['mmol/L', 'mmol/l'],
        targetUnits: ['mg/dL', 'mg/dl'],
        expectedMethod: 'molecular-weight',
        manuallyVerified: true,
        testCases: [
            {
                value: 1.29,
                expectedValue: 49.8843,
            },
            {
                value: 1.55,
                expectedValue: 59.9385,
            },
        ],
    },
    {
        biomarkerName: 'TIBC',
        sourceUnits: ['µg/dL', 'ug/dL', 'ug/dl', 'µg/dl'],
        targetUnits: ['µmol/L', 'umol/L', 'umol/l', 'µmol/l'],
        expectedMethod: 'special-formula',
        manuallyVerified: true,
        testCases: [
            {
                value: 300.0,
                expectedValue: 53.7,
            },
            {
                value: 400.0,
                expectedValue: 71.6,
            },
        ],
    },
    {
        biomarkerName: 'UIBC',
        sourceUnits: ['µg/dL', 'ug/dL', 'ug/dl', 'µg/dl'],
        targetUnits: ['µmol/L', 'umol/L', 'umol/l', 'µmol/l'],
        expectedMethod: 'special-formula',
        manuallyVerified: true,
        testCases: [
            {
                value: 200.0,
                expectedValue: 35.8,
            },
        ],
    },
    {
        biomarkerName: 'Zinc',
        sourceUnits: ['µg/dL', 'ug/dL', 'ug/dl', 'µg/dl'],
        targetUnits: ['µmol/L', 'umol/L', 'umol/l', 'µmol/l'],
        expectedMethod: 'special-formula',
        manuallyVerified: true,
        testCases: [
            {
                value: 70.0,
                expectedValue: 10.71,
            },
            {
                value: 100.0,
                expectedValue: 15.3,
            },
        ],
    },
    {
        biomarkerName: 'Zinc',
        sourceUnits: ['µmol/L', 'umol/L', 'umol/l', 'µmol/l'],
        targetUnits: ['µg/dL', 'ug/dL', 'ug/dl', 'µg/dl'],
        expectedMethod: 'special-formula',
        manuallyVerified: true,
        testCases: [
            {
                value: 10.7,
                expectedValue: 69.9346,
            },
            {
                value: 15.3,
                expectedValue: 100.0,
            },
        ],
    },
    {
        biomarkerName: 'Copper',
        sourceUnits: ['µmol/L', 'umol/L', 'umol/l', 'µmol/l'],
        targetUnits: ['µg/dL', 'ug/dL', 'ug/dl', 'µg/dl'],
        expectedMethod: 'special-formula',
        manuallyVerified: true,
        testCases: [
            {
                value: 15.0,
                expectedValue: 95.325,
            },
            {
                value: 20.0,
                expectedValue: 127.1,
            },
        ],
    },
    {
        biomarkerName: 'Selenium',
        sourceUnits: ['µg/mL', 'ug/mL', 'ug/ml', 'µg/ml'],
        targetUnits: ['µmol/L', 'umol/L', 'umol/l', 'µmol/l'],
        expectedMethod: 'molecular-weight',
        manuallyVerified: true,
        testCases: [
            {
                value: 0.1,
                expectedValue: 1.27,
            },
            {
                value: 0.15,
                expectedValue: 1.90,
            },
        ],
    },
    {
        biomarkerName: 'Mercury',
        sourceUnits: ['µg/L', 'ug/L', 'ug/l', 'µg/l'],
        targetUnits: ['nmol/L', 'nmol/l'],
        expectedMethod: 'molecular-weight',
        manuallyVerified: true,
        testCases: [
            {
                value: 5.0,
                expectedValue: 24.93,
            },
            {
                value: 10.0,
                expectedValue: 49.86,
            },
        ],
    },
    {
        biomarkerName: 'Homocysteine',
        sourceUnits: ['µmol/L', 'umol/L', 'umol/l', 'µmol/l'],
        targetUnits: ['mg/L', 'mg/l'],
        expectedMethod: 'molecular-weight',
        manuallyVerified: true,
        testCases: [
            {
                value: 10.0,
                expectedValue: 1.35,
            },
            {
                value: 15.0,
                expectedValue: 2.03,
            },
        ],
    },
    {
        biomarkerName: 'Vitamin A',
        sourceUnits: ['µg/mL', 'ug/mL', 'ug/ml', 'µg/ml'],
        targetUnits: ['µmol/L', 'umol/L', 'umol/l', 'µmol/l'],
        expectedMethod: 'molecular-weight',
        manuallyVerified: true,
        testCases: [
            {
                value: 0.5,
                expectedValue: 1.75,
            },
            {
                value: 1.0,
                expectedValue: 3.49,
            },
        ],
    },
    {
        biomarkerName: 'Vitamin E',
        sourceUnits: ['µg/mL', 'ug/mL', 'ug/ml', 'µg/ml'],
        targetUnits: ['µmol/L', 'umol/L', 'umol/l', 'µmol/l'],
        expectedMethod: 'molecular-weight',
        manuallyVerified: true,
        testCases: [
            {
                value: 10.0,
                expectedValue: 23.22,
            },
            {
                value: 15.0,
                expectedValue: 34.83,
            },
        ],
    },
    {
        biomarkerName: 'Vitamin K1',
        sourceUnits: ['ng/mL', 'ng/ml'],
        targetUnits: ['nmol/L', 'nmol/l'],
        expectedMethod: 'molecular-weight',
        manuallyVerified: true,
        testCases: [
            {
                value: 1.0,
                expectedValue: 2.22,
            },
            {
                value: 2.0,
                expectedValue: 4.44,
            },
        ],
    },
    {
        biomarkerName: 'Vitamin B12',
        sourceUnits: ['pmol/L', 'pmol/l'],
        targetUnits: ['ng/L', 'ng/l'],
        expectedMethod: 'molecular-weight',
        manuallyVerified: true,
        testCases: [
            {
                value: 200.0,
                expectedValue: 271.074,
            },
            {
                value: 300.0,
                expectedValue: 406.611,
            },
        ],
    },
    {
        biomarkerName: 'Vitamin B12',
        sourceUnits: ['ng/L', 'ng/l'],
        targetUnits: ['pmol/L', 'pmol/l'],
        expectedMethod: 'molecular-weight',
        manuallyVerified: true,
        testCases: [
            {
                value: 271.1,
                expectedValue: 200.02,
            },
            {
                value: 406.6,
                expectedValue: 300.0,
            },
        ],
    },
    {
        biomarkerName: 'Vitamin B12',
        sourceUnits: ['pg/mL', 'pg/ml'],
        targetUnits: ['pmol/L', 'pmol/l'],
        expectedMethod: 'molecular-weight',
        manuallyVerified: true,
        testCases: [
            {
                value: 271.0,
                expectedValue: 199.95,
            },
        ],
    },
    {
        biomarkerName: 'Folate',
        sourceUnits: ['nmol/L', 'nmol/l'],
        targetUnits: ['ng/mL', 'ng/ml'],
        expectedMethod: 'molecular-weight',
        manuallyVerified: true,
        testCases: [
            {
                value: 10.0,
                expectedValue: 4.41,
            },
            {
                value: 20.0,
                expectedValue: 8.83,
            },
        ],
    },
    {
        biomarkerName: 'Folate',
        sourceUnits: ['ng/mL', 'ng/ml'],
        targetUnits: ['nmol/L', 'nmol/l'],
        expectedMethod: 'molecular-weight',
        manuallyVerified: true,
        testCases: [
            {
                value: 4.41,
                expectedValue: 10.0,
            },
            {
                value: 8.83,
                expectedValue: 20.0,
            },
        ],
    },
    {
        biomarkerName: 'T3',
        sourceUnits: ['nmol/L', 'nmol/l'],
        targetUnits: ['ng/dL', 'ng/dl'],
        expectedMethod: 'molecular-weight',
        manuallyVerified: true,
        testCases: [
            {
                value: 2.0,
                expectedValue: 130.2,
            },
            {
                value: 3.0,
                expectedValue: 195.3,
            },
        ],
    },
    {
        biomarkerName: 'T3',
        sourceUnits: ['pmol/L', 'pmol/l'],
        targetUnits: ['ng/dL', 'ng/dl'],
        expectedMethod: 'molecular-weight',
        manuallyVerified: true,
        testCases: [
            {
                value: 2000.0,
                expectedValue: 130.2,
            },
        ],
    },
    {
        biomarkerName: 'T4',
        sourceUnits: ['pmol/L', 'pmol/l'],
        targetUnits: ['ng/dL', 'ng/dl'],
        expectedMethod: 'molecular-weight',
        manuallyVerified: true,
        testCases: [
            {
                value: 100.0,
                expectedValue: 7.77,
            },
            {
                value: 150.0,
                expectedValue: 11.65,
            },
        ],
    },
    {
        biomarkerName: 'Testosterone biologically active',
        sourceUnits: ['µg/L', 'ug/L', 'ug/l', 'µg/l'],
        targetUnits: ['nmol/L', 'nmol/l'],
        expectedMethod: 'molecular-weight',
        manuallyVerified: true,
        testCases: [
            {
                value: 5.0,
                expectedValue: 17.34,
            },
            {
                value: 10.0,
                expectedValue: 34.68,
            },
        ],
    },
    {
        biomarkerName: 'Testosterone total',
        sourceUnits: ['µg/L', 'ug/L', 'ug/l', 'µg/l'],
        targetUnits: ['nmol/L', 'nmol/l'],
        expectedMethod: 'molecular-weight',
        manuallyVerified: true,
        testCases: [
            {
                value: 5.0,
                expectedValue: 17.34,
            },
        ],
    },
    {
        biomarkerName: 'Estradiol',
        sourceUnits: ['ng/L', 'ng/l'],
        targetUnits: ['pmol/L', 'pmol/l'],
        expectedMethod: 'molecular-weight',
        manuallyVerified: true,
        testCases: [
            {
                value: 100.0,
                expectedValue: 367.13,
            },
            {
                value: 200.0,
                expectedValue: 734.27,
            },
        ],
    },
    {
        biomarkerName: 'Cortisol',
        sourceUnits: ['µg/L', 'ug/L', 'ug/l', 'µg/l'],
        targetUnits: ['nmol/L', 'nmol/l'],
        expectedMethod: 'molecular-weight',
        manuallyVerified: true,
        testCases: [
            {
                value: 100.0,
                expectedValue: 275.9,
            },
            {
                value: 200.0,
                expectedValue: 551.79,
            },
        ],
    },
    {
        biomarkerName: 'Ferritin',
        sourceUnits: ['µg/L', 'ug/L', 'ug/l', 'µg/l'],
        targetUnits: ['ng/mL', 'ng/ml'],
        expectedMethod: 'ucum',
        manuallyVerified: true,
        testCases: [
            {
                value: 100.0,
                expectedValue: 100.0,
            },
            {
                value: 200.0,
                expectedValue: 200.0,
            },
        ],
    },
    {
        biomarkerName: 'Ferritin',
        sourceUnits: ['ng/mL', 'ng/ml'],
        targetUnits: ['µg/L', 'ug/L', 'ug/l', 'µg/l'],
        expectedMethod: 'ucum',
        manuallyVerified: true,
        testCases: [
            {
                value: 100.0,
                expectedValue: 100.0,
            },
            {
                value: 200.0,
                expectedValue: 200.0,
            },
        ],
    },
    {
        biomarkerName: 'Prolactin',
        sourceUnits: ['m[iU]/L', 'mIU/L', 'miu/l', 'm[iu]/l'],
        targetUnits: ['µg/L', 'ug/L', 'ug/l', 'µg/l'],
        expectedMethod: 'conversion-factor',
        manuallyVerified: true,
        testCases: [
            {
                value: 20.0,
                expectedValue: 0.94,
            },
            {
                value: 30.0,
                expectedValue: 1.42,
            },
        ],
    },
    {
        biomarkerName: 'Hemoglobin',
        sourceUnits: ['g/dL', 'g/dl'],
        targetUnits: ['g/L', 'g/l'],
        expectedMethod: 'ucum',
        manuallyVerified: true,
        testCases: [
            {
                value: 12.0,
                expectedValue: 120.0,
            },
            {
                value: 15.0,
                expectedValue: 150.0,
            },
        ],
    },
    {
        biomarkerName: 'Hemoglobin',
        sourceUnits: ['g/L', 'g/l'],
        targetUnits: ['g/dL', 'g/dl'],
        expectedMethod: 'ucum',
        manuallyVerified: true,
        testCases: [
            {
                value: 120.0,
                expectedValue: 12.0,
            },
            {
                value: 150.0,
                expectedValue: 15.0,
            },
        ],
    },
    {
        biomarkerName: 'Hematocrit',
        sourceUnits: ['L/L', 'l/l'],
        targetUnits: ['%'],
        expectedMethod: 'ucum',
        manuallyVerified: true,
        testCases: [
            {
                value: 0.40,
                expectedValue: 40.0,
            },
            {
                value: 0.45,
                expectedValue: 45.0,
            },
        ],
    },
    {
        biomarkerName: 'Hematocrit',
        sourceUnits: ['%'],
        targetUnits: ['L/L', 'l/l'],
        expectedMethod: 'ucum',
        manuallyVerified: true,
        testCases: [
            {
                value: 40.0,
                expectedValue: 0.40,
            },
            {
                value: 45.0,
                expectedValue: 0.45,
            },
        ],
    },
    {
        biomarkerName: 'Albumin',
        sourceUnits: ['g/dL', 'g/dl'],
        targetUnits: ['g/L', 'g/l'],
        expectedMethod: 'ucum',
        manuallyVerified: true,
        testCases: [
            {
                value: 4.0,
                expectedValue: 40.0,
            },
            {
                value: 4.5,
                expectedValue: 45.0,
            },
        ],
    },
    {
        biomarkerName: 'Albumin',
        sourceUnits: ['g/L', 'g/l'],
        targetUnits: ['g/dL', 'g/dl'],
        expectedMethod: 'ucum',
        manuallyVerified: true,
        testCases: [
            {
                value: 40.0,
                expectedValue: 4.0,
            },
            {
                value: 45.0,
                expectedValue: 4.5,
            },
        ],
    },
    {
        biomarkerName: 'Total Protein',
        sourceUnits: ['g/dL', 'g/dl'],
        targetUnits: ['g/L', 'g/l'],
        expectedMethod: 'ucum',
        manuallyVerified: true,
        testCases: [
            {
                value: 7.0,
                expectedValue: 70.0,
            },
            {
                value: 8.0,
                expectedValue: 80.0,
            },
        ],
    },
    {
        biomarkerName: 'Total Protein',
        sourceUnits: ['g/L', 'g/l'],
        targetUnits: ['g/dL', 'g/dl'],
        expectedMethod: 'ucum',
        manuallyVerified: true,
        testCases: [
            {
                value: 70.0,
                expectedValue: 7.0,
            },
            {
                value: 80.0,
                expectedValue: 8.0,
            },
        ],
    },
    {
        biomarkerName: 'MCHC',
        sourceUnits: ['g/L', 'g/l'],
        targetUnits: ['g/dL', 'g/dl'],
        expectedMethod: 'ucum',
        manuallyVerified: true,
        testCases: [
            {
                value: 330.0,
                expectedValue: 33.0,
            },
        ],
    },
    {
        biomarkerName: 'MCHC',
        sourceUnits: ['g/dL', 'g/dl'],
        targetUnits: ['g/L', 'g/l'],
        expectedMethod: 'ucum',
        manuallyVerified: true,
        testCases: [
            {
                value: 33.0,
                expectedValue: 330.0,
            },
        ],
    },
    {
        biomarkerName: 'Ionized Calcium',
        sourceUnits: ['mmol/L', 'mmol/l'],
        targetUnits: ['mg/dL', 'mg/dl'],
        expectedMethod: 'special-formula',
        manuallyVerified: true,
        testCases: [
            {
                value: 1.2,
                expectedValue: 4.8,
            },
            {
                value: 1.3,
                expectedValue: 5.2,
            },
        ],
    },
    {
        biomarkerName: 'Vitamin D',
        sourceUnits: ['pg/mL', 'pg/ml'],
        targetUnits: ['ng/mL', 'ng/ml'],
        expectedMethod: 'ucum',
        manuallyVerified: true,
        testCases: [
            {
                value: 30000.0,
                expectedValue: 30.0,
            },
            {
                value: 50000.0,
                expectedValue: 50.0,
            },
        ],
    },
    {
        biomarkerName: 'CRP',
        sourceUnits: ['mg/L', 'mg/l'],
        targetUnits: ['mg/dL', 'mg/dl'],
        expectedMethod: 'ucum',
        manuallyVerified: true,
        testCases: [
            {
                value: 5.0,
                expectedValue: 0.5,
            },
            {
                value: 10.0,
                expectedValue: 1.0,
            },
        ],
    },
    {
        biomarkerName: 'CRP',
        sourceUnits: ['mg/dL', 'mg/dl'],
        targetUnits: ['mg/L', 'mg/l'],
        expectedMethod: 'ucum',
        manuallyVerified: true,
        testCases: [
            {
                value: 0.5,
                expectedValue: 5.0,
            },
            {
                value: 1.0,
                expectedValue: 10.0,
            },
        ],
    },
    {
        biomarkerName: 'Hemoglobin',
        sourceUnits: ['mg/dL', 'mg/dl'],
        targetUnits: ['g/L', 'g/l'],
        expectedMethod: 'ucum',
        manuallyVerified: true,
        testCases: [
            {
                value: 100.0,
                expectedValue: 1.0,
            },
        ],
    },
    {
        biomarkerName: 'TSH',
        sourceUnits: ['mIU/L', 'mIU/l', 'm[iU]/L', 'm[iu]/l'],
        targetUnits: ['[IU]/L', '[IU]/l'],
        expectedMethod: 'simple-math',
        manuallyVerified: true,
        testCases: [
            {
                value: 1000.0,
                expectedValue: 1.0,
            },
        ],
    },
    {
        biomarkerName: 'TSH',
        sourceUnits: ['[IU]/L', '[IU]/l'],
        targetUnits: ['mIU/L', 'mIU/l', 'm[iU]/L', 'm[iu]/l'],
        expectedMethod: 'simple-math',
        manuallyVerified: true,
        testCases: [
            {
                value: 1000.0,
                expectedValue: 1000000.0,
            },
        ],
    },
    {
        biomarkerName: 'T3',
        sourceUnits: ['ng/dL', 'ng/dl'],
        targetUnits: ['ug/L', 'ug/l', 'µg/L', 'µg/l'],
        expectedMethod: 'ucum',
        manuallyVerified: true,
        testCases: [
            {
                value: 100.0,
                expectedValue: 1.0,
            },
        ],
    },
    {
        biomarkerName: 'LH',
        sourceUnits: ['mIU/mL', 'mIU/ml', 'm[iU]/mL', 'm[iu]/ml'],
        targetUnits: ['[IU]/L', '[IU]/l'],
        expectedMethod: 'simple-math',
        manuallyVerified: true,
        testCases: [
            {
                value: 5.0,
                expectedValue: 5.0,
            },
            {
                value: 10.0,
                expectedValue: 10.0,
            },
        ],
    },
    {
        biomarkerName: 'Uric Acid',
        sourceUnits: ['mg/dL', 'mg/dl'],
        targetUnits: ['µmol/L', 'umol/L', 'µmol/l', 'umol/l'],
        expectedMethod: 'molecular-weight',
        manuallyVerified: true,
        testCases: [
            {
                value: 5.0,
                expectedValue: 297.4243,
            },
            {
                value: 7.0,
                expectedValue: 416.394,
            },
        ],
    },
    {
        biomarkerName: 'White Blood Cells',
        sourceUnits: ['10*3/µL', '10*3/uL', '10*3/ul'],
        targetUnits: ['10*9/L', '10*9/l'],
        expectedMethod: 'ucum',
        manuallyVerified: true,
        testCases: [
            {
                value: 5.0,
                expectedValue: 5.0,
            },
            {
                value: 10.0,
                expectedValue: 10.0,
            },
        ],
    },
    {
        biomarkerName: 'Neutrophils',
        sourceUnits: ['10*3/µL', '10*3/uL', '10*3/ul'],
        targetUnits: ['10*9/L', '10*9/l'],
        expectedMethod: 'ucum',
        manuallyVerified: true,
        testCases: [
            {
                value: 3.0,
                expectedValue: 3.0,
            },
            {
                value: 4.5,
                expectedValue: 4.5,
            },
        ],
    },
    {
        biomarkerName: 'Eosinophils',
        sourceUnits: ['10*3/µL', '10*3/uL', '10*3/ul'],
        targetUnits: ['10*9/L', '10*9/l'],
        expectedMethod: 'ucum',
        manuallyVerified: true,
        testCases: [
            {
                value: 0.1,
                expectedValue: 0.1,
            },
            {
                value: 0.5,
                expectedValue: 0.5,
            },
        ],
    },
    {
        biomarkerName: 'Basophils',
        sourceUnits: ['10*3/µL', '10*3/uL', '10*3/ul'],
        targetUnits: ['10*9/L', '10*9/l'],
        expectedMethod: 'ucum',
        manuallyVerified: true,
        testCases: [
            {
                value: 0.05,
                expectedValue: 0.05,
            },
            {
                value: 0.1,
                expectedValue: 0.1,
            },
        ],
    },
    {
        biomarkerName: 'Platelets',
        sourceUnits: ['10*3/µL', '10*3/uL', '10*3/ul'],
        targetUnits: ['10*9/L', '10*9/l'],
        expectedMethod: 'ucum',
        manuallyVerified: true,
        testCases: [
            {
                value: 250.0,
                expectedValue: 250.0,
            },
            {
                value: 150.0,
                expectedValue: 150.0,
            },
        ],
    },
    {
        biomarkerName: 'Lymphocytes',
        sourceUnits: ['10*3/µL', '10*3/uL', '10*3/ul'],
        targetUnits: ['10*9/L', '10*9/l'],
        expectedMethod: 'ucum',
        manuallyVerified: true,
        testCases: [
            {
                value: 1.5,
                expectedValue: 1.5,
            },
            {
                value: 2.0,
                expectedValue: 2.0,
            },
        ],
    },
    {
        biomarkerName: 'Monocytes',
        sourceUnits: ['10*3/µL', '10*3/uL', '10*3/ul'],
        targetUnits: ['10*9/L', '10*9/l'],
        expectedMethod: 'ucum',
        manuallyVerified: true,
        testCases: [
            {
                value: 0.25,
                expectedValue: 0.25,
            },
            {
                value: 0.5,
                expectedValue: 0.5,
            },
        ],
    },
]

export const verifiedConversionsConfig: VerifiedConversionsConfig = {
    verifiedConversions: allVerifiedConversions.filter((c): c is VerifiedConversionConfig => c.manuallyVerified),
}

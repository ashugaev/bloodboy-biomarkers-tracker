import { BiomarkerConfig } from './biomarkerConfig.types'

export const BIOMARKER_CONFIGS: Array<Partial<BiomarkerConfig>> = [
    {
        name: 'Glucose',
        ucumCode: 'mg/dL',
        normalRange: {
            min: 70,
            max: 100,
        },
        description: 'Fasting blood glucose',
        order: 0,
    },
    {
        name: 'Hemoglobin',
        ucumCode: 'g/dL',
        normalRange: {
            min: 13.5,
            max: 17.5,
        },
        description: 'Oxygen-carrying protein in red blood cells',
        order: 1,
    },
    {
        name: 'Total Cholesterol',
        ucumCode: 'mg/dL',
        normalRange: { max: 200 },
        description: 'Total blood cholesterol',
        order: 2,
    },
    {
        name: 'HDL Cholesterol',
        ucumCode: 'mg/dL',
        normalRange: { min: 40 },
        description: 'High-density lipoprotein (good cholesterol)',
        order: 3,
    },
    {
        name: 'LDL Cholesterol',
        ucumCode: 'mg/dL',
        normalRange: { max: 100 },
        description: 'Low-density lipoprotein (bad cholesterol)',
        order: 4,
    },
    {
        name: 'Triglycerides',
        ucumCode: 'mg/dL',
        normalRange: { max: 150 },
        description: 'Type of fat in blood',
        order: 5,
    },
    {
        name: 'TSH',
        ucumCode: 'u[iU]/mL',
        normalRange: {
            min: 0.4,
            max: 4.0,
        },
        description: 'Thyroid Stimulating Hormone',
        order: 6,
    },
    {
        name: 'ALT',
        ucumCode: 'U/L',
        normalRange: {
            min: 7,
            max: 56,
        },
        description: 'Alanine Aminotransferase (liver enzyme)',
        order: 7,
    },
    {
        name: 'AST',
        ucumCode: 'U/L',
        normalRange: {
            min: 10,
            max: 40,
        },
        description: 'Aspartate Aminotransferase (liver enzyme)',
        order: 8,
    },
    {
        name: 'Creatinine',
        ucumCode: 'mg/dL',
        normalRange: {
            min: 0.7,
            max: 1.3,
        },
        description: 'Kidney function marker',
        order: 9,
    },
    {
        name: 'White Blood Cells',
        ucumCode: '10*3/uL',
        normalRange: {
            min: 4.5,
            max: 11.0,
        },
        description: 'Immune system cells',
        order: 10,
    },
    {
        name: 'Red Blood Cells',
        ucumCode: '10*6/uL',
        normalRange: {
            min: 4.5,
            max: 5.9,
        },
        description: 'Oxygen-carrying blood cells',
        order: 11,
    },
    {
        name: 'Platelets',
        ucumCode: '10*3/uL',
        normalRange: {
            min: 150,
            max: 400,
        },
        description: 'Blood clotting cells',
        order: 12,
    },
    {
        name: 'Hematocrit',
        ucumCode: '%',
        normalRange: {
            min: 38.8,
            max: 50.0,
        },
        description: 'Percentage of red blood cells in blood',
        order: 13,
    },
    {
        name: 'MCV',
        ucumCode: 'fL',
        normalRange: {
            min: 80,
            max: 100,
        },
        description: 'Mean Corpuscular Volume',
        order: 14,
    },
    {
        name: 'MCH',
        ucumCode: 'pg',
        normalRange: {
            min: 27,
            max: 31,
        },
        description: 'Mean Corpuscular Hemoglobin',
        order: 15,
    },
    {
        name: 'MCHC',
        ucumCode: 'g/dL',
        normalRange: {
            min: 32,
            max: 36,
        },
        description: 'Mean Corpuscular Hemoglobin Concentration',
        order: 16,
    },
    {
        name: 'RDW',
        ucumCode: '%',
        normalRange: {
            min: 11.5,
            max: 14.5,
        },
        description: 'Red Cell Distribution Width',
        order: 17,
    },
    {
        name: 'Vitamin D',
        ucumCode: 'ng/mL',
        normalRange: {
            min: 30,
            max: 100,
        },
        description: '25-hydroxyvitamin D',
        order: 18,
    },
    {
        name: 'Vitamin B12',
        ucumCode: 'pg/mL',
        normalRange: {
            min: 200,
            max: 900,
        },
        description: 'Cobalamin',
        order: 19,
    },
    {
        name: 'Iron',
        ucumCode: 'ug/dL',
        normalRange: {
            min: 60,
            max: 170,
        },
        description: 'Serum iron',
        order: 20,
    },
    {
        name: 'Ferritin',
        ucumCode: 'ng/mL',
        normalRange: {
            min: 30,
            max: 400,
        },
        description: 'Iron storage protein',
        order: 21,
    },
    {
        name: 'Folate',
        ucumCode: 'ng/mL',
        normalRange: {
            min: 2.7,
            max: 17.0,
        },
        description: 'Vitamin B9',
        order: 22,
    },
    {
        name: 'Urea',
        ucumCode: 'mg/dL',
        normalRange: {
            min: 7,
            max: 20,
        },
        description: 'Blood urea nitrogen (BUN)',
        order: 23,
    },
    {
        name: 'Uric Acid',
        ucumCode: 'mg/dL',
        normalRange: {
            min: 3.5,
            max: 7.2,
        },
        description: 'Purine metabolism marker',
        order: 24,
    },
    {
        name: 'Total Protein',
        ucumCode: 'g/dL',
        normalRange: {
            min: 6.0,
            max: 8.3,
        },
        description: 'Total serum protein',
        order: 25,
    },
    {
        name: 'Albumin',
        ucumCode: 'g/dL',
        normalRange: {
            min: 3.5,
            max: 5.5,
        },
        description: 'Major blood protein',
        order: 26,
    },
    {
        name: 'Bilirubin',
        ucumCode: 'mg/dL',
        normalRange: { max: 1.2 },
        description: 'Total bilirubin',
        order: 27,
    },
    {
        name: 'Alkaline Phosphatase',
        ucumCode: 'U/L',
        normalRange: {
            min: 44,
            max: 147,
        },
        description: 'ALP (liver/bone enzyme)',
        order: 28,
    },
    {
        name: 'GGT',
        ucumCode: 'U/L',
        normalRange: {
            min: 0,
            max: 51,
        },
        description: 'Gamma-Glutamyl Transferase',
        order: 29,
    },
    {
        name: 'HbA1c',
        ucumCode: '%',
        normalRange: { max: 5.7 },
        description: 'Glycated hemoglobin (diabetes marker)',
        order: 30,
    },
    {
        name: 'Sodium',
        ucumCode: 'meq/L',
        normalRange: {
            min: 136,
            max: 145,
        },
        description: 'Blood sodium',
        order: 31,
    },
    {
        name: 'Potassium',
        ucumCode: 'meq/L',
        normalRange: {
            min: 3.5,
            max: 5.0,
        },
        description: 'Blood potassium',
        order: 32,
    },
    {
        name: 'Chloride',
        ucumCode: 'meq/L',
        normalRange: {
            min: 96,
            max: 106,
        },
        description: 'Blood chloride',
        order: 33,
    },
    {
        name: 'Calcium',
        ucumCode: 'mg/dL',
        normalRange: {
            min: 8.5,
            max: 10.5,
        },
        description: 'Blood calcium',
        order: 34,
    },
    {
        name: 'Magnesium',
        ucumCode: 'mg/dL',
        normalRange: {
            min: 1.7,
            max: 2.2,
        },
        description: 'Blood magnesium',
        order: 35,
    },
    {
        name: 'Phosphorus',
        ucumCode: 'mg/dL',
        normalRange: {
            min: 2.5,
            max: 4.5,
        },
        description: 'Blood phosphorus',
        order: 36,
    },
    {
        name: 'CRP',
        ucumCode: 'mg/L',
        normalRange: { max: 3.0 },
        description: 'C-Reactive Protein (inflammation marker)',
        order: 37,
    },
    {
        name: 'ESR',
        ucumCode: 'mm/h',
        normalRange: { max: 20 },
        description: 'Erythrocyte Sedimentation Rate',
        order: 38,
    },
    {
        name: 'PSA',
        ucumCode: 'ng/mL',
        normalRange: { max: 4.0 },
        description: 'Prostate-Specific Antigen',
        order: 39,
    },
]

export const DEFAULT_BLOCKED_MERGES: Array<{
    biomarkerName: string
    sourceUnits: string[]
    targetUnits: string[]
}> = [
    {
        biomarkerName: 'Testosterone',
        sourceUnits: ['%'],
        targetUnits: ['ng/mL', 'ng/dL', 'nmol/L'],
    },
    {
        biomarkerName: 'Free Testosterone',
        sourceUnits: ['%'],
        targetUnits: ['ng/mL', 'ng/dL', 'pmol/L'],
    },
]


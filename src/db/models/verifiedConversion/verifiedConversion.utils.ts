export const createVerifiedConversionKey = (
    biomarkerName: string,
    sourceUnit: string,
    targetUnit: string,
): string => {
    return `${biomarkerName.toLowerCase().trim()}|${sourceUnit}|${targetUnit}`
}

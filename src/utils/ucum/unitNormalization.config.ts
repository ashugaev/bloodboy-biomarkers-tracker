const normalizeUnit = (ucum: string): string => {
    return ucum.toLowerCase().replace(/\s/g, '').replace(/µ/g, 'u').replace(/μ/g, 'u')
}

export const unitNormalizationMap: Record<string, string> = {
    'ug/l': 'ug/L',
    'ug/ml': 'ug/mL',
    'ug/dl': 'ug/dL',
    'umol/l': 'umol/L',
    'm[iu]/l': 'mIU/L',
    'miu/ml': 'mIU/mL',
    'm[iu]/ml': 'mIU/mL',
    'miu/l': 'mIU/L',
    '[iu]/l': '[IU]/L',
}

export const normalizeUnitForUcum = (ucum: string): string => {
    const normalized = normalizeUnit(ucum)
    return unitNormalizationMap[normalized] ?? normalized
}

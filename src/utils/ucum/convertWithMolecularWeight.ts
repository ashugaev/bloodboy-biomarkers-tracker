const getMassMultiplier = (ucum: string): number => {
    if (ucum.includes('kg')) return 1000000
    if (ucum.includes('g') && !ucum.includes('ug') && !ucum.includes('ng') && !ucum.includes('pg') && !ucum.includes('mg')) return 1000
    if (ucum.includes('mg')) return 1
    if (ucum.includes('ug')) return 0.001
    if (ucum.includes('ng')) return 0.000001
    if (ucum.includes('pg')) return 0.000000001
    return 1
}

const getMolarMultiplier = (ucum: string): number => {
    if (ucum.includes('mol') && !ucum.includes('mmol') && !ucum.includes('umol') && !ucum.includes('nmol') && !ucum.includes('pmol')) return 1
    if (ucum.includes('mmol')) return 0.001
    if (ucum.includes('umol')) return 0.000001
    if (ucum.includes('nmol')) return 0.000000001
    if (ucum.includes('pmol')) return 0.000000000001
    return 1
}

const isMassUnit = (ucum: string): boolean => {
    return /(kg|g|mg|ug|ng|pg)/.test(ucum) && !/(mol)/.test(ucum)
}

const isMolarUnit = (ucum: string): boolean => {
    return /(mol|mmol|umol|nmol|pmol)/.test(ucum)
}

export const convertWithMolecularWeight = (
    value: number,
    from: string,
    to: string,
    molecularWeight: number,
): number => {
    if (!molecularWeight || molecularWeight <= 0) {
        throw new Error('Invalid molecular weight')
    }

    const fromIsMass = isMassUnit(from)
    const toIsMass = isMassUnit(to)
    const fromIsMolar = isMolarUnit(from)
    const toIsMolar = isMolarUnit(to)

    if (fromIsMass && toIsMolar) {
        const fromMultiplier = getMassMultiplier(from)
        const toMultiplier = getMolarMultiplier(to)
        const valueInMg = value * fromMultiplier
        const valueInMol = valueInMg / (molecularWeight * 1000)
        return valueInMol / toMultiplier
    }

    if (fromIsMolar && toIsMass) {
        const fromMultiplier = getMolarMultiplier(from)
        const toMultiplier = getMassMultiplier(to)
        const valueInMol = value * fromMultiplier
        const valueInMg = valueInMol * (molecularWeight * 1000)
        return valueInMg / toMultiplier
    }

    throw new Error(`Cannot convert ${from} to ${to} using molecular weight`)
}

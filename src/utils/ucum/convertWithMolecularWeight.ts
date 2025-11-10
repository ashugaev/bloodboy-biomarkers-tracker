/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return */
import { UcumLhcUtils } from '@lhncbc/ucum-lhc'

import { isMassUnit, isMolarUnit } from './unitType'

const utils = UcumLhcUtils.getInstance()

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

    if (!((fromIsMass && toIsMolar) || (fromIsMolar && toIsMass))) {
        throw new Error(`Cannot convert ${from} to ${to} using molecular weight. Units must be mass ↔ molar`)
    }

    const res = utils.convertUnitTo(from, value, to, {
        molecularWeight,
    })

    if (!res || res.status !== 'succeeded') {
        const errorMsg = res?.msg?.join('. ') ?? 'UCUM conversion with molecular weight failed'
        throw new Error(errorMsg)
    }

    if (typeof res.toVal !== 'number') {
        throw new Error('UCUM conversion returned invalid result')
    }

    return res.toVal
}

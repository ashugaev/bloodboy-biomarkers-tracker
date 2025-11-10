/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return */
import { UcumLhcUtils } from '@lhncbc/ucum-lhc'

const utils = UcumLhcUtils.getInstance()

export const convertUnitValue = (value: number, from: string, to: string): number => {
    if (from === to) return value
    const res = utils.convertUnitTo(from, value, to)
    if (!res || res.status !== 'succeeded' || typeof res.toVal !== 'number') {
        throw new Error('UCUM conversion failed')
    }
    return res.toVal
}

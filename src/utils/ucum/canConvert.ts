/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access */
import { UcumLhcUtils } from '@lhncbc/ucum-lhc'

const utils = UcumLhcUtils.getInstance()

export const canConvert = (from: string, to: string): boolean => {
    if (from === to) return true
    try {
        const testRes = utils.convertUnitTo(from, 1, to)
        return testRes !== null && testRes.status === 'succeeded'
    } catch {
        return false
    }
}

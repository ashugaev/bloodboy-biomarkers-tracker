/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access */
import { UcumLhcUtils } from '@lhncbc/ucum-lhc'

const utils = UcumLhcUtils.getInstance()

export const isAmbiguousUcumCode = (code: string): boolean => {
    if (!code || code.trim().length === 0) return false
    const trimmed = code.trim()
    return /^[0-9]+$/.test(trimmed)
}

export const validateUcumCode = (code: string): boolean => {
    if (isAmbiguousUcumCode(code)) {
        return false
    }
    if (code.startsWith('{') && code.endsWith('}')) {
        return true
    }
    const res = utils.validateUnitString(code)
    return res.status === 'valid'
}

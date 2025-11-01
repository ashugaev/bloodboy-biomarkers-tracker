/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access */
import { UcumLhcUtils } from '@lhncbc/ucum-lhc'

const utils = UcumLhcUtils.getInstance()

export const validateUcumCode = (code: string): boolean => {
    if (code.startsWith('{') && code.endsWith('}')) {
        return true
    }
    const res = utils.validateUnitString(code)
    return res.status === 'valid'
}

/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return */
import { UcumLhcUtils } from '@lhncbc/ucum-lhc'

const utils = UcumLhcUtils.getInstance()

export const getUcumUnitName = (code: string): string => {
    const result = utils.getSpecifiedUnit(code)
    if (!result?.unit) return code
    return result.unit.name_ ?? result.unit.printSymbol_ ?? result.unit.csCode_ ?? code
}

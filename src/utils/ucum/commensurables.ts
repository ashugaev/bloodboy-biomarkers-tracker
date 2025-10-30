/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return */
import { UcumLhcUtils } from '@lhncbc/ucum-lhc'

const utils = UcumLhcUtils.getInstance()

export const getCommensurableUnits = (code: string): string[] => {
    const res = utils.getCommensurables(code)
    return res.map((u: { csCode?: string }) => u.csCode).filter(Boolean) as string[]
}

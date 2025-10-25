import { validateUcumCode } from './validate'

export const mapUnitToUcumCode = (unit: string | undefined | null): string | null => {
    if (!unit) return null
    return validateUcumCode(unit) ? unit : null
}

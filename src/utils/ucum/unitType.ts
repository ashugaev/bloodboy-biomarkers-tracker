import { UnitType } from '@/db/models/unit/unit.types'

export const isMassUnit = (ucum: string): boolean => {
    return /(kg|g|mg|ug|µg|μg|ng|pg)/.test(ucum) && !/(mol)/.test(ucum)
}

export const isMolarUnit = (ucum: string): boolean => {
    return /(mol|mmol|umol|µmol|μmol|nmol|pmol)/.test(ucum)
}

export const isInternationalUnit = (ucum: string): boolean => {
    if (isMassUnit(ucum)) {
        return false
    }
    return /\[?i?u\]?/i.test(ucum) || /m\[iu\]/i.test(ucum) || /\[iu\]/i.test(ucum)
}

export const getUnitType = (ucum: string): UnitType => {
    if (isMassUnit(ucum)) {
        return 'mass'
    }
    if (isMolarUnit(ucum)) {
        return 'molar'
    }
    if (isInternationalUnit(ucum)) {
        return 'international'
    }
    if (/(l|ml|dl)/.test(ucum) && !/(mol)/.test(ucum)) {
        return 'volume'
    }
    if (/(m|cm|km|in|ft)/.test(ucum)) {
        return 'length'
    }
    return 'other'
}

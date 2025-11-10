export type UnitType = 'mass' | 'molar' | 'international' | 'volume' | 'length' | 'other'

export interface Unit {
    id: string
    ucumCode: string
    title: string
    valueType?: 'number' | 'select' | 'text'
    options?: string[]
    unitType?: UnitType
    approved: boolean
    createdAt: Date
    updatedAt: Date
}

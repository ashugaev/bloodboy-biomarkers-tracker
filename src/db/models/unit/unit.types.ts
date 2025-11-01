export interface Unit {
    id: string
    ucumCode: string
    title: string
    valueType?: 'number' | 'select' | 'text'
    options?: string[]
    approved: boolean
    createdAt: Date
    updatedAt: Date
}

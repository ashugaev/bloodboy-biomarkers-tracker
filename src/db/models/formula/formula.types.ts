import { BaseEntity } from '@/db/types/base.types'
import { Range } from '@/db/types/range.types'

/**
 * A single variable used inside a formula expression.
 * `key` is the token referenced in the expression as `{key}`.
 * `biomarkerId` points to the BiomarkerConfig whose values feed the variable.
 */
export interface FormulaVariable {
    key: string
    biomarkerId: string
}

/**
 * A user-defined formula that computes a derived value from other biomarkers.
 * Behaves like a "virtual biomarker": it is evaluated per test date and can be
 * charted and tracked over time just like a regular analysis.
 */
export interface Formula extends BaseEntity {
    name: string
    description?: string
    expression: string
    variables: FormulaVariable[]
    unitLabel?: string
    normalRange?: Range
    targetRange?: Range
    order?: number
}

import { describe, expect, it } from 'vitest'

import { evaluateExpression, extractVariableKeys, generateVariableKey, validateExpressionSyntax } from './formula.utils'

describe('extractVariableKeys', () => {
    it('extracts unique keys from an expression', () => {
        expect(extractVariableKeys('{a} / {b} + {a}')).toEqual(['a', 'b'])
    })

    it('returns empty array when there are no variables', () => {
        expect(extractVariableKeys('1 + 2')).toEqual([])
    })
})

describe('evaluateExpression', () => {
    it('evaluates basic arithmetic with operator precedence', () => {
        expect(evaluateExpression('2 + 3 * 4', {}).value).toBe(14)
    })

    it('respects parentheses', () => {
        expect(evaluateExpression('(2 + 3) * 4', {}).value).toBe(20)
    })

    it('substitutes variables', () => {
        expect(evaluateExpression('{trig} / {hdl}', {
            trig: 150,
            hdl: 50,
        }).value).toBe(3)
    })

    it('handles the AIP formula log10(TG/HDL)', () => {
        const result = evaluateExpression('log({tg} / {hdl})', {
            tg: 1.5,
            hdl: 1,
        })
        expect(result.value).toBeCloseTo(Math.log10(1.5), 6)
    })

    it('handles HOMA-IR style expression', () => {
        // glucose * insulin / 22.5
        const result = evaluateExpression('{glucose} * {insulin} / 22.5', {
            glucose: 5,
            insulin: 9,
        })
        expect(result.value).toBeCloseTo(2, 6)
    })

    it('supports unary minus', () => {
        expect(evaluateExpression('-{a} + 5', { a: 3 }).value).toBe(2)
    })

    it('supports exponentiation (right associative)', () => {
        expect(evaluateExpression('2 ^ 3 ^ 2', {}).value).toBe(512)
    })

    it('supports multi-argument functions with nesting', () => {
        expect(evaluateExpression('max(1, 2 + min(3, 4))', {}).value).toBe(5)
    })

    it('does not swallow unrelated stack operands into min/max', () => {
        expect(evaluateExpression('10 + max(1, 2)', {}).value).toBe(12)
    })

    it('reports missing variables', () => {
        const result = evaluateExpression('{a} + {b}', { a: 1 })
        expect(result.missing).toEqual(['b'])
        expect(result.value).toBeUndefined()
    })

    it('reports a syntax error for mismatched parentheses', () => {
        const result = evaluateExpression('(1 + 2', {})
        expect(result.error).toBeDefined()
    })

    it('reports non-finite results (division by zero)', () => {
        const result = evaluateExpression('{a} / 0', { a: 1 })
        expect(result.error).toBeDefined()
        expect(result.value).toBeUndefined()
    })

    it('rejects wrong arity for single-arg functions', () => {
        const result = evaluateExpression('sqrt(4, 9)', {})
        expect(result.error).toBeDefined()
    })

    it('normalizes unicode operators', () => {
        expect(evaluateExpression('{a} × {b} ÷ 2', {
            a: 4,
            b: 3,
        }).value).toBe(6)
    })
})

describe('validateExpressionSyntax', () => {
    it('accepts a valid expression', () => {
        expect(validateExpressionSyntax('{a} + {b}', ['a', 'b']).valid).toBe(true)
    })

    it('rejects an unknown function', () => {
        expect(validateExpressionSyntax('frobnicate({a})', ['a']).valid).toBe(false)
    })
})

describe('generateVariableKey', () => {
    it('slugifies a biomarker name', () => {
        expect(generateVariableKey('HDL Cholesterol', [])).toBe('hdl_cholesterol')
    })

    it('avoids collisions', () => {
        expect(generateVariableKey('HDL', ['hdl'])).toBe('hdl_2')
        expect(generateVariableKey('HDL', ['hdl', 'hdl_2'])).toBe('hdl_3')
    })

    it('falls back for empty names', () => {
        expect(generateVariableKey('%%%', [])).toBe('v')
    })
})

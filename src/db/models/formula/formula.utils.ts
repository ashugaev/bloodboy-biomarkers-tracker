import { BiomarkerRecord } from '@/db/models/biomarkerRecord'
import { UploadedDocument } from '@/db/models/document'

import { Formula, FormulaVariable } from './formula.types'

/**
 * Result of evaluating a formula expression.
 * Exactly one of `value` / `error` is meaningful; `missing` lists variable
 * keys that had no value available (which also produces an error).
 */
export interface FormulaEvalResult {
    value?: number
    error?: string
    missing: string[]
}

type FunctionName =
    | 'ln' | 'log' | 'log10' | 'log2' | 'sqrt' | 'abs' | 'exp'
    | 'min' | 'max' | 'round' | 'floor' | 'ceil' | 'pow' | 'sign'

const FUNCTIONS: Record<FunctionName, (args: number[]) => number> = {
    ln: (a) => Math.log(a[0]),
    log: (a) => Math.log10(a[0]),
    log10: (a) => Math.log10(a[0]),
    log2: (a) => Math.log2(a[0]),
    sqrt: (a) => Math.sqrt(a[0]),
    abs: (a) => Math.abs(a[0]),
    exp: (a) => Math.exp(a[0]),
    sign: (a) => Math.sign(a[0]),
    round: (a) => Math.round(a[0]),
    floor: (a) => Math.floor(a[0]),
    ceil: (a) => Math.ceil(a[0]),
    min: (a) => Math.min(...a),
    max: (a) => Math.max(...a),
    pow: (a) => Math.pow(a[0], a[1]),
}

export const FORMULA_FUNCTION_NAMES: FunctionName[] = [
    'ln', 'log', 'sqrt', 'abs', 'exp', 'min', 'max', 'round', 'pow',
]

const CONSTANTS: Record<string, number> = {
    pi: Math.PI,
    e: Math.E,
}

interface Token {
    type: 'number' | 'variable' | 'identifier' | 'operator' | 'paren' | 'comma'
    value: string
    /** For function identifiers in RPN: the number of arguments it consumes. */
    argCount?: number
}

const OPERATORS: Record<string, { precedence: number, rightAssociative: boolean }> = {
    '+': {
        precedence: 2,
        rightAssociative: false,
    },
    '-': {
        precedence: 2,
        rightAssociative: false,
    },
    '*': {
        precedence: 3,
        rightAssociative: false,
    },
    '/': {
        precedence: 3,
        rightAssociative: false,
    },
    '%': {
        precedence: 3,
        rightAssociative: false,
    },
    '^': {
        precedence: 4,
        rightAssociative: true,
    },
    // Unary minus is represented internally as 'u-'
    'u-': {
        precedence: 5,
        rightAssociative: true,
    },
}

/** Normalize unicode math symbols to their ASCII equivalents. */
const normalizeExpression = (expression: string): string => {
    return expression
        .replace(/×/g, '*')
        .replace(/÷/g, '/')
        .replace(/−/g, '-')
        .replace(/,/g, ',')
}

class TokenizeError extends Error {}

const tokenize = (expression: string): Token[] => {
    const tokens: Token[] = []
    let i = 0
    const src = expression

    while (i < src.length) {
        const char = src[i]

        if (char === ' ' || char === '\t' || char === '\n') {
            i += 1
            continue
        }

        if (char === '{') {
            const end = src.indexOf('}', i)
            if (end === -1) throw new TokenizeError('Unclosed variable reference')
            const key = src.slice(i + 1, end).trim()
            if (key.length === 0) throw new TokenizeError('Empty variable reference')
            tokens.push({
                type: 'variable',
                value: key,
            })
            i = end + 1
            continue
        }

        if (/[0-9.]/.test(char)) {
            let num = ''
            while (i < src.length && /[0-9.eE+-]/.test(src[i])) {
                // Only consume +/- when part of scientific notation (e.g. 1e-3)
                if ((src[i] === '+' || src[i] === '-') && !/[eE]/.test(src[i - 1])) break
                num += src[i]
                i += 1
            }
            if (!/^\d*\.?\d+([eE][+-]?\d+)?$/.test(num)) {
                throw new TokenizeError(`Invalid number: ${num}`)
            }
            tokens.push({
                type: 'number',
                value: num,
            })
            continue
        }

        if (/[a-zA-Z_]/.test(char)) {
            let name = ''
            while (i < src.length && /[a-zA-Z0-9_]/.test(src[i])) {
                name += src[i]
                i += 1
            }
            tokens.push({
                type: 'identifier',
                value: name,
            })
            continue
        }

        if (char === '(' || char === ')') {
            tokens.push({
                type: 'paren',
                value: char,
            })
            i += 1
            continue
        }

        if (char === ',') {
            tokens.push({
                type: 'comma',
                value: ',',
            })
            i += 1
            continue
        }

        if ('+-*/^%'.includes(char)) {
            tokens.push({
                type: 'operator',
                value: char,
            })
            i += 1
            continue
        }

        throw new TokenizeError(`Unexpected character: ${char}`)
    }

    return tokens
}

/** Convert an infix token stream to Reverse Polish Notation (shunting-yard). */
const toRpn = (tokens: Token[]): Token[] => {
    const output: Token[] = []
    const stack: Token[] = []
    // Per open-paren bookkeeping to count function arguments.
    const argCountStack: number[] = []
    const funcFlagStack: boolean[] = []
    let prev: Token | undefined

    for (const token of tokens) {
        if (token.type === 'number' || token.type === 'variable') {
            output.push(token)
        } else if (token.type === 'identifier') {
            const lower = token.value.toLowerCase()
            if (lower in CONSTANTS) {
                output.push({
                    type: 'number',
                    value: String(CONSTANTS[lower]),
                })
            } else if (lower in FUNCTIONS) {
                stack.push({
                    type: 'identifier',
                    value: lower,
                })
            } else {
                throw new TokenizeError(`Unknown function or name: ${token.value}`)
            }
        } else if (token.type === 'comma') {
            while (stack.length > 0 && stack[stack.length - 1].value !== '(') {
                const popped = stack.pop()
                if (popped !== undefined) output.push(popped)
            }
            if (argCountStack.length === 0) throw new TokenizeError('Misplaced comma')
            argCountStack[argCountStack.length - 1] += 1
        } else if (token.type === 'operator') {
            let op = token.value
            const isUnary =
                op === '-' &&
                (prev === undefined ||
                    prev.type === 'operator' ||
                    prev.value === '(' ||
                    prev.type === 'comma')
            if (isUnary) op = 'u-'

            const o1 = OPERATORS[op]
            while (stack.length > 0) {
                const top = stack[stack.length - 1]
                if (top.type !== 'operator') break
                const o2 = OPERATORS[top.value]
                if (
                    (!o1.rightAssociative && o1.precedence <= o2.precedence) ||
                    (o1.rightAssociative && o1.precedence < o2.precedence)
                ) {
                    const popped = stack.pop()
                    if (popped !== undefined) output.push(popped)
                } else {
                    break
                }
            }
            stack.push({
                type: 'operator',
                value: op,
            })
        } else if (token.value === '(') {
            const isFunctionCall = prev?.type === 'identifier' && prev.value.toLowerCase() in FUNCTIONS
            funcFlagStack.push(isFunctionCall)
            argCountStack.push(1)
            stack.push(token)
        } else if (token.value === ')') {
            while (stack.length > 0 && stack[stack.length - 1].value !== '(') {
                const popped = stack.pop()
                if (popped !== undefined) output.push(popped)
            }
            if (stack.length === 0) throw new TokenizeError('Mismatched parentheses')
            stack.pop()
            const isFunctionCall = funcFlagStack.pop() ?? false
            const argCount = argCountStack.pop() ?? 0
            if (isFunctionCall) {
                const fn = stack.pop()
                if (fn === undefined || fn.type !== 'identifier') {
                    throw new TokenizeError('Invalid function call')
                }
                output.push({
                    type: 'identifier',
                    value: fn.value,
                    argCount,
                })
            }
        }
        prev = token
    }

    while (stack.length > 0) {
        const top = stack.pop()
        if (top === undefined) break
        if (top.value === '(' || top.value === ')') {
            throw new TokenizeError('Mismatched parentheses')
        }
        output.push(top)
    }

    return output
}

const applyOperator = (op: string, stack: number[]): void => {
    if (op === 'u-') {
        const a = stack.pop()
        if (a === undefined) throw new TokenizeError('Invalid expression')
        stack.push(-a)
        return
    }
    const b = stack.pop()
    const a = stack.pop()
    if (a === undefined || b === undefined) throw new TokenizeError('Invalid expression')
    switch (op) {
        case '+': stack.push(a + b); break
        case '-': stack.push(a - b); break
        case '*': stack.push(a * b); break
        case '/': stack.push(a / b); break
        case '%': stack.push(a % b); break
        case '^': stack.push(Math.pow(a, b)); break
        default: throw new TokenizeError(`Unknown operator: ${op}`)
    }
}

const SINGLE_ARG_FUNCTIONS = new Set<FunctionName>([
    'ln', 'log', 'log10', 'log2', 'sqrt', 'abs', 'exp', 'sign', 'round', 'floor', 'ceil',
])

const evalRpn = (rpn: Token[], values: Record<string, number>): number => {
    const stack: number[] = []
    for (const token of rpn) {
        if (token.type === 'number') {
            stack.push(Number(token.value))
        } else if (token.type === 'variable') {
            stack.push(values[token.value])
        } else if (token.type === 'operator') {
            applyOperator(token.value, stack)
        } else if (token.type === 'identifier') {
            const name = token.value as FunctionName
            const fn = FUNCTIONS[name]
            const argCount = token.argCount ?? 1
            if (SINGLE_ARG_FUNCTIONS.has(name) && argCount !== 1) {
                throw new TokenizeError(`${name}() takes exactly 1 argument`)
            }
            if (name === 'pow' && argCount !== 2) {
                throw new TokenizeError('pow() takes exactly 2 arguments')
            }
            const args: number[] = []
            for (let k = 0; k < argCount; k += 1) {
                const v = stack.pop()
                if (v === undefined) throw new TokenizeError('Invalid function arguments')
                args.unshift(v)
            }
            stack.push(fn(args))
        }
    }
    if (stack.length !== 1) throw new TokenizeError('Invalid expression')
    return stack[0]
}

/**
 * Return the set of variable keys referenced by an expression (the `{key}` tokens).
 */
export const extractVariableKeys = (expression: string): string[] => {
    const keys = new Set<string>()
    const regex = /\{([^}]*)\}/g
    let match: RegExpExecArray | null
    while ((match = regex.exec(expression)) !== null) {
        const key = match[1].trim()
        if (key.length > 0) keys.add(key)
    }
    return Array.from(keys)
}

/**
 * Evaluate a formula expression against a map of variable-key -> numeric value.
 * Missing or non-finite variable values are reported instead of throwing.
 */
export const evaluateExpression = (
    expression: string,
    values: Record<string, number | undefined>,
): FormulaEvalResult => {
    const keys = extractVariableKeys(expression)
    const missing = keys.filter(key => values[key] === undefined || !Number.isFinite(values[key]))
    if (missing.length > 0) {
        return { missing }
    }

    try {
        const normalized = normalizeExpression(expression)
        const tokens = tokenize(normalized)
        if (tokens.length === 0) {
            return {
                error: 'Empty expression',
                missing: [],
            }
        }
        const rpn = toRpn(tokens)
        const resolved: Record<string, number> = {}
        for (const key of keys) {
            const value = values[key]
            if (value !== undefined) resolved[key] = value
        }
        const result = evalRpn(rpn, resolved)
        if (!Number.isFinite(result)) {
            return {
                error: 'Result is not a finite number',
                missing: [],
            }
        }
        return {
            value: result,
            missing: [],
        }
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Invalid expression'
        return {
            error: message,
            missing: [],
        }
    }
}

/**
 * Validate an expression's syntax without needing real values.
 * Substitutes `1` for every variable and checks it parses/evaluates.
 */
export const validateExpressionSyntax = (
    expression: string,
    variableKeys: string[],
): { valid: boolean, error?: string } => {
    const values: Record<string, number> = {}
    for (const key of variableKeys) values[key] = 1
    const result = evaluateExpression(expression, values)
    if (result.error !== undefined) {
        return {
            valid: false,
            error: result.error,
        }
    }
    return { valid: true }
}

const buildValueMap = (variables: FormulaVariable[], inputs: Record<string, number>): Record<string, number> => {
    const values: Record<string, number> = {}
    for (const variable of variables) {
        const value = inputs[variable.biomarkerId]
        if (value !== undefined) values[variable.key] = value
    }
    return values
}

const getRecordTimestamp = (record: BiomarkerRecord, documents: UploadedDocument[]): number => {
    const document = documents.find(d => d.id === record.documentId)
    const date = document?.testDate ?? record.createdAt
    return new Date(date).getTime()
}

const toDayKey = (timestamp: number): string => {
    const date = new Date(timestamp)
    return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`
}

export interface FormulaSeriesPoint {
    date: string
    timestamp: number
    value: number
    /** biomarkerId -> value used for this point */
    inputs: Record<string, number>
}

/**
 * Compute the full time series for a formula by aligning the referenced
 * biomarkers on each test date. A point is produced only for dates where
 * every referenced biomarker has a numeric value.
 */
export const computeFormulaSeries = (
    formula: Formula,
    records: BiomarkerRecord[],
    documents: UploadedDocument[],
): FormulaSeriesPoint[] => {
    if (formula.variables.length === 0) return []

    const biomarkerIds = new Set(formula.variables.map(v => v.biomarkerId))

    // For each biomarker: dayKey -> { value, timestamp } (keep latest per day).
    const perBiomarker = new Map<string, Map<string, { value: number, timestamp: number }>>()
    const dayTimestamps = new Map<string, number>()

    for (const record of records) {
        if (!record.approved) continue
        if (record.value === undefined || !Number.isFinite(record.value)) continue
        if (!biomarkerIds.has(record.biomarkerId)) continue

        const timestamp = getRecordTimestamp(record, documents)
        const dayKey = toDayKey(timestamp)

        if (!perBiomarker.has(record.biomarkerId)) {
            perBiomarker.set(record.biomarkerId, new Map())
        }
        const dayMap = perBiomarker.get(record.biomarkerId) as Map<string, { value: number, timestamp: number }>
        const existing = dayMap.get(dayKey)
        if (existing === undefined || timestamp >= existing.timestamp) {
            dayMap.set(dayKey, {
                value: record.value,
                timestamp,
            })
        }
        const existingDayTimestamp = dayTimestamps.get(dayKey)
        if (existingDayTimestamp === undefined || timestamp > existingDayTimestamp) {
            dayTimestamps.set(dayKey, timestamp)
        }
    }

    const points: FormulaSeriesPoint[] = []

    for (const [dayKey, timestamp] of dayTimestamps) {
        const inputs: Record<string, number> = {}
        let hasAll = true
        for (const biomarkerId of biomarkerIds) {
            const entry = perBiomarker.get(biomarkerId)?.get(dayKey)
            if (entry === undefined) {
                hasAll = false
                break
            }
            inputs[biomarkerId] = entry.value
        }
        if (!hasAll) continue

        const values = buildValueMap(formula.variables, inputs)
        const result = evaluateExpression(formula.expression, values)
        if (result.value === undefined) continue

        points.push({
            date: new Date(timestamp).toLocaleDateString(),
            timestamp,
            value: result.value,
            inputs,
        })
    }

    points.sort((a, b) => a.timestamp - b.timestamp)
    return points
}

/**
 * The latest numeric value recorded for a biomarker (by test date),
 * used for the builder's live preview.
 */
export const getLatestBiomarkerValue = (
    biomarkerId: string,
    records: BiomarkerRecord[],
    documents: UploadedDocument[],
): number | undefined => {
    let best: { value: number, timestamp: number } | undefined
    for (const record of records) {
        if (!record.approved) continue
        if (record.biomarkerId !== biomarkerId) continue
        if (record.value === undefined || !Number.isFinite(record.value)) continue
        const timestamp = getRecordTimestamp(record, documents)
        if (best === undefined || timestamp >= best.timestamp) {
            best = {
                value: record.value,
                timestamp,
            }
        }
    }
    return best?.value
}

/**
 * Evaluate a formula against the latest available value of each biomarker,
 * regardless of whether their dates align. Used for the live preview.
 */
export const previewFormula = (
    expression: string,
    variables: FormulaVariable[],
    records: BiomarkerRecord[],
    documents: UploadedDocument[],
): FormulaEvalResult => {
    const values: Record<string, number | undefined> = {}
    for (const variable of variables) {
        values[variable.key] = getLatestBiomarkerValue(variable.biomarkerId, records, documents)
    }
    return evaluateExpression(expression, values)
}

/**
 * Render an expression with `{key}` tokens replaced by human-readable
 * biomarker names, for display in tables and detail views.
 */
export const renderReadableExpression = (
    formula: Formula,
    nameByBiomarkerId: (biomarkerId: string) => string,
): string => {
    const nameByKey = new Map<string, string>()
    for (const variable of formula.variables) {
        nameByKey.set(variable.key, nameByBiomarkerId(variable.biomarkerId))
    }
    return formula.expression.replace(/\{([^}]*)\}/g, (_match, rawKey: string) => {
        const key = rawKey.trim()
        const name = nameByKey.get(key)
        return name ?? `{${key}}`
    })
}

/** Generate a safe, unique variable key from a biomarker name. */
export const generateVariableKey = (name: string, existingKeys: string[]): string => {
    const base = name
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '_')
        .replace(/^_+|_+$/g, '')
    const safeBase = base.length > 0 ? base : 'v'
    if (!existingKeys.includes(safeBase)) return safeBase
    let index = 2
    while (existingKeys.includes(`${safeBase}_${index}`)) index += 1
    return `${safeBase}_${index}`
}

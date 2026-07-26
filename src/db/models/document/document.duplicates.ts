import { BiomarkerConfig } from '@/db/models/biomarkerConfig'
import { BiomarkerRecord } from '@/db/models/biomarkerRecord'

import { UploadedDocument } from './document.types'

export type DuplicateReason = 'exact-file' | 'same-analysis'

interface AnalysisRecordLike {
    biomarkerName?: string
    value?: number
    textValue?: string
    ucumCode?: string
}

export interface DuplicateSignals {
    fileHash?: string
    testDate?: Date | string
    analysisSignature?: string
}

const normalizeText = (value?: string | null): string => {
    return value?.trim().toLowerCase() ?? ''
}

const normalizeValue = (value?: number): string => {
    return value === undefined ? '' : `${value}`
}

export const getDuplicateReasonLabel = (reason: DuplicateReason): string => {
    return reason === 'exact-file' ? 'Same file' : 'Same analysis'
}

export const normalizeDateKey = (value?: Date | string): string | null => {
    if (!value) {
        return null
    }

    const date = value instanceof Date ? value : new Date(value)

    if (Number.isNaN(date.getTime())) {
        return null
    }

    return date.toISOString().split('T')[0]
}

export const buildBiomarkerNameMap = (configs: BiomarkerConfig[]): Map<string, string> => {
    return new Map(configs.map(config => [config.id, config.name]))
}

export const createAnalysisRecordKey = (record: AnalysisRecordLike): string | null => {
    const biomarkerName = normalizeText(record.biomarkerName)
    const ucumCode = normalizeText(record.ucumCode)
    const valueKey = record.textValue !== undefined
        ? `text:${normalizeText(record.textValue)}`
        : `value:${normalizeValue(record.value)}`

    if (!biomarkerName || (!record.textValue && record.value === undefined)) {
        return null
    }

    return `${biomarkerName}|${ucumCode}|${valueKey}`
}

export const createAnalysisSignature = (records: AnalysisRecordLike[]): string => {
    return records
        .map(createAnalysisRecordKey)
        .filter((key): key is string => key !== null)
        .sort()
        .join('\n')
}

export const createAnalysisSignatureFromRecords = (
    records: BiomarkerRecord[],
    biomarkerNamesById: Map<string, string>,
): string => {
    return createAnalysisSignature(records.map(record => ({
        biomarkerName: biomarkerNamesById.get(record.biomarkerId) ?? record.originalName,
        value: record.value,
        textValue: record.textValue,
        ucumCode: record.ucumCode,
    })))
}

export const sha256Hex = async (input: ArrayBuffer): Promise<string> => {
    const digest = await crypto.subtle.digest('SHA-256', input.slice(0))
    const bytes = new Uint8Array(digest)

    return Array.from(bytes)
        .map(byte => byte.toString(16).padStart(2, '0'))
        .join('')
}

export const getDocumentFileHash = async (document: Pick<UploadedDocument, 'fileHash' | 'fileData'>): Promise<string | undefined> => {
    if (document.fileHash) {
        return document.fileHash
    }

    if (!document.fileData) {
        return undefined
    }

    return await sha256Hex(document.fileData)
}

/**
 * Compares an incoming upload against an existing document and returns the
 * reasons they are duplicates:
 * - `exact-file`: byte-identical files (matching SHA-256 hash) — a guaranteed duplicate.
 * - `same-analysis`: same test date and the same normalized biomarker signature,
 *   even when the underlying files differ.
 */
export const getDuplicateReasons = (upload: DuplicateSignals, existing: DuplicateSignals): DuplicateReason[] => {
    const reasons: DuplicateReason[] = []

    if (upload.fileHash && existing.fileHash && upload.fileHash === existing.fileHash) {
        reasons.push('exact-file')
    }

    const uploadDateKey = normalizeDateKey(upload.testDate)
    const existingDateKey = normalizeDateKey(existing.testDate)

    if (
        uploadDateKey &&
        existingDateKey &&
        uploadDateKey === existingDateKey &&
        upload.analysisSignature &&
        existing.analysisSignature &&
        upload.analysisSignature === existing.analysisSignature
    ) {
        reasons.push('same-analysis')
    }

    return reasons
}

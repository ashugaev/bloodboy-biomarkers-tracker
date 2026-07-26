import { describe, expect, it } from 'vitest'

import { createAnalysisSignature, createAnalysisSignatureFromRecords, getDuplicateReasons } from './document.duplicates'

describe('document duplicate helpers', () => {
    it('creates stable analysis signatures independent of record order', () => {
        const firstSignature = createAnalysisSignature([
            {
                biomarkerName: 'Glucose',
                value: 5.1,
                ucumCode: 'mmol/L',
            },
            {
                biomarkerName: 'TSH',
                value: 1.8,
                ucumCode: 'm[IU]/L',
            },
        ])

        const secondSignature = createAnalysisSignature([
            {
                biomarkerName: 'TSH',
                value: 1.8,
                ucumCode: 'm[IU]/L',
            },
            {
                biomarkerName: 'Glucose',
                value: 5.1,
                ucumCode: 'mmol/L',
            },
        ])

        expect(firstSignature).toBe(secondSignature)
    })

    it('uses biomarker ids to build signatures from stored records', () => {
        const signature = createAnalysisSignatureFromRecords([
            {
                id: 'record-1',
                userId: 'user-1',
                biomarkerId: 'config-1',
                ucumCode: 'mmol/L',
                value: 5.1,
                approved: true,
                latest: true,
                createdAt: new Date('2026-01-01'),
                updatedAt: new Date('2026-01-01'),
            },
        ], new Map([['config-1', 'Glucose']]))

        expect(signature).toContain('glucose|mmol/l|value:5.1')
    })

    it('flags byte-identical files as exact-file duplicates', () => {
        const reasons = getDuplicateReasons(
            {
                fileHash: 'abc',
                testDate: new Date('2026-04-01'),
                analysisSignature: 'sig-a',
            },
            {
                fileHash: 'abc',
                testDate: new Date('2026-04-10'),
                analysisSignature: 'sig-b',
            },
        )

        expect(reasons).toEqual(['exact-file'])
    })

    it('flags different files with the same date and analysis as same-analysis duplicates', () => {
        const reasons = getDuplicateReasons(
            {
                fileHash: 'file-1',
                testDate: new Date('2026-04-01T09:00:00Z'),
                analysisSignature: 'sig-a',
            },
            {
                fileHash: 'file-2',
                testDate: new Date('2026-04-01T18:00:00Z'),
                analysisSignature: 'sig-a',
            },
        )

        expect(reasons).toEqual(['same-analysis'])
    })

    it('does not flag same analysis on different dates', () => {
        const reasons = getDuplicateReasons(
            {
                fileHash: 'file-1',
                testDate: new Date('2026-04-01'),
                analysisSignature: 'sig-a',
            },
            {
                fileHash: 'file-2',
                testDate: new Date('2026-04-02'),
                analysisSignature: 'sig-a',
            },
        )

        expect(reasons).toEqual([])
    })

    it('does not flag empty analysis signatures as duplicates', () => {
        const reasons = getDuplicateReasons(
            {
                testDate: new Date('2026-04-01'),
                analysisSignature: '',
            },
            {
                testDate: new Date('2026-04-01'),
                analysisSignature: '',
            },
        )

        expect(reasons).toEqual([])
    })

    it('reports both reasons when a file is identical and shares the analysis', () => {
        const reasons = getDuplicateReasons(
            {
                fileHash: 'same',
                testDate: new Date('2026-04-01'),
                analysisSignature: 'sig-a',
            },
            {
                fileHash: 'same',
                testDate: new Date('2026-04-01'),
                analysisSignature: 'sig-a',
            },
        )

        expect(reasons).toEqual(['exact-file', 'same-analysis'])
    })
})

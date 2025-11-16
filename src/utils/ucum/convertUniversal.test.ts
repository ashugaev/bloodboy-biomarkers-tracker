import { describe, expect, it } from 'vitest'

import { convertUniversal, ConversionConfig } from '@/utils/ucum/convertUniversal'
import { verifiedConversionsConfig } from '@/utils/ucum/verifiedConversions.config'

describe('convertUniversal', () => {
    describe('Verified conversions from config', () => {
        const config = verifiedConversionsConfig

        for (const verifiedConversion of config.verifiedConversions) {
            const firstSourceUnit = verifiedConversion.sourceUnits[0]
            const firstTargetUnit = verifiedConversion.targetUnits[0]
            describe(`${verifiedConversion.biomarkerName}: ${firstSourceUnit} → ${firstTargetUnit}`, () => {
                for (const testCase of verifiedConversion.testCases) {
                    for (const sourceUnit of verifiedConversion.sourceUnits) {
                        for (const targetUnit of verifiedConversion.targetUnits) {
                            it(`should convert ${testCase.value} ${sourceUnit} to ${testCase.expectedValue} ${targetUnit} using ${verifiedConversion.expectedMethod}`, () => {
                                const conversionConfig: ConversionConfig = {
                                    biomarkerName: verifiedConversion.biomarkerName,
                                }

                                const result = convertUniversal(
                                    testCase.value,
                                    sourceUnit,
                                    targetUnit,
                                    conversionConfig,
                                )

                                expect(result.method).toBe(verifiedConversion.expectedMethod)
                                const tolerance = 0.01
                                expect(Math.abs(result.value - testCase.expectedValue)).toBeLessThanOrEqual(tolerance)
                                expect(result.error).toBeUndefined()
                            })
                        }
                    }
                }
            })
        }
    })

    describe('Same unit conversion', () => {
        it('should return same value when units are identical', () => {
            const result = convertUniversal(100, 'mg/dL', 'mg/dL')
            expect(result.method).toBe('ucum')
            expect(result.value).toBe(100)
            expect(result.error).toBeUndefined()
        })
    })

    describe('Failed conversions', () => {
        it('should fail when molecular weight is required but not provided', () => {
            const result = convertUniversal(10, 'mg/dL', 'mmol/L', {
                biomarkerName: 'UnknownBiomarker',
            })
            expect(result.method).toBe('failed')
            expect(result.error).toBeDefined()
            expect(Number.isNaN(result.value)).toBe(true)
        })

        it('should fail when conversion factor is required but not provided', () => {
            const result = convertUniversal(10, 'ng/mL', 'mIU/L', {
                biomarkerName: 'UnknownBiomarker',
            })
            expect(result.method).toBe('failed')
            expect(result.error).toBeDefined()
            expect(Number.isNaN(result.value)).toBe(true)
        })

        it('should fail when conversion is not possible', () => {
            const result = convertUniversal(10, 'invalid-unit', 'another-invalid-unit')
            expect(result.method).toBe('failed')
            expect(result.error).toBeDefined()
            expect(Number.isNaN(result.value)).toBe(true)
        })
    })

    describe('Molecular weight conversions with provided weight', () => {
        it('should convert using provided molecular weight', () => {
            const result = convertUniversal(10, 'mg/dL', 'mmol/L', {
                biomarkerName: 'Calcium',
                molecularWeight: 40.08,
            })
            expect(result.method).toBe('molecular-weight')
            expect(result.value).toBeCloseTo(2.5, 2)
        })
    })

    describe('Conversion factor conversions with provided factor', () => {
        it('should convert using provided conversion factor for mass to IU', () => {
            const result = convertUniversal(5, 'ng/mL', 'mIU/L', {
                biomarkerName: 'Testosterone',
                conversionFactor: 0.0347,
            })
            expect(result.method).toBe('conversion-factor')
            expect(result.value).toBeCloseTo(0.1735, 4)
        })
    })
})

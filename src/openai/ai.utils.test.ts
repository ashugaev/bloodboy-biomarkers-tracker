import { describe, expect, it } from 'vitest'

import { getAiModel, getAiProvider } from './ai.types'
import { extractJsonText, isInvalidApiKeyError, parseImageDataUrl } from './ai.utils'

const baseSettings = {
    id: 'main',
    openaiApiKey: '',
    createdAt: new Date(),
    updatedAt: new Date(),
}

describe('ai utils', () => {
    it('parses a base64 image data URL', () => {
        expect(parseImageDataUrl('data:image/png;base64,iVBORw0KGgo=')).toEqual({
            mediaType: 'image/png',
            data: 'iVBORw0KGgo=',
        })
    })

    it('rejects unsupported data URLs', () => {
        expect(() => parseImageDataUrl('data:application/pdf;base64,AAAA')).toThrow('Unsupported image data URL')
        expect(() => parseImageDataUrl('https://example.com/a.png')).toThrow('Unsupported image data URL')
    })

    it('extracts JSON from fenced or prefixed text', () => {
        expect(extractJsonText('```json\n{"biomarkers":[]}\n```')).toBe('{"biomarkers":[]}')
        expect(extractJsonText('Here it is: {"a":{"b":1}} done')).toBe('{"a":{"b":1}}')
        expect(extractJsonText('no json')).toBeNull()
    })

    it('detects invalid API keys across providers', () => {
        expect(isInvalidApiKeyError({ status: 401 })).toBe(true)
        expect(isInvalidApiKeyError({
            status: 400,
            message: '{"error":{"message":"API key not valid. Please pass a valid API key.","status":"INVALID_ARGUMENT"}}',
        })).toBe(true)
        expect(isInvalidApiKeyError({
            status: 400,
            message: 'Invalid image',
        })).toBe(false)
        expect(isInvalidApiKeyError({ status: 500 })).toBe(false)
    })

    it('defaults to OpenAI gpt-6.1-sol', () => {
        expect(getAiProvider(undefined)).toBe('openai')
        expect(getAiModel(undefined, 'openai')).toBe('gpt-6.1-sol')
    })

    it('uses the saved model per provider and falls back to the default', () => {
        const settings = {
            ...baseSettings,
            aiProvider: 'gemini' as const,
            aiModels: {
                gemini: 'gemini-3.8-flash',
                openrouter: '  ',
            },
        }
        expect(getAiProvider(settings)).toBe('gemini')
        expect(getAiModel(settings, 'gemini')).toBe('gemini-3.8-flash')
        expect(getAiModel(settings, 'openrouter')).toBe('openai/gpt-6.1-sol')
        expect(getAiModel(settings, 'anthropic')).toBe('claude-opus-5-5')
    })
})

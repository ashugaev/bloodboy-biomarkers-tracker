import {
    afterEach,
    describe,
    expect,
    it,
    vi,
} from 'vitest'

import { createGeminiJsonCompletion } from './gemini.client'

const IMAGE_DATA_URL = 'data:image/jpeg;base64,/9j/4AAQ'

const mockGemini = (body: Record<string, unknown>, status = 200) => {
    const fetchMock = vi.fn(async (_url: string, _init: RequestInit) => {
        await Promise.resolve()
        return new Response(JSON.stringify(body), {
            status,
            headers: { 'content-type': 'application/json' },
        })
    })
    vi.stubGlobal('fetch', fetchMock)
    return fetchMock
}

const request = {
    systemPrompt: 'system prompt',
    imageDataUrl: IMAGE_DATA_URL,
    userText: 'Extract',
    followUpText: 'fix errors',
    model: 'gemini-4-argon',
}

describe('gemini client', () => {
    afterEach(() => {
        vi.unstubAllGlobals()
    })

    it('sends an inline image with JSON output and medium thinking', async () => {
        const fetchMock = mockGemini({
            candidates: [{
                content: {
                    role: 'model',
                    parts: [{ text: '{"biomarkers":[]}' }],
                },
                finishReason: 'STOP',
            }],
        })

        const result = await createGeminiJsonCompletion('AIza-test', request)

        expect(result).toBe('{"biomarkers":[]}')
        const [url, init] = fetchMock.mock.calls[0]
        expect(String(url)).toContain('generativelanguage.googleapis.com')
        expect(String(url)).toContain('models/gemini-4-argon:generateContent')
        expect(new Headers(init.headers).get('x-goog-api-key')).toBe('AIza-test')
        const body = JSON.parse(String(init.body)) as Record<string, unknown>
        expect(body).toMatchObject({
            contents: [{
                role: 'user',
                parts: [
                    {
                        inlineData: {
                            mimeType: 'image/jpeg',
                            data: '/9j/4AAQ',
                        },
                    },
                    { text: 'Extract' },
                    { text: 'fix errors' },
                ],
            }],
            systemInstruction: { parts: [{ text: 'system prompt' }] },
            generationConfig: {
                responseMimeType: 'application/json',
                thinkingConfig: { thinkingLevel: 'MEDIUM' },
            },
        })
    })

    it('surfaces an invalid key as a 400 error', async () => {
        mockGemini({
            error: {
                code: 400,
                message: 'API key not valid. Please pass a valid API key.',
                status: 'INVALID_ARGUMENT',
            },
        }, 400)

        await expect(createGeminiJsonCompletion('bad', request)).rejects.toMatchObject({ status: 400 })
    })
})

import {
    afterEach,
    describe,
    expect,
    it,
    vi,
} from 'vitest'

import { createOpenAIJsonCompletion, createOpenRouterJsonCompletion } from './openai.client'

const IMAGE_DATA_URL = 'data:image/png;base64,iVBORw0KGgo='

const mockCompletion = (content: string) => {
    const fetchMock = vi.fn(async (_url: string, _init: RequestInit) => {
        await Promise.resolve()
        return new Response(JSON.stringify({
            id: 'chatcmpl-test',
            object: 'chat.completion',
            created: 0,
            model: 'test',
            choices: [{
                index: 0,
                message: {
                    role: 'assistant',
                    content,
                },
                finish_reason: 'stop',
            }],
        }), {
            status: 200,
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
}

describe('openai compatible clients', () => {
    afterEach(() => {
        vi.unstubAllGlobals()
    })

    it('calls OpenAI with medium reasoning effort', async () => {
        const fetchMock = mockCompletion('{"biomarkers":[]}')

        const result = await createOpenAIJsonCompletion('sk-test', {
            ...request,
            model: 'gpt-6.1-sol',
        })

        expect(result).toBe('{"biomarkers":[]}')
        const [url, init] = fetchMock.mock.calls[0]
        expect(String(url)).toBe('https://api.openai.com/v1/chat/completions')
        const body = JSON.parse(String(init.body)) as Record<string, unknown>
        expect(body).toMatchObject({
            model: 'gpt-6.1-sol',
            reasoning_effort: 'medium',
            response_format: { type: 'json_object' },
        })
        expect(body).not.toHaveProperty('temperature')
    })

    it('calls OpenRouter with nested reasoning and attribution headers', async () => {
        vi.stubGlobal('window', { location: { origin: 'https://bloodboy.report' } })
        const fetchMock = mockCompletion('```json\n{"biomarkers":[]}\n```')

        const result = await createOpenRouterJsonCompletion('sk-or-test', {
            ...request,
            model: 'anthropic/claude-opus-5.5',
        })

        expect(result).toBe('{"biomarkers":[]}')
        const [url, init] = fetchMock.mock.calls[0]
        expect(String(url)).toBe('https://openrouter.ai/api/v1/chat/completions')
        const headers = new Headers(init.headers)
        expect(headers.get('authorization')).toBe('Bearer sk-or-test')
        expect(headers.get('http-referer')).toBe('https://bloodboy.report')
        expect(headers.get('x-openrouter-title')).toBe('Bloodboy')
        const body = JSON.parse(String(init.body)) as Record<string, unknown>
        expect(body).toMatchObject({
            model: 'anthropic/claude-opus-5.5',
            reasoning: {
                effort: 'medium',
                exclude: true,
            },
        })
        expect(body).not.toHaveProperty('reasoning_effort')
    })
})

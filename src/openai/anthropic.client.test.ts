import {
    afterEach,
    describe,
    expect,
    it,
    vi,
} from 'vitest'

import { createAnthropicJsonCompletion, extractJsonText, parseImageDataUrl } from './anthropic.client'

const IMAGE_DATA_URL = 'data:image/png;base64,iVBORw0KGgo='

const mockMessagesResponse = (body: Record<string, unknown>, status = 200) => {
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

const messageBody = (text: string, stopReason = 'end_turn') => ({
    id: 'msg_test',
    type: 'message',
    role: 'assistant',
    model: 'claude-opus-5-5',
    content: [{
        type: 'text',
        text,
    }],
    stop_reason: stopReason,
    stop_sequence: null,
    usage: {
        input_tokens: 1,
        output_tokens: 1,
    },
})

describe('anthropic client', () => {
    afterEach(() => {
        vi.unstubAllGlobals()
    })

    it('parses a base64 image data URL', () => {
        expect(parseImageDataUrl(IMAGE_DATA_URL)).toEqual({
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

    it('sends a browser-safe vision request and returns the JSON text', async () => {
        const fetchMock = mockMessagesResponse(messageBody('```json\n{"biomarkers":[]}\n```'))

        const result = await createAnthropicJsonCompletion('sk-ant-test', {
            systemPrompt: 'system prompt',
            imageDataUrl: IMAGE_DATA_URL,
            userText: 'Extract biomarkers from this image.',
            followUpText: 'fix errors',
        })

        expect(result).toBe('{"biomarkers":[]}')
        expect(fetchMock).toHaveBeenCalledTimes(1)

        const [url, init] = fetchMock.mock.calls[0]
        expect(String(url)).toBe('https://api.anthropic.com/v1/messages')

        const headers = new Headers(init.headers)
        expect(headers.get('authorization')).toBe('Bearer sk-ant-test')
        expect(headers.get('anthropic-dangerous-direct-browser-access')).toBe('true')
        expect(headers.get('anthropic-beta')).toBe('server-side-fallback-2026-07-01')

        const body = JSON.parse(String(init.body)) as Record<string, unknown>
        expect(body).toMatchObject({
            model: 'claude-opus-5-5',
            max_tokens: 16000,
            fallbacks: 'default',
            output_config: { effort: 'low' },
            system: 'system prompt',
            messages: [{
                role: 'user',
                content: [
                    {
                        type: 'image',
                        source: {
                            type: 'base64',
                            media_type: 'image/png',
                            data: 'iVBORw0KGgo=',
                        },
                    },
                    {
                        type: 'text',
                        text: 'Extract biomarkers from this image.',
                    },
                    {
                        type: 'text',
                        text: 'fix errors',
                    },
                ],
            }],
        })
        expect(body).not.toHaveProperty('betas')
    })

    it('throws on refusal', async () => {
        mockMessagesResponse(messageBody('', 'refusal'))

        await expect(createAnthropicJsonCompletion('sk-ant-test', {
            systemPrompt: 'system prompt',
            imageDataUrl: IMAGE_DATA_URL,
            userText: 'Extract',
        })).rejects.toThrow('Claude declined to process this page')
    })

    it('surfaces 401 status for invalid keys', async () => {
        mockMessagesResponse({
            type: 'error',
            error: {
                type: 'authentication_error',
                message: 'invalid x-api-key',
            },
        }, 401)

        await expect(createAnthropicJsonCompletion('bad', {
            systemPrompt: 'system prompt',
            imageDataUrl: IMAGE_DATA_URL,
            userText: 'Extract',
        })).rejects.toMatchObject({ status: 401 })
    })
})

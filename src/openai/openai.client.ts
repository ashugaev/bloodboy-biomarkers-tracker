import OpenAI from 'openai'
import { ChatCompletionMessageParam } from 'openai/resources'

import { AI_REASONING_EFFORT, ResolvedVisionJsonRequest } from './ai.types'
import { extractJsonText } from './ai.utils'

const OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1'

const buildMessages = (request: ResolvedVisionJsonRequest): ChatCompletionMessageParam[] => {
    const messages: ChatCompletionMessageParam[] = [
        {
            role: 'system',
            content: request.systemPrompt,
        },
        {
            role: 'user',
            content: [
                {
                    type: 'text',
                    text: request.userText,
                },
                {
                    type: 'image_url',
                    image_url: {
                        url: request.imageDataUrl,
                    },
                },
            ],
        },
    ]

    if (request.followUpText) {
        messages.push({
            role: 'user',
            content: [
                {
                    type: 'text',
                    text: request.followUpText,
                },
            ],
        })
    }

    return messages
}

export const createOpenAIJsonCompletion = async (apiKey: string, request: ResolvedVisionJsonRequest): Promise<string | null> => {
    const client = new OpenAI({
        apiKey,
        dangerouslyAllowBrowser: true,
    })

    const completion = await client.chat.completions.create({
        model: request.model,
        messages: buildMessages(request),
        reasoning_effort: AI_REASONING_EFFORT,
        response_format: { type: 'json_object' },
        stream: false,
    })

    return completion.choices[0]?.message.content ?? null
}

// OpenRouter speaks the Chat Completions API but takes reasoning as a nested object
export const createOpenRouterJsonCompletion = async (apiKey: string, request: ResolvedVisionJsonRequest): Promise<string | null> => {
    const client = new OpenAI({
        apiKey,
        baseURL: OPENROUTER_BASE_URL,
        dangerouslyAllowBrowser: true,
        defaultHeaders: {
            'HTTP-Referer': window.location.origin,
            'X-OpenRouter-Title': 'Bloodboy',
        },
    })

    const params: OpenAI.ChatCompletionCreateParamsNonStreaming & { reasoning: { effort: string, exclude: boolean } } = {
        model: request.model,
        messages: buildMessages(request),
        reasoning: {
            effort: AI_REASONING_EFFORT,
            exclude: true,
        },
        response_format: { type: 'json_object' },
        stream: false,
    }
    const completion = await client.chat.completions.create(params)

    const content = completion.choices[0]?.message.content
    return content ? extractJsonText(content) : null
}

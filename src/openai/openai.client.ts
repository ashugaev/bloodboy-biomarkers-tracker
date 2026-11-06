import OpenAI from 'openai'
import { ChatCompletionMessageParam } from 'openai/resources'

import { AI_PROVIDERS, VisionJsonRequest } from './ai.types'

export const createOpenAIJsonCompletion = async (apiKey: string, request: VisionJsonRequest): Promise<string | null> => {
    const client = new OpenAI({
        apiKey,
        dangerouslyAllowBrowser: true,
    })

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

    const completion = await client.chat.completions.create({
        model: request.model ?? AI_PROVIDERS.openai.defaultModel,
        messages,
        reasoning_effort: 'medium',
        response_format: { type: 'json_object' },
        stream: false,
    })

    return completion.choices[0]?.message.content ?? null
}

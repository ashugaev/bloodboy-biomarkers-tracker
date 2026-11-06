import Anthropic from '@anthropic-ai/sdk'

import { AI_REASONING_EFFORT, ResolvedVisionJsonRequest } from './ai.types'
import { extractJsonText, parseImageDataUrl } from './ai.utils'

export const createAnthropicJsonCompletion = async (apiKey: string, request: ResolvedVisionJsonRequest): Promise<string | null> => {
    const client = new Anthropic({
        apiKey,
        dangerouslyAllowBrowser: true,
    })

    const image = parseImageDataUrl(request.imageDataUrl)

    const content: Anthropic.Beta.BetaContentBlockParam[] = [
        {
            type: 'image',
            source: {
                type: 'base64',
                media_type: image.mediaType,
                data: image.data,
            },
        },
        {
            type: 'text',
            text: request.userText,
        },
    ]

    if (request.followUpText) {
        content.push({
            type: 'text',
            text: request.followUpText,
        })
    }

    const response = await client.beta.messages.create({
        model: request.model,
        max_tokens: 16000,
        betas: ['server-side-fallback-2026-07-01'],
        fallbacks: 'default',
        output_config: { effort: AI_REASONING_EFFORT },
        system: request.systemPrompt,
        messages: [{
            role: 'user',
            content,
        }],
    })

    if (response.stop_reason === 'refusal') {
        throw new Error('Claude declined to process this page')
    }

    const text = response.content
        .filter((block): block is Anthropic.Beta.BetaTextBlock => block.type === 'text')
        .map(block => block.text)
        .join('')

    return extractJsonText(text)
}

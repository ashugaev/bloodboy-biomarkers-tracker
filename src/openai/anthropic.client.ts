import Anthropic from '@anthropic-ai/sdk'

import { AI_PROVIDERS, VisionJsonRequest } from './ai.types'

type ImageMediaType = 'image/png' | 'image/jpeg' | 'image/gif' | 'image/webp'

const IMAGE_MEDIA_TYPES: ImageMediaType[] = ['image/png', 'image/jpeg', 'image/gif', 'image/webp']

export const parseImageDataUrl = (dataUrl: string): { mediaType: ImageMediaType, data: string } => {
    const match = /^data:([^;,]+);base64,(.+)$/s.exec(dataUrl)
    const mediaType = match?.[1] as ImageMediaType | undefined
    if (!match || !mediaType || !IMAGE_MEDIA_TYPES.includes(mediaType)) {
        throw new Error('Unsupported image data URL')
    }

    return {
        mediaType,
        data: match[2],
    }
}

// Reply is free text: strip code fences or prose around the JSON object
export const extractJsonText = (text: string): string | null => {
    const start = text.indexOf('{')
    const end = text.lastIndexOf('}')
    if (start === -1 || end < start) return null

    return text.slice(start, end + 1)
}

export const createAnthropicJsonCompletion = async (apiKey: string, request: VisionJsonRequest): Promise<string | null> => {
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
        model: request.model ?? AI_PROVIDERS.anthropic.defaultModel,
        max_tokens: 16000,
        betas: ['server-side-fallback-2026-07-01'],
        fallbacks: 'default',
        output_config: { effort: 'low' },
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

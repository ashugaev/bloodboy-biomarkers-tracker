import { GoogleGenAI, Part, ThinkingLevel } from '@google/genai'

import { ResolvedVisionJsonRequest } from './ai.types'
import { extractJsonText, parseImageDataUrl } from './ai.utils'

export const createGeminiJsonCompletion = async (apiKey: string, request: ResolvedVisionJsonRequest): Promise<string | null> => {
    const ai = new GoogleGenAI({ apiKey })
    const image = parseImageDataUrl(request.imageDataUrl)

    const parts: Part[] = [
        {
            inlineData: {
                mimeType: image.mediaType,
                data: image.data,
            },
        },
        { text: request.userText },
    ]

    if (request.followUpText) {
        parts.push({ text: request.followUpText })
    }

    const response = await ai.models.generateContent({
        model: request.model,
        contents: [{
            role: 'user',
            parts,
        }],
        config: {
            systemInstruction: request.systemPrompt,
            responseMimeType: 'application/json',
            thinkingConfig: { thinkingLevel: ThinkingLevel.MEDIUM },
        },
    })

    return response.text ? extractJsonText(response.text) : null
}

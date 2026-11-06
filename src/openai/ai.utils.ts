export type ImageMediaType = 'image/png' | 'image/jpeg' | 'image/gif' | 'image/webp'

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

// Gemini reports a bad key as 400 API_KEY_INVALID, the others as 401
export const isInvalidApiKeyError = (error: { status?: number, message?: string }) => (
    error.status === 401 ||
    (error.status === 400 && /API_KEY_INVALID|API key not valid/i.test(error.message ?? ''))
)

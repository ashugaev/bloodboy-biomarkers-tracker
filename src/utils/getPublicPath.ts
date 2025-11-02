import { config } from '@/config'

export const getPublicPath = (path: string): string => {
    const base = config.baseUrl
    return `${base}${path}`.replace(/\/+/g, '/')
}

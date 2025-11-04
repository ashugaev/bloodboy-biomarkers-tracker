import { config } from '@/config'

export const reloadApp = () => {
    const baseUrl = config.baseUrl || '/'
    const rootUrl = `${window.location.origin}${baseUrl}`
    window.location.replace(rootUrl)
}


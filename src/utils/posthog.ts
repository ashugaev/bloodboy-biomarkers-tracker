import { usePostHog } from 'posthog-js/react'

export const usePostHogCapture = () => {
    const posthog = usePostHog()
    return posthog
}

export const captureEvent = (posthog: ReturnType<typeof usePostHogCapture> | null, eventName: string, properties?: Record<string, unknown>) => {
    if (posthog) {
        posthog.capture(eventName, properties)
    }
}

export const captureException = (posthog: ReturnType<typeof usePostHogCapture> | null, error: Error, context?: Record<string, unknown>) => {
    if (posthog && typeof posthog.captureException === 'function') {
        posthog.captureException(error, context)
    } else if (posthog) {
        posthog.capture('exception', {
            name: error.name,
            type: error.constructor.name,
            ...context,
        })
    }
}

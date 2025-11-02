export const config = {
    posthogHost: import.meta.env.VITE_PUBLIC_POSTHOG_HOST,
    posthogKey: import.meta.env.VITE_PUBLIC_POSTHOG_KEY,
    baseUrl: import.meta.env.BASE_URL,
} as const

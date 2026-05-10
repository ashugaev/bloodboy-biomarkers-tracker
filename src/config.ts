export const config = {
    posthogHost: import.meta.env.VITE_PUBLIC_POSTHOG_HOST,
    posthogKey: import.meta.env.VITE_PUBLIC_POSTHOG_KEY,
    googleClientId: import.meta.env.VITE_PUBLIC_GOOGLE_CLIENT_ID,
    baseUrl: import.meta.env.BASE_URL,
} as const

/// <reference types="vite/client" />
/// <reference types="vite-plugin-svgr/client" />

interface ImportMetaEnv {
    readonly VITE_PUBLIC_POSTHOG_KEY?: string
    readonly VITE_PUBLIC_POSTHOG_HOST?: string
    readonly VITE_PUBLIC_GOOGLE_CLIENT_ID?: string
}

interface ImportMeta {
    readonly env: ImportMetaEnv
}

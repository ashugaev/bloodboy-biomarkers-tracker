export interface ExtractionErrorModalProps {
    open: boolean
    failedPages: number[]
    onRetry: () => void
    onCancel: () => void
    retrying: boolean
}

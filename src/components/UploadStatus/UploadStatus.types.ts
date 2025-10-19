export enum UploadStage {
    UPLOADING = 'uploading',
    PARSING = 'parsing',
    EXTRACTING = 'extracting',
}

export interface UploadStatusProps {
    stage: UploadStage
    currentPage?: number
    totalPages?: number
    className?: string
}

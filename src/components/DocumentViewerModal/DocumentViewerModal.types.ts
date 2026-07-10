import { UploadedDocument } from '@/db/models/document'

export interface DocumentViewerModalProps {
    document: UploadedDocument | null
    onClose: () => void
}

import { UploadedDocument } from '@/db/models/document'

export interface DocumentConfirmationProps {
    document: UploadedDocument
    className?: string
}

import { UploadedDocument } from '@/db/models/document'

export interface FileRowData extends UploadedDocument {
}

export interface FilesTableProps {
    className?: string
}


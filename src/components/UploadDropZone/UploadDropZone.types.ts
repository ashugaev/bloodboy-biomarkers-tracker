import { ReactNode } from 'react'

import { UploadProps } from 'antd/es/upload/interface'
import { UploadRequestOption } from 'rc-upload/lib/interface'

export type FileFormat = 'pdf' | 'xls' | 'xlsx' | 'doc' | 'docx' | 'csv'

export interface UploadDropZoneProps extends UploadProps {
    formats?: FileFormat[]
    sizeMb?: number
    customRequest: (data: UploadRequestOption) => Promise<void>
    icon?: ReactNode
    title?: string
    button?: boolean
}

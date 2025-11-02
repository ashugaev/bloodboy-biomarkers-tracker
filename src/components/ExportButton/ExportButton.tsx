import { UploadOutlined } from '@ant-design/icons'
import { Button } from 'antd'
import { usePostHog } from 'posthog-js/react'

import { useBiomarkerConfigs } from '@/db/models/biomarkerConfig'
import { useBiomarkerRecords } from '@/db/models/biomarkerRecord'
import { useDocuments } from '@/db/models/document'
import { captureEvent } from '@/utils'
import { exportData } from '@/utils/exportData'

import { ExportButtonProps } from './ExportButton.types'

export const ExportButton = (props: ExportButtonProps) => {
    const { className, onlyApproved = true } = props
    const posthog = usePostHog()
    const { data: configs } = useBiomarkerConfigs({
        filter: onlyApproved ? (c) => c.approved : undefined,
    })
    const { data: records } = useBiomarkerRecords({
        filter: onlyApproved ? (r) => r.approved : undefined,
    })
    const { data: documents } = useDocuments({
        filter: onlyApproved ? (d) => d.approved : undefined,
    })

    const handleExport = () => {
        captureEvent(posthog, 'data_exported', {
            configsCount: configs.length,
            recordsCount: records.length,
            documentsCount: documents.length,
            onlyApproved,
        })
        void exportData({
            configs,
            records,
            documents,
        })
    }

    return (
        <Button
            icon={<UploadOutlined/>}
            onClick={handleExport}
            className={className}
            size='small'
        >
            Export DB
        </Button>
    )
}

import { DownloadOutlined } from '@ant-design/icons'
import { Button } from 'antd'

import { useBiomarkerConfigs } from '@/db/models/biomarkerConfig'
import { useBiomarkerRecords } from '@/db/models/biomarkerRecord'
import { useDocuments } from '@/db/models/document'
import { exportData } from '@/utils/exportData'

import { ExportButtonProps } from './ExportButton.types'

export const ExportButton = (props: ExportButtonProps) => {
    const { className, onlyApproved = true } = props
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
        void exportData({
            configs,
            records,
            documents,
        })
    }

    return (
        <Button
            icon={<DownloadOutlined/>}
            onClick={handleExport}
            className={className}
        >
            Export
        </Button>
    )
}

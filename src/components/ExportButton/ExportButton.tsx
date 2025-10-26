import { DownloadOutlined } from '@ant-design/icons'
import { Button } from 'antd'

import { useBiomarkerConfigs } from '@/db/models/biomarkerConfig'
import { useBiomarkerRecords } from '@/db/models/biomarkerRecord'
import { useDocuments } from '@/db/models/document'
import { useUnits } from '@/db/models/unit'
import { exportToExcel } from '@/utils/exportToExcel'

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
    const { data: units } = useUnits()

    const handleExport = () => {
        exportToExcel({
            configs,
            records,
            documents,
            units,
        })
    }

    return (
        <Button
            type='primary'
            icon={<DownloadOutlined/>}
            onClick={handleExport}
            className={className}
        >
            Export Excel
        </Button>
    )
}

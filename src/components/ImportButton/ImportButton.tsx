import { useRef } from 'react'

import { UploadOutlined } from '@ant-design/icons'
import { Button } from 'antd'

import { useImportData } from '@/utils/importFromExcel'

import { ImportButtonProps } from './ImportButton.types'

export const ImportButton = (props: ImportButtonProps) => {
    const { className } = props
    const fileInputRef = useRef<HTMLInputElement>(null)
    const { existingIds, importFromExcel } = useImportData()

    const handleClick = () => {
        fileInputRef.current?.click()
    }

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0]
        if (file) {
            await importFromExcel(file, existingIds)
            if (fileInputRef.current) {
                fileInputRef.current.value = ''
            }
        }
    }

    return (
        <>
            <input
                ref={fileInputRef}
                type='file'
                accept='.xlsx,.xls'
                style={{ display: 'none' }}
                onChange={(e) => { void handleFileChange(e) }}
            />
            <Button
                icon={<UploadOutlined/>}
                onClick={handleClick}
                className={className}
            >
                Import Excel
            </Button>
        </>
    )
}

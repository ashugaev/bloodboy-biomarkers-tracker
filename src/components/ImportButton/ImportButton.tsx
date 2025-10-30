import { useRef } from 'react'

import { UploadOutlined } from '@ant-design/icons'
import { Button } from 'antd'

import { importData } from '@/utils/importData'

import { ImportButtonProps } from './ImportButton.types'

export const ImportButton = (props: ImportButtonProps) => {
    const { className } = props
    const fileInputRef = useRef<HTMLInputElement>(null)

    const handleClick = () => {
        fileInputRef.current?.click()
    }

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0]
        if (file) {
            await importData(file)
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
                accept='.json'
                style={{ display: 'none' }}
                onChange={(e) => { void handleFileChange(e) }}
            />
            <Button
                size='small'
                icon={<UploadOutlined/>}
                onClick={handleClick}
                className={className}
            >
                Import
            </Button>
        </>
    )
}

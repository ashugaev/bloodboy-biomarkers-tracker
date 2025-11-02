import { useRef, useState } from 'react'

import { DeleteOutlined, DownloadOutlined, MenuOutlined, UploadOutlined } from '@ant-design/icons'
import { Button, Dropdown, Modal, MenuProps } from 'antd'

import { COLORS, DB_NAME } from '@/constants'
import { useBiomarkerConfigs } from '@/db/models/biomarkerConfig'
import { useBiomarkerRecords } from '@/db/models/biomarkerRecord'
import { useDocuments } from '@/db/models/document'
import { exportData } from '@/utils/exportData'
import { importData } from '@/utils/importData'

import { ImportButtonProps } from './ImportButton.types'

export const ImportButton = (props: ImportButtonProps) => {
    const { className, onlyApproved = true } = props
    const fileInputRef = useRef<HTMLInputElement>(null)
    const [isModalVisible, setIsModalVisible] = useState(false)
    const [isResetting, setIsResetting] = useState(false)

    const { data: configs } = useBiomarkerConfigs({
        filter: onlyApproved ? (c) => c.approved : undefined,
    })
    const { data: records } = useBiomarkerRecords({
        filter: onlyApproved ? (r) => r.approved : undefined,
    })
    const { data: documents } = useDocuments({
        filter: onlyApproved ? (d) => d.approved : undefined,
    })

    const handleImportClick = () => {
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

    const handleExport = () => {
        void exportData({
            configs,
            records,
            documents,
        })
    }

    const handleReset = () => {
        setIsResetting(true)
        const deleteRequest = indexedDB.deleteDatabase(DB_NAME)

        deleteRequest.onsuccess = () => {
            localStorage.clear()
            sessionStorage.clear()
            window.location.reload()
        }

        deleteRequest.onerror = (error) => {
            console.error('Failed to reset database:', error)
            setIsResetting(false)
        }

        deleteRequest.onblocked = () => {
            console.warn('Database deletion blocked. Closing connections...')
            window.location.reload()
        }
    }

    const items: MenuProps['items'] = [
        {
            key: 'import',
            label: 'Import DB',
            icon: <DownloadOutlined/>,
            onClick: handleImportClick,
        },
        {
            key: 'export',
            label: 'Export DB',
            icon: <UploadOutlined/>,
            onClick: handleExport,
        },
        {
            type: 'divider',
        },
        {
            key: 'reset',
            label: 'Clear DB',
            icon: <DeleteOutlined/>,
            danger: true,
            onClick: () => { setIsModalVisible(true) },
        },
    ]

    return (
        <>
            <input
                ref={fileInputRef}
                type='file'
                accept='.json'
                style={{ display: 'none' }}
                onChange={(e) => { void handleFileChange(e) }}
            />
            <Dropdown menu={{ items }} trigger={['click']}>
                <Button
                    size='small'
                    icon={<MenuOutlined/>}
                    className={className}
                />
            </Dropdown>
            <Modal
                title='Clear All Data'
                open={isModalVisible}
                onOk={handleReset}
                onCancel={() => { setIsModalVisible(false) }}
                okText='Yes, Delete Everything'
                cancelText='Cancel'
                okButtonProps={{
                    danger: true,
                    loading: isResetting,
                    style: { backgroundColor: COLORS.ERROR },
                }}
                closable={!isResetting}
                maskClosable={!isResetting}
            >
                <p>Are you sure you want to delete all your data?</p>
                <p>This will permanently remove:</p>
                <ul
                    style={{
                        marginLeft: '20px',
                        marginTop: '8px',
                        marginBottom: '12px',
                    }}
                >
                    <li>🩸 All biomarker records</li>
                    <li>📄 All uploaded documents</li>
                    <li>⚙️ All custom configurations</li>
                </ul>
            </Modal>
        </>
    )
}

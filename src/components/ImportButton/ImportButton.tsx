import { useRef, useState } from 'react'

import { DeleteOutlined, DownloadOutlined, MenuOutlined, UploadOutlined } from '@ant-design/icons'
import { Button, Checkbox, Dropdown, Modal, MenuProps, message } from 'antd'
import { usePostHog } from 'posthog-js/react'

import { COLORS, DB_NAME, PRESERVED_OPENAI_TOKEN_KEY } from '@/constants'
import { useAppSettings } from '@/db/models/appSettings'
import { useBiomarkerConfigs } from '@/db/models/biomarkerConfig'
import { useBiomarkerRecords } from '@/db/models/biomarkerRecord'
import { useDocuments } from '@/db/models/document'
import { captureEvent } from '@/utils'
import { exportData } from '@/utils/exportData'
import { importData } from '@/utils/importData'
import { reloadApp } from '@/utils/reloadApp'

import { ImportButtonProps } from './ImportButton.types'

export const ImportButton = (props: ImportButtonProps) => {
    const { className, onlyApproved = true } = props
    const posthog = usePostHog()
    const fileInputRef = useRef<HTMLInputElement>(null)
    const [isModalVisible, setIsModalVisible] = useState(false)
    const [isImportModalVisible, setIsImportModalVisible] = useState(false)
    const [isResetting, setIsResetting] = useState(false)
    const [preserveToken, setPreserveToken] = useState(true)
    const [pendingFile, setPendingFile] = useState<File | null>(null)

    const { data: configs } = useBiomarkerConfigs({
        filter: onlyApproved ? (c) => c.approved : undefined,
    })
    const { data: records } = useBiomarkerRecords({
        filter: onlyApproved ? (r) => r.approved : undefined,
    })
    const { data: documents } = useDocuments({
        filter: onlyApproved ? (d) => d.approved : undefined,
    })
    const { data: settings } = useAppSettings()

    const handleImportClick = () => {
        fileInputRef.current?.click()
    }

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0]
        if (file) {
            setPendingFile(file)
            setIsImportModalVisible(true)
        }
        if (fileInputRef.current) {
            fileInputRef.current.value = ''
        }
    }

    const handleImportConfirm = async () => {
        if (!pendingFile) return

        setIsImportModalVisible(false)
        captureEvent(posthog, 'data_import_started', {
            fileSize: pendingFile.size,
        })
        try {
            await importData(pendingFile)
            captureEvent(posthog, 'data_imported', {
                configsCount: configs.length,
                recordsCount: records.length,
                documentsCount: documents.length,
            })
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to import data'
            void message.error(errorMessage)
            captureEvent(posthog, 'data_import_failed', {
                error: error instanceof Error ? error.constructor.name : 'UnknownError',
            })
        }
        setPendingFile(null)
    }

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

    const handleReset = () => {
        captureEvent(posthog, 'database_reset', {
            configsCount: configs.length,
            recordsCount: records.length,
            documentsCount: documents.length,
            preserveToken,
        })

        const currentSettings = settings[0]
        const tokenToPreserve = preserveToken && currentSettings?.openaiApiKey
            ? currentSettings.openaiApiKey
            : null

        if (tokenToPreserve) {
            sessionStorage.setItem(PRESERVED_OPENAI_TOKEN_KEY, tokenToPreserve)
        }

        setIsResetting(true)
        const deleteRequest = indexedDB.deleteDatabase(DB_NAME)

        deleteRequest.onsuccess = () => {
            localStorage.clear()
            if (!tokenToPreserve) {
                sessionStorage.clear()
            } else {
                const preservedToken = sessionStorage.getItem(PRESERVED_OPENAI_TOKEN_KEY)
                sessionStorage.clear()
                if (preservedToken) {
                    sessionStorage.setItem(PRESERVED_OPENAI_TOKEN_KEY, preservedToken)
                }
            }
            reloadApp()
        }

        deleteRequest.onerror = (error) => {
            console.error('Failed to reset database:', error)
            setIsResetting(false)
            if (tokenToPreserve) {
                sessionStorage.removeItem(PRESERVED_OPENAI_TOKEN_KEY)
            }
        }

        deleteRequest.onblocked = () => {
            console.warn('Database deletion blocked. Closing connections...')
            reloadApp()
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
                onChange={handleFileChange}
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
                <Checkbox
                    checked={preserveToken}
                    onChange={(e) => { setPreserveToken(e.target.checked) }}
                    style={{ marginTop: '16px' }}
                >
                    Preserve OpenAI API token
                </Checkbox>
            </Modal>
            <Modal
                title='Import Database'
                open={isImportModalVisible}
                onOk={() => { void handleImportConfirm() }}
                onCancel={() => {
                    setIsImportModalVisible(false)
                    setPendingFile(null)
                }}
                okText='Yes, Import'
                cancelText='Cancel'
                okButtonProps={{
                    danger: true,
                    style: { backgroundColor: COLORS.ERROR },
                }}
            >
                <p>Are you sure you want to import data from the selected file?</p>
                <p>This will permanently replace all existing data:</p>
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
                <p
                    style={{
                        marginTop: '12px',
                        fontWeight: 'bold',
                    }}
                >
                    Current data will be lost!
                </p>
            </Modal>
        </>
    )
}

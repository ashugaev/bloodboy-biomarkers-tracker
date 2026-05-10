import { useRef, useState } from 'react'

import {
    CloudUploadOutlined,
    DeleteOutlined,
    DisconnectOutlined,
    DownloadOutlined,
    MenuOutlined,
    SyncOutlined,
    UploadOutlined,
    WarningFilled,
} from '@ant-design/icons'
import { Button, Checkbox, Dropdown, Modal, MenuProps, Tooltip, message } from 'antd'
import { usePostHog } from 'posthog-js/react'

import { config } from '@/config'
import { COLORS, DB_NAME, PRESERVED_OPENAI_TOKEN_KEY } from '@/constants'
import { useExportStatus } from '@/db'
import { useAppSettings } from '@/db/models/appSettings'
import { useBiomarkerConfigs } from '@/db/models/biomarkerConfig'
import { useBiomarkerRecords } from '@/db/models/biomarkerRecord'
import { useDocuments } from '@/db/models/document'
import {
    disconnectGoogleDriveBackup,
    getGoogleDriveBackupErrorMessage,
    setGoogleDriveAutoSync,
    syncDatabaseWithGoogleDrive,
} from '@/googleDrive'
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
    const [isDriveSyncing, setIsDriveSyncing] = useState(false)
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
    const { hasUnexportedChanges } = useExportStatus()
    const driveSettings = settings[0]?.googleDriveBackup
    const isDriveConnected = driveSettings?.enabled ?? false
    const isGoogleDriveConfigured = !!config.googleClientId
    const driveBackupLabel = !isGoogleDriveConfigured
        ? 'Set Google Client ID'
        : isDriveConnected ? 'Sync Google Drive' : 'Connect Google Drive'
    const unexportedChangesTooltip = isDriveConnected && driveSettings?.autoSync
        ? 'Local changes are waiting for Google Drive auto sync.'
        : 'Don\'t forget to export: you have local changes that are not included in the latest backup yet.'

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

    const handleDriveSync = async () => {
        setIsDriveSyncing(true)
        captureEvent(posthog, 'google_drive_sync_started', {
            connected: isDriveConnected,
            autoSync: driveSettings?.autoSync ?? false,
        })

        try {
            const result = await syncDatabaseWithGoogleDrive({
                prompt: isDriveConnected ? '' : 'consent',
                forceEnable: true,
            })

            if (result.action === 'uploaded' && result.backup) {
                void message.success(`Backup saved to Google Drive: ${result.backup.historyFileName}`)
            } else if (result.action === 'downloaded') {
                void message.success('Newer Google Drive backup restored')
            } else {
                void message.success('Google Drive backup is up to date')
            }

            captureEvent(posthog, 'google_drive_sync_completed', {
                action: result.action,
            })
        } catch (error) {
            const errorMessage = getGoogleDriveBackupErrorMessage(error)
            void message.error(errorMessage)
            captureEvent(posthog, 'google_drive_sync_failed', {
                error: error instanceof Error ? error.constructor.name : 'UnknownError',
            })
        } finally {
            setIsDriveSyncing(false)
        }
    }

    const handleDriveAutoSyncToggle = async () => {
        if (!isDriveConnected) {
            await handleDriveSync()
            return
        }

        const nextAutoSync = !(driveSettings?.autoSync ?? false)
        await setGoogleDriveAutoSync(nextAutoSync)
        void message.success(nextAutoSync ? 'Google Drive auto sync enabled' : 'Google Drive auto sync paused')
        captureEvent(posthog, 'google_drive_auto_sync_toggled', {
            enabled: nextAutoSync,
        })
    }

    const handleDriveDisconnect = async () => {
        await disconnectGoogleDriveBackup()
        void message.success('Google Drive backup disconnected')
        captureEvent(posthog, 'google_drive_backup_disconnected')
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
            key: 'drive-backup',
            label: driveBackupLabel,
            icon: <CloudUploadOutlined/>,
            disabled: isDriveSyncing || !isGoogleDriveConfigured,
            onClick: () => { void handleDriveSync() },
        },
        {
            key: 'drive-auto-sync',
            label: driveSettings?.autoSync ? 'Pause Drive auto sync' : 'Enable Drive auto sync',
            icon: <SyncOutlined/>,
            disabled: isDriveSyncing || !isGoogleDriveConfigured,
            onClick: () => { void handleDriveAutoSyncToggle() },
        },
        {
            key: 'drive-disconnect',
            label: 'Disconnect Google Drive',
            icon: <DisconnectOutlined/>,
            disabled: !isDriveConnected || isDriveSyncing,
            onClick: () => { void handleDriveDisconnect() },
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
            <div className='inline-flex items-center gap-2'>
                {hasUnexportedChanges && (
                    <Tooltip title={unexportedChangesTooltip}>
                        <span className='inline-flex items-center text-base leading-none cursor-help'>
                            <WarningFilled style={{ color: COLORS.WARNING }}/>
                        </span>
                    </Tooltip>
                )}
                {driveSettings?.lastError && (
                    <Tooltip title={driveSettings.lastError}>
                        <span className='inline-flex items-center text-base leading-none cursor-help'>
                            <WarningFilled style={{ color: COLORS.ERROR }}/>
                        </span>
                    </Tooltip>
                )}
                <Dropdown menu={{ items }} trigger={['click']}>
                    <Button
                        size='small'
                        icon={<MenuOutlined/>}
                        loading={isDriveSyncing}
                        className={className}
                    />
                </Dropdown>
            </div>
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

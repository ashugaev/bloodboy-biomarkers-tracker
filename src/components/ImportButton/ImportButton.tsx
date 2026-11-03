import { useRef, useState } from 'react'

import {
    DeleteOutlined,
    DisconnectOutlined,
    DownloadOutlined,
    MenuOutlined,
    ReloadOutlined,
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
    clearGoogleDriveAccessToken,
    disconnectGoogleDriveBackup,
    getGoogleDriveBackupErrorMessage,
    markGoogleDriveBackupError,
    syncDatabaseWithGoogleDrive,
} from '@/googleDrive'
import { captureEvent } from '@/utils'
import { exportData } from '@/utils/exportData'
import { importData } from '@/utils/importData'
import { reloadApp } from '@/utils/reloadApp'

import { ImportButtonProps } from './ImportButton.types'

interface GoogleDriveIconProps {
    menuItem?: boolean
}

export const ImportButton = (props: ImportButtonProps) => {
    const { className, onlyApproved = true } = props
    const posthog = usePostHog()
    const fileInputRef = useRef<HTMLInputElement>(null)
    const [isModalVisible, setIsModalVisible] = useState(false)
    const [isImportModalVisible, setIsImportModalVisible] = useState(false)
    const [isDriveModalVisible, setIsDriveModalVisible] = useState(false)
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
        ? 'Google Drive unavailable'
        : isDriveConnected ? 'Google Drive' : 'Connect Google Drive'
    const shouldOpenDriveModal = isDriveConnected || !!driveSettings?.lastError
    const unexportedChangesTooltip = isDriveConnected
        ? 'Local changes are waiting for Google Drive auto sync.'
        : 'Don\'t forget to export: you have local changes that are not included in the latest backup yet.'
    const lastBackupAt = driveSettings?.lastBackupAt
        ? new Date(driveSettings.lastBackupAt).toLocaleString()
        : null

    const GoogleDriveIcon = ({ menuItem }: GoogleDriveIconProps) => (
        <span
            className={`anticon${menuItem ? ' ant-dropdown-menu-item-icon' : ''}`}
            role='img'
            aria-hidden='true'
        >
            <svg
                focusable='false'
                width='1em'
                height='1em'
                viewBox='0 0 87.3 78'
            >
                <path fill='#0066da' d='m6.6 66.85 3.85 6.65c.8 1.4 1.95 2.5 3.3 3.3l13.75-23.8h-27.5c0 1.55.4 3.1 1.2 4.5z'/>
                <path fill='#00ac47' d='m43.65 25-13.75-23.8c-1.35.8-2.5 1.9-3.3 3.3l-25.4 44a9.06 9.06 0 0 0 -1.2 4.5h27.5z'/>
                <path fill='#ea4335' d='m73.55 76.8c1.35-.8 2.5-1.9 3.3-3.3l1.6-2.75 7.65-13.25c.8-1.4 1.2-2.95 1.2-4.5h-27.502l5.852 11.5z'/>
                <path fill='#00832d' d='m43.65 25 13.75-23.8c-1.35-.8-2.9-1.2-4.5-1.2h-18.5c-1.6 0-3.15.45-4.5 1.2z'/>
                <path fill='#2684fc' d='m59.8 53h-32.3l-13.75 23.8c1.35.8 2.9 1.2 4.5 1.2h50.8c1.6 0 3.15-.45 4.5-1.2z'/>
                <path fill='#ffba00' d='m73.4 26.5-12.7-22c-.8-1.4-1.95-2.5-3.3-3.3l-13.75 23.8 16.15 28h27.45c0-1.55-.4-3.1-1.2-4.5z'/>
            </svg>
        </span>
    )

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

    const handleDriveConnect = async () => {
        setIsDriveSyncing(true)
        captureEvent(posthog, 'google_drive_sync_started', {
            connected: isDriveConnected,
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
            setIsDriveModalVisible(false)
        } catch (error) {
            const errorMessage = getGoogleDriveBackupErrorMessage(error)
            void markGoogleDriveBackupError(error)
            void message.error(errorMessage)
            captureEvent(posthog, 'google_drive_sync_failed', {
                error: error instanceof Error ? error.constructor.name : 'UnknownError',
            })
        } finally {
            setIsDriveSyncing(false)
        }
    }

    const handleDriveReconnect = async () => {
        clearGoogleDriveAccessToken()
        await handleDriveConnect()
    }

    const handleDriveDisconnect = async () => {
        await disconnectGoogleDriveBackup()
        setIsDriveModalVisible(false)
        void message.success('Google Drive backup disconnected')
        captureEvent(posthog, 'google_drive_backup_disconnected')
    }

    const handleDriveMenuClick = () => {
        if (shouldOpenDriveModal) {
            setIsDriveModalVisible(true)
            return
        }

        void handleDriveConnect()
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
            icon: <GoogleDriveIcon menuItem/>,
            disabled: isDriveSyncing || !isGoogleDriveConfigured,
            onClick: handleDriveMenuClick,
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
                    <Tooltip
                        title={(
                            <div className='flex flex-col items-start gap-2'>
                                <span>{driveSettings.lastError}</span>
                                <Button
                                    size='small'
                                    icon={<ReloadOutlined/>}
                                    loading={isDriveSyncing}
                                    onClick={() => { void handleDriveReconnect() }}
                                >
                                    Reconnect Google Drive
                                </Button>
                            </div>
                        )}
                    >
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
                title='Google Drive'
                open={isDriveModalVisible}
                onCancel={() => { setIsDriveModalVisible(false) }}
                footer={null}
            >
                {driveSettings?.lastError && (
                    <div
                        style={{
                            marginBottom: 16,
                            color: COLORS.ERROR,
                        }}
                    >
                        {driveSettings.lastError}
                    </div>
                )}
                {isDriveConnected ? (
                    <>
                        <p>Google Drive is connected. Automatic backup sync is enabled.</p>
                        {lastBackupAt && (
                            <p>Latest sync: {lastBackupAt}</p>
                        )}
                        {driveSettings?.lastBackupWebViewLink && driveSettings.lastBackupFileName && (
                            <p>
                                Latest backup:{' '}
                                <a
                                    href={driveSettings.lastBackupWebViewLink}
                                    target='_blank'
                                    rel='noreferrer'
                                >
                                    {driveSettings.lastBackupFileName}
                                </a>
                            </p>
                        )}
                        <div className='flex flex-wrap gap-2'>
                            {driveSettings?.lastError && (
                                <Button
                                    type='primary'
                                    icon={<ReloadOutlined/>}
                                    loading={isDriveSyncing}
                                    onClick={() => { void handleDriveReconnect() }}
                                >
                                    Reconnect Google Drive
                                </Button>
                            )}
                            <Button
                                danger
                                icon={<DisconnectOutlined/>}
                                disabled={isDriveSyncing}
                                onClick={() => { void handleDriveDisconnect() }}
                            >
                                Disconnect Google Drive
                            </Button>
                        </div>
                    </>
                ) : (
                    <>
                        <p>Connect Google Drive to keep database backups synced automatically.</p>
                        <Button
                            type='primary'
                            icon={<GoogleDriveIcon/>}
                            loading={isDriveSyncing}
                            onClick={() => { void handleDriveConnect() }}
                        >
                            Connect Google Drive
                        </Button>
                    </>
                )}
            </Modal>
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

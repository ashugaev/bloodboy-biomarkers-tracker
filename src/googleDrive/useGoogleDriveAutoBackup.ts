import { useCallback, useEffect, useRef } from 'react'

import { App as AntApp } from 'antd'

import { useExportStatus } from '@/db'
import { useAppSettings } from '@/db/models/appSettings'

import { markGoogleDriveBackupError, syncDatabaseWithGoogleDrive } from './googleDriveBackup.service'

const AUTO_SYNC_DELAY_MS = 3000
const AUTO_SYNC_INTERVAL_MS = 60_000

export const useGoogleDriveAutoBackup = () => {
    const { message } = AntApp.useApp()
    const { data: settings } = useAppSettings()
    const { hasUnexportedChanges, lastExportedAt, loading } = useExportStatus()
    const syncInFlightRef = useRef(false)
    const lastFailureRef = useRef<string | null>(null)
    const lastSyncTriggerRef = useRef<string | null>(null)

    const runSync = useCallback(() => {
        if (syncInFlightRef.current) {
            return
        }

        syncInFlightRef.current = true

        syncDatabaseWithGoogleDrive({ prompt: '' })
            .then((result) => {
                lastFailureRef.current = null
                if (result.action === 'downloaded') {
                    void message.success('Newer Google Drive backup found')
                }
            })
            .catch((error) => {
                const errorMessage = error instanceof Error ? error.message : 'Google Drive sync failed'
                void markGoogleDriveBackupError(error)

                if (lastFailureRef.current !== errorMessage) {
                    lastFailureRef.current = errorMessage
                    void message.warning('Google Drive sync needs reconnection')
                }
            })
            .finally(() => {
                syncInFlightRef.current = false
            })
    }, [message])

    useEffect(() => {
        const driveSettings = settings[0]?.googleDriveBackup

        if (
            loading ||
            !driveSettings?.enabled ||
            !driveSettings.autoSync ||
            syncInFlightRef.current
        ) {
            return
        }

        const triggerKey = [
            hasUnexportedChanges,
            lastExportedAt?.getTime() ?? 'never',
            driveSettings.lastBackupAt?.getTime() ?? 'never',
        ].join(':')

        if (lastSyncTriggerRef.current === triggerKey && !hasUnexportedChanges) {
            return
        }

        lastSyncTriggerRef.current = triggerKey

        const timeoutId = window.setTimeout(() => {
            runSync()
        }, AUTO_SYNC_DELAY_MS)

        return () => {
            window.clearTimeout(timeoutId)
        }
    }, [hasUnexportedChanges, lastExportedAt, loading, runSync, settings])

    useEffect(() => {
        const driveSettings = settings[0]?.googleDriveBackup

        if (!driveSettings?.enabled || !driveSettings.autoSync) {
            return
        }

        const intervalId = window.setInterval(runSync, AUTO_SYNC_INTERVAL_MS)

        return () => {
            window.clearInterval(intervalId)
        }
    }, [runSync, settings])
}

import { useCallback } from 'react'

import { App as AntApp } from 'antd'
import { usePostHog } from 'posthog-js/react'

import { getLoadedProfile } from '@/profiles/profiles.service'
import { captureEvent } from '@/utils'

import { getGoogleDriveBackupErrorMessage, resolveGoogleDriveSyncConflict } from './googleDriveBackup.service'
import { GoogleDriveConflictChoice, GoogleDriveSyncResult } from './googleDriveBackup.types'

let isConflictModalOpen = false

const formatDate = (date: Date | null): string => (date ? date.toLocaleString() : 'unknown')

export const isGoogleDriveConflictPending = () => isConflictModalOpen

export const useGoogleDriveConflictModal = () => {
    const { message, modal } = AntApp.useApp()
    const posthog = usePostHog()

    return useCallback((result: GoogleDriveSyncResult) => {
        if (isConflictModalOpen) {
            return
        }

        isConflictModalOpen = true
        captureEvent(posthog, 'google_drive_conflict_shown')

        const resolve = async (choice: GoogleDriveConflictChoice) => {
            try {
                await resolveGoogleDriveSyncConflict(choice)
                captureEvent(posthog, 'google_drive_conflict_resolved', { choice })
                if (choice === 'local') {
                    void message.success('This device version saved to Google Drive')
                }
            } catch (error) {
                void message.error(getGoogleDriveBackupErrorMessage(error))
                captureEvent(posthog, 'google_drive_conflict_failed', { choice })
            } finally {
                isConflictModalOpen = false
            }
        }

        void modal.confirm({
            title: 'Data changed on this device and in Google Drive',
            content: (
                <div className='flex flex-col gap-2'>
                    <p>
                        Profile &quot;{getLoadedProfile().name}&quot; was changed here and on another device since the last sync.
                        Choose which version to keep.
                    </p>
                    <p>This device: last change {formatDate(result.localVersionAt)}</p>
                    <p>Google Drive: last change {formatDate(result.remoteVersionAt)}</p>
                    <p>A copy of this device&apos;s data is saved in Google Drive history, so nothing is lost.</p>
                </div>
            ),
            okText: 'Use Google Drive version',
            cancelText: 'Keep this device version',
            closable: false,
            keyboard: false,
            maskClosable: false,
            onOk: async () => { await resolve('remote') },
            onCancel: async () => { await resolve('local') },
        })
    }, [message, modal, posthog])
}

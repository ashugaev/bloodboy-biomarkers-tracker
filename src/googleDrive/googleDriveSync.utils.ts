import { GoogleDriveSyncPlan, GoogleDriveSyncState } from './googleDriveBackup.types'

const isLocalChanged = (state: GoogleDriveSyncState): boolean => {
    if (state.syncedLocalFingerprint !== undefined) {
        return state.localFingerprint !== state.syncedLocalFingerprint
    }

    return !state.lastBackupAt ||
        !state.localVersionAt ||
        state.localVersionAt.getTime() > state.lastBackupAt.getTime()
}

const isRemoteChanged = (state: GoogleDriveSyncState): boolean => {
    if (state.syncedRemoteVersion !== undefined) {
        return state.remoteVersion !== state.syncedRemoteVersion
    }

    return !state.lastBackupAt || state.remoteVersionAt?.getTime() !== state.lastBackupAt.getTime()
}

export const getGoogleDriveSyncPlan = (state: GoogleDriveSyncState): GoogleDriveSyncPlan => {
    if (!state.remoteVersion) {
        return state.localFingerprint ? 'upload' : 'none'
    }

    const remoteChanged = isRemoteChanged(state)

    if (!state.localFingerprint) {
        return remoteChanged ? 'download' : 'none'
    }

    if (state.remoteFingerprint === state.localFingerprint) {
        return 'in-sync'
    }

    const localChanged = isLocalChanged(state)

    if (localChanged && remoteChanged) {
        return 'conflict'
    }
    if (localChanged) {
        return 'upload'
    }
    if (remoteChanged) {
        return 'download'
    }

    return 'in-sync'
}

import { GoogleDriveBackupSettings } from '@/db/models/appSettings'

export interface Profile {
    id: string
    name: string
    createdAt: string
    updatedAt?: string
}

export interface DeletedProfile {
    id: string
    deletedAt: string
}

export interface ProfileSnapshot {
    profiles: Profile[]
    deletedProfiles: DeletedProfile[]
}

export interface ProfileRegistry extends ProfileSnapshot {
    activeProfileId: string
    googleDriveSyncEnabled?: boolean
}

export interface ProfileSeed {
    profileId: string
    openaiApiKey?: string
    googleDriveBackup?: GoogleDriveBackupSettings
}

export interface ProfilesBundleEntry extends Profile {
    backup?: unknown
}

export interface ProfilesBundle {
    formatVersion: number
    exportedAt: string
    profiles: ProfilesBundleEntry[]
}

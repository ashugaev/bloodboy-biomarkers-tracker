import { Dexie } from 'dexie'

import { config } from '@/config'
import { DEFAULT_PROFILE_ID, MAIN_SETTINGS_ID, PROFILE_SEED_STORAGE_KEY } from '@/constants'
// eslint-disable-next-line no-restricted-imports
import { BloodTestDatabase, db } from '@/db/services/db.service'
import { createDatabaseBackupBlob, downloadBlob } from '@/utils/exportData'

import {
    addProfile,
    getLoadedProfile,
    getProfileDbName,
    getProfileFileTag,
    readProfileRegistry,
    removeProfileFromRegistry,
    setActiveProfileId,
} from './profiles.service'
import { Profile, ProfileSeed } from './profiles.types'

export const switchProfile = (profileId: string) => {
    setActiveProfileId(profileId)
    const baseUrl = config.baseUrl || '/'
    window.location.replace(`${window.location.origin}${baseUrl}data`)
}

export const createProfile = async (name: string, copySettings: boolean): Promise<Profile> => {
    const profile = addProfile(name)

    if (copySettings) {
        const settings = await db.appSettings.limit(1).first()
        const seed: ProfileSeed = {
            profileId: profile.id,
            openaiApiKey: settings?.openaiApiKey,
            googleDriveEnabled: settings?.googleDriveBackup?.enabled ?? false,
        }
        sessionStorage.setItem(PROFILE_SEED_STORAGE_KEY, JSON.stringify(seed))
    }

    return profile
}

const parseProfileSeed = (raw: string): ProfileSeed | null => {
    try {
        return JSON.parse(raw) as ProfileSeed
    } catch {
        return null
    }
}

// Applies settings copied from the previous profile to a freshly created one.
export const applyProfileSeed = async () => {
    const raw = sessionStorage.getItem(PROFILE_SEED_STORAGE_KEY)
    if (!raw) {
        return
    }

    sessionStorage.removeItem(PROFILE_SEED_STORAGE_KEY)
    const seed = parseProfileSeed(raw)

    if (!seed || seed.profileId !== getLoadedProfile().id || await db.appSettings.count() > 0) {
        return
    }

    const now = new Date()
    await db.appSettings.add({
        id: MAIN_SETTINGS_ID,
        openaiApiKey: seed.openaiApiKey ?? '',
        ...(seed.googleDriveEnabled ? {
            googleDriveBackup: {
                enabled: true,
                connectedAt: now,
            },
        } : {}),
        createdAt: now,
        updatedAt: now,
    })
}

// Downloads a JSON backup of the profile before its database is deleted.
export const deleteProfile = async (profileId: string) => {
    if (profileId === DEFAULT_PROFILE_ID || profileId === getLoadedProfile().id) {
        throw new Error('Switch to another profile before deleting this one')
    }

    const profile = readProfileRegistry().profiles.find(item => item.id === profileId)
    if (!profile) {
        throw new Error('Profile not found')
    }

    const dbName = getProfileDbName(profileId)
    const profileDb = new BloodTestDatabase(dbName)
    const exportedAt = new Date()

    try {
        const backupBlob = await createDatabaseBackupBlob(exportedAt, profileDb)
        downloadBlob(backupBlob, `bloodboy_db_backup${getProfileFileTag(profile)}_${exportedAt.toISOString().split('T')[0]}.json`)
    } finally {
        profileDb.close()
    }

    await Dexie.delete(dbName)
    removeProfileFromRegistry(profileId)
}

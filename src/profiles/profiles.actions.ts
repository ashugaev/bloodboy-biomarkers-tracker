import { Dexie } from 'dexie'

import { config } from '@/config'
import { DEFAULT_PROFILE_ID, MAIN_SETTINGS_ID, PROFILE_SEED_STORAGE_KEY } from '@/constants'
import { GoogleDriveBackupSettings } from '@/db/models/appSettings'
// eslint-disable-next-line no-restricted-imports
import { BloodTestDatabase, db } from '@/db/services/db.service'
import { DatabaseExportJson, createDatabaseBackupBlob, downloadBlob, exportDatabaseJson } from '@/utils/exportData'
import { importDatabaseBackup } from '@/utils/importData'

import {
    addProfile,
    getLoadedProfile,
    getLoadedProfileDbName,
    getProfileDbName,
    getProfileFileTag,
    readProfileRegistry,
    removeProfileFromRegistry,
    setActiveProfileId,
    setGoogleDriveSyncEnabled,
    upsertProfile,
    validateProfileName,
} from './profiles.service'
import { Profile, ProfileSeed, ProfilesBundle, ProfilesBundleEntry } from './profiles.types'

const PROFILES_BUNDLE_FORMAT_VERSION = 1

type ProfilesBundleFile = DatabaseExportJson & {
    bloodboyProfiles: ProfilesBundle
}

let isDeletingLoadedDatabase = false

const getDateTag = (date: Date): string => date.toISOString().split('T')[0]

const openDataPage = () => {
    const baseUrl = config.baseUrl || '/'
    window.location.replace(`${window.location.origin}${baseUrl}data`)
}

const withProfileDatabase = async <T>(
    profileId: string,
    action: (database: BloodTestDatabase) => Promise<T>,
): Promise<T> => {
    if (profileId === getLoadedProfile().id) {
        return await action(db)
    }

    const database = new BloodTestDatabase(getProfileDbName(profileId))
    try {
        return await action(database)
    } finally {
        database.close()
    }
}

export const switchProfile = (profileId: string) => {
    setActiveProfileId(profileId)
    openDataPage()
}

const writeProfileSeed = (seed: ProfileSeed) => {
    sessionStorage.setItem(PROFILE_SEED_STORAGE_KEY, JSON.stringify(seed))
}

export const createProfile = async (name: string, copySettings: boolean): Promise<Profile> => {
    const profile = addProfile(name)

    if (copySettings) {
        const settings = await db.appSettings.limit(1).first()
        writeProfileSeed({
            profileId: profile.id,
            openaiApiKey: settings?.openaiApiKey,
        })
    }

    return profile
}

export const saveProfileResetSeed = (googleDriveBackup: GoogleDriveBackupSettings | undefined) => {
    if (googleDriveBackup) {
        writeProfileSeed({
            profileId: getLoadedProfile().id,
            googleDriveBackup,
        })
    }
}

const parseProfileSeed = (raw: string): ProfileSeed | null => {
    try {
        return JSON.parse(raw) as ProfileSeed
    } catch {
        return null
    }
}

const reviveDate = (value: Date | string | undefined): Date | undefined => {
    return value ? new Date(value) : undefined
}

const reviveGoogleDriveBackup = (settings: GoogleDriveBackupSettings): GoogleDriveBackupSettings => ({
    ...settings,
    lastBackupAt: reviveDate(settings.lastBackupAt),
    connectedAt: reviveDate(settings.connectedAt),
})

const applyProfileSeed = async () => {
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
        ...(seed.googleDriveBackup ? { googleDriveBackup: reviveGoogleDriveBackup(seed.googleDriveBackup) } : {}),
        createdAt: now,
        updatedAt: now,
    })
}

const migrateGoogleDriveSyncFlag = async () => {
    if (readProfileRegistry().googleDriveSyncEnabled !== undefined) {
        return
    }

    const enabled = (await db.appSettings.limit(1).first())?.googleDriveBackup?.enabled
    if (enabled !== undefined) {
        setGoogleDriveSyncEnabled(enabled)
    }
}

const watchLoadedDatabaseDeletion = () => {
    db.on('versionchange', (event) => {
        if (event.newVersion !== null || isDeletingLoadedDatabase) {
            return
        }

        db.close()
        window.location.reload()
        return false
    })
}

export const initializeLoadedProfile = async () => {
    watchLoadedDatabaseDeletion()
    await applyProfileSeed()
    await migrateGoogleDriveSyncFlag()
}

export const deleteLoadedProfileDatabase = (): IDBOpenDBRequest => {
    isDeletingLoadedDatabase = true
    return indexedDB.deleteDatabase(getLoadedProfileDbName())
}

const findProfile = (profileId: string): Profile => {
    const profile = readProfileRegistry().profiles.find(item => item.id === profileId)
    if (!profile) {
        throw new Error('Profile not found')
    }
    return profile
}

export const downloadProfileBackup = async (profileId: string) => {
    const profile = findProfile(profileId)
    const exportedAt = new Date()
    const backupBlob = await withProfileDatabase(profileId, async database => await createDatabaseBackupBlob(exportedAt, database))

    downloadBlob(backupBlob, `bloodboy_db_backup${getProfileFileTag(profile)}_${getDateTag(exportedAt)}.json`)
}

export const deleteProfile = async (profileId: string) => {
    if (profileId === DEFAULT_PROFILE_ID || profileId === getLoadedProfile().id) {
        throw new Error('Switch to another profile before deleting this one')
    }

    findProfile(profileId)
    await Dexie.delete(getProfileDbName(profileId))
    removeProfileFromRegistry(profileId)
}

const markProfileExported = async (database: BloodTestDatabase, exportedAt: Date) => {
    const settings = await database.appSettings.limit(1).first()
    if (settings) {
        await database.appSettings.update(settings.id, {
            lastExportedAt: exportedAt,
            updatedAt: exportedAt,
        })
    }
}

export const exportAllProfiles = async () => {
    const exportedAt = new Date()
    const { profiles } = readProfileRegistry()
    const entries: ProfilesBundleEntry[] = []
    let mainExport: DatabaseExportJson | null = null

    for (const profile of profiles) {
        const profileExport = await withProfileDatabase(profile.id, async database => await exportDatabaseJson(exportedAt, database))

        if (profile.id === DEFAULT_PROFILE_ID) {
            mainExport = profileExport
            entries.push(profile)
        } else {
            entries.push({
                ...profile,
                backup: profileExport,
            })
        }
    }

    if (!mainExport) {
        throw new Error('Main profile export failed')
    }

    const bundle: ProfilesBundleFile = {
        ...mainExport,
        bloodboyProfiles: {
            formatVersion: PROFILES_BUNDLE_FORMAT_VERSION,
            exportedAt: exportedAt.toISOString(),
            profiles: entries,
        },
    }

    downloadBlob(
        new Blob([JSON.stringify(bundle)], { type: 'application/json' }),
        `bloodboy_all_profiles_backup_${getDateTag(exportedAt)}.json`,
    )

    for (const profile of profiles) {
        await withProfileDatabase(profile.id, async database => { await markProfileExported(database, exportedAt) })
    }

    return profiles.length
}

export const readProfilesBundle = async (file: Blob): Promise<ProfilesBundle | null> => {
    try {
        const parsed = JSON.parse(await file.text()) as Partial<ProfilesBundleFile>
        const bundle = parsed.bloodboyProfiles
        return bundle && Array.isArray(bundle.profiles) ? bundle : null
    } catch {
        return null
    }
}

const getImportedProfileName = (entry: ProfilesBundleEntry): string => {
    return validateProfileName(entry.name, entry.id)
        ? `${entry.name} (${entry.id.slice(0, 4)})`
        : entry.name
}

export const importAllProfiles = async (file: Blob) => {
    const bundle = await readProfilesBundle(file)
    if (!bundle) {
        throw new Error('File is not an all-profiles backup')
    }

    for (const entry of bundle.profiles) {
        const isMainProfile = entry.id === DEFAULT_PROFILE_ID
        if (!isMainProfile && !entry.backup) {
            continue
        }

        upsertProfile({
            id: entry.id,
            name: getImportedProfileName(entry),
            createdAt: entry.createdAt,
        })

        const backupBlob = isMainProfile
            ? file
            : new Blob([JSON.stringify(entry.backup)], { type: 'application/json' })

        await withProfileDatabase(entry.id, async (database) => {
            await importDatabaseBackup(backupBlob, {
                database,
                reload: false,
                successMessage: null,
            })
        })
    }

    openDataPage()
}

import { v4 as uuidv4 } from 'uuid'

import {
    DB_NAME,
    DEFAULT_PROFILE_ID,
    DEFAULT_PROFILE_NAME,
    GOOGLE_DRIVE_ACCESS_TOKEN_STORAGE_KEY,
    PROFILE_DB_NAME_SEPARATOR,
    PROFILES_CHANGED_EVENT,
    PROFILES_STORAGE_KEY,
} from '@/constants'

import {
    DeletedProfile,
    Profile,
    ProfileRegistry,
    ProfileSnapshot,
} from './profiles.types'

const PROFILE_DB_NAME_PREFIX = `${DB_NAME}${PROFILE_DB_NAME_SEPARATOR}`
const PRESERVED_LOCAL_STORAGE_KEYS = [PROFILES_STORAGE_KEY, GOOGLE_DRIVE_ACCESS_TOKEN_STORAGE_KEY]

let loadedProfileId: string | null = null

const createDefaultProfile = (): Profile => ({
    id: DEFAULT_PROFILE_ID,
    name: DEFAULT_PROFILE_NAME,
    createdAt: new Date(0).toISOString(),
})

const isProfile = (value: unknown): value is Profile => {
    if (!value || typeof value !== 'object') {
        return false
    }

    const profile = value as Partial<Profile>
    return typeof profile.id === 'string' &&
        profile.id.length > 0 &&
        typeof profile.name === 'string' &&
        typeof profile.createdAt === 'string'
}

const isDeletedProfile = (value: unknown): value is DeletedProfile => {
    if (!value || typeof value !== 'object') {
        return false
    }

    const deletedProfile = value as Partial<DeletedProfile>
    return typeof deletedProfile.id === 'string' && typeof deletedProfile.deletedAt === 'string'
}

const readStoredRegistry = (): Partial<ProfileRegistry> | null => {
    try {
        const raw = window.localStorage.getItem(PROFILES_STORAGE_KEY)
        return raw ? JSON.parse(raw) as Partial<ProfileRegistry> : null
    } catch {
        return null
    }
}

const writeProfileRegistry = (registry: ProfileRegistry) => {
    window.localStorage.setItem(PROFILES_STORAGE_KEY, JSON.stringify(registry))
    window.dispatchEvent?.(new Event(PROFILES_CHANGED_EVENT))
}

const withDefaultProfile = (profiles: Profile[]): Profile[] => {
    return profiles.some(profile => profile.id === DEFAULT_PROFILE_ID)
        ? profiles
        : [createDefaultProfile(), ...profiles]
}

export const readProfileRegistry = (): ProfileRegistry => {
    const stored = readStoredRegistry()
    const profiles = withDefaultProfile(Array.isArray(stored?.profiles) ? stored.profiles.filter(isProfile) : [])
    const deletedProfiles = Array.isArray(stored?.deletedProfiles) ? stored.deletedProfiles.filter(isDeletedProfile) : []
    const activeProfileId = profiles.some(profile => profile.id === stored?.activeProfileId)
        ? stored?.activeProfileId ?? DEFAULT_PROFILE_ID
        : DEFAULT_PROFILE_ID

    return {
        activeProfileId,
        profiles,
        deletedProfiles,
        ...(typeof stored?.googleDriveSyncEnabled === 'boolean' ? { googleDriveSyncEnabled: stored.googleDriveSyncEnabled } : {}),
    }
}

export const getProfileDbName = (profileId: string): string => {
    return profileId === DEFAULT_PROFILE_ID ? DB_NAME : `${PROFILE_DB_NAME_PREFIX}${profileId}`
}

export const getLoadedProfile = (): Profile => {
    const registry = readProfileRegistry()
    loadedProfileId ??= registry.activeProfileId
    const profileId = loadedProfileId

    return registry.profiles.find(profile => profile.id === profileId) ?? {
        id: profileId,
        name: profileId,
        createdAt: new Date(0).toISOString(),
    }
}

export const isLoadedProfileRegistered = (): boolean => {
    const profileId = getLoadedProfile().id
    return readProfileRegistry().profiles.some(profile => profile.id === profileId)
}

export const getLoadedProfileDbName = (): string => {
    return getProfileDbName(getLoadedProfile().id)
}

const normalizeProfileName = (name: string): string => name.trim().toLocaleLowerCase()

export const validateProfileName = (name: string, profileId?: string): string | null => {
    if (!name.trim()) {
        return 'Profile name is required'
    }

    const isTaken = readProfileRegistry().profiles.some(profile => (
        profile.id !== profileId && normalizeProfileName(profile.name) === normalizeProfileName(name)
    ))

    return isTaken ? 'A profile with this name already exists' : null
}

const assertValidProfileName = (name: string, profileId?: string) => {
    const error = validateProfileName(name, profileId)
    if (error) {
        throw new Error(error)
    }
}

export const addProfile = (name: string): Profile => {
    assertValidProfileName(name)
    const registry = readProfileRegistry()
    const now = new Date().toISOString()
    const profile: Profile = {
        id: uuidv4(),
        name: name.trim(),
        createdAt: now,
        updatedAt: now,
    }

    writeProfileRegistry({
        ...registry,
        profiles: [...registry.profiles, profile],
    })

    return profile
}

export const upsertProfile = (profile: Profile) => {
    const registry = readProfileRegistry()
    const updatedProfile: Profile = {
        ...profile,
        updatedAt: new Date().toISOString(),
    }
    const exists = registry.profiles.some(item => item.id === profile.id)

    writeProfileRegistry({
        ...registry,
        profiles: exists
            ? registry.profiles.map(item => (item.id === profile.id ? updatedProfile : item))
            : [...registry.profiles, updatedProfile],
        deletedProfiles: registry.deletedProfiles.filter(item => item.id !== profile.id),
    })
}

export const renameProfile = (profileId: string, name: string) => {
    assertValidProfileName(name, profileId)
    const registry = readProfileRegistry()

    writeProfileRegistry({
        ...registry,
        profiles: registry.profiles.map(profile => (
            profile.id === profileId
                ? {
                    ...profile,
                    name: name.trim(),
                    updatedAt: new Date().toISOString(),
                }
                : profile
        )),
    })
}

export const setActiveProfileId = (profileId: string) => {
    const registry = readProfileRegistry()

    if (!registry.profiles.some(profile => profile.id === profileId)) {
        throw new Error('Profile not found')
    }

    writeProfileRegistry({
        ...registry,
        activeProfileId: profileId,
    })
}

export const removeProfileFromRegistry = (profileId: string) => {
    if (profileId === DEFAULT_PROFILE_ID) {
        throw new Error('Main profile cannot be deleted')
    }

    const registry = readProfileRegistry()

    writeProfileRegistry({
        ...registry,
        activeProfileId: registry.activeProfileId === profileId ? DEFAULT_PROFILE_ID : registry.activeProfileId,
        profiles: registry.profiles.filter(profile => profile.id !== profileId),
        deletedProfiles: [
            ...registry.deletedProfiles.filter(item => item.id !== profileId),
            {
                id: profileId,
                deletedAt: new Date().toISOString(),
            },
        ],
    })
}

const getProfileVersion = (profile: Profile): number => {
    return new Date(profile.updatedAt ?? profile.createdAt).getTime()
}

export const mergeProfileSnapshots = (local: ProfileSnapshot, remote: ProfileSnapshot): ProfileSnapshot => {
    const deletedAtById = new Map<string, number>()
    for (const item of [...local.deletedProfiles, ...remote.deletedProfiles]) {
        const deletedAt = new Date(item.deletedAt).getTime()
        if (deletedAt > (deletedAtById.get(item.id) ?? -Infinity)) {
            deletedAtById.set(item.id, deletedAt)
        }
    }

    const profilesById = new Map<string, Profile>()
    for (const profile of [...local.profiles, ...remote.profiles]) {
        const current = profilesById.get(profile.id)
        if (!current || getProfileVersion(profile) > getProfileVersion(current)) {
            profilesById.set(profile.id, profile)
        }
    }

    const profiles = [...profilesById.values()].filter(profile => (
        profile.id === DEFAULT_PROFILE_ID ||
        getProfileVersion(profile) > (deletedAtById.get(profile.id) ?? -Infinity)
    ))
    const aliveIds = new Set(profiles.map(profile => profile.id))

    return {
        profiles: withDefaultProfile(profiles),
        deletedProfiles: [...deletedAtById.entries()]
            .filter(([id]) => !aliveIds.has(id))
            .map(([id, deletedAt]) => ({
                id,
                deletedAt: new Date(deletedAt).toISOString(),
            })),
    }
}

export const parseProfileSnapshot = (value: unknown): ProfileSnapshot | null => {
    if (!value || typeof value !== 'object') {
        return null
    }

    const snapshot = value as Partial<ProfileSnapshot>
    return {
        profiles: Array.isArray(snapshot.profiles) ? snapshot.profiles.filter(isProfile) : [],
        deletedProfiles: Array.isArray(snapshot.deletedProfiles) ? snapshot.deletedProfiles.filter(isDeletedProfile) : [],
    }
}

export const toCanonicalProfileSnapshot = (snapshot: ProfileSnapshot): string => {
    const byId = <T extends { id: string }>(a: T, b: T) => a.id.localeCompare(b.id)

    return JSON.stringify({
        profiles: [...snapshot.profiles].sort(byId),
        deletedProfiles: [...snapshot.deletedProfiles].sort(byId),
    })
}

export const applyRemoteProfileSnapshot = (remote: ProfileSnapshot | null): ProfileSnapshot => {
    const registry = readProfileRegistry()
    const merged = remote ? mergeProfileSnapshots(registry, remote) : registry
    const profiles = merged.profiles
    const activeProfileId = profiles.some(profile => profile.id === registry.activeProfileId)
        ? registry.activeProfileId
        : DEFAULT_PROFILE_ID

    if (JSON.stringify(merged.profiles) !== JSON.stringify(registry.profiles) ||
        JSON.stringify(merged.deletedProfiles) !== JSON.stringify(registry.deletedProfiles)) {
        writeProfileRegistry({
            ...registry,
            activeProfileId,
            profiles,
            deletedProfiles: merged.deletedProfiles,
        })
    }

    return {
        profiles,
        deletedProfiles: merged.deletedProfiles,
    }
}

export const isGoogleDriveSyncEnabled = (profileSyncEnabled: boolean | undefined): boolean => {
    return readProfileRegistry().googleDriveSyncEnabled ?? profileSyncEnabled ?? false
}

export const setGoogleDriveSyncEnabled = (enabled: boolean) => {
    const registry = readProfileRegistry()
    if (registry.googleDriveSyncEnabled === enabled) {
        return
    }

    writeProfileRegistry({
        ...registry,
        googleDriveSyncEnabled: enabled,
    })
}

export const recoverOrphanProfiles = async (): Promise<boolean> => {
    if (typeof indexedDB === 'undefined' || typeof indexedDB.databases !== 'function') {
        return false
    }

    const databases = await indexedDB.databases()
    const registry = readProfileRegistry()
    const knownIds = new Set([
        ...registry.profiles.map(profile => profile.id),
        ...registry.deletedProfiles.map(profile => profile.id),
    ])
    const orphanProfiles = databases
        .map(database => database.name)
        .filter((name): name is string => !!name?.startsWith(PROFILE_DB_NAME_PREFIX))
        .map(name => name.slice(PROFILE_DB_NAME_PREFIX.length))
        .filter(profileId => profileId.length > 0 && !knownIds.has(profileId))
        .map((profileId): Profile => ({
            id: profileId,
            name: `Recovered ${profileId.slice(0, 8)}`,
            createdAt: new Date().toISOString(),
        }))

    if (orphanProfiles.length === 0) {
        return false
    }

    writeProfileRegistry({
        ...registry,
        profiles: [...registry.profiles, ...orphanProfiles],
    })

    return true
}

export const clearLocalStorageForReset = () => {
    const preserved = PRESERVED_LOCAL_STORAGE_KEYS
        .map(key => [key, window.localStorage.getItem(key)] as const)
    window.localStorage.clear()

    preserved.forEach(([key, value]) => {
        if (value != null) {
            window.localStorage.setItem(key, value)
        }
    })
}

export const getProfileFileTag = (profile: Profile): string => {
    if (profile.id === DEFAULT_PROFILE_ID) {
        return ''
    }

    const slug = profile.name
        .toLowerCase()
        .replace(/[^\p{L}\p{N}]+/gu, '-')
        .replace(/^-+|-+$/g, '')

    return `_${slug || profile.id.slice(0, 8)}`
}

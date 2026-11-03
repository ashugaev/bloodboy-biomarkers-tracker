import { v4 as uuidv4 } from 'uuid'

import {
    DB_NAME,
    DEFAULT_PROFILE_ID,
    DEFAULT_PROFILE_NAME,
    PROFILE_DB_NAME_SEPARATOR,
    PROFILES_STORAGE_KEY,
} from '@/constants'

import { Profile, ProfileRegistry } from './profiles.types'

const PROFILE_DB_NAME_PREFIX = `${DB_NAME}${PROFILE_DB_NAME_SEPARATOR}`

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
}

export const readProfileRegistry = (): ProfileRegistry => {
    const stored = readStoredRegistry()
    const storedProfiles = Array.isArray(stored?.profiles) ? stored.profiles.filter(isProfile) : []
    const profiles = storedProfiles.some(profile => profile.id === DEFAULT_PROFILE_ID)
        ? storedProfiles
        : [createDefaultProfile(), ...storedProfiles]
    const activeProfileId = profiles.some(profile => profile.id === stored?.activeProfileId)
        ? stored?.activeProfileId ?? DEFAULT_PROFILE_ID
        : DEFAULT_PROFILE_ID

    return {
        activeProfileId,
        profiles,
    }
}

export const getProfileDbName = (profileId: string): string => {
    return profileId === DEFAULT_PROFILE_ID ? DB_NAME : `${PROFILE_DB_NAME_PREFIX}${profileId}`
}

// The profile this tab opened its database with. Stays fixed until reload,
// even if another tab switches the active profile.
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

export const getLoadedProfileDbName = (): string => {
    return getProfileDbName(getLoadedProfile().id)
}

export const addProfile = (name: string): Profile => {
    const registry = readProfileRegistry()
    const profile: Profile = {
        id: uuidv4(),
        name: name.trim(),
        createdAt: new Date().toISOString(),
    }

    writeProfileRegistry({
        ...registry,
        profiles: [...registry.profiles, profile],
    })

    return profile
}

export const renameProfile = (profileId: string, name: string) => {
    const registry = readProfileRegistry()

    writeProfileRegistry({
        ...registry,
        profiles: registry.profiles.map(profile => (
            profile.id === profileId ? {
                ...profile,
                name: name.trim(),
            } : profile
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
        activeProfileId: registry.activeProfileId === profileId ? DEFAULT_PROFILE_ID : registry.activeProfileId,
        profiles: registry.profiles.filter(profile => profile.id !== profileId),
    })
}

// Re-registers profile databases that exist in IndexedDB but are missing from
// the registry, e.g. after site storage for localStorage was cleared.
export const recoverOrphanProfiles = async (): Promise<boolean> => {
    if (typeof indexedDB === 'undefined' || typeof indexedDB.databases !== 'function') {
        return false
    }

    const databases = await indexedDB.databases()
    const registry = readProfileRegistry()
    const knownIds = new Set(registry.profiles.map(profile => profile.id))
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

// Clears localStorage but keeps the profile registry, so a database reset
// does not orphan the other profiles.
export const clearLocalStorageExceptProfiles = () => {
    const registry = window.localStorage.getItem(PROFILES_STORAGE_KEY)
    window.localStorage.clear()

    if (registry) {
        window.localStorage.setItem(PROFILES_STORAGE_KEY, registry)
    }
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

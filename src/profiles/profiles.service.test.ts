import {
    beforeEach,
    describe,
    expect,
    it,
    vi,
} from 'vitest'

import { PROFILES_STORAGE_KEY } from '@/constants'

const createStorage = () => {
    const store = new Map<string, string>()

    return {
        getItem: (key: string) => store.get(key) ?? null,
        setItem: (key: string, value: string) => { store.set(key, value) },
        removeItem: (key: string) => { store.delete(key) },
        clear: () => { store.clear() },
    }
}

const loadService = async () => await import('./profiles.service')

describe('profiles service', () => {
    beforeEach(() => {
        vi.resetModules()
        vi.unstubAllGlobals()
        vi.stubGlobal('window', { localStorage: createStorage() })
    })

    it('maps a fresh install to the legacy database', async () => {
        const { getLoadedProfile, getLoadedProfileDbName, readProfileRegistry } = await loadService()

        expect(readProfileRegistry().profiles).toHaveLength(1)
        expect(getLoadedProfile().id).toBe('default')
        expect(getLoadedProfileDbName()).toBe('bloodboy-db')
    })

    it('opens the active profile database', async () => {
        const { addProfile, getLoadedProfileDbName, setActiveProfileId } = await loadService()
        const profile = addProfile(' Partner ')
        setActiveProfileId(profile.id)

        expect(profile.name).toBe('Partner')
        expect(getLoadedProfileDbName()).toBe(`bloodboy-db--${profile.id}`)
    })

    it('keeps the loaded profile when another tab switches', async () => {
        const { addProfile, getLoadedProfile, setActiveProfileId } = await loadService()
        expect(getLoadedProfile().id).toBe('default')

        setActiveProfileId(addProfile('Kid').id)

        expect(getLoadedProfile().id).toBe('default')
    })

    it('falls back to main profile on corrupted or unknown registry', async () => {
        window.localStorage.setItem(PROFILES_STORAGE_KEY, '{broken')
        const { readProfileRegistry } = await loadService()
        expect(readProfileRegistry().activeProfileId).toBe('default')

        window.localStorage.setItem(PROFILES_STORAGE_KEY, JSON.stringify({
            activeProfileId: 'missing',
            profiles: [{ id: 'x' }],
        }))
        expect(readProfileRegistry()).toEqual({
            activeProfileId: 'default',
            profiles: [expect.objectContaining({ id: 'default' })],
            deletedProfiles: [],
        })
    })

    it('refuses to delete main profile and resets active on removal', async () => {
        const { addProfile, readProfileRegistry, removeProfileFromRegistry, setActiveProfileId } = await loadService()
        const profile = addProfile('Kid')
        setActiveProfileId(profile.id)

        expect(() => { removeProfileFromRegistry('default') }).toThrow()
        removeProfileFromRegistry(profile.id)

        expect(readProfileRegistry().activeProfileId).toBe('default')
        expect(readProfileRegistry().profiles).toHaveLength(1)
    })

    it('keeps the registry and Drive token when local storage is cleared on reset', async () => {
        const { addProfile, clearLocalStorageForReset, readProfileRegistry } = await loadService()
        addProfile('Kid')
        window.localStorage.setItem('other', 'value')
        window.localStorage.setItem('bloodboy.googleDrive.accessToken', 'token')

        clearLocalStorageForReset()

        expect(window.localStorage.getItem('other')).toBeNull()
        expect(window.localStorage.getItem('bloodboy.googleDrive.accessToken')).toBe('token')
        expect(readProfileRegistry().profiles).toHaveLength(2)
    })

    it('rejects empty and duplicate profile names', async () => {
        const { addProfile, renameProfile, validateProfileName } = await loadService()
        const kid = addProfile('Kid')

        expect(validateProfileName('  ')).not.toBeNull()
        expect(validateProfileName(' kid ')).not.toBeNull()
        expect(validateProfileName('Kid', kid.id)).toBeNull()
        expect(() => addProfile('MAIN')).toThrow()
        expect(() => { renameProfile(kid.id, 'main') }).toThrow()
    })

    it('does not recover deleted profiles as orphans', async () => {
        vi.stubGlobal('indexedDB', {
            databases: vi.fn(() => Promise.resolve([{ name: 'bloodboy-db--deleted-id' }])),
        })
        const { readProfileRegistry, recoverOrphanProfiles, removeProfileFromRegistry, upsertProfile } = await loadService()
        upsertProfile({
            id: 'deleted-id',
            name: 'Gone',
            createdAt: new Date().toISOString(),
        })
        removeProfileFromRegistry('deleted-id')

        expect(await recoverOrphanProfiles()).toBe(false)
        expect(readProfileRegistry().profiles.map(profile => profile.id)).toEqual(['default'])
    })

    it('merges profile lists from two devices by latest change', async () => {
        const { mergeProfileSnapshots } = await loadService()
        const at = (minute: number) => new Date(Date.UTC(2026, 0, 1, 0, minute)).toISOString()
        const local = {
            profiles: [
                {
                    id: 'default',
                    name: 'Main',
                    createdAt: at(0),
                },
                {
                    id: 'a',
                    name: 'Anna',
                    createdAt: at(1),
                    updatedAt: at(5),
                },
                {
                    id: 'b',
                    name: 'Bob',
                    createdAt: at(1),
                    updatedAt: at(1),
                },
            ],
            deletedProfiles: [],
        }
        const remote = {
            profiles: [
                {
                    id: 'default',
                    name: 'Main',
                    createdAt: at(0),
                },
                {
                    id: 'a',
                    name: 'Anna old',
                    createdAt: at(1),
                    updatedAt: at(2),
                },
                {
                    id: 'c',
                    name: 'Cat',
                    createdAt: at(3),
                    updatedAt: at(3),
                },
            ],
            deletedProfiles: [{
                id: 'b',
                deletedAt: at(4),
            }],
        }

        const merged = mergeProfileSnapshots(local, remote)

        expect(merged.profiles.map(profile => profile.name)).toEqual(['Main', 'Anna', 'Cat'])
        expect(merged.deletedProfiles).toEqual([{
            id: 'b',
            deletedAt: at(4),
        }])
        expect(mergeProfileSnapshots(remote, local)).toEqual(merged)
    })

    it('restores a deleted profile when it changed after deletion', async () => {
        const { mergeProfileSnapshots } = await loadService()
        const merged = mergeProfileSnapshots(
            {
                profiles: [{
                    id: 'a',
                    name: 'Anna',
                    createdAt: '2026-01-01T00:00:00.000Z',
                    updatedAt: '2026-01-03T00:00:00.000Z',
                }],
                deletedProfiles: [],
            },
            {
                profiles: [],
                deletedProfiles: [{
                    id: 'a',
                    deletedAt: '2026-01-02T00:00:00.000Z',
                }],
            },
        )

        expect(merged.profiles.map(profile => profile.id)).toEqual(['default', 'a'])
        expect(merged.deletedProfiles).toEqual([])
    })

    it('keeps one Drive sync switch for all profiles', async () => {
        const { isGoogleDriveSyncEnabled, setGoogleDriveSyncEnabled } = await loadService()

        expect(isGoogleDriveSyncEnabled(true)).toBe(true)
        expect(isGoogleDriveSyncEnabled(undefined)).toBe(false)

        setGoogleDriveSyncEnabled(false)
        expect(isGoogleDriveSyncEnabled(true)).toBe(false)

        setGoogleDriveSyncEnabled(true)
        expect(isGoogleDriveSyncEnabled(undefined)).toBe(true)
    })

    it('recovers profile databases missing from the registry', async () => {
        vi.stubGlobal('indexedDB', {
            databases: vi.fn(() => Promise.resolve([
                { name: 'bloodboy-db' },
                { name: 'bloodboy-db--1234567890ab' },
                { name: 'unrelated' },
            ])),
        })
        const { readProfileRegistry, recoverOrphanProfiles } = await loadService()

        expect(await recoverOrphanProfiles()).toBe(true)
        expect(readProfileRegistry().profiles.map(profile => profile.id)).toEqual(['default', '1234567890ab'])
        expect(await recoverOrphanProfiles()).toBe(false)
    })

    it('tags export files only for extra profiles', async () => {
        const { getProfileFileTag } = await loadService()
        const createdAt = new Date(0).toISOString()

        expect(getProfileFileTag({
            id: 'default',
            name: 'Main',
            createdAt,
        })).toBe('')
        expect(getProfileFileTag({
            id: 'abcdef123456',
            name: 'Мама Anna!',
            createdAt,
        })).toBe('_мама-anna')
        expect(getProfileFileTag({
            id: 'abcdef123456',
            name: '!!!',
            createdAt,
        })).toBe('_abcdef12')
    })
})

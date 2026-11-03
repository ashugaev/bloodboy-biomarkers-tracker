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

    it('keeps the registry when local storage is cleared on reset', async () => {
        const { addProfile, clearLocalStorageExceptProfiles, readProfileRegistry } = await loadService()
        addProfile('Kid')
        window.localStorage.setItem('other', 'value')

        clearLocalStorageExceptProfiles()

        expect(window.localStorage.getItem('other')).toBeNull()
        expect(readProfileRegistry().profiles).toHaveLength(2)
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

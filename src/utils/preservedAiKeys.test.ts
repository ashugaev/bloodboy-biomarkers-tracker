import {
    beforeEach,
    describe,
    expect,
    it,
    vi,
} from 'vitest'

import { clearPreservedAiKeys, getAiKeysToPreserve, readPreservedAiKeys, savePreservedAiKeys } from './preservedAiKeys'

const createStorage = () => {
    const values = new Map<string, string>()
    return {
        getItem: (key: string) => values.get(key) ?? null,
        setItem: (key: string, value: string) => { values.set(key, value) },
        removeItem: (key: string) => { values.delete(key) },
    }
}

const baseSettings = {
    id: 'main',
    createdAt: new Date(),
    updatedAt: new Date(),
}

describe('preserved AI keys', () => {
    beforeEach(() => {
        vi.stubGlobal('sessionStorage', createStorage())
    })

    it('returns null when no key is set', () => {
        expect(getAiKeysToPreserve(undefined)).toBeNull()
        expect(getAiKeysToPreserve({
            ...baseSettings,
            openaiApiKey: '',
        })).toBeNull()
    })

    it('keeps both keys and the active provider', () => {
        expect(getAiKeysToPreserve({
            ...baseSettings,
            openaiApiKey: 'sk-openai',
            anthropicApiKey: 'sk-ant',
            aiProvider: 'anthropic',
        })).toEqual({
            openaiApiKey: 'sk-openai',
            anthropicApiKey: 'sk-ant',
            aiProvider: 'anthropic',
        })
    })

    it('round-trips through session storage', () => {
        savePreservedAiKeys({
            anthropicApiKey: 'sk-ant',
            aiProvider: 'anthropic',
        })
        expect(readPreservedAiKeys()).toEqual({
            anthropicApiKey: 'sk-ant',
            aiProvider: 'anthropic',
        })

        clearPreservedAiKeys()
        expect(readPreservedAiKeys()).toBeNull()
    })

    it('ignores malformed or empty entries', () => {
        sessionStorage.setItem('preservedAiKeys', '{not json')
        expect(readPreservedAiKeys()).toBeNull()

        savePreservedAiKeys({ aiProvider: 'openai' })
        expect(readPreservedAiKeys()).toBeNull()
    })
})

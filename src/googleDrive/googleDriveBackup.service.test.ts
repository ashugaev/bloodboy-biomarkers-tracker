import {
    beforeEach,
    describe,
    expect,
    it,
    vi,
} from 'vitest'

vi.mock('@/db/services/db.service', () => ({
    db: {
        appSettings: {
            limit: () => ({
                first: () => ({
                    id: 'settings',
                    openaiApiKey: '',
                    createdAt: new Date('2026-01-01T00:00:00Z'),
                    updatedAt: new Date('2026-01-01T00:00:00Z'),
                    googleDriveBackup: {
                        enabled: true,
                    },
                }),
            }),
            add: vi.fn(),
            update: vi.fn(),
        },
    },
}))

vi.mock('@/db/utils/exportStatus.utils', () => ({
    getLatestUserDataUpdatedAt: vi.fn(),
}))

vi.mock('@/utils/exportData', () => ({
    createDatabaseBackupBlob: vi.fn(),
}))

vi.mock('@/utils/importData', () => ({
    importDatabaseBackup: vi.fn(),
}))

const createDocument = () => ({
    getElementById: vi.fn(),
    createElement: vi.fn(),
    head: {
        appendChild: vi.fn(),
    },
})

describe('google drive backup service', () => {
    beforeEach(() => {
        vi.resetModules()
        vi.unstubAllGlobals()
        vi.stubGlobal('window', {
            localStorage: {
                getItem: vi.fn(() => null),
                setItem: vi.fn(),
                removeItem: vi.fn(),
            },
        })
    })

    it('does not start Google OAuth during non-interactive sync', async () => {
        const document = createDocument()
        vi.stubGlobal('document', document)

        const { syncDatabaseWithGoogleDrive } = await import('./googleDriveBackup.service')

        await expect(syncDatabaseWithGoogleDrive({ interactive: false })).rejects.toThrow('Google Drive sync needs reconnection')
        expect(document.createElement).not.toHaveBeenCalled()
        expect(document.head.appendChild).not.toHaveBeenCalled()
    })
})

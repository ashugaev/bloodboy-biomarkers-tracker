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
    getLatestUserDataUpdatedAt: vi.fn(() => Promise.resolve(new Date('2026-02-01T00:00:00Z'))),
}))

vi.mock('@/utils/exportData', () => ({
    createDatabaseBackupBlob: vi.fn(() => Promise.resolve(new Blob(['{}'], { type: 'application/json' }))),
}))

vi.mock('@/utils/importData', () => ({
    importDatabaseBackup: vi.fn(),
}))

interface DriveUpload {
    metadata: Record<string, unknown>
    content: string
}

const createStorage = (entries: Record<string, string>) => {
    const store = new Map(Object.entries(entries))

    return {
        getItem: (key: string) => store.get(key) ?? null,
        setItem: (key: string, value: string) => { store.set(key, value) },
        removeItem: (key: string) => { store.delete(key) },
    }
}

const createFakeDrive = () => {
    const folders: Array<{ name: string, parent?: string }> = []
    const uploads: DriveUpload[] = []

    const fetchMock = vi.fn(async (url: string, init?: RequestInit) => {
        const json = (value: unknown) => new Response(JSON.stringify(value), { status: 200 })

        if (url.includes('/upload/drive/v3/')) {
            const body = await (init?.body as Blob).text()
            const parts = body.split(/\r\n--bloodboy_backup_[^\r]+/)
            const metadataPart = parts[0].split('\r\n\r\n')[1]
            const contentPart = parts[1].split('\r\n\r\n')[1]
            const metadata = JSON.parse(metadataPart) as Record<string, unknown>
            uploads.push({
                metadata,
                content: contentPart,
            })
            return json({
                id: `file:${String(metadata.name)}`,
                name: metadata.name,
            })
        }

        if (init?.method === 'POST') {
            const metadata = JSON.parse(init.body as string) as { name: string, parents?: string[] }
            folders.push({
                name: metadata.name,
                parent: metadata.parents?.[0],
            })
            return json({
                id: `id:${metadata.name}`,
                name: metadata.name,
            })
        }

        return json({ files: [] })
    })

    return {
        fetchMock,
        folders,
        uploads,
    }
}

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

    it('keeps extra profile backups in their own folder and syncs the profile list', async () => {
        const registry = {
            activeProfileId: 'kid',
            profiles: [
                {
                    id: 'default',
                    name: 'Main',
                    createdAt: '1970-01-01T00:00:00.000Z',
                },
                {
                    id: 'kid',
                    name: 'Kid',
                    createdAt: '2026-01-01T00:00:00.000Z',
                },
            ],
            deletedProfiles: [],
        }
        vi.stubGlobal('window', {
            localStorage: createStorage({
                'bloodboy.profiles': JSON.stringify(registry),
                'bloodboy.googleDrive.accessToken': JSON.stringify({
                    accessToken: 'token',
                    expiresAt: Date.now() + 3_600_000,
                }),
            }),
        })
        const drive = createFakeDrive()
        vi.stubGlobal('fetch', drive.fetchMock)

        const { syncDatabaseWithGoogleDrive } = await import('./googleDriveBackup.service')
        const result = await syncDatabaseWithGoogleDrive({ interactive: false })

        expect(result.action).toBe('uploaded')
        expect(drive.folders).toContainEqual({
            name: 'profiles',
            parent: 'id:Bloodboy Backups',
        })
        expect(drive.folders).toContainEqual({
            name: 'kid',
            parent: 'id:profiles',
        })
        expect(drive.folders).toContainEqual({
            name: 'latest',
            parent: 'id:kid',
        })
        expect(drive.folders).toContainEqual({
            name: 'history',
            parent: 'id:kid',
        })

        const manifest = drive.uploads.find(upload => upload.metadata.name === 'bloodboy_backup_manifest.json')
        expect(manifest?.metadata.parents).toEqual(['id:kid'])
        expect(JSON.parse(manifest?.content ?? '{}')).toMatchObject({
            profile: {
                id: 'kid',
                name: 'Kid',
            },
            structure: { latest: '/Bloodboy Backups/profiles/kid/latest/bloodboy_db_backup_latest.json' },
        })

        const profilesFile = drive.uploads.find(upload => upload.metadata.name === 'bloodboy_profiles.json')
        expect(profilesFile?.metadata.parents).toEqual(['id:Bloodboy Backups'])
        expect((JSON.parse(profilesFile?.content ?? '{}') as { profiles: Array<{ id: string }> }).profiles.map(profile => profile.id))
            .toEqual(['default', 'kid'])
    })

    it('keeps the main profile backup layout and skips the profile list for main only', async () => {
        vi.stubGlobal('window', {
            localStorage: createStorage({
                'bloodboy.googleDrive.accessToken': JSON.stringify({
                    accessToken: 'token',
                    expiresAt: Date.now() + 3_600_000,
                }),
            }),
        })
        const drive = createFakeDrive()
        vi.stubGlobal('fetch', drive.fetchMock)

        const { syncDatabaseWithGoogleDrive } = await import('./googleDriveBackup.service')
        await syncDatabaseWithGoogleDrive({ interactive: false })

        expect(drive.folders).toContainEqual({
            name: 'latest',
            parent: 'id:Bloodboy Backups',
        })
        expect(drive.folders.map(folder => folder.name)).not.toContain('profiles')
        expect(drive.uploads.map(upload => upload.metadata.name)).not.toContain('bloodboy_profiles.json')
        const manifest = drive.uploads.find(upload => upload.metadata.name === 'bloodboy_backup_manifest.json')
        expect(manifest?.metadata.parents).toEqual(['id:Bloodboy Backups'])
    })
})

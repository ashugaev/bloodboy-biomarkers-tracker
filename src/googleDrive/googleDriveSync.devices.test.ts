import {
    beforeEach,
    describe,
    expect,
    it,
    vi,
} from 'vitest'

interface DeviceData {
    version: string | null
    items: string[]
}

interface Device {
    data: DeviceData
    settings: Record<string, unknown> & { id: string, googleDriveBackup?: Record<string, unknown> }
    storage: Map<string, string>
}

interface DriveFile {
    name: string
    parents: string[]
    mimeType?: string
    content: string
}

const devices = vi.hoisted(() => ({ current: null as Device | null }))

const currentDevice = (): Device => {
    if (!devices.current) {
        throw new Error('No device selected')
    }
    return devices.current
}

vi.mock('@/db/services/db.service', () => ({
    db: {
        appSettings: {
            limit: () => ({ first: () => Promise.resolve(currentDevice().settings) }),
            add: vi.fn(),
            update: vi.fn((_id: string, patch: Record<string, unknown>) => {
                Object.assign(currentDevice().settings, patch)
                return Promise.resolve(1)
            }),
        },
    },
}))

vi.mock('@/db/utils/exportStatus.utils', () => ({
    getLatestUserDataUpdatedAt: vi.fn(() => {
        const { version } = currentDevice().data
        return Promise.resolve(version ? new Date(version) : null)
    }),
    getUserDataFingerprint: vi.fn(() => {
        const { version, items } = currentDevice().data
        return Promise.resolve(items.length ? `${version}|${items.join(',')}` : null)
    }),
}))

vi.mock('@/utils/exportData', () => ({
    createDatabaseBackupBlob: vi.fn(() => Promise.resolve(new Blob([JSON.stringify(currentDevice().data)], { type: 'application/json' }))),
}))

vi.mock('@/utils/importData', () => ({
    importDatabaseBackup: vi.fn(async (blob: Blob, options: { googleDriveBackup?: Record<string, unknown>, afterImport?: () => Promise<void> }) => {
        const device = currentDevice()
        device.data = JSON.parse(await blob.text()) as DeviceData
        device.settings.googleDriveBackup = options.googleDriveBackup
        await options.afterImport?.()
    }),
}))

const createFakeDrive = () => {
    const files = new Map<string, DriveFile>()
    let nextId = 1
    const json = (value: unknown) => new Response(JSON.stringify(value), { status: 200 })

    const parseMultipart = async (body: Blob) => {
        const parts = (await body.text()).split(/\r\n--bloodboy_backup_[^\r]+/)
        return {
            metadata: JSON.parse(parts[0].split('\r\n\r\n')[1]) as { name: string, parents?: string[], mimeType?: string },
            content: parts[1].split('\r\n\r\n')[1],
        }
    }

    const fetchMock = vi.fn(async (url: string, init?: RequestInit) => {
        const { pathname, searchParams } = new URL(url)
        const fileId = /\/files\/([^/?]+)/.exec(pathname)?.[1]

        if (pathname.startsWith('/upload/')) {
            const { metadata, content } = await parseMultipart(init?.body as Blob)
            if (init?.method === 'PATCH' && fileId) {
                const file = files.get(fileId)
                if (!file) return new Response('{}', { status: 404 })
                files.set(fileId, {
                    ...file,
                    content,
                })
                return json({
                    id: fileId,
                    name: file.name,
                })
            }
            const id = `f${nextId++}`
            files.set(id, {
                name: metadata.name,
                parents: metadata.parents ?? [],
                mimeType: metadata.mimeType,
                content,
            })
            return json({
                id,
                name: metadata.name,
            })
        }

        if (init?.method === 'POST') {
            const metadata = JSON.parse(init.body as string) as { name: string, parents?: string[], mimeType?: string }
            const id = `f${nextId++}`
            files.set(id, {
                name: metadata.name,
                parents: metadata.parents ?? [],
                mimeType: metadata.mimeType,
                content: '',
            })
            return json({
                id,
                name: metadata.name,
            })
        }

        if (fileId && searchParams.get('alt') === 'media') {
            const file = files.get(fileId)
            return file ? new Response(file.content, { status: 200 }) : new Response('{}', { status: 404 })
        }

        const query = searchParams.get('q') ?? ''
        const name = /name='((?:[^'\\]|\\.)*)'/.exec(query)?.[1]
        const parent = /'([^']+)' in parents/.exec(query)?.[1]
        const mimeType = /mimeType='([^']+)'/.exec(query)?.[1]
        const found = [...files.entries()].find(([, file]) => (
            file.name === name &&
            (!parent || file.parents.includes(parent)) &&
            (!mimeType || file.mimeType === mimeType)
        ))

        return json({
            files: found ? [{
                id: found[0],
                name: found[1].name,
            }] : [],
        })
    })

    const readLatest = () => {
        const latest = [...files.values()].find(file => file.name === 'bloodboy_db_backup_latest.json')
        return latest ? JSON.parse(latest.content) as DeviceData : null
    }

    const fileNames = () => [...files.values()].map(file => file.name)

    return {
        fetchMock,
        readLatest,
        fileNames,
    }
}

const createDevice = (data: DeviceData): Device => ({
    data,
    settings: {
        id: 'settings',
        openaiApiKey: '',
        createdAt: new Date('2026-01-01T00:00:00Z'),
        updatedAt: new Date('2026-01-01T00:00:00Z'),
        googleDriveBackup: { enabled: true },
    },
    storage: new Map([[
        'bloodboy.googleDrive.accessToken',
        JSON.stringify({
            accessToken: 'token',
            expiresAt: Date.now() + 3_600_000,
        }),
    ]]),
})

const tick = async () => { await new Promise(resolve => setTimeout(resolve, 5)) }

const loadService = async () => {
    vi.resetModules()
    return await import('./googleDriveBackup.service')
}

describe('google drive sync between two devices', () => {
    let drive: ReturnType<typeof createFakeDrive>
    let laptop: Device
    let phone: Device

    const use = async (device: Device) => {
        devices.current = device
        vi.stubGlobal('window', {
            localStorage: {
                getItem: (key: string) => device.storage.get(key) ?? null,
                setItem: (key: string, value: string) => { device.storage.set(key, value) },
                removeItem: (key: string) => { device.storage.delete(key) },
            },
        })
        await tick()
        return await loadService()
    }

    const edit = (device: Device, item: string) => {
        device.data = {
            version: new Date().toISOString(),
            items: [...device.data.items, item],
        }
    }

    beforeEach(() => {
        vi.unstubAllGlobals()
        drive = createFakeDrive()
        vi.stubGlobal('fetch', drive.fetchMock)
        laptop = createDevice({
            version: '2026-02-01T00:00:00.000Z',
            items: ['laptop-1'],
        })
        phone = createDevice({
            version: null,
            items: [],
        })
    })

    it('passes edits back and forth without losing data', async () => {
        expect((await (await use(laptop)).syncDatabaseWithGoogleDrive({ interactive: false })).action).toBe('uploaded')

        expect((await (await use(phone)).syncDatabaseWithGoogleDrive({ interactive: false })).action).toBe('downloaded')
        expect(phone.data.items).toEqual(['laptop-1'])
        expect((await (await use(phone)).syncDatabaseWithGoogleDrive({ interactive: false })).action).toBe('none')

        edit(phone, 'phone-1')
        expect((await (await use(phone)).syncDatabaseWithGoogleDrive({ interactive: false })).action).toBe('uploaded')

        expect((await (await use(laptop)).syncDatabaseWithGoogleDrive({ interactive: false })).action).toBe('downloaded')
        expect(laptop.data.items).toEqual(['laptop-1', 'phone-1'])

        laptop.data = {
            ...laptop.data,
            items: ['phone-1'],
        }
        expect((await (await use(laptop)).syncDatabaseWithGoogleDrive({ interactive: false })).action).toBe('uploaded')
        expect((await (await use(phone)).syncDatabaseWithGoogleDrive({ interactive: false })).action).toBe('downloaded')
        expect(phone.data.items).toEqual(['phone-1'])
        expect((await (await use(phone)).syncDatabaseWithGoogleDrive({ interactive: false })).action).toBe('none')
    })

    it('asks instead of overwriting when both devices changed since the last sync', async () => {
        await (await use(laptop)).syncDatabaseWithGoogleDrive({ interactive: false })
        await (await use(phone)).syncDatabaseWithGoogleDrive({ interactive: false })

        edit(laptop, 'laptop-offline')
        edit(phone, 'phone-2')
        await (await use(phone)).syncDatabaseWithGoogleDrive({ interactive: false })

        const service = await use(laptop)
        const conflict = await service.syncDatabaseWithGoogleDrive({ interactive: false })
        expect(conflict.action).toBe('conflict')
        expect(conflict.conflictBackupFileName).toMatch(/_conflict_this_device\.json$/)
        expect(laptop.data.items).toEqual(['laptop-1', 'laptop-offline'])
        expect(drive.readLatest()?.items).toEqual(['laptop-1', 'phone-2'])

        expect((await (await use(laptop)).syncDatabaseWithGoogleDrive({ interactive: false })).action).toBe('conflict')
        expect(drive.fileNames().filter(name => name.includes('_conflict_'))).toHaveLength(1)

        await (await use(laptop)).resolveGoogleDriveSyncConflict('remote')
        expect(laptop.data.items).toEqual(['laptop-1', 'phone-2'])
        expect((await (await use(laptop)).syncDatabaseWithGoogleDrive({ interactive: false })).action).toBe('none')
    })

    it('keeps this device version on request', async () => {
        await (await use(laptop)).syncDatabaseWithGoogleDrive({ interactive: false })
        await (await use(phone)).syncDatabaseWithGoogleDrive({ interactive: false })

        edit(laptop, 'laptop-offline')
        edit(phone, 'phone-2')
        await (await use(phone)).syncDatabaseWithGoogleDrive({ interactive: false })
        await (await use(laptop)).syncDatabaseWithGoogleDrive({ interactive: false })

        await (await use(laptop)).resolveGoogleDriveSyncConflict('local')
        expect(drive.readLatest()?.items).toEqual(['laptop-1', 'laptop-offline'])
        expect((await (await use(phone)).syncDatabaseWithGoogleDrive({ interactive: false })).action).toBe('downloaded')
        expect(phone.data.items).toEqual(['laptop-1', 'laptop-offline'])
    })

    it('does not overwrite Drive when a browser with its own data connects', async () => {
        await (await use(laptop)).syncDatabaseWithGoogleDrive({ interactive: false })

        phone.data = {
            version: '2026-05-01T00:00:00.000Z',
            items: ['phone-own'],
        }
        phone.settings.googleDriveBackup = undefined
        const result = await (await use(phone)).syncDatabaseWithGoogleDrive({
            interactive: false,
            forceEnable: true,
        })

        expect(result.action).toBe('conflict')
        expect(drive.readLatest()?.items).toEqual(['laptop-1'])
        expect(phone.data.items).toEqual(['phone-own'])
    })
})

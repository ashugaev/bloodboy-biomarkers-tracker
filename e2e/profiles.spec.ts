import { expect as baseExpect, Page, test } from '@playwright/test'

const expect = baseExpect.configure({ timeout: 15_000 })

declare global {
    interface Window {
        __bloodboyE2E?: {
            seedExactFileDuplicateScenario(fileHash: string): Promise<void>
        }
    }
}

test.describe.configure({ timeout: 120_000 })

interface StoredRegistry {
    activeProfileId: string
    profiles: Array<{ id: string, name: string }>
}

const readStoreRows = async (page: Page, dbName: string, storeName: string) => {
    return await page.evaluate(async ([name, store]) => {
        return await new Promise<unknown[]>((resolve, reject) => {
            const request = indexedDB.open(name)
            request.onerror = () => { reject(request.error) }
            request.onsuccess = () => {
                const database = request.result
                const rowsRequest = database.transaction(store, 'readonly').objectStore(store).getAll()
                rowsRequest.onerror = () => { reject(rowsRequest.error) }
                rowsRequest.onsuccess = () => {
                    database.close()
                    resolve(rowsRequest.result)
                }
            }
        })
    }, [dbName, storeName] as const)
}

const countRows = async (page: Page, dbName: string, storeName: string) => {
    return (await readStoreRows(page, dbName, storeName)).length
}

const readRegistry = async (page: Page) => {
    return await page.evaluate(() => JSON.parse(window.localStorage.getItem('bloodboy.profiles') ?? 'null') as StoredRegistry | null)
}

const listDatabaseNames = async (page: Page) => {
    return await page.evaluate(async () => (await indexedDB.databases()).map(database => database.name))
}

const seedLoadedProfile = async (page: Page, fileHash: string) => {
    await page.waitForFunction(() => typeof window.__bloodboyE2E !== 'undefined')
    await page.evaluate(async (hash) => {
        await window.__bloodboyE2E?.seedExactFileDuplicateScenario(hash)
    }, fileHash)
}

const startWithMainData = async (page: Page) => {
    await page.goto('/data')
    await page.waitForFunction(() => typeof window.__bloodboyE2E !== 'undefined')
    await page.evaluate(() => { window.localStorage.removeItem('bloodboy.profiles') })
    await seedLoadedProfile(page, 'main-profile-hash')
    await page.goto('/data')
}

const createProfile = async (page: Page, name: string) => {
    const profileButton = page.getByRole('button', { name: 'Profile' })
    await profileButton.click()
    await page.getByText('Manage profiles').click()
    await page.getByPlaceholder('New profile name').fill(name)
    await page.getByRole('button', { name: 'Create and switch' }).click()
    await expect(profileButton).toHaveText(name)

    const registry = await readRegistry(page)
    const profile = registry?.profiles.find(item => item.name === name)
    expect(profile).toBeDefined()

    return {
        id: profile?.id ?? '',
        dbName: `bloodboy-db--${profile?.id}`,
    }
}

const openMenu = async (page: Page) => {
    await page.locator('header .anticon-menu').locator('..').click()
}

test('switches between isolated profiles and deletes one after its backup', async ({ page }) => {
    await startWithMainData(page)
    const profileButton = page.getByRole('button', { name: 'Profile' })
    await expect(profileButton).toHaveText('Main')

    const partner = await createProfile(page, 'Partner')
    expect((await readRegistry(page))?.activeProfileId).toBe(partner.id)
    expect(await countRows(page, 'bloodboy-db', 'uploadedFiles')).toBe(1)
    expect(await countRows(page, partner.dbName, 'uploadedFiles')).toBe(0)
    expect(await readStoreRows(page, partner.dbName, 'appSettings')).toEqual([
        expect.objectContaining({ openaiApiKey: 'e2e-test-key' }),
    ])

    await profileButton.click()
    await page.getByRole('menuitem', { name: 'Main' }).click()
    await expect(profileButton).toHaveText('Main')

    await profileButton.click()
    await page.getByText('Manage profiles').click()
    await page.getByRole('button', { name: 'Delete Partner' }).click()
    const deleteButton = page.getByRole('button', { name: 'Backup saved, delete' })
    await expect(deleteButton).toBeDisabled()

    const downloadPromise = page.waitForEvent('download')
    await page.getByRole('button', { name: 'Download backup' }).click()
    const download = await downloadPromise
    expect(download.suggestedFilename()).toMatch(/^bloodboy_db_backup_partner_\d{4}-\d{2}-\d{2}\.json$/)

    await deleteButton.click()
    await expect(page.getByRole('button', { name: 'Delete Partner' })).toHaveCount(0)
    expect((await readRegistry(page))?.profiles.map(profile => profile.id)).toEqual(['default'])
    expect(await listDatabaseNames(page)).not.toContain(partner.dbName)
    expect(await countRows(page, 'bloodboy-db', 'uploadedFiles')).toBe(1)
})

test('rejects duplicate profile names', async ({ page }) => {
    await startWithMainData(page)
    await page.getByRole('button', { name: 'Profile' }).click()
    await page.getByText('Manage profiles').click()
    await page.getByPlaceholder('New profile name').fill(' main ')

    await expect(page.getByText('A profile with this name already exists')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Create and switch' })).toBeDisabled()
})

test('imports a main profile backup into another profile', async ({ page }) => {
    await startWithMainData(page)

    await openMenu(page)
    const exportPromise = page.waitForEvent('download', { predicate: download => download.suggestedFilename().endsWith('.json') })
    await page.getByRole('menuitem', { name: 'Export DB' }).click()
    const backup = await exportPromise
    expect(backup.suggestedFilename()).toMatch(/^bloodboy_db_backup_\d{4}-\d{2}-\d{2}\.json$/)
    const backupPath = await backup.path()

    const imported = await createProfile(page, 'Imported')
    expect(await countRows(page, imported.dbName, 'uploadedFiles')).toBe(0)

    await page.locator('input[type=file][accept=".json"]').setInputFiles(backupPath)
    await expect(page.getByText('into profile "Imported"')).toBeVisible()
    const importReload = page.waitForEvent('load')
    await page.getByRole('button', { name: 'Yes, Import' }).click()
    await importReload
    await expect(page.getByRole('button', { name: 'Profile' })).toHaveText('Imported')

    await expect.poll(async () => await countRows(page, imported.dbName, 'uploadedFiles')).toBe(1)
    expect(await countRows(page, 'bloodboy-db', 'uploadedFiles')).toBe(1)
})

test('exports all profiles in one file and restores them on a clean browser', async ({ page, browser }) => {
    await startWithMainData(page)
    const partner = await createProfile(page, 'Partner')
    await seedLoadedProfile(page, 'partner-profile-hash')
    await page.goto('/data')

    await openMenu(page)
    const exportPromise = page.waitForEvent('download')
    await page.getByRole('menuitem', { name: 'Export all profiles' }).click()
    const bundle = await exportPromise
    expect(bundle.suggestedFilename()).toMatch(/^bloodboy_all_profiles_backup_\d{4}-\d{2}-\d{2}\.json$/)
    const bundlePath = await bundle.path()

    const cleanContext = await browser.newContext()
    const cleanPage = await cleanContext.newPage()
    await cleanPage.goto('/data')
    await expect(cleanPage.getByRole('button', { name: 'Profile' })).toHaveText('Main')

    await cleanPage.locator('input[type=file][accept=".json"]').setInputFiles(bundlePath)
    await expect(cleanPage.getByText('This file contains 2 profiles: Main, Partner.')).toBeVisible()
    const importReload = cleanPage.waitForEvent('load')
    await cleanPage.getByRole('button', { name: 'Yes, Import' }).click()
    await importReload

    await expect.poll(async () => (await readRegistry(cleanPage))?.profiles.map(profile => profile.name)).toEqual(['Main', 'Partner'])
    expect((await readRegistry(cleanPage))?.profiles[1].id).toBe(partner.id)
    await expect.poll(async () => await readStoreRows(cleanPage, 'bloodboy-db', 'uploadedFiles')).toEqual([
        expect.objectContaining({ fileHash: 'main-profile-hash' }),
    ])
    expect(await readStoreRows(cleanPage, partner.dbName, 'uploadedFiles')).toEqual([
        expect.objectContaining({ fileHash: 'partner-profile-hash' }),
    ])

    await cleanContext.close()
})

test('clears only the current profile and keeps Google Drive signed in', async ({ page }) => {
    await startWithMainData(page)
    const partner = await createProfile(page, 'Partner')
    await seedLoadedProfile(page, 'partner-profile-hash')
    await page.evaluate(() => {
        window.localStorage.setItem('bloodboy.googleDrive.accessToken', JSON.stringify({ accessToken: 'token', expiresAt: 1 }))
    })
    await page.goto('/data')

    await openMenu(page)
    await page.getByRole('menuitem', { name: 'Clear DB' }).click()
    await expect(page.getByText('Clear profile "Partner"')).toBeVisible()
    await page.getByRole('button', { name: 'Yes, Delete Everything' }).click()
    await page.waitForURL(url => !url.pathname.endsWith('/data'))

    await expect.poll(async () => (await readRegistry(page))?.activeProfileId).toBe(partner.id)
    expect(await page.evaluate(() => window.localStorage.getItem('bloodboy.googleDrive.accessToken'))).not.toBeNull()
    expect(await countRows(page, 'bloodboy-db', 'uploadedFiles')).toBe(1)
    await expect.poll(async () => await countRows(page, partner.dbName, 'uploadedFiles')).toBe(0)
})

test('reloads a tab whose profile was deleted in another tab', async ({ page, context }) => {
    await startWithMainData(page)
    const partner = await createProfile(page, 'Partner')

    const otherTab = await context.newPage()
    await otherTab.goto('/data')
    const otherProfileButton = otherTab.getByRole('button', { name: 'Profile' })
    await expect(otherProfileButton).toHaveText('Partner')
    await otherProfileButton.click()
    await otherTab.getByRole('menuitem', { name: 'Main' }).click()
    await expect(otherProfileButton).toHaveText('Main')

    await otherProfileButton.click()
    await otherTab.getByText('Manage profiles').click()
    await otherTab.getByRole('button', { name: 'Delete Partner' }).click()
    const downloadPromise = otherTab.waitForEvent('download')
    await otherTab.getByRole('button', { name: 'Download backup' }).click()
    await downloadPromise
    await otherTab.getByRole('button', { name: 'Backup saved, delete' }).click()
    await expect(otherTab.getByRole('button', { name: 'Delete Partner' })).toHaveCount(0)

    await expect(page.getByRole('button', { name: 'Profile' })).toHaveText('Main')
    expect(await listDatabaseNames(page)).not.toContain(partner.dbName)
})

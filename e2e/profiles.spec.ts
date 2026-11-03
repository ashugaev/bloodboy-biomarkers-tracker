import { expect, Page, test } from '@playwright/test'

declare global {
    interface Window {
        __bloodboyE2E?: {
            seedExactFileDuplicateScenario(fileHash: string): Promise<void>
        }
    }
}

const countRows = async (page: Page, dbName: string, storeName: string) => {
    return await page.evaluate(async ([name, store]) => {
        return await new Promise<number>((resolve, reject) => {
            const request = indexedDB.open(name)
            request.onerror = () => { reject(request.error) }
            request.onsuccess = () => {
                const database = request.result
                const countRequest = database.transaction(store, 'readonly').objectStore(store).count()
                countRequest.onerror = () => { reject(countRequest.error) }
                countRequest.onsuccess = () => {
                    database.close()
                    resolve(countRequest.result)
                }
            }
        })
    }, [dbName, storeName] as const)
}

const readRegistry = async (page: Page) => {
    return await page.evaluate(() => JSON.parse(window.localStorage.getItem('bloodboy.profiles') ?? 'null') as {
        activeProfileId: string
        profiles: Array<{ id: string, name: string }>
    } | null)
}

const listDatabaseNames = async (page: Page) => {
    return await page.evaluate(async () => (await indexedDB.databases()).map(database => database.name))
}

test('switches between isolated profiles and keeps main data', async ({ page }) => {
    await page.goto('/data')
    await page.waitForFunction(() => typeof window.__bloodboyE2E !== 'undefined')
    await page.evaluate(async () => {
        window.localStorage.removeItem('bloodboy.profiles')
        await window.__bloodboyE2E?.seedExactFileDuplicateScenario('main-profile-hash')
    })
    await page.goto('/data')

    const profileButton = page.getByRole('button', { name: 'Profile' })
    await expect(profileButton).toHaveText('Main')

    await profileButton.click()
    await page.getByText('Manage profiles').click()
    await page.getByPlaceholder('New profile name').fill('Partner')
    await page.getByRole('button', { name: 'Create and switch' }).click()

    await expect(profileButton).toHaveText('Partner')
    const registry = await readRegistry(page)
    const partner = registry?.profiles.find(profile => profile.name === 'Partner')
    expect(partner).toBeDefined()
    expect(registry?.activeProfileId).toBe(partner?.id)

    const partnerDbName = `bloodboy-db--${partner?.id}`
    expect(await countRows(page, 'bloodboy-db', 'uploadedFiles')).toBe(1)
    expect(await countRows(page, partnerDbName, 'uploadedFiles')).toBe(0)
    expect(await countRows(page, partnerDbName, 'appSettings')).toBe(1)

    await profileButton.click()
    await page.getByRole('menuitem', { name: 'Main' }).click()
    await expect(profileButton).toHaveText('Main')

    await profileButton.click()
    await page.getByText('Manage profiles').click()
    await page.getByRole('button', { name: 'Delete Partner' }).click()
    const downloadPromise = page.waitForEvent('download')
    await page.getByRole('button', { name: 'Download backup and delete' }).click()
    const download = await downloadPromise

    expect(download.suggestedFilename()).toMatch(/^bloodboy_db_backup_partner_\d{4}-\d{2}-\d{2}\.json$/)
    await expect(page.getByRole('button', { name: 'Delete Partner' })).toHaveCount(0)
    expect((await readRegistry(page))?.profiles.map(profile => profile.id)).toEqual(['default'])
    expect(await listDatabaseNames(page)).not.toContain(partnerDbName)
    expect(await countRows(page, 'bloodboy-db', 'uploadedFiles')).toBe(1)
})

test('imports a main profile backup into another profile', async ({ page }) => {
    await page.goto('/data')
    await page.waitForFunction(() => typeof window.__bloodboyE2E !== 'undefined')
    await page.evaluate(async () => {
        window.localStorage.removeItem('bloodboy.profiles')
        await window.__bloodboyE2E?.seedExactFileDuplicateScenario('import-profile-hash')
    })
    await page.goto('/data')

    const menuButton = page.locator('header .anticon-menu').locator('..')
    await menuButton.click()
    const exportPromise = page.waitForEvent('download', { predicate: download => download.suggestedFilename().endsWith('.json') })
    await page.getByRole('menuitem', { name: 'Export DB' }).click()
    const backup = await exportPromise
    const backupPath = await backup.path()
    expect(backup.suggestedFilename()).toMatch(/^bloodboy_db_backup_\d{4}-\d{2}-\d{2}\.json$/)

    const profileButton = page.getByRole('button', { name: 'Profile' })
    await profileButton.click()
    await page.getByText('Manage profiles').click()
    await page.getByPlaceholder('New profile name').fill('Imported')
    await page.getByRole('button', { name: 'Create and switch' }).click()
    await expect(profileButton).toHaveText('Imported')

    const registry = await readRegistry(page)
    const imported = registry?.profiles.find(profile => profile.name === 'Imported')
    const importedDbName = `bloodboy-db--${imported?.id}`
    expect(await countRows(page, importedDbName, 'uploadedFiles')).toBe(0)

    await page.locator('input[type=file][accept=".json"]').setInputFiles(backupPath)
    await page.getByRole('button', { name: 'Yes, Import' }).click()
    await page.waitForURL('**/data')
    await expect(profileButton).toHaveText('Imported')

    await expect.poll(async () => await countRows(page, importedDbName, 'uploadedFiles')).toBe(1)
    expect(await countRows(page, 'bloodboy-db', 'uploadedFiles')).toBe(1)
})

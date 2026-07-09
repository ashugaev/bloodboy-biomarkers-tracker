import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import path from 'node:path'

import { expect, test } from '@playwright/test'

declare global {
    interface Window {
        __bloodboyE2E?: {
            reset(): Promise<void>
            seedExactFileDuplicateScenario(fileHash: string): Promise<void>
        }
    }
}

const fixturePath = path.join(process.cwd(), 'e2e/fixtures/exact-duplicate.pdf')
const fixtureHash = createHash('sha256').update(readFileSync(fixturePath)).digest('hex')

test.beforeEach(async ({ page }) => {
    await page.goto('/data')
    await page.waitForFunction(() => typeof window.__bloodboyE2E !== 'undefined')
})

test('excludes an identical file on upload with a notification', async ({ page }) => {
    await page.evaluate(async (fileHash) => {
        await window.__bloodboyE2E?.seedExactFileDuplicateScenario(fileHash)
    }, fixtureHash)

    await page.reload()
    await page.locator('input[name="file"]').setInputFiles(fixturePath)

    await expect(page.getByText('File excluded as duplicate')).toBeVisible()
    await expect(page.getByText('is identical to a file you already uploaded')).toBeVisible()

    // The duplicate file is not added: the files list still shows only the seeded document.
    await page.getByRole('tab', { name: 'Files' }).click()
    await expect(page.getByRole('gridcell', { name: 'exact-duplicate.pdf' })).toHaveCount(1)
})

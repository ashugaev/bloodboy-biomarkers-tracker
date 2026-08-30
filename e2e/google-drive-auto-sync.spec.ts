import { expect, test } from '@playwright/test'

declare global {
    interface Window {
        __bloodboyE2E?: {
            seedGoogleDriveAutoSyncScenario(): Promise<void>
        }
    }
}

test('does not start Google OAuth from automatic sync', async ({ page }) => {
    await page.goto('/data')
    await page.waitForFunction(() => typeof window.__bloodboyE2E !== 'undefined')
    await page.evaluate(async () => {
        await window.__bloodboyE2E?.seedGoogleDriveAutoSyncScenario()
    })

    await page.goto('/data')
    await page.waitForTimeout(3500)

    await expect(page.locator('script[src="https://accounts.google.com/gsi/client"]')).toHaveCount(0)
})

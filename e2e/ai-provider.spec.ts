import path from 'node:path'

import { expect, Page, Route, test } from '@playwright/test'

declare global {
    interface Window {
        __bloodboyE2E?: {
            seedNoApiKeyScenario(): Promise<void>
        }
    }
}

const fixturePath = path.join(process.cwd(), 'e2e/fixtures/exact-duplicate.pdf')

const extractionJson = JSON.stringify({
    biomarkers: [{
        name: 'E2E Glucose',
        originalName: 'E2E Glucose',
        value: 5.2,
        unit: 'mmol/L',
        ucumCode: 'mmol/L',
        referenceRange: {
            min: 3.9,
            max: 5.5,
        },
        order: 0,
    }],
    testDate: '2026-01-15',
    labName: 'E2E Lab',
})

const corsHeaders = {
    'access-control-allow-origin': '*',
    'access-control-allow-methods': 'POST, OPTIONS',
    'access-control-allow-headers': '*',
}

const fulfillJson = async (route: Route, body: unknown) => {
    if (route.request().method() === 'OPTIONS') {
        await route.fulfill({
            status: 204,
            headers: corsHeaders,
        })
        return
    }

    await route.fulfill({
        status: 200,
        headers: {
            ...corsHeaders,
            'content-type': 'application/json',
        },
        body: JSON.stringify(body),
    })
}

const seedWithoutKey = async (page: Page) => {
    await page.goto('/data')
    await page.waitForFunction(() => typeof window.__bloodboyE2E !== 'undefined')
    await page.evaluate(async () => {
        await window.__bloodboyE2E?.seedNoApiKeyScenario()
    })
    await page.reload()
}

const saveKey = async (page: Page, providerLabel: string, apiKey: string) => {
    await expect(page.getByRole('heading', { name: 'AI API Key' })).toBeVisible()
    await page.getByText(providerLabel, { exact: true }).click()
    await page.getByLabel(`${providerLabel} API key`).fill(apiKey)
    await page.getByRole('button', { name: 'Save' }).click()
    await expect(page.locator('input[name="file"]')).toBeAttached()
}

test('extracts with a Claude API key', async ({ page }) => {
    const anthropicRequests: Array<{ headers: Record<string, string>, body: Record<string, unknown> }> = []

    await page.route('https://api.anthropic.com/**', async (route) => {
        if (route.request().method() === 'POST') {
            anthropicRequests.push({
                headers: await route.request().allHeaders(),
                body: route.request().postDataJSON() as Record<string, unknown>,
            })
        }
        await fulfillJson(route, {
            id: 'msg_e2e',
            type: 'message',
            role: 'assistant',
            model: 'claude-opus-5-5',
            content: [{
                type: 'text',
                text: `\`\`\`json\n${extractionJson}\n\`\`\``,
            }],
            stop_reason: 'end_turn',
            stop_sequence: null,
            usage: {
                input_tokens: 1,
                output_tokens: 1,
            },
        })
    })
    await page.route('https://api.openai.com/**', async (route) => {
        await route.abort()
    })

    await seedWithoutKey(page)
    await saveKey(page, 'Claude', 'sk-ant-e2e')

    await page.locator('input[name="file"]').setInputFiles(fixturePath)
    await expect(page.getByText('E2E Glucose').first()).toBeVisible({ timeout: 30000 })

    expect(anthropicRequests.length).toBeGreaterThan(0)
    const [request] = anthropicRequests
    expect(request.headers.authorization).toBe('Bearer sk-ant-e2e')
    expect(request.headers['anthropic-dangerous-direct-browser-access']).toBe('true')
    expect(request.body.model).toBe('claude-opus-5-5')
    expect(JSON.stringify(request.body.messages)).toContain('"type":"image"')
})

test('extracts with an OpenAI API key', async ({ page }) => {
    let openaiCalls = 0

    await page.route('https://api.openai.com/**', async (route) => {
        if (route.request().method() === 'POST') openaiCalls++
        await fulfillJson(route, {
            id: 'chatcmpl-e2e',
            object: 'chat.completion',
            created: 0,
            model: 'gpt-5.4',
            choices: [{
                index: 0,
                message: {
                    role: 'assistant',
                    content: extractionJson,
                },
                finish_reason: 'stop',
            }],
        })
    })
    await page.route('https://api.anthropic.com/**', async (route) => {
        await route.abort()
    })

    await seedWithoutKey(page)
    await saveKey(page, 'OpenAI', 'sk-openai-e2e')

    await page.locator('input[name="file"]').setInputFiles(fixturePath)
    await expect(page.getByText('E2E Glucose').first()).toBeVisible({ timeout: 30000 })
    expect(openaiCalls).toBeGreaterThan(0)
})

test('switches provider from the menu and keeps both keys', async ({ page }) => {
    await seedWithoutKey(page)
    await saveKey(page, 'OpenAI', 'sk-openai-e2e')

    await page.locator('header').getByRole('button').last().click()
    await page.getByText('AI provider', { exact: true }).click()

    const dialog = page.getByRole('dialog', { name: 'AI provider' })
    await dialog.getByText('Claude', { exact: true }).click()
    await dialog.getByLabel('Claude API key').fill('sk-ant-e2e')
    await dialog.getByRole('button', { name: 'Save' }).click()
    await expect(dialog).toBeHidden()

    await page.locator('header').getByRole('button').last().click()
    await page.getByText('AI provider', { exact: true }).click()
    await dialog.getByText('OpenAI', { exact: true }).click()
    await expect(dialog.getByLabel('OpenAI API key')).toHaveAttribute('placeholder', 'Saved. Enter a new key to replace')
    await dialog.getByRole('button', { name: 'Use saved OpenAI key' }).click()
    await expect(dialog).toBeHidden()
})

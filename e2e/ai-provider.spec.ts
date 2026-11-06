import path from 'node:path'

import { expect, Locator, Page, Route, test } from '@playwright/test'

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

const chooseProvider = async (page: Page, scope: Page | Locator, providerLabel: string) => {
    await scope.getByRole('combobox', { name: 'AI provider' }).click({ force: true })
    await page.locator(`.ant-select-item-option[title="${providerLabel}"]`).click()
}

const saveKey = async (page: Page, providerLabel: string, apiKey: string, model?: string) => {
    await expect(page.getByRole('heading', { name: 'AI provider' })).toBeVisible()
    await chooseProvider(page, page, providerLabel)
    await page.getByLabel(`${providerLabel} API key`).fill(apiKey)
    if (model) {
        await page.getByRole('combobox', { name: 'Model for parsing' }).click({ force: true })
        await page.locator(`.ant-select-item-option[title="${model}"]`).click()
    }
    await page.getByRole('button', { name: 'Save' }).click()
    await expect(page.locator('input[name="file"]')).toBeAttached()
}

const chatCompletion = (model: string) => ({
    id: 'chatcmpl-e2e',
    object: 'chat.completion',
    created: 0,
    model,
    choices: [{
        index: 0,
        message: {
            role: 'assistant',
            content: extractionJson,
        },
        finish_reason: 'stop',
    }],
})

const blockOtherProviders = async (page: Page, allowed: string) => {
    const hosts = ['api.openai.com', 'api.anthropic.com', 'openrouter.ai', 'generativelanguage.googleapis.com']
    for (const host of hosts.filter(item => item !== allowed)) {
        await page.route(`https://${host}/**`, async (route) => {
            await route.abort()
        })
    }
}

const uploadAndExpectResult = async (page: Page) => {
    await page.locator('input[name="file"]').setInputFiles(fixturePath)
    await expect(page.getByText('E2E Glucose').first()).toBeVisible({ timeout: 30000 })
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
    await blockOtherProviders(page, 'api.anthropic.com')

    await seedWithoutKey(page)
    await saveKey(page, 'Claude', 'sk-ant-e2e')
    await uploadAndExpectResult(page)

    expect(anthropicRequests.length).toBeGreaterThan(0)
    const [request] = anthropicRequests
    expect(request.headers.authorization).toBe('Bearer sk-ant-e2e')
    expect(request.headers['anthropic-dangerous-direct-browser-access']).toBe('true')
    expect(request.body.model).toBe('claude-opus-5-5')
    expect(JSON.stringify(request.body.messages)).toContain('"type":"image"')
})

test('extracts with an OpenAI API key and the default model', async ({ page }) => {
    const bodies: Array<Record<string, unknown>> = []

    await page.route('https://api.openai.com/**', async (route) => {
        if (route.request().method() === 'POST') bodies.push(route.request().postDataJSON() as Record<string, unknown>)
        await fulfillJson(route, chatCompletion('gpt-6.1-sol'))
    })
    await blockOtherProviders(page, 'api.openai.com')

    await seedWithoutKey(page)
    await saveKey(page, 'OpenAI', 'sk-openai-e2e')
    await uploadAndExpectResult(page)

    expect(bodies.length).toBeGreaterThan(0)
    expect(bodies[0]).toMatchObject({
        model: 'gpt-6.1-sol',
        reasoning_effort: 'medium',
    })
})

test('extracts with an OpenRouter API key and a chosen model', async ({ page }) => {
    const requests: Array<{ headers: Record<string, string>, body: Record<string, unknown> }> = []

    await page.route('https://openrouter.ai/**', async (route) => {
        if (route.request().method() === 'POST') {
            requests.push({
                headers: await route.request().allHeaders(),
                body: route.request().postDataJSON() as Record<string, unknown>,
            })
        }
        await fulfillJson(route, chatCompletion('google/gemini-3.8-flash'))
    })
    await blockOtherProviders(page, 'openrouter.ai')

    await seedWithoutKey(page)
    await saveKey(page, 'OpenRouter', 'sk-or-e2e', 'google/gemini-3.8-flash')
    await uploadAndExpectResult(page)

    expect(requests.length).toBeGreaterThan(0)
    expect(requests[0].headers.authorization).toBe('Bearer sk-or-e2e')
    expect(requests[0].body).toMatchObject({
        model: 'google/gemini-3.8-flash',
        reasoning: { effort: 'medium' },
    })
})

test('extracts with a Gemini API key', async ({ page }) => {
    const requests: Array<{ url: string, headers: Record<string, string> }> = []

    await page.route('https://generativelanguage.googleapis.com/**', async (route) => {
        if (route.request().method() === 'POST') {
            requests.push({
                url: route.request().url(),
                headers: await route.request().allHeaders(),
            })
        }
        await fulfillJson(route, {
            candidates: [{
                content: {
                    role: 'model',
                    parts: [{ text: extractionJson }],
                },
                finishReason: 'STOP',
            }],
        })
    })
    await blockOtherProviders(page, 'generativelanguage.googleapis.com')

    await seedWithoutKey(page)
    await saveKey(page, 'Gemini', 'AIza-e2e')
    await uploadAndExpectResult(page)

    expect(requests.length).toBeGreaterThan(0)
    expect(requests[0].url).toContain('models/gemini-4-argon:generateContent')
    expect(requests[0].headers['x-goog-api-key']).toBe('AIza-e2e')
})

test('switches provider from the menu and keeps both keys', async ({ page }) => {
    await seedWithoutKey(page)
    await saveKey(page, 'OpenAI', 'sk-openai-e2e')

    await page.locator('header').getByRole('button').last().click()
    await page.getByText('AI provider', { exact: true }).click()

    const dialog = page.getByRole('dialog', { name: 'AI provider' })
    await chooseProvider(page, dialog, 'Claude')
    await dialog.getByLabel('Claude API key').fill('sk-ant-e2e')
    await dialog.getByRole('button', { name: 'Save' }).click()
    await expect(dialog).toBeHidden()

    await page.locator('header').getByRole('button').last().click()
    await page.getByText('AI provider', { exact: true }).click()
    await chooseProvider(page, dialog, 'OpenAI')
    await expect(dialog.getByLabel('OpenAI API key')).toHaveAttribute('placeholder', 'Saved. Enter a new key to replace')
    await expect(dialog.getByRole('combobox', { name: 'Model for parsing' })).toHaveValue('gpt-6.1-sol')
    await dialog.getByRole('button', { name: 'Save' }).click()
    await expect(dialog).toBeHidden()
})

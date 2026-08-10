const path = require('path')
const { sharedHelper, moduleHelper, fixturePath } = require(path.join(
  process.env.AURORA_E2E_ROOT,
  'helpers/paths'
))
const { test, expect } = require('@playwright/test')
const { T } = sharedHelper('timeouts')
const { gotoLoggedIn, step, attachScreenshot, hasCredentials } = sharedHelper('login')
const { clickReady } = sharedHelper('ready')
const { openSettings, logoutToLoginForm } = require('./helpers/settings')


test.describe('Desktop settings', () => {
  test.skip(!hasCredentials(), 'Set E2E_LOGIN_0/E2E_PASSWORD_0 (or E2E_LOGIN/E2E_PASSWORD) in .env.e2e')

  test('opens settings then logs out', async ({ page }) => {
    test.setTimeout(T(120000))

    await gotoLoggedIn(page)

    await openSettings(page)
    await attachScreenshot(page, 'settings-01-open')

    await step('Settings screen and tabs are visible', async () => {
      await expect(page.getByTestId('settings')).toBeVisible()
      const tabs = await page.getByTestId('settings-tab').count()
      console.log(`  → Settings tabs count: ${tabs}`)
      expect(tabs).toBeGreaterThan(0)
    })

    const tabCount = await page.getByTestId('settings-tab').count()
    if (tabCount > 0) {
      await step('Open first settings tab', async () => {
        const firstTab = page.getByTestId('settings-tab').first()
        const label = (
          await firstTab
            .locator('.text, .name .text')
            .innerText()
            .catch(() => '')
        ).trim()
        await clickReady(firstTab)
        console.log(`  → Opened settings tab: ${label || '(unknown)'}`)
        await expect(page.getByTestId('settings')).toBeVisible({
          timeout: T(15000),
        })
        await attachScreenshot(page, 'settings-03-tab')
      })
    }

    await logoutToLoginForm(page)

    await step('Back on login form', async () => {
      await expect(page.getByTestId('login-email')).toBeVisible()
      await expect(page.getByTestId('login-password')).toBeVisible()
      await expect(page.getByTestId('login-submit')).toBeVisible()
      await attachScreenshot(page, 'settings-02-logged-out')
    })
  })
})

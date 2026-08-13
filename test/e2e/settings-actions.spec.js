const path = require('path')
const { sharedHelper, moduleHelper, fixturePath } = require(path.join(
  process.env.AURORA_E2E_ROOT,
  'helpers/paths'
))
const { test, expect } = require('@playwright/test')
const { T } = sharedHelper('timeouts')
const { gotoLoggedIn, step, attachScreenshot, hasCredentials } = sharedHelper('login')
const { clickReady } = sharedHelper('ready')
const { openSettings, goBackToSettingsMenu, openPgpPanel, openPgpGenerateButton } = require('./helpers/settings')


test.describe('Desktop settings actions', () => {
  test.skip(!hasCredentials(), 'Set E2E_LOGIN_0/E2E_PASSWORD_0 (or E2E_LOGIN/E2E_PASSWORD) in .env.e2e')

  test('opens every settings tab', async ({ page }) => {
    test.setTimeout(T(180000))
    await gotoLoggedIn(page)
    await openSettings(page)

    const tabs = page.getByTestId('settings-tab')
    const count = await tabs.count()
    console.log(`  → Settings tabs: ${count}`)
    expect(count).toBeGreaterThan(0)

    for (let i = 0; i < count; i++) {
      await step(`Open settings tab #${i + 1}`, async () => {
        await openSettings(page)
        const tab = tabs.nth(i)
        const name = (await tab.getAttribute('data-settings-name')) || ''
        const label = (
          await tab.locator('.text, .name .text').innerText().catch(() => '')
        ).trim()
        await clickReady(tab)
        await expect(page.getByTestId('settings')).toBeVisible({
          timeout: T(15000),
        })
        console.log(`  → Opened tab: ${label || name || i}`)
        await attachScreenshot(page, `settings-tab-${i + 1}`)
        await goBackToSettingsMenu(page)
      })
    }
  })

  test('opens OpenPGP settings when available', async ({ page }) => {
    test.setTimeout(T(180000))
    await gotoLoggedIn(page)
    await openSettings(page)

    const openPgpTab = page.locator(
      '[data-test-id="settings-tab"][data-settings-name*="pgp" i], [data-test-id="settings-tab"][data-settings-path*="open-pgp"], [data-test-id="settings-tab"][data-settings-name="openpgp"]'
    )
    const byText = page
      .getByTestId('settings-tab')
      .filter({ hasText: /openpgp|open.?pgp|pgp/i })
    test.skip(
      (await openPgpTab.count()) === 0 && (await byText.count()) === 0,
      'OpenPGP settings tab is not available on this stand'
    )

    await step('Open OpenPGP settings tab', async () => {
      if ((await openPgpTab.count()) > 0) {
        await clickReady(openPgpTab.first())
      } else {
        await clickReady(byText.first())
      }
      await expect(openPgpPanel(page)).toBeVisible({
        timeout: T(30000),
      })
      await attachScreenshot(page, 'settings-openpgp-01')
    })

    await step('Expect generate control when present', async () => {
      const generate = openPgpGenerateButton(page)
      await expect(generate).toBeVisible({ timeout: T(15000) })
      await goBackToSettingsMenu(page)
    })
  })

  test('opens Paranoid Encryption settings', async ({ page }) => {
    test.setTimeout(T(120000))
    await gotoLoggedIn(page)
    await openSettings(page)

    const paranoidTab = page
      .getByTestId('settings-tab')
      .filter({ hasText: /paranoid|encryption/i })
    test.skip(
      (await paranoidTab.count()) === 0,
      'Paranoid Encryption tab is not available on this stand'
    )

    await step('Open Paranoid Encryption tab', async () => {
      await clickReady(paranoidTab.first())
      await expect(page.getByTestId('settings-paranoid-encryption')).toBeVisible({
        timeout: T(30000),
      })
      await expect(page.getByTestId('settings-paranoid-enable')).toBeVisible()
      await attachScreenshot(page, 'settings-paranoid-01')
    })

    await step('Back to settings root', async () => {
      await goBackToSettingsMenu(page)
    })
  })

  test('opens Add account control when available', async ({ page }) => {
    test.setTimeout(T(120000))
    await gotoLoggedIn(page)
    await openSettings(page)

    await step('Open mail/accounts tab if needed', async () => {
      const mailTab = page
        .getByTestId('settings-tab')
        .filter({ hasText: /mail|account|почт/i })
        .first()
      if (await mailTab.isVisible().catch(() => false)) {
        await clickReady(mailTab)
      }
    })

    const addAccount = page.getByTestId('settings-add-account')
    test.skip(
      (await addAccount.count()) === 0 ||
        !(await addAccount.isVisible().catch(() => false)),
      'Add account is hidden (multi-account disabled or already has account)'
    )

    await step('Expect Add account button', async () => {
      await expect(addAccount).toBeVisible({ timeout: T(15000) })
      await attachScreenshot(page, 'settings-add-account-01')
    })
  })
})

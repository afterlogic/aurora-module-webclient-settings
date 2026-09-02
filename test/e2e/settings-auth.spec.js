const path = require('path')
const { sharedHelper, moduleHelper, fixturePath } = require(path.join(
  process.env.AURORA_E2E_ROOT,
  'helpers/paths'
))
const { test, expect } = require('@playwright/test')
const { T } = sharedHelper('timeouts')
const { gotoLoggedIn, step, attachScreenshot, hasCredentials } = sharedHelper('login')
const { clickReady } = sharedHelper('ready')
const {
  openSettings,
  goBackToSettingsMenu,
  openPgpPanel,
  openPgpGenerateButton,
  openPgpEnableMailControl,
} = require('./helpers/settings')


async function openOpenPgpTab(page) {
  const openPgpTab = page.locator(
    '[data-test-id="settings-tab"][data-settings-name*="pgp" i], [data-test-id="settings-tab"][data-settings-path*="open-pgp"], [data-test-id="settings-tab"][data-settings-name="openpgp"]'
  )
  const byText = page
    .getByTestId('settings-tab')
    .filter({ hasText: /openpgp|open.?pgp|pgp/i })
  if ((await openPgpTab.count()) > 0) {
    await clickReady(openPgpTab.first())
  } else if ((await byText.count()) > 0) {
    await clickReady(byText.first())
  } else {
    return false
  }
  return true
}

test.describe('Desktop settings auth surfaces', () => {
  test.skip(!hasCredentials(), 'Set E2E_LOGIN_0/E2E_PASSWORD_0 (or E2E_LOGIN/E2E_PASSWORD) in .env.e2e')

  test.describe('OpenPGP', () => {
    test('OpenPGP: generate control visible (no create)', async ({ page }) => {
    test.setTimeout(T(180000))
    await gotoLoggedIn(page)
    await openSettings(page)

    const opened = await openOpenPgpTab(page)
    test.skip(!opened, 'OpenPGP settings tab is not available on this stand')

    await step('Expect OpenPGP panel and generate control', async () => {
      await expect(openPgpPanel(page)).toBeVisible({
        timeout: T(30000),
      })
      const generate = openPgpGenerateButton(page)
      await expect(generate).toBeVisible({ timeout: T(15000) })
      console.log('  → Generate control visible (not submitting)')
      await attachScreenshot(page, 'settings-auth-pgp-generate')
    })

    await step('Back to settings root', async () => {
      await goBackToSettingsMenu(page)
    })
    })

    test('OpenPGP: toggle mail option', async ({ page }) => {
    test.setTimeout(T(180000))
    await gotoLoggedIn(page)
    await openSettings(page)

    const opened = await openOpenPgpTab(page)
    test.skip(!opened, 'OpenPGP settings tab is not available on this stand')

    await step('Toggle Enable in mail', async () => {
      await expect(openPgpPanel(page)).toBeVisible({
        timeout: T(30000),
      })
      const enable = openPgpEnableMailControl(page)
      await expect(enable).toBeVisible({ timeout: T(15000) })
      const before = await enable.evaluate((el) =>
        el.classList.contains('checked') ||
        (el.matches && el.matches('input') && el.checked)
      )
      await clickReady(enable)
      await expect
        .poll(async () =>
          enable.evaluate(
            (el) =>
              el.classList.contains('checked') ||
              (el.matches && el.matches('input') && el.checked)
          )
        )
        .not.toBe(before)
      console.log(`  → Enable OpenPGP in mail toggled from ${before}`)
      await attachScreenshot(page, 'settings-auth-pgp-toggle')
    })

    await step('Restore previous toggle value', async () => {
      const enable = openPgpEnableMailControl(page)
      await clickReady(enable)
      await goBackToSettingsMenu(page)
    })
    })
  })

  test.describe('Paranoid Encryption', () => {
    test('Paranoid Encryption shows enable controls', async ({ page }) => {
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

    await step('Open tab and expect toggles', async () => {
      await clickReady(paranoidTab.first())
      const panel = page.getByTestId('settings-paranoid')
      await expect(panel).toBeVisible({ timeout: T(30000) })
      await expect(
        panel.getByRole('checkbox', { name: /enable paranoid encryption/i })
      ).toBeVisible()
      console.log('  → Paranoid controls visible (no mutation)')
      await attachScreenshot(page, 'settings-auth-paranoid')
    })

    await step('Back to settings root', async () => {
      await goBackToSettingsMenu(page)
    })
    })
  })

  test.describe('Two-factor authentication', () => {
    test('opens the 2FA setup form', async ({ page }) => {
      test.setTimeout(T(120000))
      await gotoLoggedIn(page)
      await openSettings(page)

      const tab = page.locator(
        '[data-test-id="settings-tab"][data-settings-name="two-factor-auth"]'
      )
      const byText = page
        .getByTestId('settings-tab')
        .filter({ hasText: /two.?factor|2fa|двухфактор/i })
      test.skip(
        (await tab.count()) === 0 && (await byText.count()) === 0,
        '2FA settings tab is not available on this stand'
      )

      await step('Open 2FA tab', async () => {
        if ((await tab.count()) > 0) {
          await clickReady(tab.first())
        } else {
          await clickReady(byText.first())
        }
        await expect(page.getByTestId('settings-2fa')).toBeVisible({
          timeout: T(20000),
        })
        console.log('  → 2FA form visible')
        await attachScreenshot(page, 'settings-2fa-01')
      })
    })
  })
})

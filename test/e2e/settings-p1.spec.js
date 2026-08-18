const path = require('path')
const { sharedHelper, moduleHelper } = require(path.join(
  process.env.AURORA_E2E_ROOT,
  'helpers/paths'
))
const { test, expect } = require('@playwright/test')
const { T } = sharedHelper('timeouts')
const {
  gotoLoggedIn,
  step,
  attachScreenshot,
  fieldControl,
  hasCredentials,
} = sharedHelper('login')
const { clickReady, clickNav } = sharedHelper('ready')
const {
  openSettings,
  openMailAccountsSettings,
} = require('./helpers/settings')
const {
  waitForInboxList,
  closeComposeWithoutSending,
} = moduleHelper('MailWebclient', 'mail')

async function jqueryClick(locator) {
  await locator.evaluate((el) => {
    const $ = window.jQuery || window.$
    if ($) {
      $(el).trigger('click')
      return
    }
    el.click()
  })
}

async function openMailSettingsTab(page) {
  await openSettings(page)
  const tab = page.locator(
    '[data-test-id="settings-tab"][data-settings-name="mail"]'
  )
  await expect(tab.first()).toBeVisible({ timeout: T(15000) })
  await clickReady(tab.first())
}

test.describe('Desktop settings P1', () => {
  test.skip(!hasCredentials(), 'Set E2E_LOGIN_PRIMARY in .env.e2e')

  test('changes Mail layout and opens Mail in that layout', async ({ page }) => {
    test.setTimeout(T(180000))
    await gotoLoggedIn(page)
    await openMailSettingsTab(page)

    const layout = page.getByTestId('settings-mail-layout')
    test.skip(
      !(await layout.isVisible().catch(() => false)),
      'Layout select is hidden (AllowChangeLayout is false)'
    )

    const original = await layout.inputValue()
    const next = original === 'separated' ? 'vertical' : 'separated'
    const expectedClass =
      next === 'separated' ? 'layout-separated' : 'layout-vertical'

    await step(`Save layout ${original} → ${next}`, async () => {
      await layout.selectOption(next)
      await jqueryClick(page.getByTestId('settings-mail-save'))
      await page.waitForTimeout(1500)
      console.log(`  → Layout saved: ${next}`)
      await attachScreenshot(page, 'settings-p1-layout-01')
    })

    await step('Mail uses the new layout class', async () => {
      await clickNav(page, 'nav-mail')
      await waitForInboxList(page)
      await expect(page.locator('html')).toHaveClass(new RegExp(expectedClass), {
        timeout: T(20000),
      })
      await attachScreenshot(page, 'settings-p1-layout-02-mail')
    })

    await step('Restore original layout', async () => {
      await openMailSettingsTab(page)
      await expect(layout).toBeVisible({ timeout: T(15000) })
      await layout.selectOption(original)
      await jqueryClick(page.getByTestId('settings-mail-save'))
      await page.waitForTimeout(1500)
    })
  })

  test('edits identity display name and shows it in compose', async ({
    page,
  }) => {
    test.setTimeout(T(180000))
    await gotoLoggedIn(page)
    await openSettings(page)
    await openMailAccountsSettings(page)

    const identity = page.getByTestId('settings-identity-item').first()
    test.skip(
      !(await identity.isVisible().catch(() => false)),
      'No identity item on Email Accounts'
    )

    const newName = `E2E Id ${Date.now()}`
    let original = ''

    await step('Edit identity display name', async () => {
      await clickReady(identity)
      const nameInput = fieldControl(page, 'settings-identity-name')
      await expect(nameInput).toBeVisible({ timeout: T(15000) })
      original = await nameInput.inputValue()
      await nameInput.clear()
      await nameInput.pressSequentially(newName, { delay: 15 })
      await jqueryClick(page.getByTestId('settings-identity-save'))
      await page.waitForTimeout(1500)
      console.log(`  → Identity name: "${original}" → "${newName}"`)
      await attachScreenshot(page, 'settings-p1-identity-01')
    })

    await step('Compose From shows the display name', async () => {
      await clickNav(page, 'nav-mail')
      await waitForInboxList(page)
      await clickReady(page.getByTestId('mail-compose-fab'))
      await expect(page.getByTestId('mail-compose')).toBeVisible({
        timeout: T(15000),
      })
      const fromSelect = page.getByTestId('mail-compose-from')
      const fromStatic = page.locator('.compose .from .not_editable')
      if (await fromSelect.isVisible().catch(() => false)) {
        await expect(fromSelect).toContainText(newName, { timeout: T(15000) })
      } else {
        await expect(fromStatic.first()).toContainText(newName, {
          timeout: T(15000),
        })
      }
      await attachScreenshot(page, 'settings-p1-identity-02-compose')
      await closeComposeWithoutSending(page)
    })

    await step('Restore original identity name', async () => {
      await openSettings(page)
      await openMailAccountsSettings(page)
      await clickReady(page.getByTestId('settings-identity-item').first())
      const nameInput = fieldControl(page, 'settings-identity-name')
      await expect(nameInput).toBeVisible({ timeout: T(15000) })
      await nameInput.clear()
      if (original) {
        await nameInput.pressSequentially(original, { delay: 15 })
      }
      await jqueryClick(page.getByTestId('settings-identity-save'))
      await page.waitForTimeout(1500)
    })
  })

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
      await attachScreenshot(page, 'settings-p1-2fa-01')
    })
  })
})

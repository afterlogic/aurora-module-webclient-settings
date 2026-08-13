const path = require('path')
const { sharedHelper, moduleHelper, fixturePath } = require(path.join(
  process.env.AURORA_E2E_ROOT,
  'helpers/paths'
))
const { test, expect } = require('@playwright/test')
const { T } = sharedHelper('timeouts')
const {
  gotoLoggedIn,
  step,
  attachScreenshot,
  hasCredentials,
  hasSecondaryCredentials,
  getPrimaryCredentials,
  getSecondaryCredentials,
} = sharedHelper('login')
const { clickReady, waitForListReady } = sharedHelper('ready')
const {
  openSettings,
  goBackToSettingsMenu,
  openPgpPanel,
  openPgpGenerateButton,
  mailAccountsTab,
  addAccountButton,
  accountListItem,
  openMailAccountsSettings,
  fillAddAccountPopup,
  removeMailAccountIfListed,
  switchMailAccount,
  expectCurrentMailAccount,
  clickNav,
} = require('./helpers/settings')
const { listReadyOptions } = moduleHelper('MailWebclient', 'mail')


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

  test('adds a second mail account and switches between them', async ({ page }) => {
    test.setTimeout(T(240000))
    test.skip(
      !hasSecondaryCredentials(),
      'Set E2E_LOGIN_SECONDARY and E2E_PASSWORD_SECONDARY in .env.e2e'
    )

    const primary = getPrimaryCredentials()
    const secondary = getSecondaryCredentials()
    test.skip(
      primary.login.toLowerCase() === secondary.login.toLowerCase(),
      'PRIMARY and SECONDARY must be different mailboxes'
    )

    await gotoLoggedIn(page)
    await openSettings(page)

    const { byName, byText } = mailAccountsTab(page)
    test.skip(
      (await byName.count()) === 0 && (await byText.count()) === 0,
      'Email Accounts settings tab is not available on this stand'
    )

    await step('Open Email Accounts settings tab', async () => {
      await openMailAccountsSettings(page)
    })

    await step('Remove leftover SECONDARY mailbox if listed', async () => {
      const removed = await removeMailAccountIfListed(page, secondary.login)
      console.log(
        removed
          ? `  → removed leftover ${secondary.login}`
          : `  → ${secondary.login} not in the list yet`
      )
    })

    await step(`Add ${secondary.login} as a second mailbox`, async () => {
      await clickReady(addAccountButton(page))
      await fillAddAccountPopup(page, secondary)
      await expect(accountListItem(page, secondary.login)).toBeVisible({
        timeout: T(60000),
      })
      await attachScreenshot(page, 'settings-add-account-01')
    })

    try {
      await step('Open Mail and switch to SECONDARY', async () => {
        await clickNav(page, 'nav-mail')
        await expect(page.getByTestId('mail-message-list')).toBeVisible({
          timeout: T(30000),
        })
        await expect(page.getByTestId('nav-mail')).toHaveClass(/has_control/, {
          timeout: T(15000),
        })
        await waitForListReady(page, listReadyOptions)
        await switchMailAccount(page, secondary.login)
        await waitForListReady(page, listReadyOptions)
        await attachScreenshot(page, 'settings-add-account-02-secondary-mail')
      })

      await step('Switch back to PRIMARY', async () => {
        await switchMailAccount(page, primary.login)
        await waitForListReady(page, listReadyOptions)
        await expectCurrentMailAccount(page, primary.login)
        await attachScreenshot(page, 'settings-add-account-03-primary-mail')
      })
    } finally {
      await step('Remove the added SECONDARY mailbox', async () => {
        await openSettings(page)
        await openMailAccountsSettings(page)
        await removeMailAccountIfListed(page, secondary.login)
      })
    }
  })
})

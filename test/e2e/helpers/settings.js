const path = require('path')
const { sharedHelper, fixturePath } = require(path.join(
  process.env.AURORA_E2E_ROOT,
  'helpers/paths'
))
const { expect } = require('@playwright/test')
const { step } = sharedHelper('login')
const { clickReady, clickNav } = sharedHelper('ready')

async function openSettings(page) {
  await step('Open Settings', async () => {
    await clickNav(page, 'nav-settings')
    await expect(page.getByTestId('settings')).toBeVisible({
      timeout: 30000,
    })
  })
}

/**
 * Open a settings tab by router path or by data-settings-name.
 * Desktop uses data-settings-name (e.g. "common", "mail", "openpgp").
 */
async function openSettingsTab(page, pathOrName) {
  const byPath = page.locator(
    `[data-test-id="settings-tab"][data-settings-path="${pathOrName}"]`
  )
  if ((await byPath.count()) > 0) {
    await expect(byPath.first()).toBeVisible({ timeout: 15000 })
    await clickReady(byPath.first())
    return
  }

  // Strip /settings/ prefix if a mobile-style path was passed.
  const name = String(pathOrName)
    .replace(/^\/?settings\/?/, '')
    .replace(/\//g, '-')
    .replace(/^-+|-+$/g, '')

  const byName = page.locator(
    `[data-test-id="settings-tab"][data-settings-name="${name}"], [data-test-id="settings-tab"][data-settings-name="${pathOrName}"]`
  )
  if ((await byName.count()) > 0) {
    await expect(byName.first()).toBeVisible({ timeout: 15000 })
    await clickReady(byName.first())
    return
  }

  // Fallback: match visible tab text.
  const byText = page
    .getByTestId('settings-tab')
    .filter({ hasText: new RegExp(name || pathOrName, 'i') })
    .first()
  await expect(byText).toBeVisible({ timeout: 15000 })
  await clickReady(byText)
}

/**
 * Desktop always shows the settings tab list — noop / ensure settings root visible.
 */
async function goBackToSettingsMenu(page) {
  if (await page.getByTestId('settings').isVisible().catch(() => false)) {
    return
  }
  await openSettings(page)
}

async function logoutToLoginForm(page) {
  await step('Logout to login form', async () => {
    await clickReady(page.getByTestId('settings-logout'))
    await expect(page.getByTestId('login-email')).toBeVisible({
      timeout: 30000,
    })
  })
}

module.exports = {
  openSettings,
  openSettingsTab,
  goBackToSettingsMenu,
  logoutToLoginForm,
  clickReady,
}

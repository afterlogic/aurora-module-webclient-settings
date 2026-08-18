const path = require('path')
const { sharedHelper, fixturePath } = require(path.join(
  process.env.AURORA_E2E_ROOT,
  'helpers/paths'
))
const { expect } = require('@playwright/test')
const { step, logoutToLoginForm } = sharedHelper('login')
const { clickReady, clickNav, confirmOkIfVisible } = sharedHelper('ready')
const { T } = sharedHelper('timeouts')

async function openSettings(page) {
  await step('Open Settings', async () => {
    await clickNav(page, 'nav-settings')
    await expect(page.getByTestId('settings')).toBeVisible({
      timeout: T(30000),
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
    await expect(byPath.first()).toBeVisible({ timeout: T(15000) })
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
    await expect(byName.first()).toBeVisible({ timeout: T(15000) })
    await clickReady(byName.first())
    return
  }

  // Fallback: match visible tab text.
  const byText = page
    .getByTestId('settings-tab')
    .filter({ hasText: new RegExp(name || pathOrName, 'i') })
    .first()
  await expect(byText).toBeVisible({ timeout: T(15000) })
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

/** OpenPGP settings panel — staging may omit data-test-id. Heading lives in panel_top, not inside the panel_center test-id. */
function openPgpPanel(page) {
  return page
    .locator(
      [
        '[data-test-id="settings-openpgp"]',
        'h2.settings_heading:has-text("OpenPGP")',
        '.settings_heading:has-text("OpenPGP")',
      ].join(', ')
    )
    .first()
}

function openPgpGenerateButton(page) {
  return page
    .locator(
      '[data-test-id="settings-openpgp-generate"], .buttons .button:has-text("Generate new key")'
    )
    .first()
}

function openPgpEnableMailControl(page) {
  return page
    .locator(
      '[data-test-id="settings-openpgp-enable-mail"], label.custom_checkbox:has(#enableOpenPgpInMail)'
    )
    .first()
}

/**
 * Mail → Email Accounts tab (HashModuleName + '-accounts').
 * Do not match the "Mail" tab: /mail/ hits it first in TabsOrder.
 */
function mailAccountsTab(page) {
  const byName = page.locator(
    [
      '[data-test-id="settings-tab"][data-settings-name="mail-accounts"]',
      '#selenium_settings_mail-accounts',
      '[data-test-id="settings-tab"].mail-accounts',
    ].join(', ')
  )
  const byText = page.getByTestId('settings-tab').filter({
    hasText: /email accounts?|аккаунт/i,
  })
  return { byName, byText }
}

function mailAccountsPane(page) {
  return page
    .locator(
      [
        '[data-test-id="settings-mail-accounts"]',
        '.middle_bar.mail-accounts',
        'h2.settings_heading:has-text("Email Account")',
        'h2.settings_heading:has-text("Аккаунт")',
      ].join(', ')
    )
    .first()
}

/** Add New Account — staging may omit data-test-id. */
function addAccountButton(page) {
  return page
    .locator(
      [
        '[data-test-id="settings-add-account"]',
        '#selenium_settings_create_account_button',
        '.add_account_button',
        '.buttons .button:has-text("Add New Account")',
        '.buttons .button:has-text("Добавить новый аккаунт")',
      ].join(', ')
    )
    .first()
}

function accountLocalPart(email) {
  return String(email).split('@')[0]
}

function accountListItem(page, email) {
  return page
    .locator(
      [
        '[data-test-id="settings-mail-accounts"] [data-test-id="settings-account-item"]',
        '.middle_bar.mail-accounts .item.account',
      ].join(', ')
    )
    .filter({ hasText: email })
}

function addAccountDialog(page) {
  return page.locator('.popup.add_account:visible, [data-test-id="settings-add-account-dialog"]:visible').first()
}

async function openMailAccountsSettings(page) {
  const { byName, byText } = mailAccountsTab(page)
  if ((await byName.count()) > 0) {
    await clickReady(byName.first())
  } else {
    await expect(byText.first()).toBeVisible({ timeout: T(15000) })
    await clickReady(byText.first())
  }
  await expect(mailAccountsPane(page)).toBeVisible({ timeout: T(15000) })
}

async function fillAddAccountPopup(page, credentials) {
  const dialog = addAccountDialog(page)
  await expect(dialog).toBeVisible({ timeout: T(15000) })

  const otherAuth = page
    .locator(
      '[data-test-id="settings-add-account-auth-option"], .popup.add_account .item.account'
    )
    .filter({ hasText: /^other$/i })
  if (await otherAuth.first().isVisible().catch(() => false)) {
    await clickReady(otherAuth.first())
  }

  const emailInput = page.locator(
    '[data-test-id="settings-add-account-email"], #selenium_settings_create_account_email'
  )
  const passwordInput = page.locator(
    '[data-test-id="settings-add-account-password"], #selenium_settings_create_account_password'
  )
  await expect(emailInput.first()).toBeVisible({ timeout: T(15000) })
  await emailInput.first().fill(credentials.login)
  await passwordInput.first().fill(credentials.password)

  const submit = page
    .locator(
      [
        '[data-test-id="settings-add-account-submit"]',
        '.popup.add_account .buttons .button:not(.secondary_button)',
      ].join(', ')
    )
    .filter({ hasText: /^(add|save)$/i })
    .first()
  await clickReady(submit)

  const longFormLogin = page.locator('.popup.add_account .row.login input')
  let afterSubmit = 'pending'
  await expect
    .poll(
      async () => {
        if (await longFormLogin.isVisible().catch(() => false)) {
          afterSubmit = 'long'
          return 'long'
        }
        if (!(await addAccountDialog(page).isVisible().catch(() => false))) {
          afterSubmit = 'closed'
          return 'closed'
        }
        return 'pending'
      },
      { timeout: T(45000), intervals: [300, 600, 1000] }
    )
    .toMatch(/^(long|closed)$/)

  if (afterSubmit === 'long') {
    await longFormLogin.fill(credentials.login)
    const save = page
      .locator('.popup.add_account .buttons .button:not(.secondary_button)')
      .filter({ hasText: /^save$/i })
      .first()
    await clickReady(save)
    await expect(addAccountDialog(page)).toBeHidden({ timeout: T(45000) })
  }
}

async function removeMailAccountIfListed(page, email) {
  const item = accountListItem(page, email)
  if ((await item.count()) === 0) {
    return false
  }
  await clickReady(item.first())
  const remove = page.locator(
    `[data-test-id="settings-remove-account"], [id="selenium_settings_delete_account_${email}"]`
  )
  await clickReady(remove.first())
  await confirmOkIfVisible(page, 15000)
  await expect(item).toHaveCount(0, { timeout: T(30000) })
  return true
}

function mailAccountOption(page, email) {
  const local = accountLocalPart(email)
  return page
    .locator(
      '[data-test-id="mail-account-option"], [data-test-id="nav-mail"] .dropdown_content .item'
    )
    .filter({ hasText: new RegExp(local.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i') })
}

async function expectCurrentMailAccount(page, email) {
  const local = accountLocalPart(email)
  await expect(page.getByTestId('nav-mail')).toContainText(new RegExp(local, 'i'), {
    timeout: T(30000),
  })
}

/**
 * When Mail is the current header tab, the dropdown opens on a click of
 * the tab itself (not .control). Dropdown lists non-current accounts only.
 */
async function switchMailAccount(page, email) {
  const nav = page.getByTestId('nav-mail')
  await expect(nav).toBeVisible({ timeout: T(15000) })
  const already =
    (await nav.innerText().catch(() => '')).toLowerCase().includes(
      accountLocalPart(email).toLowerCase()
    )
  if (already && (await mailAccountOption(page, email).count()) === 0) {
    return
  }

  await nav.click()
  const option = mailAccountOption(page, email).first()
  await expect(option).toBeVisible({ timeout: T(15000) })
  await clickReady(option)
  await expectCurrentMailAccount(page, email)
}

/**
 * Nested tab inside Email Accounts (folders / signature / filters / forward / autoresponder).
 */
async function openAccountTab(page, tabName) {
  const tab = page.locator(
    `[data-test-id="settings-account-tab"][data-tab-name="${tabName}"]`
  )
  const fallback = page.locator(`#selenium_settings_account_${tabName}_button`)
  const tabVisible = await tab
    .first()
    .waitFor({ state: 'visible', timeout: T(8000) })
    .then(() => true)
    .catch(() => false)
  if (tabVisible) {
    await clickReady(tab.first())
    return true
  }
  const fallbackVisible = await fallback
    .first()
    .waitFor({ state: 'visible', timeout: T(3000) })
    .then(() => true)
    .catch(() => false)
  if (fallbackVisible) {
    await clickReady(fallback.first())
    return true
  }
  return false
}

module.exports = {
  openSettings,
  openSettingsTab,
  goBackToSettingsMenu,
  openPgpPanel,
  openPgpGenerateButton,
  openPgpEnableMailControl,
  mailAccountsTab,
  mailAccountsPane,
  addAccountButton,
  accountListItem,
  addAccountDialog,
  openMailAccountsSettings,
  fillAddAccountPopup,
  removeMailAccountIfListed,
  mailAccountOption,
  expectCurrentMailAccount,
  switchMailAccount,
  openAccountTab,
  logoutToLoginForm,
  clickReady,
  clickNav,
}

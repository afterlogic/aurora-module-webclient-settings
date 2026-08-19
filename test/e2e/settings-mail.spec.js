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

/** KO `value` binding reads jQuery change, not Playwright selectOption alone. */
async function setLayoutSelect(layout, value) {
  await layout.evaluate((el, v) => {
    const $ = window.jQuery || window.$
    if ($) {
      $(el).val(v).trigger('change')
      return
    }
    el.value = v
    el.dispatchEvent(new Event('change', { bubbles: true }))
  }, value)
  await expect(layout).toHaveValue(value)
}

async function saveMailSettings(page) {
  const save = page.getByTestId('settings-mail-save')
  await clickReady(save)
  await expect(save).toBeVisible({ timeout: T(30000) })
}

async function openMailSettingsTab(page) {
  await openSettings(page)
  const tab = page.locator(
    '[data-test-id="settings-tab"][data-settings-name="mail"]'
  )
  await expect(tab.first()).toBeVisible({ timeout: T(15000) })
  await clickReady(tab.first())
}

test.describe('Desktop mail settings', () => {
  test.skip(!hasCredentials(), 'Set E2E_LOGIN_PRIMARY in .env.e2e')

  test.describe('Layout', () => {
    test('changes Mail layout and opens Mail in that layout', async ({
      page,
    }) => {
      test.setTimeout(T(180000))
      await gotoLoggedIn(page)
      await openMailSettingsTab(page)

      const layout = page.getByTestId('settings-mail-layout')
      const layoutVisible = await layout
        .waitFor({ state: 'visible', timeout: T(15000) })
        .then(() => true)
        .catch(() => false)
      test.skip(
        !layoutVisible,
        'Layout select is hidden (AllowChangeLayout is false)'
      )

      const original = await layout.inputValue()
      // Vertical ↔ horizontal keep the combined list visible. Separated hides
      // mail-message-list until a folder is opened (different UX, not this check).
      const next = original === 'horizontal' ? 'vertical' : 'horizontal'
      const htmlClass =
        next === 'horizontal' ? 'layout-horiz-split' : 'layout-vertical'

      await step(`Save layout ${original} → ${next}`, async () => {
        await setLayoutSelect(layout, next)
        await saveMailSettings(page)
        console.log(`  → Layout saved: ${next}`)
        await attachScreenshot(page, 'settings-mail-layout-01')
      })

      await step('Mail uses the new layout class', async () => {
        await clickNav(page, 'nav-mail')
        await expect(page.getByTestId('confirm-ok')).toBeHidden({
          timeout: T(3000),
        })
        await waitForInboxList(page)
        await expect(page.locator('html')).toHaveClass(new RegExp(htmlClass), {
          timeout: T(20000),
        })
        await attachScreenshot(page, 'settings-mail-layout-02-mail')
      })

      await step('Restore original layout', async () => {
        await openMailSettingsTab(page)
        await expect(layout).toBeVisible({ timeout: T(15000) })
        await setLayoutSelect(layout, original)
        await saveMailSettings(page)
      })
    })
  })

  test.describe('Identity', () => {
    test('edits identity display name and shows it in compose', async ({
      page,
    }) => {
      test.setTimeout(T(180000))
      await gotoLoggedIn(page)
      await openSettings(page)
      await openMailAccountsSettings(page)

      // Default identity is filled only after Mail.GetIdentities (mail prefetch).
      const identity = page.getByTestId('settings-identity-item').first()
      const identityVisible = await identity
        .waitFor({ state: 'visible', timeout: T(20000) })
        .then(() => true)
        .catch(() => false)
      if (!identityVisible) {
        const canAdd = await page
          .getByTestId('settings-add-identity')
          .first()
          .isVisible()
          .catch(() => false)
        if (canAdd) {
          throw new Error(
            'Identities are allowed but no identity row appeared after GetIdentities'
          )
        }
        test.skip(true, 'Identities are not enabled on this stand')
      }

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
        await attachScreenshot(page, 'settings-identity-01')
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
        await attachScreenshot(page, 'settings-identity-02-compose')
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
  })
})

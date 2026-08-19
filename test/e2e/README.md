# Desktop E2E (Playwright)

Scenarios for **SettingsWebclient**. Runner lives at the Aurora install root:

```bash
# from install root
npm run test:e2e-desktop
./modules/CoreWebclient/test/e2e/run.sh

# this module only (Chrome)
npm run test:e2e-desktop -- --setup "SettingsWebclient Chrome"
```

Shared helpers: `modules/CoreWebclient/test/e2e/helpers/` (`AURORA_E2E_ROOT`).
Domain helpers: `./helpers/` in this folder.

Filter Playwright UI / CLI by **file name** or nested `test.describe`.

| File | What it covers |
|------|----------------|
| `settings.spec.js` | Open settings, walk tabs, OpenPGP / Paranoid when present |
| `settings-actions.spec.js` | Add second mailbox and switch (needs SECONDARY) |
| `settings-auth.spec.js` | OpenPGP controls, Paranoid Encryption, 2FA form |
| `settings-mail.spec.js` | Mail layout, identity display name in compose |

Stand gates: layout hidden when `AllowChangeLayout` is false; 2FA tab missing when `TwoFactorAuth` is disabled. Local stand: `AllowChangeLayout` true, `TwoFactorAuth.Disabled` false.

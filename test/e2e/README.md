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

## P1 specs (`settings-p1.spec.js`)

- change Mail layout → open Mail with matching `layout-*` class on `<html>`
- edit identity display name → visible in compose From
- open 2FA settings form (no enable on stand)

Multi-account switch: `settings-actions.spec.js` (needs SECONDARY).

Stand gates: layout hidden when `AllowChangeLayout` is false; 2FA tab missing on stand.

# Desktop E2E (Playwright)

Scenarios for **SettingsWebclient**. Runner lives at the Aurora install root:

```bash
# from install root
yarn test:e2e-desktop
./modules/CoreWebclient/test/e2e/run.sh

# this module only (Chrome)
yarn --cwd modules/CoreWebclient/test/e2e test:e2e_local -- --project="SettingsWebclient · Desktop Chrome"
```

Shared helpers: `modules/CoreWebclient/test/e2e/helpers/` (`AURORA_E2E_ROOT`).
Domain helpers: `./helpers/` in this folder.

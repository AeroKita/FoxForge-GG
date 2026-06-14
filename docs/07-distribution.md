# Distribution & Updates

The tool ships **two ways from one codebase**, with **two independent update channels**.

## Distribution
- **Hosted PWA** (zero install): GitHub Pages deploys `dist/` on every push to `main`
  ([`.github/workflows/pages.yml`](../.github/workflows/pages.yml)). Installable; auto-updates via service worker.
- **Desktop app** (Tauri v2): tiny native installers (Win `.msi/.exe`, macOS `.dmg`, Linux
  `.deb/.AppImage`) built in CI on a `v*` tag ([`.github/workflows/release.yml`](../.github/workflows/release.yml)),
  published to GitHub Releases with a signed `latest.json` updater manifest.

## Two update channels
1. **App updates** (UI/engine code) — Tauri auto-updater checks GitHub Releases on launch.
   **On by default; user-toggleable + manual "Check for updates"** in the Updates panel
   ([`UpdatePanel.tsx`](../src/components/UpdatePanel.tsx), [`runtime.ts`](../src/ui/runtime.ts)).
   The PWA equivalent is the service worker (updates on reload).
2. **Game-data updates** (stats every patch) — the app fetches `data/manifest.json` from Pages at
   launch; if `version` (the bundle's `lastUpdated`) changed, it downloads + zod-validates + caches
   the new bundle, applied next launch ([`dataSource.ts`](../src/data/dataSource.ts)). The bundled
   JSON is the offline fallback. **A patch update = publish one JSON — no app rebuild/release.**
   [`data.yml`](../.github/workflows/data.yml) re-scrapes weekly and publishes automatically.

## Release a desktop version
```bash
# bump version in src-tauri/tauri.conf.json + package.json, then:
git tag v0.2.0 && git push origin v0.2.0   # CI builds + publishes installers + latest.json
```

## Local desktop dev/build (needs Rust)
```bash
curl https://sh.rustup.rs -sSf | sh      # one-time
npm run tauri dev                         # run desktop app
npm run tauri build                       # local installers
```

## One-time setup (in GitHub repo settings)
1. **Pages**: Settings → Pages → Source = GitHub Actions.
2. **Updater secret** (for signed auto-updates): add repo secret
   `TAURI_SIGNING_PRIVATE_KEY` = the contents of `src-tauri/updater.key` (generated locally,
   git-ignored — never commit it). Password is empty. The matching public key is already in
   `tauri.conf.json`.
3. If the repo/owner ever changes, update the URLs in `tauri.conf.json` (updater endpoint),
   `dataSource.ts` (`DATA_BASE`, or set `VITE_DATA_BASE_URL`), and `data.yml`.

## Notes
- **Unsigned binaries**: without an Apple Developer ID / Windows Authenticode cert, users see a
  Gatekeeper/SmartScreen warning on first launch (right-click → Open on macOS). Auto-update still
  works (it uses the Tauri updater key, separate from OS code-signing). Add certs later for clean installs.
- **Size**: desktop installer is small (OS webview); the 22 MB of art is bundled for offline use —
  flip `asset()` to a remote base later if you want an even smaller binary.

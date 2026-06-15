# Branding: renaming the app & changing the icon

The app's name, tagline, and icon are intentionally easy to change. This is the
full, exact process.

## Rename the app

### 1. One source of truth (covers the whole web app)

Edit [`src/ui/brand.ts`](../src/ui/brand.ts):

```ts
export const APP_NAME = "FoxForge GG";          // header title, HTML <title>, PWA name
export const APP_SHORT_NAME = "FoxForge";        // PWA home-screen label
export const APP_TAGLINE = "Forge your UNITE Loadout!"; // header subtitle
export const APP_DESCRIPTION = "…";              // PWA + meta description
```

That single file drives:
- the in-app header title + tagline ([`src/App.tsx`](../src/App.tsx)),
- the browser tab title (`index.html` `__APP_NAME__` placeholder, replaced by the
  `htmlBranding` plugin in [`vite.config.ts`](../vite.config.ts)),
- the PWA manifest `name` / `short_name` / `description`.

### 2. Native + release files (can't import TS — edit by hand)

These four spots must match `APP_NAME` for the desktop app and GitHub Releases:

| File | Field | Notes |
| --- | --- | --- |
| [`src-tauri/tauri.conf.json`](../src-tauri/tauri.conf.json) | `productName` | becomes the desktop app name **and** the installer filenames |
| [`src-tauri/tauri.conf.json`](../src-tauri/tauri.conf.json) | `app.windows[0].title` | the OS window title |
| [`src-tauri/Cargo.toml`](../src-tauri/Cargo.toml) | `description` | crate metadata |
| [`.github/workflows/release.yml`](../.github/workflows/release.yml) | `releaseName` | the GitHub Release title |

### 3. Do NOT change (on purpose)

- `identifier` in `tauri.conf.json` (`gg.aerokita.unitebuildoptimizer`) — this is
  the app's stable identity. Changing it breaks **auto-update continuity** for
  already-installed apps and moves their saved-data directory. Keep it fixed
  across renames.
- The Cargo `package.name` / `[lib].name` and `package.json` `name` — internal
  identifiers, not user-facing.

### 4. Ship it

- Web: push to `main` → Pages redeploys with the new name.
- Desktop: bump `version` (package.json + tauri.conf.json), then
  `git tag vX.Y.Z && git push origin vX.Y.Z` → CI publishes renamed installers.

## Change the icon

The committed source is [`tools/app-icon.png`](../tools/app-icon.png) — a 1024×1024
master image. To swap in new art, point the generator at any image (it's
normalized to 1024² RGBA and written back to `tools/app-icon.png`), then refresh
the desktop set:

```bash
# 1. Adopt a new master + regenerate web/PWA icons (favicon, apple-touch, pwa-192/512)
node tools/make-icons.mjs path/to/new-icon.png

# 2. Desktop (Tauri) icon set — .ico/.icns/.png + Store/Android/iOS sizes
npx tauri icon tools/app-icon.png
```

(Run `node tools/make-icons.mjs` with no argument to regenerate the web icons from
the existing source.) Commit the regenerated `tools/app-icon.png`, `public/*`, and
`src-tauri/icons/*`. The web icons deploy on the next push to `main`; the desktop
icons ship with the next tagged release.

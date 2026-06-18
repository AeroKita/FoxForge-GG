# Distribution & Updates

The tool ships **one way: a hosted web app (PWA)** on GitHub Pages, with **two
update channels** — the app code and the game data update independently.

## Distribution

**Hosted PWA** (zero install): GitHub Pages deploys `dist/` on every push to `main`
([`.github/workflows/pages.yml`](../.github/workflows/pages.yml)). It's installable from
the browser ("Add to Home Screen" / "Install") for an offline-capable window, and the
service worker auto-updates it on reload.

## Two update channels

1. **App updates** (UI/engine code) — handled by the PWA service worker: a new deploy
   is picked up on the next reload. No manual step, no separate release.
2. **Game-data updates** (stats every patch) — the app fetches `data/manifest.json` from
   Pages at launch; if `version` (the bundle's `lastUpdated`) changed, it downloads +
   zod-validates + caches the new bundle, applied next launch
   ([`dataSource.ts`](../src/data/dataSource.ts)). The bundled JSON is the offline
   fallback. **A patch update = publish one JSON — no app rebuild.**
   [`data.yml`](../.github/workflows/data.yml) re-scrapes weekly and publishes automatically.

## One-time setup (in GitHub repo settings)

1. **Pages**: Settings → Pages → Source = GitHub Actions.
2. If the repo/owner ever changes, update the data URLs in `dataSource.ts` (`DATA_BASE`,
   or set `VITE_DATA_BASE_URL`) and `data.yml`.

## Notes

- **Size**: the build is ≈258 KB gzipped JS plus ~22 MB of art, bundled for offline use —
  flip `asset()` to a remote base later if you want a lighter initial load.

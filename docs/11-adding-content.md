# Adding Content

This is the maintenance runbook for the only expected ongoing work on FoxForge GG: adding a Pokémon, held item, trainer (battle) item, curated build or label, or move clip after a balance patch or roster update. Game data is **always regenerated, never hand-edited** — the pipeline rewrites `src/data/patch-current.json` in place. [`AGENTS.md`](../AGENTS.md) remains the architecture authority; this doc is a task-oriented copy-paste sequence drawn from it and the numbered docs.

## The tool (preferred path)

Use these npm commands from the repo root (`FoxForge-GG/`):

| Command | When to use |
| --- | --- |
| `npm run data:doctor` | First step — checks Node, Python venv, ffmpeg, and `_raw/` |
| `npm run data:refresh` | One-command pipeline refresh (see modes below) |
| `npm run data:curate -- scaffold <id> [--write]` | Print or insert a validated stub in `curated_builds.json` |
| `npm run data:curate -- check` | Validate all curated entries before normalize |
| `npm run data:gaps` | Checklist of missing builds, descriptions, or clips per Pokémon |
| `npm run data:publish` | Sync `public/data/` mirror after any local normalize |
| `npm run data:publish:check` | Verify published copy matches baseline (also in CI via `npm test`) |

**Refresh modes** (`npm run data:refresh -- --mode <mode>`):

| Mode | Use case |
| --- | --- |
| `full` (default) | New patch / new Pokémon from UNITE-DB |
| `curate` | After editing `curated_builds.json` or `move_descriptions.json` (no re-fetch) |
| `clips` | After dropping new raw recordings |

Flags: `--patch-version X` (new patch id for normalize), `--no-verify` (skip final gate), `--skip-art` (full mode only — skip art mirror).

## When you need this

| Task | Sections |
| --- | --- |
| New Pokémon (roster addition) | [The tool](#the-tool-preferred-path) or [Manual fallback](#manual-fallback), then [Curating a Pokémon](#curating-a-pokémon-builds-labels-descriptions), [Publish + verify](#publish--verify) |
| New held item | [The tool](#the-tool-preferred-path) or [Manual fallback](#manual-fallback), [Publish + verify](#publish--verify) |
| New trainer (battle) item | [The tool](#the-tool-preferred-path) or [Manual fallback](#manual-fallback), [Publish + verify](#publish--verify) |
| New curated build or label | [Curating a Pokémon](#curating-a-pokémon-builds-labels-descriptions), [Publish + verify](#publish--verify) |
| New move clip | [Adding move clips](#adding-move-clips), [Publish + verify](#publish--verify) |

**Key asymmetry:** held items and battle (trainer) items flow straight from UNITE-DB through `fetch.py` → `build_held_items` / `build_battle_items` with no curation needed. Only Pokémon need curated builds, labels, descriptions, and clips.

## The easy path: trigger a data refresh

GitHub → Actions → **Refresh game data** → *Run workflow* (`.github/workflows/data.yml`).

The workflow re-scrapes UNITE-DB, normalizes, regenerates emblem-optimizer presets, mirrors art, publishes `public/data/`, and opens (or updates) a review PR on `data/auto-refresh` with a field-level changelog from `tools/community/diff_bundle.py`. Optionally pass `patch_version` when the UNITE patch id should change.

Anything UNITE-DB already carries — most new items and base Pokémon data — arrives this way with no local work beyond reviewing the PR.

## Manual fallback

The tool above replaces this manual sequence. Keep it as a reference if `data:refresh` is unavailable.

From the repo root, with the Python venv activated:

```bash
cd tools/community && source ../extract/.venv/bin/activate
python3 fetch.py && python3 normalize.py && cd ../.. && npm run generate:presets && cd tools/community && python3 fetch_art.py && python3 normalize_as_boosts.py
```

`normalize.py` writes `src/data/patch-current.json`, backfilling blank UNITE-DB move text from the owned `move_descriptions.json` (see [Descriptions](#descriptions)).

Then **publish** the runtime copy and verify:

```bash
npm run data:publish
npm run verify
```

For curated-build- or description-only edits (no UNITE-DB re-fetch):

```bash
npm run data:refresh -- --mode curate
```

## Curating a Pokémon (builds, labels, descriptions)

[`tools/community/curated_builds.json`](../tools/community/curated_builds.json) is the **only** place to add Recommended/Creative builds and label overrides. `normalize.py`'s `apply_curated_builds` merges them and **hard-validates** every entry — an unknown emblem/held/battle id or bad grade fails the build loudly.

### Three footguns

1. **Never hand-edit `emblemName` or any field in `patch-current.json`.** Regeneration clobbers it. Use `curated_builds.json` instead: top-level `_emblemNameRemap` / `_emblemNamePrefixRemap`, and per-Pokémon `builds`, `recommendedTitles`, `creativeBuilds`, or `emblemPreset`.
2. **`builds` and `recommendedTitles` are mutually exclusive** per Pokémon. `creativeBuilds` may coexist with either.
3. **After editing builds, run `npm run generate:presets`** (or `npm run data:post-normalize`) or CI fails on `presetsSync.test.ts`.

Use a per-Pokémon `builds` overlay (not `recommendedTitles`) when both display order and labels must stay pinned against UNITE-DB reordering.

### Descriptions

Move **Advanced** descriptions come from UNITE-DB (`rsb` text via `advanced_desc()`). Move **Basic** descriptions come from UNITE-DB where it ships them, and otherwise from [`tools/community/move_descriptions.json`](../tools/community/move_descriptions.json) — an **owned, hand-maintained** data file that `normalize.py` uses to backfill any move whose UNITE-DB Basic text is blank. (It was originally seeded from Serebii, but the scraper has been retired; this file is now yours to edit directly.)

To add or fix a Basic description, edit `move_descriptions.json`: under the Pokémon's id, add an entry keyed by the **normalized move name** — lowercase, with a trailing parenthetical and apostrophes stripped (e.g. `Sovereign Slide` → `sovereign slide`, `Sirfetch'd`'s moves drop the apostrophe). The key must match UNITE-DB's exact move spelling, or the backfill won't find it. Then run `npm run data:refresh -- --mode curate`. Run `npm run data:gaps` to list moves still missing a Basic description. See [`AGENTS.md`](../AGENTS.md) **Data Bundle Versioning** for the full schema.

### Single-Pokémon roster add

When a full `fetch.py` would pull unrelated drift from live UNITE-DB: append that Pokémon's rows to `_raw/pokemon.json` and `_raw/stats.json`, inject any missing Basic move/passive text, add curated `builds` in `curated_builds.json` when the raw placeholder is empty, then `normalize.py` → `npm run generate:presets` → `fetch_art.py` → publish (below). Regenerate only — do not hand-edit `patch-current.json`.

## Adding move clips

Follow the dedicated batch runbook: [`plans/2026-06-20-add-move-clips-runbook.md`](../../plans/2026-06-20-add-move-clips-runbook.md) (raw recordings → `transcode_clips.py` → `normalize.py` → verify).

## Publish + verify

FoxForge GG keeps **two copies** of the bundle:

| Copy | Path | Role |
| --- | --- | --- |
| Build-time baseline | `src/data/patch-current.json` | Stable filename; shipped with the app build |
| Published runtime copy | `public/data/patch-<patchVersion>.json` + `manifest.json` | Cache-busted fetch target for live data updates |

The `manifest.json` `version` field must equal the bundle's `lastUpdated` (not `patchVersion`). After any local `normalize.py` run, **re-sync the published copy** with `npm run data:publish` — a stale `public/data/` is the most common drift.

Gate everything with:

```bash
npm run verify
```

## Per-patch checklist

For the full balance-patch workflow (source tiers, spot-checks, forum watch, release), see [`docs/10-patch-watch-checklist.md`](10-patch-watch-checklist.md).

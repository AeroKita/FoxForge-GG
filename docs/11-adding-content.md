# Adding Content

Human maintenance runbook for FoxForge GG. Use this when adding a Pokémon, held/trainer item, curated build, description, or move clip. Game data is **always regenerated, never hand-edited** — never edit `src/data/patch-current.json` or `public/data/patch-*.json` by hand.

Architecture detail lives in [`AGENTS.md`](../AGENTS.md). Clips detail lives in [`12-adding-move-clips.md`](12-adding-move-clips.md).

**Nothing goes live until you push (or merge a PR).** Every path runs the test gate first — if something is wrong, it stops instead of shipping.

---

## Pick your task

| What you have | Do this |
| --- | --- |
| New held item, trainer item, or balance text already on UNITE-DB | [A — Balance / items](#a--balance--items-easiest) |
| New Pokémon already on [unite-db.com](https://unite-db.com) | [B — New Pokémon](#b--new-pokémon) |
| New move/passive video recordings | [C — Move clips](#c--move-clips) |
| Pokémon in UNITE but **not** on UNITE-DB yet | [D — Provisional](#d--provisional-pokémon-not-on-unite-db-yet) |

First time on a machine? From `FoxForge-GG/`:

```bash
npm run data:doctor
```

Fix anything it prints (Node **24+**, Python venv, ffmpeg). On Apple Silicon, if doctor wants Node 24:

```bash
export PATH="/opt/homebrew/opt/node@24/bin:$PATH"
```

---

## A — Balance / items (easiest)

No hand-written builds. Two options:

### GitHub only (no laptop)

1. GitHub → **Actions** → **Refresh game data** → **Run workflow**.
2. Optional: set `patch_version` (e.g. `1.23.3.12`) when the in-game patch id changed.
3. Wait for the PR on `data/auto-refresh`.
4. Skim the changelog → **Merge**. Pages redeploys from `main`.

If the PR fails tests (common when a new Pokémon arrived with blank Basic move text), do not merge — use [B — New Pokémon](#b--new-pokémon) instead.

### Terminal

```bash
cd FoxForge-GG
npm run data:refresh -- --patch-version <X>   # omit --patch-version if patch id unchanged
git add -A
git commit -m "chore(data): refresh UNITE data"
git push
```

---

## B — New Pokémon

**About 20–40 minutes** once UNITE-DB has the Pokémon (longer if you also add clips).

Hand work is usually: (1) Basic move/passive text if UNITE-DB left them blank, (2) one Recommended build, (3) optional version bumps, (4) optional clips.

### Do now — checklist

Run every command from `FoxForge-GG/`. Replace `<id>` with the slug (e.g. `reshiram`) and `<Name>` with the display name.

1. **Pull UNITE-DB into the project** (use the real in-game patch id when it changed):

```bash
npm run data:refresh -- --patch-version <X>
```

If this fails `verify` on blank Basic descriptions, that is expected for many launches — continue; steps 3–4 fix it. If it fails for another reason, stop and read the error.

2. **See what is still missing:**

```bash
npm run data:gaps
```

Read the lines for `<id>`. Typical leftovers: no Recommended builds, blank descriptions, missing clips.

3. **Fill blank Basic descriptions (required when `data:gaps` or `verify` says so).**

Edit `tools/community/move_descriptions.json`: add a `"<id>"` object. Keys are **normalized move/passive names** — lowercase, strip trailing `(…)` and apostrophes (`Sirfetch'd` → `sirfetchd`). Example:

```json
"reshiram": {
  "turboblaze": "Has the user …",
  "dragon breath": "Has the user …",
  "blue flare": "Has the user …\n\nUpgrade (Level 13): …"
}
```

Tips:

- Copy in-game Basic tooltip text. Keep `\n\n` between paragraphs.
- Prefer `Upgrade (Level N):` using the upgrade’s second level from UNITE-DB (often 11 or 13).
- If Basic already has body text but no Upgrade line, normalize will copy **only** the Advanced Upgrade paragraph automatically — you do not need to paste numbers by hand.
- No `attack` key needed unless you have basic-attack Basic text (basic attacks are excluded from the blank-description gate).

4. **Scaffold and fill one Recommended build:**

```bash
npm run data:curate -- scaffold <id> --write
```

Open `tools/community/curated_builds.json`, find `"<id>"`, and fill:

- `name` / `emblemName` (same string is fine)
- `lane` (e.g. `Anywhere Damage` or `Path Damage`)
- `heldItemIds` (three ids, e.g. `energy-amplifier`)
- `battleItemId` (e.g. `eject-button`)
- `emblems` (exactly 10 × `{ "emblemId": "048-venonat", "grade": "gold" }`)
- `moves` (the two **final** move names from the scaffold `_comment`)

```bash
npm run data:curate -- check
```

Fix anything it reports (it suggests nearby ids for typos).

5. **Rebuild with your curation:**

```bash
npm run data:refresh -- --mode curate
```

Must finish with `verify` green. Then:

```bash
npm run data:gaps
```

`<id>` should no longer list blank descriptions or missing builds. Missing clips are OK for ship.

6. **Bump the app version** (Settings → App version). Roster add → minor; tiny follow-up → patch:

```bash
npm version 2.4.0 --no-git-tag-version   # example: new Pokémon after 2.3.x
```

Update the “currently `x.y.z`” / roster / `patchVersion` sentences in `AGENTS.md` if they still show the old numbers.

7. **Optional clips now** (or later via [C](#c--move-clips)):

```bash
# after dropping raws in tools/community/_clips/<id>/
npm run data:refresh -- --mode clips
```

You need this second pass even if you already ran full refresh — full mode transcodes *before* the new Pokémon exists in the bundle.

8. **Ship:**

```bash
git add -A
git commit -m "feat(data): add <Name> — patch <X> (vY.Z.W)"
git push origin main
```

9. **Smoke-check live** (or `npm run dev` first): picker shows the Pokémon, Recommended build applies, Basic/Advanced tooltips look right, Settings shows the new game-data and app versions.

### Footguns (read once)

1. **Never hand-edit** `patch-current.json` or `public/data/patch-*.json`.
2. **Blank Basic text fails CI** — fill `move_descriptions.json`, then `--mode curate`. Closing a failed auto-refresh PR and doing section B is normal.
3. **`builds` vs `recommendedTitles`** — mutually exclusive per Pokémon. New mons use `builds`.
4. **Scaffold needs the Pokémon in the bundle** — run step 1 before step 4.
5. **Clips after roster add** — always finish with `--mode clips` if you staged recordings.

---

## C — Move clips

Follow [`12-adding-move-clips.md`](12-adding-move-clips.md).

Short path when the Pokémon is already in the bundle:

```bash
# drop 1280×720 files into tools/community/_clips/<id>/ as <skill-id>.mp4
npm run data:refresh -- --mode clips
git add -A && git commit -m "feat(media): add clips for <Name>" && git push
```

---

## D — Provisional (Pokémon not on UNITE-DB yet)

Use only when the mon is playable in UNITE but missing from `https://unite-db.com/pokemon.json`. This is the hard path (~1–2 hours). Precedent: Palkia.

**Phase A — ship a placeholder**

1. Append rows to `tools/community/_raw/pokemon.json` and `_raw/stats.json` (copy stats from a similar mon; blank `rsb`; temporary `id` ≥ 900).
2. Add Basic text in `move_descriptions.json`.
3. Add curated `builds` (section B steps 4–5).
4. Drop placeholder art at `public/assets/pokemon/{portrait,thumbnail}/<Name>.png`.
5. Write `tools/community/_raw/<NAME>-PROVISIONAL.md` listing what is fake.
6. `npm run data:refresh -- --mode curate` (or normalize → presets → art → publish → verify).
7. Commit. Clips: [`12-adding-move-clips.md`](12-adding-move-clips.md).

**Phase B — when UNITE-DB catches up**

1. Delete placeholder art and the `*-PROVISIONAL.md` file.
2. `npm run data:refresh -- --patch-version <X>` (fetch overwrites `_raw`, art refreshes).
3. Re-check `move_descriptions.json` keys against real move names.
4. `npm run data:gaps` → fix leftovers → bump app version → commit.

---

## Command cheat sheet

| Command | When |
| --- | --- |
| `npm run data:doctor` | First step on a new machine |
| `npm run data:refresh` | Full pull from UNITE-DB (+ verify) |
| `npm run data:refresh -- --patch-version X` | Full pull and set game-data patch id |
| `npm run data:refresh -- --mode curate` | After editing builds or descriptions |
| `npm run data:refresh -- --mode clips` | After dropping new recordings |
| `npm run data:gaps` | “What is still missing?” |
| `npm run data:curate -- scaffold <id> --write` | Insert build template |
| `npm run data:curate -- check` | Validate `curated_builds.json` |
| `npm run verify` | Full local CI gate |
| `npm version X.Y.Z --no-git-tag-version` | Bump Settings app version |

Refresh modes: `full` (default) = doctor → fetch → transcode → normalize → presets → harvest → art → boosts → publish → verify. `curate` and `clips` run smaller subsets.

---

## Descriptions (reference)

- **Advanced** — from UNITE-DB (`rsb`); automatic.
- **Basic** — from UNITE-DB when present; else from `tools/community/move_descriptions.json`.
- After backfill, normalize punctuates Basic paragraphs and appends Advanced’s Upgrade paragraph onto Basic when Basic lacks an Upgrade marker.
- Edit archive → `npm run data:refresh -- --mode curate`.

---

## Curated builds (reference)

Only edit [`tools/community/curated_builds.json`](../tools/community/curated_builds.json).

1. Never hand-edit `emblemName` (or anything else) in patch JSON.
2. Per Pokémon: `builds` **or** `recommendedTitles`, not both. `creativeBuilds` may coexist.
3. After build edits, `--mode curate` (or `npm run generate:presets`) — CI fails on stale `emblemOptimizerPresets.json`.

---

## Publish + verify (reference)

| Copy | Path |
| --- | --- |
| Build-time baseline | `src/data/patch-current.json` |
| Published runtime | `public/data/patch-<patchVersion>.json` + `manifest.json` |

`manifest.json` `version` must equal the bundle’s `lastUpdated`. `npm run data:refresh` / `data:publish` keep them aligned. Gate with `npm run verify`.

Balance-patch watch list: [`10-patch-watch-checklist.md`](10-patch-watch-checklist.md).

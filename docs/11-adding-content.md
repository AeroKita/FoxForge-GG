# Adding Content

**Do this first:** pick **one** letter below. Ignore the other letters until that path is done.

| You have | Open this section | Time |
| --- | --- | --- |
| New held item, trainer item, or balance text already on UNITE-DB | [A — Balance / items](#a--balance--items) | ~5–15 min |
| New Pokémon already on [unite-db.com](https://unite-db.com) | [B — New Pokémon](#b--new-pokémon) | ~20–40 min (+ clips later) |
| New move/passive video recordings | [C — Move clips](#c--move-clips) | ~10–20 min |
| Pokémon in UNITE but **not** on UNITE-DB yet | [D — Provisional](#d--provisional) | ~1–2 hr |

Hard rules (every path):

1. Never hand-edit `src/data/patch-current.json` or `public/data/patch-*.json`. Game data is regenerated.
2. Nothing goes live until you push (or merge a PR).
3. Every ship path runs the test gate first — if something is wrong, it stops instead of shipping.

Architecture detail: [`AGENTS.md`](../AGENTS.md). Clips deep dive: [`12-adding-move-clips.md`](12-adding-move-clips.md).

---

## 0 — First time on this machine

**Do this now** if you have not run doctor on this Mac yet. Skip if doctor already passed today.

1. Open a terminal in `FoxForge-GG/`.
2. Pin Node with NVM (version is in `.nvmrc` and `.node-version`):

```bash
nvm install   # once per machine / when the pin changes
nvm use       # every new shell, unless you set `nvm alias default`
```

3. Run preflight:

```bash
npm run data:doctor
```

4. Fix anything it prints (Node **24+**, Python venv, ffmpeg).
5. If `node` is wrong or missing: stay with NVM (`nvm install && nvm use`). Do **not** export Homebrew `node@24` PATH hacks.

**Done when:** doctor prints environment ready (warnings for optional clip tooling are OK if you are not doing clips).

**Next:** go to the letter you picked (A, B, C, or D).

---

## A — Balance / items

**You are on path A.** No hand-written builds. Pick **one** of the two options below.

### A1 — GitHub only (no laptop)

1. Open the repo on GitHub → **Actions** → **Refresh game data** → **Run workflow**.
2. Optional: set `patch_version` (e.g. `1.23.3.12`) when the in-game patch id changed.
3. Wait for the PR on `data/auto-refresh`.
4. Skim the changelog.
5. If tests are green → **Merge**. Pages redeploys from `main`.
6. If tests fail on blank Basic move text → **do not merge**. Stop path A. Open [B — New Pokémon](#b--new-pokémon).
7. If tests fail for another reason → stop and fix the error before merging.

**Done when:** PR merged (or you switched to B).

**Next:** open the live site and spot-check an affected item/Pokémon, or stop.

### A2 — Terminal

1. `cd FoxForge-GG`
2. Refresh (omit `--patch-version` if the patch id is unchanged):

```bash
npm run data:refresh -- --patch-version <X>
```

3. If verify fails on blank Basic descriptions → stop path A. Open [B — New Pokémon](#b--new-pokémon).
4. If verify fails for another reason → stop and read the error.
5. Commit and push:

```bash
git add -A
git commit -m "chore(data): refresh UNITE data"
git push
```

**Done when:** push succeeded and CI/Pages is happy.

**Next:** smoke-check live, or stop.

---

## B — New Pokémon

**You are on path B.** ~20–40 minutes once UNITE-DB has the Pokémon (longer if you also add clips).

Hand work is usually:

1. Basic move/passive text if UNITE-DB left them blank
2. One Recommended build
3. Optional version bumps
4. Optional clips

Run every command from `FoxForge-GG/`. Replace `<id>` with the slug (e.g. `reshiram`) and `<Name>` with the display name.

### B — Do now

1. Pull UNITE-DB into the project (use the real in-game patch id when it changed):

```bash
npm run data:refresh -- --patch-version <X>
```

2. If this fails `verify` on blank Basic descriptions → that is expected for many launches. Continue to step 3. If it fails for another reason → stop and read the error.
3. See what is still missing:

```bash
npm run data:gaps
```

4. Read the lines for `<id>`. Typical leftovers: no Recommended builds, blank descriptions, missing clips.
5. Fill blank Basic descriptions when `data:gaps` or `verify` says so. Open `tools/community/move_descriptions.json` and add a `"<id>"` object.
6. Use **normalized** move/passive names as keys: lowercase, strip trailing `(…)` and apostrophes (`Sirfetch'd` → `sirfetchd`). Example:

```json
"reshiram": {
  "turboblaze": "Has the user …",
  "dragon breath": "Has the user …",
  "blue flare": "Has the user …\n\nUpgrade (Level 13): …"
}
```

7. When writing Basic text:
   - Copy in-game Basic tooltip text.
   - Keep `\n\n` between paragraphs.
   - Prefer `Upgrade (Level N):` using the upgrade’s second level from UNITE-DB (often 11 or 13).
   - If Basic already has body text but no Upgrade line, normalize will copy **only** the Advanced Upgrade paragraph automatically — you do not need to paste numbers by hand.
   - No `attack` key needed unless you have basic-attack Basic text (basic attacks are excluded from the blank-description gate).
8. Scaffold one Recommended build:

```bash
npm run data:curate -- scaffold <id> --write
```

9. Open `tools/community/curated_builds.json`, find `"<id>"`, and fill:
   - `name` / `emblemName` (same string is fine)
   - `lane` (e.g. `Anywhere Damage` or `Path Damage`)
   - `heldItemIds` (three ids, e.g. `energy-amplifier`)
   - `battleItemId` (e.g. `eject-button`)
   - `emblems` (exactly 10 × `{ "emblemId": "048-venonat", "grade": "gold" }`)
   - `moves` (the two **final** move names from the scaffold `_comment`)
10. Validate the curation file:

```bash
npm run data:curate -- check
```

11. Fix anything it reports (it suggests nearby ids for typos).
12. Rebuild with your curation:

```bash
npm run data:refresh -- --mode curate
```

13. Confirm this finished with `verify` green. If not → stop and fix before shipping.
14. Re-check gaps:

```bash
npm run data:gaps
```

15. Confirm `<id>` no longer lists blank descriptions or missing builds. Missing clips are OK for ship.
16. Bump the app version (Settings → App version). Roster add → minor; tiny follow-up → patch:

```bash
npm version 2.4.0 --no-git-tag-version   # example: new Pokémon after 2.3.x
```

17. Update the “currently `x.y.z`” / roster / `patchVersion` sentences in `AGENTS.md` if they still show the old numbers.
18. Ship:

```bash
git add -A
git commit -m "feat(data): add <Name> — patch <X> (vY.Z.W)"
git push origin main
```

19. Smoke-check live (or `npm run dev` first):
    - Picker shows the Pokémon
    - Recommended build applies
    - Basic/Advanced tooltips look right
    - Settings shows the new game-data and app versions

**Done when:** push is up and the smoke-check above passes. Clips can wait.

**Next (optional):** if you already staged recordings, do steps B20–B21. Otherwise stop, or open [C](#c--move-clips) later.

### B — Optional clips (same session or later)

20. Drop raws in `tools/community/_clips/<id>/` (see [`12-adding-move-clips.md`](12-adding-move-clips.md)).
21. Run a clips-only refresh (required even if you already ran full refresh — full mode transcodes *before* the new Pokémon exists in the bundle):

```bash
npm run data:refresh -- --mode clips
```

22. Commit/push media if you did not already in step 18.

### B — Footguns (read once before/during B)

1. Never hand-edit `patch-current.json` or `public/data/patch-*.json`.
2. Blank Basic text fails CI — fill `move_descriptions.json`, then `--mode curate`. Closing a failed auto-refresh PR and doing section B is normal.
3. `builds` vs `recommendedTitles` are mutually exclusive per Pokémon. New mons use `builds`.
4. Scaffold needs the Pokémon in the bundle — run B step 1 before B step 8.
5. Clips after roster add — always finish with `--mode clips` if you staged recordings.

---

## C — Move clips

**You are on path C.** Full detail: [`12-adding-move-clips.md`](12-adding-move-clips.md).

Short path when the Pokémon is **already** in the bundle:

1. Drop 1280×720 files into `tools/community/_clips/<id>/` as `<skill-id>.mp4`.
2. Refresh clips only:

```bash
npm run data:refresh -- --mode clips
```

3. Commit and push:

```bash
git add -A
git commit -m "feat(media): add clips for <Name>"
git push
```

**Done when:** moves play in the app for that Pokémon.

**Next:** smoke-check one move video in Settings/build UI, or stop.

---

## D — Provisional

**You are on path D.** Use only when the mon is playable in UNITE but missing from `https://unite-db.com/pokemon.json`. Hard path (~1–2 hours). Precedent: Palkia.

### D — Phase A (ship a placeholder)

1. Append rows to `tools/community/_raw/pokemon.json` and `_raw/stats.json` (copy stats from a similar mon; blank `rsb`; temporary `id` ≥ 900).
2. Add Basic text in `move_descriptions.json`.
3. Add curated `builds` using [B steps 8–15](#b--do-now) (scaffold → fill → check → `--mode curate` → gaps).
4. Drop placeholder art at `public/assets/pokemon/{portrait,thumbnail}/<Name>.png`.
5. Write `tools/community/_raw/<NAME>-PROVISIONAL.md` listing what is fake.
6. Rebuild:

```bash
npm run data:refresh -- --mode curate
```

   (or normalize → presets → art → publish → verify if you are running pieces by hand)
7. Commit. For clips, follow [`12-adding-move-clips.md`](12-adding-move-clips.md).

**Done when (Phase A):** placeholder is on `main` and marked provisional in `_raw/`.

**Next:** stop until UNITE-DB catches up, then do Phase B.

### D — Phase B (when UNITE-DB catches up)

1. Delete placeholder art and the `*-PROVISIONAL.md` file.
2. Pull real data:

```bash
npm run data:refresh -- --patch-version <X>
```

3. Re-check `move_descriptions.json` keys against real move names.
4. Run gaps and fix leftovers:

```bash
npm run data:gaps
```

5. Bump app version.
6. Commit and push.

**Done when (Phase B):** no provisional files left; real UNITE-DB data is live.

**Next:** smoke-check the Pokémon on live/dev.

---

## Command cheat sheet

Use while mid-path. Skip if you already know the command.

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

Refresh modes:

1. `full` (default) = doctor → fetch → transcode → normalize → presets → harvest → art → boosts → publish → verify
2. `curate` and `clips` run smaller subsets

---

## Reference — Descriptions

Skip while executing A–D. Open when writing Basic text.

1. **Advanced** — from UNITE-DB (`rsb`); automatic.
2. **Basic** — from UNITE-DB when present; else from `tools/community/move_descriptions.json`.
3. After backfill, normalize punctuates Basic paragraphs and appends Advanced’s Upgrade paragraph onto Basic when Basic lacks an Upgrade marker.
4. Edit archive → `npm run data:refresh -- --mode curate`.

---

## Reference — Curated builds

Skip while executing A–D. Open when editing builds.

Only edit [`tools/community/curated_builds.json`](../tools/community/curated_builds.json).

1. Never hand-edit `emblemName` (or anything else) in patch JSON.
2. Per Pokémon: `builds` **or** `recommendedTitles`, not both. `creativeBuilds` may coexist.
3. After build edits, `--mode curate` (or `npm run generate:presets`) — CI fails on stale `emblemOptimizerPresets.json`.

---

## Reference — Publish + verify

Skip while executing A–D. Open when debugging publish/manifest mismatches.

| Copy | Path |
| --- | --- |
| Build-time baseline | `src/data/patch-current.json` |
| Published runtime | `public/data/patch-<patchVersion>.json` + `manifest.json` |

1. `manifest.json` `version` must equal the bundle’s `lastUpdated`.
2. `npm run data:refresh` / `data:publish` keep them aligned.
3. Gate with `npm run verify`.
4. Balance-patch watch list: [`10-patch-watch-checklist.md`](10-patch-watch-checklist.md).

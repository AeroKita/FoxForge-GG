# Palkia — provisional placeholder data

Palkia is **not yet on UNITE-DB** (verified 2026-07-17: `pokemon.json` returns 96
Pokémon, no Palkia). To preview its layout in the local app ahead of real data, a
placeholder Palkia was hand-injected into the `_raw` fallback files, following the
"Single-Pokémon roster add" path in [`docs/11-adding-content.md`](../../../docs/11-adding-content.md).

## What is real vs. placeholder

| Piece | Status |
| --- | --- |
| Role / type / range (All-Rounder, Sp. Atk, Melee) | real |
| Move set + Basic descriptions (`move_descriptions.json`) | real — transcribed from official in-game screenshots |
| Move-preview clips (`public/assets/skills/Palkia/`) | real — self-recorded |
| Two Recommended builds (`curated_builds.json`) | real — user-provided |
| **Base stats (all 15 levels)** | **PLACEHOLDER — copied from Empoleon** |
| Move damage numbers (`rsb`) | empty — no values until real data |
| Advanced-mode move text | empty — the UI falls back to Basic |
| Portrait / thumbnail art | placeholder "?" images |
| `_raw` `id` (900) | fake sentinel (real ids are 1–96) |

The stat numbers shown in-app are **Empoleon's**, not Palkia's. Nothing here is
fit to publish.

## When UNITE-DB ships Palkia

`fetch.py` overwrites `_raw/`, so a normal `npm run data:refresh` replaces this
entire placeholder with real data automatically. After that:

1. Delete this file and the placeholder art (`public/assets/pokemon/{portrait,thumbnail}/Palkia.png`) — `fetch_art.py` pulls the real art.
2. Re-check the two curated builds' item/emblem ids and the `move_descriptions.json`
   keys against UNITE-DB's real Palkia move names.
3. Confirm the `Upgrade (Level 11 / 13)` levels in the Aura Sphere / Dragon Claw
   descriptions match the real upgrade levels.
4. Update `AGENTS.md`: drop the "Palkia is a hand-injected placeholder…" note from
   the roster line under **How This System Works** (the count stays at 97, or bumps
   with whatever else UNITE-DB adds).

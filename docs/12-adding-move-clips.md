# Adding Move Clips

Data/asset work only — no TypeScript changes. Run from the `FoxForge-GG/` folder.

## Prerequisites

1. `npm run data:doctor` — needs `ffmpeg` + `ffprobe` (and Node 24+).
2. The Pokémon must already be in `src/data/patch-current.json` (add the Pokémon first via [`11-adding-content.md`](11-adding-content.md)).
3. Raw recordings at **1280×720 H.264**, named by exact skill id.

## File layout

```
tools/community/_clips/<pokemon-id>/
  MOVES.txt                          # checklist (commit this)
  dragon-breath.mp4                  # raw (gitignored)
  blue-flare.mp4
  turboblaze.mp4                     # optional passive
```

- Skill ids match the bundle (`move.id` or `passiveAbility.id`), lowercase with hyphens.
- Each folder’s `MOVES.txt` lists the expected filenames. Staging overview: [`tools/community/_clips/README.md`](../tools/community/_clips/README.md).
- Scope: base moves, final (upgrade) moves, Unite moves. **Passives are optional.**

## Steps

1. Drop the raw `.mp4` / `.mov` files into `_clips/<pokemon-id>/`.
2. Quick name + resolution check:

```bash
python3 - <<'PY'
import json, subprocess
from pathlib import Path
b = json.load(open("src/data/patch-current.json"))
by_id = {p["id"]: p for p in b["pokemon"]}
bad = []
for c in sorted(p for p in Path("tools/community/_clips").glob("*/*") if p.suffix.lower() in (".mp4", ".mov")):
    p = by_id.get(c.parent.name)
    mid = c.stem.lower()
    move = None
    if p:
        move = next((m for m in p["moves"] if m["id"] == mid and m.get("slot") in ("move1", "move2", "uniteMove")), None)
        if not move and (p.get("passiveAbility") or {}).get("id") == mid:
            move = p["passiveAbility"]
    dim = subprocess.run(
        ["ffprobe", "-v", "error", "-select_streams", "v:0",
         "-show_entries", "stream=width,height", "-of", "csv=p=0", str(c)],
        capture_output=True, text=True,
    ).stdout.strip()
    if not move:
        bad.append((str(c), "bad pokemon/skill-id"))
    elif dim != "1280,720":
        bad.append((str(c), f"resolution {dim}"))
print("issues:", len(bad))
for row in bad:
    print(" ", row)
PY
```

Fix any reported rows before continuing.

3. Transcode + wire into the bundle (one command):

```bash
npm run data:refresh -- --mode clips
```

This transcodes new/changed clips, rewrites `tools/community/move_clips.json`, regenerates `patch-current.json` + `public/data/`, and runs `npm run verify`.

4. Commit and push:

```bash
git add -A
git commit -m "feat(media): add move clips for <Pokémon>"
git push origin main
```

## Roster-add footgun

`npm run data:refresh` (full mode) transcodes **before** normalize. On a brand-new Pokémon, the first full refresh skips that Pokémon’s clips. After the Pokémon is in the bundle, run:

```bash
npm run data:refresh -- --mode clips
```

## Notes

- Outputs land at `public/assets/skills/<Folder>/<Skill>.mp4` (~30–160 KB each). Commit those; raws stay gitignored.
- A skill with no clip falls back to GIF (if any) or static icon.
- Prefer `npm run data:refresh -- --mode clips` over calling `transcode_clips.py` + `normalize.py` by hand — the refresh mode keeps both bundle copies and verify in sync.

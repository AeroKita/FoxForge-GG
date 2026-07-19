"""Report per-Pokémon curation gaps in the live bundle."""

from __future__ import annotations

import json
import sys
from pathlib import Path

REPO = Path(__file__).resolve().parents[2]
BUNDLE = REPO / "src" / "data" / "patch-current.json"


def find_gaps(bundle: dict) -> list[str]:
    """Return formatted per-Pokémon gap lines for *bundle* (empty if clean)."""
    lines: list[str] = []

    for p in bundle.get("pokemon") or []:
        gaps: list[str] = []
        pid = p["id"]
        name = p.get("name", pid)

        if not p.get("builds"):
            gaps.append("no Recommended builds")

        for m in p.get("moves", []):
            if m.get("slot") == "basicAttack":
                continue
            if not (m.get("description") or "").strip():
                gaps.append(f"blank description on {m.get('name', '?')!r}")

        for m in p.get("moves", []):
            if m.get("slot") == "basicAttack":
                continue
            if not m.get("videoAsset") and not m.get("gifAsset"):
                gaps.append(f"missing clip/gif on {m.get('name', '?')!r}")

        builds = list(p.get("builds") or []) + list(p.get("creativeBuilds") or [])
        if builds and not any(len(b.get("emblems") or []) == 10 for b in builds):
            gaps.append(
                "no complete 10-emblem build (optimizer preset falls back to generic)"
            )

        if gaps:
            lines.append(f"- **{name}** (`{pid}`): {', '.join(gaps)}")

    return lines


def main() -> None:
    bundle = json.loads(BUNDLE.read_text())
    lines = find_gaps(bundle)
    if lines:
        for line in lines:
            print(line)
    else:
        print("✓ no curation gaps found")
    sys.exit(0)


if __name__ == "__main__":
    main()

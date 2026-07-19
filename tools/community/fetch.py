"""Fetch raw Pokémon UNITE data from UNITE-DB (community source).

UNITE-DB (https://unite-db.com) is a statically-generated Nuxt site whose store
is hydrated from six public JSON endpoints at the site root. robots.txt permits
crawling (Disallow is empty). We pull all six verbatim into _raw/ so the
normalize step is reproducible and offline.

This is the documented community-data fallback (docs/04-data-sourcing.md): the
APK's own bundles are encrypted with keys not yet recovered for v1.23.1.1, so we
source the numbers from UNITE-DB and flag the whole bundle's provenance.

Usage:  python3 fetch.py
"""

from __future__ import annotations

import json
from datetime import date
from pathlib import Path

import requests

BASE = "https://unite-db.com"
RAW = Path(__file__).resolve().parent / "_raw"
ENDPOINTS = [
    "pokemon",
    "stats",
    "held_items",
    "battle_items",
    "emblems",
    "emblem_sets",
]


def fetch() -> None:
    RAW.mkdir(parents=True, exist_ok=True)
    manifest = {"source": BASE, "fetched": date.today().isoformat(), "files": {}}
    for name in ENDPOINTS:
        url = f"{BASE}/{name}.json"
        r = requests.get(url, headers={"User-Agent": "unite-build-optimizer/0.1"}, timeout=60)
        r.raise_for_status()
        (RAW / f"{name}.json").write_bytes(r.content)
        parsed = r.json()
        manifest["files"][name] = {"url": url, "bytes": len(r.content), "count": len(parsed)}
        print(f"  {name}.json: {len(r.content):,} bytes, {len(parsed)} entries")
    (RAW / "_manifest.json").write_text(json.dumps(manifest, indent=2))
    print(f"\nWrote {RAW}/_manifest.json (source={BASE})")


if __name__ == "__main__":
    fetch()

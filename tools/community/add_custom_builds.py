#!/usr/bin/env python3
"""One-shot curation: add custom Recommended + Creative builds and rename two
build sets in the patch bundle. Idempotent; edits src/data and public/data
identically. See plans/2026-06-17-custom-builds-plan.md."""
import json
from pathlib import Path

HERE = Path(__file__).resolve().parent
ROOT = HERE.parent.parent  # FoxForge-GG/
FILES = [ROOT / "src/data/patch-1.23.1.1.json",
         ROOT / "public/data/patch-1.23.1.1.json"]

def build(title, lane, held, battle, moves, emblems):
    return {
        "name": title, "emblemName": title, "lane": lane,
        "heldItemIds": held, "battleItemId": battle,
        "emblems": [{"emblemId": e, "grade": g} for e, g in emblems],
        "moves": moves,
    }

# ---- Recommended builds (added to `builds`) --------------------------------
RECOMMENDED = {
    "skeledirge": [
        build("Singing Special Attacker", "Anywhere Damage",
              ["slick-spoon", "wise-glasses", "choice-specs"], "eject-button",
              ["Hyper Voice", "Snarl"],
              [("048-venonat","gold"),("012-butterfree","gold"),("249-lugia","gold"),
               ("071-victreebel","bronze"),("045-vileplume","gold"),("049-venomoth","gold"),
               ("088-grimer","gold"),("089-muk","gold"),("211-qwilfish","gold"),
               ("248-tyranitar","gold")]),
        build("Mobile Special Attacker", "Anywhere Damage",
              ["drive-lens", "wise-glasses", "choice-specs"], "x-speed",
              ["Hyper Voice", "Snarl"],
              [("189-jumpluff","gold"),("249-lugia","gold"),("048-venonat","gold"),
               ("045-vileplume","gold"),("049-venomoth","gold"),("248-tyranitar","gold"),
               ("908-meowscarada","platinum"),("088-grimer","gold"),("094-gengar","gold"),
               ("041-zubat","gold")]),
    ],
    "articuno": [
        build("Frozen Defender", "Path Damage",
              ["vanguard-bell", "focus-band", "curse-incense"], "x-speed",
              ["Blizzard", "Ice Beam"],
              [("086-seel","gold"),("245-suicune","gold"),("134-vaporeon","gold"),
               ("144-articuno","gold"),("226-mantine","gold"),("012-butterfree","gold"),
               ("249-lugia","gold"),("242-blissey","gold"),("145-zapdos","gold"),
               ("221-piloswine","gold")]),
    ],
    "meganium": [
        build("Healing Support", "Path Damage",
              ["rescue-hood", "focus-band", "sp--atk-specs"], "potion",
              ["Grass Knot", "Petal Blizzard"],
              [("048-venonat","gold"),("012-butterfree","gold"),("249-lugia","gold"),
               ("071-victreebel","bronze"),("045-vileplume","gold"),("049-venomoth","gold"),
               ("088-grimer","gold"),("089-muk","gold"),("211-qwilfish","gold"),
               ("248-tyranitar","gold")]),
        build("Shield Support", "Path Damage",
              ["rescue-hood", "resonant-guard", "buddy-barrier"], "x-speed",
              ["Grass Knot", "Petal Blizzard"],
              [("048-venonat","gold"),("012-butterfree","gold"),("249-lugia","gold"),
               ("071-victreebel","bronze"),("045-vileplume","gold"),("049-venomoth","gold"),
               ("088-grimer","gold"),("089-muk","gold"),("211-qwilfish","gold"),
               ("248-tyranitar","gold")]),
    ],
    "moltres": [
        build("Blazing All-Rounder", "Path Damage",
              ["slick-spoon", "choice-specs", "focus-band"], "full-heal",
              ["Sky Attack", "Heat Wave"],
              [("045-vileplume","gold"),("049-venomoth","gold"),("048-venonat","gold"),
               ("012-butterfree","gold"),("189-jumpluff","gold"),("249-lugia","gold"),
               ("145-zapdos","gold"),("242-blissey","gold"),("113-chansey","gold"),
               ("248-tyranitar","gold")]),
    ],
    "typhlosion": [
        build("Blazing Special Attacker", "Anywhere Damage",
              ["wise-glasses", "slick-spoon", "amulet-coin"], "eject-button",
              ["Eruption", "Flame Wheel"],
              [("045-vileplume","gold"),("145-zapdos","gold"),("242-blissey","gold"),
               ("249-lugia","gold"),("012-butterfree","gold"),("189-jumpluff","gold"),
               ("144-articuno","gold"),("086-seel","gold"),("048-venonat","gold"),
               ("043-oddish","gold")]),
    ],
    "feraligatr": [
        build("Crunchy All-Rounder", "Anywhere Damage",
              ["razor-claw", "attack-weight", "weakness-policy"], "eject-button",
              ["Crunch", "Waterfall"],
              [("057-primeape","gold"),("068-machamp","gold"),("105-marowak","gold"),
               ("142-aerodactyl","bronze"),("018-pidgeot","gold"),("115-kangaskhan","gold"),
               ("206-dunsparce","gold"),("235-smeargle","gold"),("250-ho-oh","gold"),
               ("031-nidoqueen","gold")]),
    ],
}

# ---- Creative builds (added to `creativeBuilds`) ---------------------------
CREATIVE = {
    "lucario": [
        build("Step on the Gas (Physical)", "Anywhere Damage",
              ["attack-weight", "float-stone", "amulet-coin"], "full-heal",
              ["Extreme Speed", "Bone Rush"],
              [("172-pichu","gold"),("025-pikachu","platinum"),("051-dugtrio","gold"),
               ("050-diglett","gold"),("142-aerodactyl","gold"),("145-zapdos","gold"),
               ("1008-miraidon","platinum"),("082-magneton","bronze"),
               ("101-electrode","platinum"),("100-voltorb","gold")]),
    ],
    "gengar": [
        build("Step on the Gas (Special)", "Center Damage",
              ["drive-lens", "float-stone", "amulet-coin"], "full-heal",
              ["Sludge Bomb", "Hex"],
              [("172-pichu","gold"),("907-floragato","platinum"),("193-yanma","gold"),
               ("189-jumpluff","gold"),("243-raikou","gold"),("145-zapdos","gold"),
               ("1008-miraidon","platinum"),("082-magneton","gold"),
               ("101-electrode","platinum"),("100-voltorb","gold")]),
    ],
    "urshifu": [
        build("Flurry of Surging Strikes", "Center Damage",
              ["accel-bracer", "weakness-policy", "muscle-band"], "full-heal",
              ["Surging Strikes", "Liquidation"],
              [("250-ho-oh","gold"),("057-primeape","gold"),("089-muk","gold"),
               ("211-qwilfish","gold"),("169-crobat","gold"),("197-umbreon","gold"),
               ("168-ariados","gold"),("024-arbok","silver"),("248-tyranitar","gold"),
               ("142-aerodactyl","bronze")]),
    ],
    "latios": [
        build("Step on the Gas (Special)", "Path Damage",
              ["drive-lens", "wise-glasses", "float-stone"], "eject-button",
              ["Luster Purge", "Dragon Pulse"],
              [("172-pichu","gold"),("907-floragato","platinum"),("193-yanma","gold"),
               ("189-jumpluff","gold"),("243-raikou","gold"),("145-zapdos","gold"),
               ("1008-miraidon","platinum"),("082-magneton","gold"),
               ("101-electrode","platinum"),("100-voltorb","gold")]),
    ],
    "latias": [
        build("Step on the Gas (Special)", "Path Damage",
              ["drive-lens", "curse-incense", "float-stone"], "eject-button",
              ["Mist Ball", "Dragon Breath"],
              [("172-pichu","gold"),("907-floragato","platinum"),("193-yanma","gold"),
               ("189-jumpluff","gold"),("243-raikou","gold"),("145-zapdos","gold"),
               ("1008-miraidon","platinum"),("082-magneton","gold"),
               ("101-electrode","platinum"),("100-voltorb","gold")]),
    ],
    "decidueye": [
        build("Heavy is the Crown", "Center Damage",
              ["drain-crown", "rapid-fire-scarf", "scope-lens"], "eject-button",
              ["Razor Leaf", "Leaf Storm"],
              [("142-aerodactyl","bronze"),("250-ho-oh","gold"),("229-houndoom","bronze"),
               ("228-houndour","gold"),("244-entei","gold"),("077-ponyta","silver"),
               ("005-charmeleon","silver"),("004-charmander","bronze"),
               ("136-flareon","bronze"),("207-gligar","gold")]),
    ],
    "garchomp": [
        build("Heavy is the Crown", "Path Damage",
              ["drain-crown", "rapid-fire-scarf", "big-root"], "full-heal",
              ["Dragon Rush", "Dragon Claw"],
              [("142-aerodactyl","bronze"),("250-ho-oh","gold"),("068-machamp","gold"),
               ("076-golem","gold"),("218-slugma","bronze"),("244-entei","gold"),
               ("229-houndoom","gold"),("004-charmander","gold"),("146-moltres","bronze"),
               ("022-fearow","gold")]),
    ],
}

# ---- Renames: set emblemName on existing builds, scoped by Pokémon id ------
# Absol: all builds -> one title. Lucario: by array index.
ABSOL_RENAME = "Critical Hit Specialist"
LUCARIO_RENAME = ["Punch Rush", "Doggo Zoomies", "Punchy Doggy", "Amplified Aura Cannon"]

def apply(bundle):
    by_id = {p["id"]: p for p in bundle["pokemon"]}
    for pid, builds in RECOMMENDED.items():
        by_id[pid]["builds"] = builds              # these Pokémon had no builds
    for pid, builds in CREATIVE.items():
        by_id[pid]["creativeBuilds"] = builds      # add new Creative array
    for b in by_id["absol"]["builds"]:
        b["emblemName"] = ABSOL_RENAME
    luc = by_id["lucario"]["builds"]
    assert len(luc) == len(LUCARIO_RENAME), f"expected 4 Lucario builds, got {len(luc)}"
    for b, title in zip(luc, LUCARIO_RENAME):
        b["emblemName"] = title
    bundle["lastUpdated"] = "2026-06-17"

for path in FILES:
    data = json.loads(path.read_text(encoding="utf-8"))
    apply(data)
    path.write_text(json.dumps(data, indent=2, ensure_ascii=False), encoding="utf-8")
    print(f"updated {path}")

# Safety: the two bundles must stay byte-identical.
a, b = (p.read_text(encoding="utf-8") for p in FILES)
assert a == b, "src/data and public/data drifted — they must be identical"
print("OK: both bundles identical")

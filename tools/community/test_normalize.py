"""Unit tests for normalize.py helpers."""

from __future__ import annotations

import unittest

from normalize import (
    build_emblems,
    build_upgrade_move,
    fix_spelling,
    fix_spelling_deep,
    passive_basic_desc,
    strip_activation_note,
)


class TestStripActivationNote(unittest.TestCase):
    def test_with_period(self):
        self.assertEqual(
            strip_activation_note("...kick style. Activates at Level 9"),
            "...kick style.",
        )

    def test_without_period(self):
        self.assertEqual(
            strip_activation_note("...loses its shield Activates at Level 8"),
            "...loses its shield.",
        )

    def test_noop(self):
        self.assertEqual(strip_activation_note("A plain sentence."), "A plain sentence.")


class TestPassiveBasicDesc(unittest.TestCase):
    def test_unite_db_description_present(self):
        passive = {"name": "Dark Aura", "description": "From UNITE-DB.", "rsb": {"true_desc": "Advanced."}}
        over = {"dark aura": "Override text."}
        self.assertEqual(passive_basic_desc(passive, over), "From UNITE-DB.")

    def test_blank_description_uses_override(self):
        passive = {"name": "Dark Aura", "description": "", "rsb": {"true_desc": "Advanced."}}
        over = {"dark aura": "Override text."}
        self.assertEqual(passive_basic_desc(passive, over), "Override text.")

    def test_both_blank_falls_back_to_rsb(self):
        passive = {"name": "Dark Aura", "description": "", "rsb": {"true_desc": "Advanced text."}}
        self.assertEqual(passive_basic_desc(passive, {}), "Advanced text.")

    def test_none_passive_returns_empty(self):
        self.assertEqual(passive_basic_desc(None, {}), "")


class TestBuildUpgradeMove(unittest.TestCase):
    def test_bare_upgrade_marker_gets_level_from_level2(self):
        up = {"name": "Low Sweep", "description1": "Body.\n\nUpgrade: More damage.", "level2": "11"}
        move = build_upgrade_move(up, "move1", "Quaquaval")
        self.assertIn("Upgrade (Level 11):", move["description"])
        self.assertNotIn("Upgrade:", move["description"].replace("Upgrade (Level 11):", ""))


class TestFixSpelling(unittest.TestCase):
    def test_known_misspellings(self):
        self.assertEqual(fix_spelling("Chicorita"), "Chikorita")
        self.assertEqual(fix_spelling("Ho-oh"), "Ho-Oh")
        self.assertEqual(fix_spelling("Lumiere of Demise"), "Lumière of Demise")

    def test_noop_passthrough(self):
        self.assertEqual(fix_spelling("Pikachu"), "Pikachu")

    def test_lowercase_slugs_untouched(self):
        self.assertEqual(fix_spelling("250-ho-oh"), "250-ho-oh")
        self.assertEqual(fix_spelling("lumiere-of-demise"), "lumiere-of-demise")


class TestFixSpellingDeep(unittest.TestCase):
    def test_rewrites_nested_string_values(self):
        fixture = {
            "name": "Ho-oh",
            "nested": {"description": "Ho-oh recovers HP"},
            "items": ["Chicorita", "plain"],
            "count": 42,
        }
        out = fix_spelling_deep(fixture)
        self.assertEqual(out["name"], "Ho-Oh")
        self.assertEqual(out["nested"]["description"], "Ho-Oh recovers HP")
        self.assertEqual(out["items"], ["Chikorita", "plain"])
        self.assertEqual(out["count"], 42)

    def test_skips_asset_path_fields(self):
        fixture = {
            "name": "Lumiere of Demise",
            "iconAsset": "/assets/skills/Yveltal/Lumiere+of+Demise.png",
            "videoAsset": "/assets/skills/Yveltal/Lumiere+of+Demise.mp4",
        }
        out = fix_spelling_deep(fixture)
        self.assertEqual(out["name"], "Lumière of Demise")
        self.assertEqual(out["iconAsset"], "/assets/skills/Yveltal/Lumiere+of+Demise.png")
        self.assertEqual(out["videoAsset"], "/assets/skills/Yveltal/Lumiere+of+Demise.mp4")


class TestBuildEmblemsSpelling(unittest.TestCase):
    def test_chicorita_and_ho_oh_display_names(self):
        rows = [
            {
                "name": "152A",
                "pokedex": "152",
                "grade": "A",
                "display_name": "Chicorita",
                "color1": "Green",
                "stats": [],
            },
            {
                "name": "250A",
                "pokedex": "250",
                "grade": "A",
                "display_name": "Ho-oh",
                "color1": "Red",
                "stats": [],
            },
        ]
        out = build_emblems(rows)
        by_id = {e["id"]: e for e in out}
        self.assertEqual(by_id["152-chikorita"]["pokemonName"], "Chikorita")
        self.assertEqual(by_id["250-ho-oh"]["pokemonName"], "Ho-Oh")


if __name__ == "__main__":
    unittest.main()

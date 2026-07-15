"""Unit tests for normalize.py helpers."""

from __future__ import annotations

import unittest

from normalize import (
    apply_patch_note_overrides,
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


def _minimal_override_bundle() -> dict:
    """One Pokémon with one move and one held item for patch-note override tests."""
    return {
        "pokemon": [{
            "id": "testmon",
            "moves": [{
                "id": "test-move",
                "cooldownSeconds": 8.5,
                "damageInstances": [
                    {"ratio": 1.0, "slider": 10.0, "base": 100.0, "scalingStat": "attack", "damageType": "physical"},
                    {"ratio": 2.0, "slider": 20.0, "base": 200.0, "scalingStat": "attack", "damageType": "physical"},
                ],
                "description": "Basic text.",
                "descriptionAdvanced": "Advanced text with 8.5% max HP.",
            }],
        }],
        "heldItems": [{
            "id": "test-item",
            "description": "Boost by 11/14/17%.",
            "effect": {"label": "HP", "tiers": ["11%", "14%", "17%"]},
        }],
    }


class TestApplyPatchNoteOverrides(unittest.TestCase):
    def test_set_move_field_applies_when_expect_matches(self):
        bundle = _minimal_override_bundle()
        overrides = [{
            "kind": "set",
            "pokemon": "testmon",
            "move": "test-move",
            "field": "cooldownSeconds",
            "expect": 8.5,
            "value": 8.0,
            "why": "test cooldown",
        }]
        applied, skipped = apply_patch_note_overrides(bundle, overrides)
        self.assertEqual(applied, 1)
        self.assertEqual(skipped, 0)
        self.assertEqual(bundle["pokemon"][0]["moves"][0]["cooldownSeconds"], 8.0)

    def test_set_move_field_skips_when_expect_mismatches(self):
        bundle = _minimal_override_bundle()
        overrides = [{
            "kind": "set",
            "pokemon": "testmon",
            "move": "test-move",
            "field": "cooldownSeconds",
            "expect": 7.0,
            "value": 8.0,
            "why": "test cooldown",
        }]
        applied, skipped = apply_patch_note_overrides(bundle, overrides)
        self.assertEqual(applied, 0)
        self.assertEqual(skipped, 1)
        self.assertEqual(bundle["pokemon"][0]["moves"][0]["cooldownSeconds"], 8.5)

    def test_set_item_effect_tiers_applies_on_exact_list_match(self):
        bundle = _minimal_override_bundle()
        overrides = [{
            "kind": "set",
            "item": "test-item",
            "field": "effect.tiers",
            "expect": ["11%", "14%", "17%"],
            "value": ["17%", "20%", "23%"],
            "why": "test tiers",
        }]
        applied, skipped = apply_patch_note_overrides(bundle, overrides)
        self.assertEqual(applied, 1)
        self.assertEqual(skipped, 0)
        self.assertEqual(
            bundle["heldItems"][0]["effect"]["tiers"],
            ["17%", "20%", "23%"],
        )

    def test_scale_damage_multiplies_listed_instances_only(self):
        bundle = _minimal_override_bundle()
        overrides = [{
            "kind": "scaleDamage",
            "pokemon": "testmon",
            "move": "test-move",
            "instances": [0],
            "expectRatios": [1.0],
            "factor": 1.5,
            "why": "test scale",
        }]
        applied, skipped = apply_patch_note_overrides(bundle, overrides)
        self.assertEqual(applied, 1)
        self.assertEqual(skipped, 0)
        inst0 = bundle["pokemon"][0]["moves"][0]["damageInstances"][0]
        inst1 = bundle["pokemon"][0]["moves"][0]["damageInstances"][1]
        self.assertEqual(inst0["ratio"], 1.5)
        self.assertEqual(inst0["slider"], 15.0)
        self.assertEqual(inst0["base"], 150.0)
        self.assertEqual(inst1["ratio"], 2.0)
        self.assertEqual(inst1["slider"], 20.0)
        self.assertEqual(inst1["base"], 200.0)

    def test_scale_damage_skips_when_expect_ratios_mismatch(self):
        bundle = _minimal_override_bundle()
        overrides = [{
            "kind": "scaleDamage",
            "pokemon": "testmon",
            "move": "test-move",
            "instances": [0, 1],
            "expectRatios": [1.0, 2.5],
            "factor": 1.5,
            "why": "test scale",
        }]
        applied, skipped = apply_patch_note_overrides(bundle, overrides)
        self.assertEqual(applied, 0)
        self.assertEqual(skipped, 1)
        inst0 = bundle["pokemon"][0]["moves"][0]["damageInstances"][0]
        inst1 = bundle["pokemon"][0]["moves"][0]["damageInstances"][1]
        self.assertEqual(inst0["ratio"], 1.0)
        self.assertEqual(inst1["ratio"], 2.0)

    def test_replace_text_rewrites_named_field(self):
        bundle = _minimal_override_bundle()
        overrides = [{
            "kind": "replaceText",
            "pokemon": "testmon",
            "move": "test-move",
            "fields": ["descriptionAdvanced"],
            "find": "8.5% max HP",
            "replace": "9.35% max HP",
            "why": "test text",
        }]
        applied, skipped = apply_patch_note_overrides(bundle, overrides)
        self.assertEqual(applied, 1)
        self.assertEqual(skipped, 0)
        self.assertIn("9.35% max HP", bundle["pokemon"][0]["moves"][0]["descriptionAdvanced"])
        self.assertNotIn("8.5% max HP", bundle["pokemon"][0]["moves"][0]["descriptionAdvanced"])

    def test_replace_text_expires_when_find_absent(self):
        bundle = _minimal_override_bundle()
        overrides = [{
            "kind": "replaceText",
            "item": "test-item",
            "fields": ["description"],
            "find": "by 99/99/99%",
            "replace": "by 17/20/23%",
            "why": "test text",
        }]
        applied, skipped = apply_patch_note_overrides(bundle, overrides)
        self.assertEqual(applied, 0)
        self.assertEqual(skipped, 1)
        self.assertEqual(bundle["heldItems"][0]["description"], "Boost by 11/14/17%.")


if __name__ == "__main__":
    unittest.main()

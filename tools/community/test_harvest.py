"""Unit tests for harvest_descriptions.py — archive Basic move/passive text from the bundle."""

from __future__ import annotations

import copy
import unittest

from harvest_descriptions import harvest


def _bundle(**pokemon_overrides) -> dict:
    base = {
        "id": "pikachu",
        "displayName": "Pikachu",
        "moves": [],
        "passiveAbility": {"id": "static", "name": "Static", "description": ""},
    }
    base.update(pokemon_overrides)
    return {"patchVersion": "1.0.0.0", "pokemon": [base]}


class TestHarvest(unittest.TestCase):
    def test_new_text_is_added(self):
        bundle = _bundle(
            moves=[
                {
                    "id": "thunderbolt",
                    "name": "Thunderbolt",
                    "slot": "move1",
                    "description": "Deals damage.",
                }
            ]
        )
        archive: dict = {}
        updated, changes = harvest(bundle, archive)
        self.assertEqual(updated["pikachu"]["thunderbolt"], "Deals damage.")
        self.assertEqual(len(changes), 1)

    def test_changed_text_is_updated(self):
        bundle = _bundle(
            moves=[
                {
                    "id": "thunderbolt",
                    "name": "Thunderbolt",
                    "slot": "move1",
                    "description": "New wording.",
                }
            ]
        )
        archive = {"pikachu": {"thunderbolt": "Old wording."}}
        updated, changes = harvest(bundle, archive)
        self.assertEqual(updated["pikachu"]["thunderbolt"], "New wording.")
        self.assertEqual(len(changes), 1)

    def test_blank_never_overwrites(self):
        bundle = _bundle(
            moves=[
                {
                    "id": "thunderbolt",
                    "name": "Thunderbolt",
                    "slot": "move1",
                    "description": "",
                }
            ]
        )
        archive = {"pikachu": {"thunderbolt": "Preserved text."}}
        updated, changes = harvest(bundle, archive)
        self.assertEqual(updated["pikachu"]["thunderbolt"], "Preserved text.")
        self.assertEqual(changes, [])

    def test_passive_is_harvested(self):
        bundle = _bundle(
            passiveAbility={
                "id": "static",
                "name": "Static",
                "description": "May paralyze on hit.",
            }
        )
        archive: dict = {}
        updated, changes = harvest(bundle, archive)
        self.assertEqual(updated["pikachu"]["static"], "May paralyze on hit.")
        self.assertEqual(len(changes), 1)

    def test_idempotent(self):
        bundle = _bundle(
            moves=[
                {
                    "id": "thunderbolt",
                    "name": "Thunderbolt",
                    "slot": "move1",
                    "description": "Deals damage.",
                }
            ],
            passiveAbility={
                "id": "static",
                "name": "Static",
                "description": "May paralyze on hit.",
            },
        )
        archive: dict = {}
        updated, changes1 = harvest(bundle, archive)
        _, changes2 = harvest(bundle, updated)
        self.assertGreater(len(changes1), 0)
        self.assertEqual(changes2, [])

    def test_existing_hand_entries_survive(self):
        bundle = _bundle(moves=[])
        archive = {"missingmon": {"some move": "Hand-written."}}
        updated, changes = harvest(bundle, archive)
        self.assertEqual(updated["missingmon"]["some move"], "Hand-written.")
        self.assertEqual(changes, [])


if __name__ == "__main__":
    unittest.main()

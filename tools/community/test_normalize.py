"""Unit tests for normalize.py helpers."""

from __future__ import annotations

import unittest

from normalize import build_upgrade_move, strip_activation_note


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


class TestBuildUpgradeMove(unittest.TestCase):
    def test_bare_upgrade_marker_gets_level_from_level2(self):
        up = {"name": "Low Sweep", "description1": "Body.\n\nUpgrade: More damage.", "level2": "11"}
        move = build_upgrade_move(up, "move1", "Quaquaval")
        self.assertIn("Upgrade (Level 11):", move["description"])
        self.assertNotIn("Upgrade:", move["description"].replace("Upgrade (Level 11):", ""))


if __name__ == "__main__":
    unittest.main()

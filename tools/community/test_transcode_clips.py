"""Unit tests for transcode_clips.py helpers."""

from __future__ import annotations

import unittest

from transcode_clips import move_index


class TestMoveIndex(unittest.TestCase):
    """move_index must include Move 1/2/Unite and passives that have iconAsset."""

    def test_indexes_moves_and_passive(self):
        bundle = {
            "pokemon": [
                {
                    "id": "reshiram",
                    "moves": [
                        {
                            "id": "dragon-breath",
                            "slot": "move1",
                            "iconAsset": "/assets/skills/Reshiram/Dragon+Breath.png",
                        },
                        {"id": "attack", "slot": "basicAttack"},
                    ],
                    "passiveAbility": {
                        "id": "turboblaze",
                        "iconAsset": "/assets/skills/Reshiram/Turboblaze.png",
                    },
                }
            ]
        }
        idx = move_index(bundle)
        self.assertIn(("reshiram", "dragon-breath"), idx)
        self.assertNotIn(("reshiram", "attack"), idx)
        self.assertIn(("reshiram", "turboblaze"), idx)
        self.assertEqual(
            idx[("reshiram", "turboblaze")]["iconAsset"],
            "/assets/skills/Reshiram/Turboblaze.png",
        )

    def test_skips_passive_without_icon(self):
        bundle = {
            "pokemon": [
                {
                    "id": "x",
                    "moves": [],
                    "passiveAbility": {"id": "guts"},
                }
            ]
        }
        self.assertEqual(move_index(bundle), {})


if __name__ == "__main__":
    unittest.main()

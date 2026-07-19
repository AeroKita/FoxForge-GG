"""Unit tests for gaps.py — curation gap detection on a GameDataBundle."""

from __future__ import annotations

import unittest

from gaps import find_gaps


def _move(name: str, *, description: str = "text", video: bool = True) -> dict:
    m: dict = {
        "id": name.lower().replace(" ", "-"),
        "name": name,
        "slot": "move1",
        "description": description,
    }
    if video:
        m["videoAsset"] = f"/assets/skills/{name}.mp4"
    return m


def _build(*, emblems: int = 10) -> dict:
    return {
        "name": "Build",
        "heldItemIds": ["a", "b", "c"],
        "battleItemId": "eject-button",
        "emblems": [{"emblemId": f"e{i}", "grade": "gold"} for i in range(emblems)],
        "moves": ["A", "B"],
    }


def _pokemon(
    pid: str = "testmon",
    *,
    builds: list | None = None,
    creative: list | None = None,
    moves: list | None = None,
) -> dict:
    return {
        "id": pid,
        "name": pid.title(),
        "builds": builds if builds is not None else [_build()],
        "creativeBuilds": creative or [],
        "moves": moves if moves is not None else [_move("Thunderbolt")],
    }


class TestFindGaps(unittest.TestCase):
    def test_no_builds(self):
        lines = find_gaps({"pokemon": [_pokemon(builds=[])]})
        self.assertEqual(len(lines), 1)
        self.assertIn("no Recommended builds", lines[0])

    def test_blank_move_description(self):
        lines = find_gaps(
            {"pokemon": [_pokemon(moves=[_move("Thunderbolt", description="")])]}
        )
        self.assertEqual(len(lines), 1)
        self.assertIn("blank description on 'Thunderbolt'", lines[0])

    def test_complete_10_emblem_build_no_gap(self):
        lines = find_gaps({"pokemon": [_pokemon(builds=[_build(emblems=10)])]})
        self.assertEqual(lines, [])

    def test_builds_without_complete_10_emblem_set(self):
        """Non-empty builds that all lack exactly 10 emblems must flag optimizer fallback."""
        lines = find_gaps(
            {
                "pokemon": [
                    _pokemon(
                        builds=[_build(emblems=0), _build(emblems=5)],
                        creative=[_build(emblems=9)],
                    )
                ]
            }
        )
        self.assertEqual(len(lines), 1)
        self.assertIn(
            "no complete 10-emblem build (optimizer preset falls back to generic)",
            lines[0],
        )


if __name__ == "__main__":
    unittest.main()

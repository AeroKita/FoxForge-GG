"""Unit tests for doctor.py — environment preflight helpers."""

from __future__ import annotations

import unittest

from doctor import node_version_hint


class TestNodeVersionHint(unittest.TestCase):
    """Hints must steer maintainers to NVM + .nvmrc, not Homebrew PATH hacks."""

    def test_hint_mentions_nvm_install_and_use(self):
        hint = node_version_hint(24)
        self.assertIn("nvm install", hint)
        self.assertIn("nvm use", hint)

    def test_hint_mentions_nvmrc(self):
        hint = node_version_hint(24)
        self.assertIn(".nvmrc", hint)

    def test_hint_includes_required_major(self):
        hint = node_version_hint(24)
        self.assertIn("24", hint)
        hint22 = node_version_hint(22)
        self.assertIn("22", hint22)

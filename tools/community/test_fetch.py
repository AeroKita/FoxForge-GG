"""Tests for fetch.py (UNITE-DB raw mirror)."""

from __future__ import annotations

import json
import tempfile
import unittest
from pathlib import Path
from unittest.mock import MagicMock, patch

import fetch


class TestFetch(unittest.TestCase):
    """fetch() writes every endpoint under RAW and a _manifest.json."""

    def test_fetch_writes_endpoints_and_manifest(self):
        """
        When each UNITE-DB endpoint returns JSON, fetch() writes one file per
        endpoint under RAW plus a _manifest.json summarizing counts/bytes.
        Uses requests.get (not urllib) so TLS works via certifi in the venv.
        """
        payloads = {
            name: [{"id": i, "name": name}] for i, name in enumerate(fetch.ENDPOINTS)
        }

        def fake_get(url: str, **kwargs):
            name = url.rsplit("/", 1)[-1].removesuffix(".json")
            body = json.dumps(payloads[name]).encode()
            resp = MagicMock()
            resp.content = body
            resp.json.return_value = payloads[name]
            resp.raise_for_status.return_value = None
            return resp

        with tempfile.TemporaryDirectory() as tmp:
            raw = Path(tmp)
            with (
                patch.object(fetch, "RAW", raw),
                patch("fetch.requests.get", side_effect=fake_get) as get_mock,
            ):
                fetch.fetch()

            self.assertEqual(get_mock.call_count, len(fetch.ENDPOINTS))
            for name in fetch.ENDPOINTS:
                path = raw / f"{name}.json"
                self.assertTrue(path.is_file(), f"missing {name}.json")
                self.assertEqual(json.loads(path.read_text()), payloads[name])

            manifest = json.loads((raw / "_manifest.json").read_text())
            self.assertEqual(manifest["source"], fetch.BASE)
            self.assertEqual(set(manifest["files"]), set(fetch.ENDPOINTS))
            for name in fetch.ENDPOINTS:
                self.assertEqual(manifest["files"][name]["count"], 1)


if __name__ == "__main__":
    unittest.main()

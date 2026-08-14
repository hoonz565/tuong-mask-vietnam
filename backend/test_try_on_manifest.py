import hashlib
import unittest
from pathlib import Path

from main import get_cached_try_on_templates


class TryOnManifestTests(unittest.TestCase):
    def test_manifest_has_unique_complete_templates(self):
        manifest = get_cached_try_on_templates()
        templates = manifest["templates"]

        self.assertEqual(manifest["schema_version"], 1)
        self.assertGreaterEqual(len(templates), 6)
        self.assertEqual(len({item["id"] for item in templates}), len(templates))
        self.assertEqual(len({item["mask_id"] for item in templates}), len(templates))

        for template in templates:
            self.assertTrue(template["atlas_url"].startswith("/try-on/templates/"))
            self.assertRegex(template["asset_sha256"], r"^[0-9a-f]{64}$")
            self.assertEqual(template["topology_version"], "mediapipe_face_468_v1")
            self.assertEqual(template["release_channel"], "technical_pilot")
            self.assertGreater(len(template["layers"]), 0)
            self.assertIn("status", template["cultural_review"])
            self.assertIn("asset_owner", template["license"])

            asset_path = Path(__file__).parent.parent / "frontend" / "public" / template["atlas_url"].lstrip("/")
            self.assertTrue(asset_path.is_file(), f"Missing atlas: {asset_path}")
            digest = hashlib.sha256(asset_path.read_bytes()).hexdigest()
            self.assertEqual(digest, template["asset_sha256"])


if __name__ == "__main__":
    unittest.main()

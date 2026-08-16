import hashlib
import unittest
from pathlib import Path

from main import get_cached_masks, get_cached_try_on_templates, get_runtime_try_on_templates


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
            self.assertEqual(
                [layer["id"] for layer in template["layers"]],
                ["base", "eye_motifs", "mouth"],
            )
            self.assertIn("status", template["cultural_review"])
            self.assertIn("asset_owner", template["license"])

            asset_path = Path(__file__).parent.parent / "frontend" / "public" / template["atlas_url"].lstrip("/")
            self.assertTrue(asset_path.is_file(), f"Missing atlas: {asset_path}")
            digest = hashlib.sha256(asset_path.read_bytes()).hexdigest()
            self.assertEqual(digest, template["asset_sha256"])

    def test_runtime_catalog_makes_every_gallery_mask_selectable(self):
        masks = get_cached_masks()
        templates = get_runtime_try_on_templates()

        self.assertEqual(len(templates), 117)
        self.assertEqual(len(templates), len(masks))
        self.assertEqual(len({item["id"] for item in templates}), len(templates))
        self.assertEqual(len({item["mask_id"] for item in templates}), len(templates))

        masks_by_id = {item["id"]: item for item in masks}
        templates_by_mask_id = {item["mask_id"]: item for item in templates}
        for mask_id, mask in masks_by_id.items():
            template = templates_by_mask_id[mask_id]
            self.assertRegex(template["id"], r"^[a-z0-9_]+_v[0-9]+$")
            self.assertEqual(template["texture_source"], "gallery_image")
            self.assertEqual(template["source_image_url"], mask["image_url"])
            self.assertEqual(template["thumbnail_url"], mask["image_url"])
            self.assertEqual(template["layers"][0]["id"], "gallery_mask")
            self.assertEqual(template["layers"][0]["occlusion_policy"], "face_mesh")

        self.assertEqual(templates_by_mask_id["dao_tam_xuan"]["id"], "dao_tam_xuan_v1")
        self.assertEqual(
            templates_by_mask_id["dao_tam_xuan"]["source_image_url"],
            "/static/images/18.png",
        )


if __name__ == "__main__":
    unittest.main()

import hashlib
import json
import unittest
from pathlib import Path


MODEL_ROOT = Path(__file__).parents[3] / "frontend" / "public" / "models" / "try-on"


class ModelManifestTests(unittest.TestCase):
    def test_content_hashed_runtime_artifacts_match_manifest(self):
        manifest = json.loads((MODEL_ROOT / "manifest.json").read_text(encoding="utf-8"))
        total_bytes = 0

        self.assertEqual(manifest["schema_version"], 1)
        self.assertEqual(manifest["release_channel"], "technical_pilot")
        self.assertGreaterEqual(len(manifest["models"]), 2)

        for model in manifest["models"]:
            artifact = MODEL_ROOT / Path(model["url"]).name
            self.assertTrue(artifact.is_file(), f"Missing model artifact: {artifact}")
            self.assertIn(model["sha256"][:8], artifact.name)
            self.assertEqual(artifact.stat().st_size, model["bytes"])
            self.assertEqual(hashlib.sha256(artifact.read_bytes()).hexdigest(), model["sha256"])
            self.assertNotEqual(model["deployment_review"], "approved")
            total_bytes += artifact.stat().st_size

        self.assertEqual(total_bytes, manifest["total_model_bytes"])
        self.assertLessEqual(total_bytes, 20_000_000)


if __name__ == "__main__":
    unittest.main()

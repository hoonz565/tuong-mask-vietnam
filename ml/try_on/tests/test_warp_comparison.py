import unittest
from pathlib import Path

from ml.try_on.scripts.compare_warp_methods import compare


class WarpComparisonTests(unittest.TestCase):
    def test_dense_mesh_beats_rigid_and_meets_synthetic_pixel_gate(self):
        mesh = Path(__file__).parents[3] / "frontend" / "public" / "try-on" / "mesh" / "canonical_face_model.obj"
        result = compare(mesh)
        methods = result["methods"]

        self.assertEqual(result["evaluation_points"], 898)
        self.assertLess(methods["dense_piecewise_affine"]["p95_px"], 2)
        self.assertLess(
            methods["dense_piecewise_affine"]["p95_px"],
            methods["offline_tps_64"]["p95_px"],
        )
        self.assertLess(
            methods["offline_tps_64"]["p95_px"],
            methods["rigid_similarity"]["p95_px"],
        )


if __name__ == "__main__":
    unittest.main()

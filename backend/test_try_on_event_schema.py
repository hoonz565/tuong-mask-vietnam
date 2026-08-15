import unittest

from pydantic import ValidationError

from main import TryOnEvent


class TryOnEventSchemaTests(unittest.TestCase):
    def test_accepts_only_coarse_pixel_free_metrics(self):
        event = TryOnEvent(
            event="first_render",
            release_channel="technical_pilot",
            template_id="bao_cong_v1",
            duration_ms=2450,
            parser_provider="wasm",
            renderer_fps_bucket="30_plus",
        )
        self.assertEqual(event.event, "first_render")
        self.assertFalse(hasattr(event, "session_id"))

    def test_rejects_raw_camera_or_biometric_fields(self):
        prohibited_fields = [
            "image",
            "frame",
            "face_crop",
            "landmarks",
            "parsing_mask",
            "embedding",
            "user_id",
            "ip_address",
            "skin_tone",
            "gender",
        ]
        for field in prohibited_fields:
            with self.subTest(field=field), self.assertRaises(ValidationError):
                TryOnEvent(
                    event="try_on_opened",
                    release_channel="technical_pilot",
                    **{field: "blocked"},
                )

    def test_rejects_unbounded_or_identifying_values(self):
        with self.assertRaises(ValidationError):
            TryOnEvent(
                event="first_render",
                release_channel="technical_pilot",
                template_id="../../person@example.com",
                duration_ms=9_999_999,
            )


if __name__ == "__main__":
    unittest.main()

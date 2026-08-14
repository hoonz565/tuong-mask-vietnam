"""Create and smoke-test the R&D face parser INT8 artifact.

This script performs static QDQ quantization with deterministic technical image
calibration. It does not claim visual parity; release still requires the
consented evaluation set defined in the model card and implementation plan.
"""

from __future__ import annotations

import argparse
import hashlib
from pathlib import Path

import numpy as np
import onnx
import onnxruntime as ort
from PIL import Image
from onnxruntime.quantization import (
    CalibrationDataReader,
    CalibrationMethod,
    QuantFormat,
    QuantType,
    quantize_static,
)

MEAN = np.asarray([0.485, 0.456, 0.406], dtype=np.float32)
STD = np.asarray([0.229, 0.224, 0.225], dtype=np.float32)


class ImageCalibrationReader(CalibrationDataReader):
    """Deterministic technical calibration; not a substitute for release QA."""

    def __init__(self, input_name: str, image_dir: Path, limit: int = 16):
        self.input_name = input_name
        paths = sorted(image_dir.glob("*.png"), key=lambda path: path.name)[:limit]
        self.samples = iter(self._preprocess(path) for path in paths)

    @staticmethod
    def _preprocess(path: Path) -> np.ndarray:
        with Image.open(path) as image:
            rgb = image.convert("RGB").resize((512, 512), Image.Resampling.BILINEAR)
            pixels = np.asarray(rgb, dtype=np.float32) / 255.0
        normalized = (pixels - MEAN) / STD
        return normalized.transpose(2, 0, 1)[None, ...].astype(np.float32)

    def get_next(self):
        sample = next(self.samples, None)
        return None if sample is None else {self.input_name: sample}


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as model_file:
        for chunk in iter(lambda: model_file.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def smoke_test(fp32_path: Path, int8_path: Path) -> dict[str, float | list[int]]:
    rng = np.random.default_rng(20260815)
    sample = rng.normal(0, 1, (1, 3, 512, 512)).astype(np.float32)
    fp32_session = ort.InferenceSession(str(fp32_path), providers=["CPUExecutionProvider"])
    int8_session = ort.InferenceSession(str(int8_path), providers=["CPUExecutionProvider"])
    fp32_output = fp32_session.run(None, {fp32_session.get_inputs()[0].name: sample})[0]
    int8_output = int8_session.run(None, {int8_session.get_inputs()[0].name: sample})[0]
    agreement = float(np.mean(np.argmax(fp32_output, axis=1) == np.argmax(int8_output, axis=1)))
    return {
        "output_shape": list(int8_output.shape),
        "synthetic_argmax_agreement": agreement,
        "mean_absolute_logit_error": float(np.mean(np.abs(fp32_output - int8_output))),
    }


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("input", type=Path)
    parser.add_argument("output", type=Path)
    parser.add_argument("--calibration-dir", type=Path, required=True)
    args = parser.parse_args()
    args.output.parent.mkdir(parents=True, exist_ok=True)

    onnx.checker.check_model(onnx.load(args.input))
    input_name = ort.InferenceSession(str(args.input), providers=["CPUExecutionProvider"]).get_inputs()[0].name
    calibration_reader = ImageCalibrationReader(input_name, args.calibration_dir)
    quantize_static(
        model_input=str(args.input),
        model_output=str(args.output),
        calibration_data_reader=calibration_reader,
        quant_format=QuantFormat.QDQ,
        activation_type=QuantType.QUInt8,
        weight_type=QuantType.QInt8,
        per_channel=True,
        calibrate_method=CalibrationMethod.MinMax,
    )
    onnx.checker.check_model(onnx.load(args.output))
    metrics = smoke_test(args.input, args.output)

    print(f"input_bytes={args.input.stat().st_size}")
    print(f"output_bytes={args.output.stat().st_size}")
    print(f"sha256={sha256(args.output)}")
    for key, value in metrics.items():
        print(f"{key}={value}")


if __name__ == "__main__":
    main()

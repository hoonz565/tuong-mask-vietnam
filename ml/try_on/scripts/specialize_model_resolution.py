"""Specialize a fully-convolutional ONNX face parser to a fixed square input."""

from __future__ import annotations

import argparse
import hashlib
from pathlib import Path

import numpy as np
import onnx
import onnxruntime as ort


def set_spatial_shape(value_info, size: int) -> None:
    dimensions = value_info.type.tensor_type.shape.dim
    if len(dimensions) != 4:
        raise ValueError(f"Expected NCHW tensor, received {len(dimensions)} dimensions")
    dimensions[2].dim_value = size
    dimensions[3].dim_value = size


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    digest.update(path.read_bytes())
    return digest.hexdigest()


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("input", type=Path)
    parser.add_argument("output", type=Path)
    parser.add_argument("--size", type=int, default=256)
    args = parser.parse_args()
    if args.size < 128 or args.size % 32:
        parser.error("size must be >= 128 and divisible by 32")

    model = onnx.load(args.input)
    set_spatial_shape(model.graph.input[0], args.size)
    for output in model.graph.output:
        set_spatial_shape(output, args.size)
    # Exported static intermediate annotations still contain 512-derived
    # dimensions. They are non-semantic metadata and must be re-inferred for
    # the specialized input rather than merged with stale shapes by ORT.
    model.graph.ClearField("value_info")
    onnx.checker.check_model(model)
    args.output.parent.mkdir(parents=True, exist_ok=True)
    onnx.save(model, args.output)

    session = ort.InferenceSession(str(args.output), providers=["CPUExecutionProvider"])
    input_meta = session.get_inputs()[0]
    sample = np.zeros((1, 3, args.size, args.size), dtype=np.float32)
    result = session.run(None, {input_meta.name: sample})[0]
    if list(result.shape[-2:]) != [args.size, args.size]:
        raise RuntimeError(f"Unexpected specialized output shape: {result.shape}")
    print(f"bytes={args.output.stat().st_size}")
    print(f"sha256={sha256(args.output)}")
    print(f"output_shape={list(result.shape)}")


if __name__ == "__main__":
    main()

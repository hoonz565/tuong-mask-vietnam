"""Reproducible local latency benchmark for the browser face-parser artifact.

This measures native ONNX Runtime CPU inference as a reproducible smoke baseline.
Browser/device launch gates still require the matrix described in the evaluation plan.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import platform
import statistics
import time
from pathlib import Path

import numpy as np
import onnxruntime as ort


def percentile(values: list[float], quantile: float) -> float:
    ordered = sorted(values)
    index = (len(ordered) - 1) * quantile
    lower = int(index)
    upper = min(lower + 1, len(ordered) - 1)
    fraction = index - lower
    return ordered[lower] * (1 - fraction) + ordered[upper] * fraction


def benchmark(model_path: Path, warmup: int, iterations: int) -> dict[str, object]:
    model_bytes = model_path.read_bytes()
    started = time.perf_counter()
    session = ort.InferenceSession(
        str(model_path),
        providers=["CPUExecutionProvider"],
        sess_options=ort.SessionOptions(),
    )
    load_ms = (time.perf_counter() - started) * 1_000

    input_meta = session.get_inputs()[0]
    shape = [1 if not isinstance(size, int) else size for size in input_meta.shape]
    rng = np.random.default_rng(20260815)
    input_tensor = rng.normal(0, 1, size=shape).astype(np.float32)
    feeds = {input_meta.name: input_tensor}

    for _ in range(warmup):
        session.run(None, feeds)

    samples_ms: list[float] = []
    output_shape: list[int] | None = None
    for _ in range(iterations):
        started = time.perf_counter()
        output = session.run(None, feeds)[0]
        samples_ms.append((time.perf_counter() - started) * 1_000)
        output_shape = list(output.shape)

    return {
        "artifact": model_path.name,
        "sha256": hashlib.sha256(model_bytes).hexdigest(),
        "size_bytes": len(model_bytes),
        "runtime": f"onnxruntime {ort.__version__}",
        "provider": session.get_providers()[0],
        "platform": platform.platform(),
        "input_shape": shape,
        "output_shape": output_shape,
        "warmup_runs": warmup,
        "measured_runs": iterations,
        "session_load_ms": round(load_ms, 2),
        "latency_ms": {
            "mean": round(statistics.fmean(samples_ms), 2),
            "median": round(statistics.median(samples_ms), 2),
            "p95": round(percentile(samples_ms, 0.95), 2),
            "min": round(min(samples_ms), 2),
            "max": round(max(samples_ms), 2),
        },
    }


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("model", type=Path)
    parser.add_argument("--warmup", type=int, default=3)
    parser.add_argument("--iterations", type=int, default=12)
    args = parser.parse_args()
    if args.warmup < 0 or args.iterations < 1:
        parser.error("warmup must be >= 0 and iterations must be >= 1")
    print(json.dumps(benchmark(args.model, args.warmup, args.iterations), indent=2))


if __name__ == "__main__":
    main()

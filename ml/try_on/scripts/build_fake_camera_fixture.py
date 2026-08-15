"""Build a local Y4M loop for deterministic browser camera lifecycle tests."""

from __future__ import annotations

import argparse
from pathlib import Path

import numpy as np
from PIL import Image, ImageOps


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("source", type=Path)
    parser.add_argument("output", type=Path)
    parser.add_argument("--frames", type=int, default=90)
    args = parser.parse_args()

    width, height = 640, 480
    with Image.open(args.source) as source:
        rgb = Image.new("RGB", (width, height), "black")
        fitted = ImageOps.contain(source.convert("RGB"), (width, height), Image.Resampling.LANCZOS)
        rgb.paste(fitted, ((width - fitted.width) // 2, (height - fitted.height) // 2))
        ycbcr = np.asarray(rgb.convert("YCbCr"), dtype=np.uint8)

    y_plane = ycbcr[:, :, 0]
    cb_plane = ycbcr[:, :, 1].reshape(height // 2, 2, width // 2, 2).mean(axis=(1, 3)).astype(np.uint8)
    cr_plane = ycbcr[:, :, 2].reshape(height // 2, 2, width // 2, 2).mean(axis=(1, 3)).astype(np.uint8)
    frame = y_plane.tobytes() + cb_plane.tobytes() + cr_plane.tobytes()
    args.output.parent.mkdir(parents=True, exist_ok=True)
    with args.output.open("wb") as video:
        video.write(f"YUV4MPEG2 W{width} H{height} F30:1 Ip A1:1 C420jpeg\n".encode())
        for _ in range(args.frames):
            video.write(b"FRAME\n")
            video.write(frame)


if __name__ == "__main__":
    main()

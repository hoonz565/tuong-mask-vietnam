"""Compare rigid, dense piecewise-affine and offline TPS warps on one fixture.

The fixture is a deterministic pose + expression deformation applied to the
MediaPipe canonical mesh. Errors are evaluated at triangle centroids in 720p
pixel units, so all three methods see identical source/target geometry.
"""

from __future__ import annotations

import argparse
import json
from pathlib import Path

import numpy as np


def load_mesh(path: Path) -> tuple[np.ndarray, np.ndarray]:
    vertices: list[list[float]] = []
    faces: list[list[int]] = []
    for raw_line in path.read_text(encoding="utf-8").splitlines():
        parts = raw_line.strip().split()
        if not parts:
            continue
        if parts[0] == "v":
            vertices.append([float(parts[1]), float(parts[2])])
        elif parts[0] == "f":
            faces.append([int(corner.split("/")[0]) - 1 for corner in parts[1:4]])
    points = np.asarray(vertices[:468], dtype=np.float64)
    points = (points - points.min(axis=0)) / np.maximum(np.ptp(points, axis=0), 1e-9)
    return points, np.asarray(faces, dtype=np.int32)


def fixture_warp(points: np.ndarray) -> np.ndarray:
    centered = points - 0.5
    angle = np.deg2rad(9)
    rotation = np.asarray([[np.cos(angle), -np.sin(angle)], [np.sin(angle), np.cos(angle)]])
    rigid = centered @ rotation.T * 0.96 + np.asarray([0.52, 0.49])
    x = points[:, 0]
    y = points[:, 1]
    mouth = np.exp(-(((x - 0.5) / 0.22) ** 2 + ((y - 0.25) / 0.16) ** 2))
    brows = np.exp(-(((x - 0.5) / 0.35) ** 2 + ((y - 0.7) / 0.12) ** 2))
    cheeks = np.exp(-(((y - 0.47) / 0.2) ** 2))
    non_rigid = np.column_stack([
        (x - 0.5) * mouth * 0.12 + np.sin(y * np.pi) * (x - 0.5) * cheeks * 0.025,
        -mouth * 0.055 + brows * 0.035,
    ])
    return rigid + non_rigid


def fit_similarity(source: np.ndarray, target: np.ndarray) -> tuple[np.ndarray, float, np.ndarray]:
    source_mean = source.mean(axis=0)
    target_mean = target.mean(axis=0)
    source_centered = source - source_mean
    target_centered = target - target_mean
    covariance = source_centered.T @ target_centered
    left, singular, right = np.linalg.svd(covariance)
    rotation = left @ right
    scale = singular.sum() / np.sum(source_centered ** 2)
    translation = target_mean - source_mean @ rotation * scale
    return rotation, scale, translation


def apply_similarity(points: np.ndarray, fit: tuple[np.ndarray, float, np.ndarray]) -> np.ndarray:
    rotation, scale, translation = fit
    return points @ rotation * scale + translation


def farthest_points(points: np.ndarray, count: int) -> np.ndarray:
    selected = [int(np.argmin(np.sum((points - 0.5) ** 2, axis=1)))]
    distances = np.full(len(points), np.inf)
    while len(selected) < count:
        distances = np.minimum(
            distances,
            np.sum((points - points[selected[-1]]) ** 2, axis=1),
        )
        selected.append(int(np.argmax(distances)))
    return np.asarray(selected, dtype=np.int32)


def tps_kernel(distances_squared: np.ndarray) -> np.ndarray:
    safe = np.maximum(distances_squared, 1e-12)
    values = safe * np.log(safe)
    values[distances_squared < 1e-12] = 0
    return values


def fit_tps(source: np.ndarray, target: np.ndarray, regularization: float = 1e-6):
    count = len(source)
    differences = source[:, None, :] - source[None, :, :]
    kernel = tps_kernel(np.sum(differences ** 2, axis=2))
    affine = np.column_stack([np.ones(count), source])
    system = np.block([
        [kernel + np.eye(count) * regularization, affine],
        [affine.T, np.zeros((3, 3))],
    ])
    values = np.vstack([target, np.zeros((3, 2))])
    coefficients = np.linalg.solve(system, values)
    return source, coefficients[:count], coefficients[count:]


def apply_tps(points: np.ndarray, fit) -> np.ndarray:
    source, weights, affine = fit
    differences = points[:, None, :] - source[None, :, :]
    kernel = tps_kernel(np.sum(differences ** 2, axis=2))
    return kernel @ weights + np.column_stack([np.ones(len(points)), points]) @ affine


def error_summary(prediction: np.ndarray, truth: np.ndarray) -> dict[str, float]:
    errors = np.linalg.norm(prediction - truth, axis=1) * 720
    return {
        "median_px": round(float(np.median(errors)), 3),
        "p95_px": round(float(np.percentile(errors, 95)), 3),
        "max_px": round(float(np.max(errors)), 3),
    }


def compare(mesh_path: Path) -> dict[str, object]:
    vertices, faces = load_mesh(mesh_path)
    target_vertices = fixture_warp(vertices)
    queries = vertices[faces].mean(axis=1)
    truth = fixture_warp(queries)

    rigid = apply_similarity(queries, fit_similarity(vertices, target_vertices))
    piecewise = target_vertices[faces].mean(axis=1)
    controls = farthest_points(vertices, 64)
    tps = apply_tps(queries, fit_tps(vertices[controls], target_vertices[controls]))

    return {
        "fixture": "canonical_pose_smile_brow_jaw_v1",
        "evaluation_points": len(queries),
        "tps_control_points": len(controls),
        "pixel_reference_height": 720,
        "methods": {
            "rigid_similarity": error_summary(rigid, truth),
            "dense_piecewise_affine": error_summary(piecewise, truth),
            "offline_tps_64": error_summary(tps, truth),
        },
    }


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("mesh", type=Path)
    args = parser.parse_args()
    print(json.dumps(compare(args.mesh), indent=2))


if __name__ == "__main__":
    main()
